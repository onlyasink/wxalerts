import React, { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { SystemConfig } from "../types/config";

declare global {
  interface Window {
    config: {
      getConfig(): Promise<SystemConfig>;
      getSection<K extends keyof SystemConfig>(
        section: K
      ): Promise<SystemConfig[K]>;
      getValue<K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
        section: K,
        key: T
      ): Promise<SystemConfig[K][T]>;
      updateConfig(updates: Partial<SystemConfig>): Promise<SystemConfig>;
      updateSection<K extends keyof SystemConfig>(
        section: K,
        updates: Partial<SystemConfig[K]>
      ): Promise<SystemConfig[K]>;
      updateValue<
        K extends keyof SystemConfig,
        T extends keyof SystemConfig[K]
      >(
        section: K,
        key: T,
        value: SystemConfig[K][T]
      ): Promise<SystemConfig[K][T]>;
      resetToDefaults(): Promise<SystemConfig>;
      resetSection<K extends keyof SystemConfig>(
        section: K
      ): Promise<SystemConfig[K]>;
      hasConfigFile(): Promise<boolean>;
      getConfigPath(): Promise<string>;
    };
  }
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "weather" | "ui" | "audio" | "general"
  >("weather");
  const [zoneCodes, setZoneCodes] = useState<any[] | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const currentConfig = await window.config.getConfig();
      setConfig(currentConfig);
      if(currentConfig.weather.state) {
        fetchZoneCodes(currentConfig.weather.state);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updates: Partial<SystemConfig>) => {
    if (!config) return;

    setSaving(true);
    try {
      const updatedConfig = await window.config.updateConfig(updates);
      setConfig(updatedConfig);
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateSection = async <K extends keyof SystemConfig>(
    section: K,
    updates: Partial<SystemConfig[K]>
  ) => {
    if (!config) return;

    setSaving(true);
    try {
      const updatedSection = await window.config.updateSection(
        section,
        updates
      );
      setConfig({ ...config, [section]: updatedSection });
    } catch (error) {
      console.error("Failed to update section:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateValue = async <
    K extends keyof SystemConfig,
    T extends keyof SystemConfig[K]
  >(
    section: K,
    key: T,
    value: SystemConfig[K][T]
  ) => {
    if (!config) return;

    setSaving(true);
    try {
      await window.config.updateValue(section, key, value);
      setConfig({
        ...config,
        [section]: { ...config[section], [key]: value },
      });
    } catch (error) {
      console.error("Failed to update value:", error);
    } finally {
      setSaving(false);
    }
  };

  const fetchZoneCodes = async (e: any) => {
    const response = await fetch(`https://api.weather.gov/zones?area=${e}`, {
      headers: {
        Accept: "application/geo+json",
      },
    });
    const data = await response.json();
    setZoneCodes(data.features);
  };

  const resetToDefaults = async () => {
    setSaving(true);
    try {
      const defaultConfig = await window.config.resetToDefaults();
      setConfig(defaultConfig);
    } catch (error) {
      console.error("Failed to reset config:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-white">Loading configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-white">Failed to load configuration</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Head>
        <title>Settings - WX Alerts</title>
      </Head>
      <div className="w-full h-screen flex flex-row">
        <div className="w-64 dark:bg-[#000]/20 bg-[#ACACAC]/30 drag-region cascadia-mono p-4">
          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/images/logo.png"
              width={32}
              height={32}
              alt="WXAlerts"
            />
            <h1 className="text-white font-bold text-lg">Settings</h1>
          </div>

          <nav className="space-y-2 nodrag-region">
            <button
              onClick={() => setActiveTab("weather")}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeTab === "weather"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Weather Alerts
            </button>
            <button
              onClick={() => setActiveTab("ui")}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeTab === "ui"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Interface
            </button>
            <button
              onClick={() => setActiveTab("audio")}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeTab === "audio"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Audio
            </button>
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeTab === "general"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              General
            </button>
          </nav>

          <div className="mt-8 pt-4 border-t border-gray-700 nodrag-region">
            <button
              onClick={resetToDefaults}
              disabled={saving}
              className="w-full px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto drag-region">
          {activeTab === "weather" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Weather Alert Settings
              </h2>

              <div className="space-y-4 nodrag-region">
                <div className="flex items-center justify-between">
                  <label className="text-white">Enable Weather Alerts</label>
                  <input
                    type="checkbox"
                    checked={config.weather.enabled}
                    onChange={(e) =>
                      updateValue("weather", "enabled", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div>
                  <label className="text-white block mb-2">
                    Check Interval (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.weather.checkInterval / 60000}
                    onChange={(e) =>
                      updateValue(
                        "weather",
                        "checkInterval",
                        parseInt(e.target.value) * 60000
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                    min="1"
                    max="60"
                  />
                </div>

                <div>
                  <label className="text-white block mb-2">State Code</label>
                  <select
                    value={config.weather.state}
                    onChange={(e) => {
                      updateValue("weather", "state", e.target.value);
                      fetchZoneCodes(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-white bg[#ACACAC]/30 dark:bg-[#000]/20 rounded-md"
                  >
                    <option value="">Select a state</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                  </select>
                </div>

                <div>
                  <label className="text-white block mb-2">County</label>
                  <select
                    value={config.weather.zone}
                    onChange={(e) =>
                      updateValue("weather", "zone", e.target.value)
                    }
                    className="w-full px-3 py-2 text-white bg[#ACACAC]/30 dark:bg-[#000]/20 rounded-md"
                  >
                    {zoneCodes?.length > 0 ? (
                      zoneCodes.map((code) => (
                        <option value={code.properties.id}>
                          {code.properties.name} County, {code.properties.state}
                        </option>
                      ))
                    ) : (
                      <option disabled>
                        Select a state to fetch county codes
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-white block mb-2">
                    Severity Filter
                  </label>
                  <div className="space-y-2">
                    {["Minor", "Moderate", "Severe", "Extreme"].map(
                      (severity) => (
                        <label key={severity} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={config.weather.severityFilter.includes(
                              severity as any
                            )}
                            onChange={(e) => {
                              const newFilter = e.target.checked
                                ? [
                                    ...config.weather.severityFilter,
                                    severity as any,
                                  ]
                                : config.weather.severityFilter.filter(
                                    (s) => s !== severity
                                  );
                              updateValue(
                                "weather",
                                "severityFilter",
                                newFilter
                              );
                            }}
                            className="w-4 h-4 mr-2"
                          />
                          <span className="text-white">{severity}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Auto Play Sound</label>
                  <input
                    type="checkbox"
                    checked={config.weather.autoPlaySound}
                    onChange={(e) =>
                      updateValue("weather", "autoPlaySound", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Show Notifications</label>
                  <input
                    type="checkbox"
                    checked={config.weather.showNotifications}
                    onChange={(e) =>
                      updateValue(
                        "weather",
                        "showNotifications",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "ui" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                Interface Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-white block mb-2">Theme</label>
                  <select
                    value={config.ui.theme}
                    onChange={(e) =>
                      updateValue("ui", "theme", e.target.value as any)
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white block mb-2">
                      Window Width
                    </label>
                    <input
                      type="number"
                      value={config.ui.windowSize.width}
                      onChange={(e) =>
                        updateValue("ui", "windowSize", {
                          ...config.ui.windowSize,
                          width: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                      min="400"
                      max="1200"
                    />
                  </div>
                  <div>
                    <label className="text-white block mb-2">
                      Window Height
                    </label>
                    <input
                      type="number"
                      value={config.ui.windowSize.height}
                      onChange={(e) =>
                        updateValue("ui", "windowSize", {
                          ...config.ui.windowSize,
                          height: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                      min="300"
                      max="800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Always On Top</label>
                  <input
                    type="checkbox"
                    checked={config.ui.alwaysOnTop}
                    onChange={(e) =>
                      updateValue("ui", "alwaysOnTop", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Minimize to Tray</label>
                  <input
                    type="checkbox"
                    checked={config.ui.minimizeToTray}
                    onChange={(e) =>
                      updateValue("ui", "minimizeToTray", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "audio" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Audio Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-white block mb-2">
                    Volume ({Math.round(config.audio.volume * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.audio.volume}
                    onChange={(e) =>
                      updateValue("audio", "volume", parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Mute</label>
                  <input
                    type="checkbox"
                    checked={config.audio.mute}
                    onChange={(e) =>
                      updateValue("audio", "mute", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div>
                  <label className="text-white block mb-2">Alert Sound</label>
                  <select
                    value={config.audio.alertSound}
                    onChange={(e) =>
                      updateValue("audio", "alertSound", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  >
                    <option value="/alert.wav">Standard Alert</option>
                    <option value="/alerteas.wav">EAS Alert</option>
                    <option value="/alertfuture.wav">Future Alert</option>
                  </select>
                </div>

                <div>
                  <label className="text-white block mb-2">
                    EAS Alert Sound
                  </label>
                  <select
                    value={config.audio.easSound}
                    onChange={(e) =>
                      updateValue("audio", "easSound", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  >
                    <option value="/alerteas.wav">EAS Alert</option>
                    <option value="/alert.wav">Standard Alert</option>
                    <option value="/alertfuture.wav">Future Alert</option>
                  </select>
                </div>

                <div>
                  <label className="text-white block mb-2">
                    Future Alert Sound
                  </label>
                  <select
                    value={config.audio.futureAlertSound}
                    onChange={(e) =>
                      updateValue("audio", "futureAlertSound", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  >
                    <option value="/alertfuture.wav">Future Alert</option>
                    <option value="/alert.wav">Standard Alert</option>
                    <option value="/alerteas.wav">EAS Alert</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">
                General Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white">Auto Start with Windows</label>
                  <input
                    type="checkbox"
                    checked={config.general.autoStart}
                    onChange={(e) =>
                      updateValue("general", "autoStart", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-white">Start Minimized</label>
                  <input
                    type="checkbox"
                    checked={config.general.startMinimized}
                    onChange={(e) =>
                      updateValue("general", "startMinimized", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div>
                  <label className="text-white block mb-2">Log Level</label>
                  <select
                    value={config.general.logLevel}
                    onChange={(e) =>
                      updateValue("general", "logLevel", e.target.value as any)
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>

                <div>
                  <label className="text-white block mb-2">
                    Data Retention (days)
                  </label>
                  <input
                    type="number"
                    value={config.general.dataRetention}
                    onChange={(e) =>
                      updateValue(
                        "general",
                        "dataRetention",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                    min="1"
                    max="365"
                  />
                </div>
              </div>
            </div>
          )}

          {saving && (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md">
              Saving...
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}
