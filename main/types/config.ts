export interface SystemConfig {
  // Weather Alert Settings
  weather: {
    enabled: boolean;
    checkInterval: number; // in milliseconds
    state: string;
    zone: string; // NWS zone codes
    severityFilter: ('Minor' | 'Moderate' | 'Severe' | 'Extreme')[];
    autoPlaySound: boolean;
    soundFile: string;
    showNotifications: boolean;
  };
  
  // UI Settings
  ui: {
    theme: 'light' | 'dark' | 'auto';
    windowSize: {
      width: number;
      height: number;
    };
    alwaysOnTop: boolean;
    minimizeToTray: boolean;
  };
  
  // Audio Settings
  audio: {
    volume: number; // 0-1
    mute: boolean;
    alertSound: string;
    easSound: string;
    futureAlertSound: string;
  };
  
  // General Settings
  general: {
    autoStart: boolean;
    startMinimized: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    dataRetention: number; // days
  };
}

export const defaultConfig: SystemConfig = {
  weather: {
    enabled: true,
    checkInterval: 300000, // 5 minutes
    state: "AZ",
    zone: 'AZC009', // Graham County, AZ
    severityFilter: ['Minor', 'Moderate', 'Severe', 'Extreme'],
    autoPlaySound: true,
    soundFile: '/alert.wav',
    showNotifications: true,
  },
  ui: {
    theme: 'auto',
    windowSize: {
      width: 650,
      height: 650,
    },
    alwaysOnTop: false,
    minimizeToTray: true,
  },
  audio: {
    volume: 0.8,
    mute: false,
    alertSound: '/alert.wav',
    easSound: '/alerteas.wav',
    futureAlertSound: '/alertfuture.wav',
  },
  general: {
    autoStart: false,
    startMinimized: false,
    logLevel: 'info',
    dataRetention: 30,
  },
};

export type ConfigKey = keyof SystemConfig;
export type ConfigSection = keyof SystemConfig;
export type ConfigValue = SystemConfig[ConfigSection];
