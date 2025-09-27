import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { SystemConfig, defaultConfig } from '../types/config';

export class ConfigManager {
  private configPath: string;
  private config: SystemConfig;

  constructor() {
    this.configPath = join(app.getPath('userData'), 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): SystemConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf8');
        const loadedConfig = JSON.parse(configData);
        // Merge with defaults to ensure all properties exist
        return this.mergeWithDefaults(loadedConfig);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    
    // Return default config if loading fails
    return this.mergeWithDefaults({});
  }

  private mergeWithDefaults(loadedConfig: Partial<SystemConfig>): SystemConfig {
    const merged = { ...defaultConfig };
    
    // Deep merge each section
    Object.keys(defaultConfig).forEach(section => {
      if (loadedConfig[section]) {
        merged[section] = { ...defaultConfig[section], ...loadedConfig[section] };
      }
    });
    
    return merged;
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  // Get entire config
  getConfig(): SystemConfig {
    return { ...this.config };
  }

  // Get specific section
  getSection<K extends keyof SystemConfig>(section: K): SystemConfig[K] {
    return { ...this.config[section] };
  }

  // Get specific value
  getValue<K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
    section: K,
    key: T
  ): SystemConfig[K][T] {
    return this.config[section][key];
  }

  // Update entire config
  updateConfig(newConfig: Partial<SystemConfig>): SystemConfig {
    this.config = this.mergeWithDefaults({ ...this.config, ...newConfig });
    this.saveConfig();
    return this.getConfig();
  }

  // Update specific section
  updateSection<K extends keyof SystemConfig>(
    section: K,
    updates: Partial<SystemConfig[K]>
  ): SystemConfig[K] {
    this.config[section] = { ...this.config[section], ...updates };
    this.saveConfig();
    return this.getSection(section);
  }

  // Update specific value
  updateValue<K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
    section: K,
    key: T,
    value: SystemConfig[K][T]
  ): SystemConfig[K][T] {
    this.config[section][key] = value;
    this.saveConfig();
    return value;
  }

  // Reset to defaults
  resetToDefaults(): SystemConfig {
    this.config = { ...defaultConfig };
    this.saveConfig();
    return this.getConfig();
  }

  // Reset specific section to defaults
  resetSection<K extends keyof SystemConfig>(section: K): SystemConfig[K] {
    this.config[section] = { ...defaultConfig[section] };
    this.saveConfig();
    return this.getSection(section);
  }

  // Check if config file exists
  hasConfigFile(): boolean {
    return existsSync(this.configPath);
  }

  // Get config file path
  getConfigPath(): string {
    return this.configPath;
  }
}
