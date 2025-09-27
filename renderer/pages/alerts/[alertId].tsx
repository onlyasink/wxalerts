import React from "react";
import Head from "next/head";
// import Link from 'next/link'
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import moment from "moment";

export default function HomePage({ alertId }: any) {
  const [nwsData, setNwsData] = React.useState(null);

  React.useEffect(() => {
    const getStoredAlerts = window.localStorage.getItem("storedAlerts");
    const storedAlerts = getStoredAlerts ? JSON.parse(getStoredAlerts) : [];
    const alert = storedAlerts.find((alert) => alert.id === alertId);
    setNwsData(alert);
  });

  return (
    <React.Fragment>
      <Head>
        <title>ALERT: {nwsData?.properties?.headline}</title>
      </Head>
      <div
        className={`w-full p-4 h-screen flex flex-col items-center justify-center gap-3 cascadia-mono`}
      >
        <div className="h-6 -mt-2.5 w-full drag-region flex flex-row items-center gap-2">
          <div className="h-2 rounded-full w-full dark:bg-[#000]/20 bg-[#ACACAC]/30" />
          <span className="w-1/4" />
        </div>
        <div className="flex flex-row gap-6 mx-auto w-1/1.5 items-center">
          <Image src="/images/logo.png" width={65} height={65} alt="WXAlerts" />
          <div className="flex flex-col gap-1 text-left">
            <h1 className="font-bold text-xl dark:text-white">
              {nwsData?.properties?.event} | {nwsData?.properties.senderName}
            </h1>
            <h1 className="font-normal text-md dark:text-white">
              {nwsData?.properties?.severity} |{" "}
              {moment(nwsData?.properties.onset).format("DD/MM/YYYY HH:MM a")} -{" "}
              {moment(nwsData?.properties.ends).format("DD/MM/YYYY HH:MM a")}
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
