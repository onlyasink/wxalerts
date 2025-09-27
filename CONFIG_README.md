# System Configuration for WX Alerts

This document explains how to use the system configuration feature in the WX Alerts application.

## Overview

The configuration system allows you to:
- Store and retrieve application settings
- Update settings via IPC (Inter-Process Communication)
- Persist settings to disk
- Reset settings to defaults
- Access settings from both main and renderer processes

## Configuration Structure

The configuration is organized into four main sections:

### 1. Weather Settings (`weather`)
- `enabled`: Enable/disable weather alerts
- `checkInterval`: How often to check for alerts (in milliseconds)
- `zones`: Array of NWS zone codes to monitor
- `severityFilter`: Array of severity levels to show
- `autoPlaySound`: Whether to automatically play alert sounds
- `soundFile`: Default sound file for alerts
- `showNotifications`: Whether to show system notifications

### 2. UI Settings (`ui`)
- `theme`: Application theme ('light', 'dark', 'auto')
- `windowSize`: Default window dimensions
- `alwaysOnTop`: Keep window on top of other applications
- `minimizeToTray`: Minimize to system tray instead of taskbar

### 3. Audio Settings (`audio`)
- `volume`: Audio volume (0-1)
- `mute`: Mute all audio
- `alertSound`: Sound file for regular alerts
- `easSound`: Sound file for EAS alerts
- `futureAlertSound`: Sound file for future alerts

### 4. General Settings (`general`)
- `autoStart`: Start with Windows
- `startMinimized`: Start minimized to tray
- `logLevel`: Logging verbosity level
- `dataRetention`: How long to keep data (in days)

## Usage Examples

### From Renderer Process (React Components)

```typescript
// Get entire configuration
const config = await window.config.getConfig();

// Get specific section
const weatherConfig = await window.config.getSection('weather');

// Get specific value
const checkInterval = await window.config.getValue('weather', 'checkInterval');

// Update entire configuration
const updatedConfig = await window.config.updateConfig({
  weather: {
    enabled: true,
    checkInterval: 300000
  }
});

// Update specific section
const updatedWeather = await window.config.updateSection('weather', {
  enabled: false
});

// Update specific value
await window.config.updateValue('weather', 'enabled', true);

// Reset to defaults
const defaultConfig = await window.config.resetToDefaults();

// Reset specific section
const defaultWeather = await window.config.resetSection('weather');
```

### From Main Process (Node.js)

```typescript
import { ConfigManager } from './config/ConfigManager';

// Initialize configuration manager
const configManager = new ConfigManager();

// Get entire configuration
const config = configManager.getConfig();

// Get specific section
const weatherConfig = configManager.getSection('weather');

// Get specific value
const checkInterval = configManager.getValue('weather', 'checkInterval');

// Update entire configuration
const updatedConfig = configManager.updateConfig({
  weather: {
    enabled: true,
    checkInterval: 300000
  }
});

// Update specific section
const updatedWeather = configManager.updateSection('weather', {
  enabled: false
});

// Update specific value
configManager.updateValue('weather', 'enabled', true);

// Reset to defaults
const defaultConfig = configManager.resetToDefaults();

// Reset specific section
const defaultWeather = configManager.resetSection('weather');
```

## Configuration File Location

The configuration is stored in a JSON file at:
- **Windows**: `%APPDATA%/wxalerts-app/config.json`
- **macOS**: `~/Library/Application Support/wxalerts-app/config.json`
- **Linux**: `~/.config/wxalerts-app/config.json`

## Default Configuration

If no configuration file exists, the application will use these defaults:

```json
{
  "weather": {
    "enabled": true,
    "checkInterval": 300000,
    "zones": ["AZC009"],
    "severityFilter": ["Minor", "Moderate", "Severe", "Extreme"],
    "autoPlaySound": true,
    "soundFile": "/alert.wav",
    "showNotifications": true
  },
  "ui": {
    "theme": "auto",
    "windowSize": {
      "width": 650,
      "height": 650
    },
    "alwaysOnTop": false,
    "minimizeToTray": true
  },
  "audio": {
    "volume": 0.8,
    "mute": false,
    "alertSound": "/alert.wav",
    "easSound": "/alerteas.wav",
    "futureAlertSound": "/alertfuture.wav"
  },
  "general": {
    "autoStart": false,
    "startMinimized": false,
    "logLevel": "info",
    "dataRetention": 30
  }
}
```

## Settings UI

The application includes a comprehensive settings UI accessible via the settings button in the main interface. The settings are organized into tabs:

1. **Weather Alerts**: Configure alert behavior and monitoring
2. **Interface**: Customize UI appearance and behavior
3. **Audio**: Adjust sound settings and volume
4. **General**: Set application-wide preferences

## Integration with Existing Features

The configuration system is integrated with existing features:

- **Weather fetching**: Uses `weather.checkInterval` and `weather.enabled`
- **Sound playback**: Respects `weather.autoPlaySound` and audio settings
- **Window behavior**: Uses UI settings for window size and behavior
- **Notifications**: Respects `weather.showNotifications` setting

## Error Handling

The configuration system includes robust error handling:

- If the config file is corrupted, it falls back to defaults
- If a specific value is missing, it uses the default value
- All operations are wrapped in try-catch blocks
- Errors are logged to the console for debugging

## Type Safety

The configuration system is fully typed with TypeScript:

- All configuration keys are type-checked
- Section and value types are enforced
- IntelliSense support for all configuration properties
- Compile-time error checking for invalid configurations
