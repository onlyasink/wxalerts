import path from "path";
import {
  app,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  BrowserWindow,
  Notification,
  protocol,
  dialog,
  shell,
} from "electron";
import { MicaBrowserWindow } from "mica-electron";
import serve from "electron-serve";
import { ConfigManager } from "./config/ConfigManager";
import { SystemConfig } from "./types/config";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

let tray;
let isQuitting = false;
let configManager: ConfigManager;

app.on("before-quit", () => {
  isQuitting = true;
});
(async () => {
  await app.whenReady();

  // Initialize configuration manager
  configManager = new ConfigManager();

  protocol.handle("wxalerts", async (request) => {
    const _url = new URL(request.url);
    const storedAlertWin = new BrowserWindow({
      width: 650,
      height: 650,
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#00000000",
        symbolColor: "#000000",
        height: 34,
      },
      backgroundColor: "#00000000",
      backgroundMaterial: "mica",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
      show: false,
    });

    if (isProd) {
      await storedAlertWin.loadURL("app://./stored-alert");
    } else {
      const port = process.argv[2];
      await storedAlertWin.loadURL(`http://localhost:${port}/stored-alert`);
      storedAlertWin.webContents.openDevTools();
    }
    storedAlertWin.show();

    return new Response("OK", { status: 200 });
  });

  const mainWindow = new MicaBrowserWindow({
    width: 650,
    height: 650,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#00000000", // Background color of the overlay
      symbolColor: "#000000", // Color of the window control symbols
      height: 34, // Height of the title bar overlay
    },
    backgroundColor: "#00000000",
    backgroundMaterial: "mica",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  const iconPath =
    process.platform === "darwin"
      ? path.join(__dirname, "..", "resources", "icon.icns")
      : path.join(__dirname, "..", "resources", "icon.ico");
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);

  const showWindow = () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  };

  const hideWindow = () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Check for alerts",
      click: () => {
        mainWindow.webContents.send("bkg:nws:fetch");
      },
    },
    { type: "separator" },
    {
      label: "Settings",
      click: async () => {
        const settingsWin = new BrowserWindow({
          width: 950,
          height: 650,
          titleBarStyle: "hidden",
          titleBarOverlay: {
            color: "#00000000", // Background color of the overlay
            symbolColor: "#000000", // Color of the window control symbols
            height: 34, // Height of the title bar overlay
          },
          backgroundColor: "#00000000",
          backgroundMaterial: "mica",
          autoHideMenuBar: true,
          webPreferences: {
            preload: path.join(__dirname, "preload.js"),
          },
        });

        if (isProd) {
          await settingsWin.loadURL("app://./settings");
        } else {
          const port = process.argv[2];
          await settingsWin.loadURL(`http://localhost:${port}/settings`);
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("WX Alerts");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      hideWindow();
    } else {
      showWindow();
    }
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.webContents.send("main:win:close");
    }
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
  // Start hidden in tray; user can open from tray
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});

ipcMain.on("window:close", async (event, arg) => {
  const win =
    BrowserWindow.fromWebContents(event.sender) ||
    BrowserWindow.getAllWindows()[0];
  win.hide();
  win.webContents.send("bkg:nws:fetch");
});

// Fetch current NWS alerts for Graham County (AZC009), convert XML -> JSON, and reply
ipcMain.on("nws:fetch", async (event) => {
  const zoneCode = configManager.getValue("weather", "zone");
  console.log(`Making request to NWS API with Zone code: ${zoneCode}`);
  const url = `https://api.weather.gov/alerts/active?zone=${zoneCode}`;

  const fetchAlerts = async (requestUrl) => {
    const response = await fetch(requestUrl, {
      headers: {
        "User-Agent": "wxalerts/1.0",
        Accept: "application/geo+json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status}: ${response.statusText}`
      );
    }
    return response.json();
  };

  try {
    const json = await fetchAlerts(url);
    console.log(
      `Returned JSON: ${JSON.stringify(
        json.features.map((feature) => {
          return feature.properties.id;
        })
      )}`
    );
    const alerts = json.features;
    try {
      const win =
        BrowserWindow.fromWebContents(event.sender) ||
        BrowserWindow.getAllWindows()[0];

      alerts.map(async (alert) => {
        const getStoredIds = await win.webContents.executeJavaScript(
          'JSON.parse(localStorage.getItem("storedAlertIds") || "[]");',
          true
        );

        console.log(`Stored Alert IDs: ${getStoredIds}`);

        if (!getStoredIds || getStoredIds.length <= 0) {
          const storedIds = [alert.properties.id];
          const setStoredIds = await win.webContents.executeJavaScript(
            `localStorage.setItem("storedAlertIds", JSON.stringify(${JSON.stringify(
              storedIds
            )}));`,
            true
          );

          if (
            alert.properties.severity === "Severe" ||
            alert.properties.severity === "Extreme"
          ) {
            const getStoredAlerts = await win.webContents.executeJavaScript(
              `JSON.parse(localStorage.getItem("storedAlerts") || "[]");`,
              true
            );

            if (!getStoredAlerts || getStoredAlerts.length <= 0) {
              const setStoredAlerts = [alert];
              const updateStoredAlerts =
                await win.webContents.executeJavaScript(
                  `localStorage.setItem("storedAlerts", JSON.stringify(${JSON.stringify(
                    setStoredAlerts
                  )}));`,
                  true
                );
            } else {
              const updatedStoredAlerts = [alert, ...getStoredAlerts];
              const updateStoredAlerts =
                await win.webContents.executeJavaScript(
                  `localStorage.setItem("storedAlerts", JSON.stringify(${JSON.stringify(
                    updatedStoredAlerts
                  )}));`,
                  true
                );
            }

            event.reply("nws:result", { ok: true, data: alert });
            win.webContents.send("nws:alerteas:play", null);
            win.show();
            win.focus();
          } else {
            const getStoredAlerts = await win.webContents.executeJavaScript(
              `JSON.parse(localStorage.getItem("storedAlerts") || "[]");`,
              true
            );
            if (!getStoredAlerts || getStoredAlerts.length <= 0) {
              const setStoredAlerts = [alert];

              const updateStoredAlerts =
                await win.webContents.executeJavaScript(
                  `localStorage.setItem("storedAlerts", JSON.stringify(${JSON.stringify(
                    setStoredAlerts
                  )}));`,
                  true
                );

              win.webContents.send("nws:alert:play", null);
              const notif = new Notification({
                title: alert.properties.headline,
                body: alert.properties.description,
                silent: true,
              });

              notif.show();
              notif.on("click", async () => {
                const storedAlertWin = new BrowserWindow({
                  width: 650,
                  height: 650,
                  titleBarStyle: "hidden",
                  titleBarOverlay: {
                    color: "#00000000",
                    symbolColor: "#000000",
                    height: 34,
                  },
                  backgroundColor: "#00000000",
                  backgroundMaterial: "mica",
                  autoHideMenuBar: true,
                  webPreferences: {
                    preload: path.join(__dirname, "preload.js"),
                  },
                  show: false,
                });

                if (isProd) {
                  await storedAlertWin.loadURL("app://./stored-alert");
                } else {
                  const port = process.argv[2];
                  await storedAlertWin.loadURL(
                    `http://localhost:${port}/stored-alert`
                  );
                }
                storedAlertWin.show();
              });
            } else {
              const updatedStoredAlerts = [alert, ...getStoredAlerts];

              const updateStoredAlerts =
                await win.webContents.executeJavaScript(
                  `localStorage.setItem("storedAlerts", JSON.stringify(${JSON.stringify(
                    updatedStoredAlerts
                  )}));`,
                  true
                );

              win.webContents.send("nws:alert:play", null);
              const notif = new Notification({
                title: alert.properties.headline,
                body: alert.properties.description,
                silent: true,
              });

              notif.show();
              notif.on("click", async () => {
                const storedAlertWin = new BrowserWindow({
                  width: 650,
                  height: 650,
                  titleBarStyle: "hidden",
                  titleBarOverlay: {
                    color: "#00000000",
                    symbolColor: "#000000",
                    height: 34,
                  },
                  backgroundColor: "#00000000",
                  backgroundMaterial: "mica",
                  autoHideMenuBar: true,
                  webPreferences: {
                    preload: path.join(__dirname, "preload.js"),
                  },
                  show: false,
                });

                if (isProd) {
                  await storedAlertWin.loadURL("app://./stored-alert");
                } else {
                  const port = process.argv[2];
                  await storedAlertWin.loadURL(
                    `http://localhost:${port}/stored-alert`
                  );
                }
                storedAlertWin.show();
              });
            }
          }
        } else if (getStoredIds.includes(alert.properties.id)) {
          const getStoredAlerts = await win.webContents.executeJavaScript(
            `JSON.parse(localStorage.getItem("storedAlerts") || "[]");`,
            true
          );

          const storedAlert = getStoredAlerts.find(
            (sAlert) => sAlert.properties.id === alert.properties.id
          );

          if (
            storedAlert.properties.headline !==
              alert.properties.headline ||
            storedAlert.properties.description !==
              alert.properties.description
          ) {
            win.webContents.send("nws:alert:play", null);
            const notif = new Notification({
              title: `Alert updated: ${alert.properties.headline}`,
              body: `Click to view the updated alert.`,
              silent: true,
            });

            notif.show();
            notif.on("click", async () => {
              const viewAlertWin = new BrowserWindow({
                width: 650,
                height: 650,
                titleBarStyle: "hidden",
                titleBarOverlay: {
                  color: "#00000000",
                  symbolColor: "#000000",
                  height: 34,
                },
                backgroundColor: "#00000000",
                backgroundMaterial: "mica",
                autoHideMenuBar: true,
                webPreferences: {
                  preload: path.join(__dirname, "preload.js"),
                },
                show: false,
              });

              if (isProd) {
                await viewAlertWin.loadURL(
                  `app://./alerts/${alert.properties.id}`
                );
              } else {
                const port = process.argv[2];
                await viewAlertWin.loadURL(
                  `http://localhost:${port}/alerts/${alert.properties.id}`
                );
              }
              viewAlertWin.show();
            });
          } else {
            return new Notification({
              title: "No updates found",
              body: "Alert check complete. No updates found.",
              silent: true,
            }).show();
          }
        } else if(getStoredIds.length === alerts.length) {

        } else {
          const updatedStoredIds = [
            ...getStoredIds,
            alert.properties.id,
          ];
          console.log(`Updating stored Alert IDs: ${updatedStoredIds}`);

          const updateStoredIds = await win.webContents.executeJavaScript(
            `localStorage.setItem("storedAlertIds", JSON.stringify(${JSON.stringify(
              updatedStoredIds
            )}));`,
            true
          );

          if (
            alert.properties.severity === "Severe" ||
            alert.properties.severity === "Extreme"
          ) {
            event.reply("nws:result", { ok: true, data: alert });
            win.webContents.send("nws:alerteas:play", null);
            win.show();
            win.focus();
          } else {
            const getStoredAlerts = await win.webContents.executeJavaScript(
              `JSON.parse(localStorage.getItem("storedAlerts") || "[]");`,
              true
            );
            if (!getStoredAlerts || getStoredAlerts.length <= 0) {
              const setStoredAlerts = [alert];

              const updateStoredAlerts =
                await win.webContents.executeJavaScript(
                  `localStorage.setItem("storedAlerts", JSON.stringify(${JSON.stringify(
                    setStoredAlerts
                  )}));`,
                  true
                );

              win.webContents.send("nws:alert:play", null);
              const notif = new Notification({
                title: alert.properties.headline,
                body: alert.properties.description,
                silent: true,
              });

              notif.show();
              notif.on("click", async () => {
                const storedAlertWin = new BrowserWindow({
                  width: 650,
                  height: 650,
                  titleBarStyle: "hidden",
                  titleBarOverlay: {
                    color: "#00000000",
                    symbolColor: "#000000",
                    height: 34,
                  },
                  backgroundColor: "#00000000",
                  backgroundMaterial: "mica",
                  autoHideMenuBar: true,
                  webPreferences: {
                    preload: path.join(__dirname, "preload.js"),
                  },
                  show: false,
                });

                if (isProd) {
                  await storedAlertWin.loadURL("app://./stored-alert");
                } else {
                  const port = process.argv[2];
                  await storedAlertWin.loadURL(
                    `http://localhost:${port}/stored-alert`
                  );
                }
                storedAlertWin.show();
              });
            } else {
              const updatedStoredAlerts = [alert, ...getStoredAlerts];

              const updateStoredAlerts =
                await win.webContents.executeJavaScript(
                  `localStorage.setItem("storedAlerts", JSON.stringify(${JSON.stringify(
                    updatedStoredAlerts
                  )}));`,
                  true
                );

              win.webContents.send("nws:alert:play", null);
              const notif = new Notification({
                title: alert.properties.headline,
                body: alert.properties.description,
                silent: true,
              });

              notif.show();
              notif.on("click", async () => {
                const storedAlertWin = new BrowserWindow({
                  width: 650,
                  height: 650,
                  titleBarStyle: "hidden",
                  titleBarOverlay: {
                    color: "#00000000",
                    symbolColor: "#000000",
                    height: 34,
                  },
                  backgroundColor: "#00000000",
                  backgroundMaterial: "mica",
                  autoHideMenuBar: true,
                  webPreferences: {
                    preload: path.join(__dirname, "preload.js"),
                  },
                  show: false,
                });

                if (isProd) {
                  await storedAlertWin.loadURL("app://./stored-alert");
                } else {
                  const port = process.argv[2];
                  await storedAlertWin.loadURL(
                    `http://localhost:${port}/stored-alert`
                  );
                }
                storedAlertWin.show();
              });
            }
          }
        }
      });
    } catch (e) {
      event.reply("nws:error", {
        ok: false,
        message: e?.message || String(e),
      });
    }
  } catch (error) {
    event.reply("nws:error", {
      ok: false,
      message: error?.message || String(error),
    });
  }
});

ipcMain.on("show-window", async (event, arg) => {
  const win =
    BrowserWindow.fromWebContents(event.sender) ||
    BrowserWindow.getAllWindows()[0];
  if (win) {
    win.show();
    win.focus();
  }
});

// Configuration IPC handlers
ipcMain.handle("config:get", async () => {
  return configManager.getConfig();
});

ipcMain.handle("config:get-section", async (event, section) => {
  return configManager.getSection(section);
});

ipcMain.handle("config:get-value", async (event, section, key) => {
  return configManager.getValue(section, key);
});

ipcMain.handle("config:update", async (event, updates) => {
  return configManager.updateConfig(updates);
});

ipcMain.handle("config:update-section", async (event, section, updates) => {
  return configManager.updateSection(section, updates);
});

ipcMain.handle("config:update-value", async (event, section, key, value) => {
  return configManager.updateValue(section, key, value);
});

ipcMain.handle("config:reset", async () => {
  return configManager.resetToDefaults();
});

ipcMain.handle("config:reset-section", async (event, section) => {
  return configManager.resetSection(section);
});

ipcMain.handle("config:has-file", async () => {
  return configManager.hasConfigFile();
});

ipcMain.handle("config:get-path", async () => {
  return configManager.getConfigPath();
});
