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

export type ConfigKey = keyof SystemConfig;
export type ConfigSection = keyof SystemConfig;
export type ConfigValue = SystemConfig[ConfigSection];
