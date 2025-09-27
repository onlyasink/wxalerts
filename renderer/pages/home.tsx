import React from "react";
import Head from "next/head";
import Link from 'next/link';
import Image from "next/image";
import { Roboto_Mono } from "next/font/google/index";
import ReactMarkdown from "react-markdown";
import moment from "moment";
import { SystemConfig } from "../types/config";

declare global {
  interface Window {
    config: {
      getConfig(): Promise<SystemConfig>;
      getSection<K extends keyof SystemConfig>(section: K): Promise<SystemConfig[K]>;
      getValue<K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
        section: K,
        key: T
      ): Promise<SystemConfig[K][T]>;
      updateConfig(updates: Partial<SystemConfig>): Promise<SystemConfig>;
      updateSection<K extends keyof SystemConfig>(
        section: K,
        updates: Partial<SystemConfig[K]>
      ): Promise<SystemConfig[K]>;
      updateValue<K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
        section: K,
        key: T,
        value: SystemConfig[K][T]
      ): Promise<SystemConfig[K][T]>;
      resetToDefaults(): Promise<SystemConfig>;
      resetSection<K extends keyof SystemConfig>(section: K): Promise<SystemConfig[K]>;
      hasConfigFile(): Promise<boolean>;
      getConfigPath(): Promise<string>;
    };
  }
}

export default function HomePage() {
  const [message, setMessage] = React.useState("No message found");
  const [loading, setLoading] = React.useState(false);
  const [nwsData, setNwsData] = React.useState(null);
  const [nwsError, setNwsError] = React.useState(null);
  const [config, setConfig] = React.useState<SystemConfig | null>(null);

  const playBeep = React.useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.001;
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(
        0.00001,
        audioCtx.currentTime + 0.25
      );
      oscillator.stop(audioCtx.currentTime + 0.25);
    } catch {}
  }, []);

  const playAlertSound = async () => {
    try {
      const audio = new Audio("/alert.wav");
      await audio.play();
    } catch {
      // Fallback if file missing or autoplay blocked
      playBeep();
    }
  };

  const playEASAlertSound = async () => {
    try {
      const audio = new Audio("/alerteas.wav");
      await audio.play();
    } catch {
      // Fallback if file missing or autoplay blocked
      playBeep();
    }
  };

  // Load configuration on mount
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const currentConfig = await window.config.getConfig();
        setConfig(currentConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();
  }, []);

  React.useEffect(() => {
    if (!config) return;
    
    const intervalId = setInterval(() => {
      if (config.weather.enabled) {
        window.ipc.send("nws:fetch", null);
      }
    }, config.weather.checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [config]);

  React.useEffect(() => {
    const offFetch = window.ipc.on("bkg:nws:fetch", () => {
      window.ipc.send("nws:fetch", null);
    });
    const offWinClose = window.ipc.on("main:win:close", () => {
      window.ipc.send("window:close", null);
    })
    const offPlayAlert = window.ipc.on("nws:alert:play", (payload: any) => {
        playAlertSound();
    });
    const offPlayEASAlert = window.ipc.on(
      "nws:alerteas:play",
      (payload: any) => {
          playEASAlertSound();
      }
    );
    const offResult = window.ipc.on("nws:result", (payload: any) => {
      console.log(payload);
      setLoading(false);
      setNwsError(null);
      setNwsData(payload.data);
    });
    const offError = window.ipc.on("nws:error", (payload: any) => {
      setLoading(false);
      setNwsError(payload?.message || "Failed to fetch alerts");
    });

    return () => {
      offPlayAlert && offPlayAlert();
      offPlayEASAlert && offPlayEASAlert();
      offFetch && offFetch();
      offResult && offResult();
      offError && offError();
    };
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>
          ALERT: {nwsData?.properties?.headline}
        </title>
      </Head>
      <div
        className={`w-full p-4 h-screen flex flex-col items-center justify-center gap-3 cascadia-mono`}
      >
        <div className="h-6 -mt-2.5 w-full drag-region flex flex-row items-center gap-2">
          <div className="h-2 rounded-full w-full dark:bg-[#000]/20 bg-[#ACACAC]/30" />
          <div className="w-1/4 flex flex-row items-center justify-end">

          </div>
        </div>
        <div className="flex flex-row gap-6 mx-auto w-1/1.5 items-center">
          <Image src="/images/logo.png" width={65} height={65} alt="WXAlerts" />
          <div className="flex flex-col gap-1 text-left">
            <h1 className="font-bold text-xl dark:text-white">
              {nwsData?.properties?.event} |{" "}
              {nwsData?.properties?.senderName}
            </h1>
            <h1 className="font-normal text-md dark:text-white">
              {nwsData?.properties?.severity} |{" "}
              {moment(nwsData?.properties?.onset).format(
                "DD/MM/YYYY HH:MM a"
              )}{" "}
              -{" "}
              {moment(nwsData?.properties?.ends).format(
                "DD/MM/YYYY HH:MM a"
              )}
            </h1>
          </div>
        </div>
        <div className="font-normal text-md dark:text-white p-6 dark:bg-[#000000]/20 bg-[#ACACAC]/30 rounded-md w-full max-w-3xl max-h-3xl overflow-y-auto">
          <ReactMarkdown>
            {nwsData?.properties?.description || ""}
          </ReactMarkdown>
        </div>
      </div>
    </React.Fragment>
  );
}
