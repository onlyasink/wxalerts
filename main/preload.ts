import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { SystemConfig } from './types/config'

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  invoke(channel: string, ...args: unknown[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
}

const configHandler = {
  // Get entire configuration
  async getConfig(): Promise<SystemConfig> {
    return ipcRenderer.invoke('config:get')
  },
  
  // Get specific section
  async getSection<K extends keyof SystemConfig>(section: K): Promise<SystemConfig[K]> {
    return ipcRenderer.invoke('config:get-section', section)
  },
  
  // Get specific value
  async getValue<K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
    section: K, 
    key: T
  ): Promise<SystemConfig[K][T]> {
    return ipcRenderer.invoke('config:get-value', section, key)
  },
  
  // Update entire configuration
  async updateConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    return ipcRenderer.invoke('config:update', updates)
  },
  
  // Update specific section
  async updateSection<K extends keyof SystemConfig>(
    section: K, 
    updates: Partial<SystemConfig[K]>
  ): Promise<SystemConfig[K]> {
    return ipcRenderer.invoke('config:update-section', section, updates)
  },
  
  // Update specific value
  async updateValue<K extends keyof SystemConfig, T extends keyof SystemConfig[K]>(
    section: K, 
    key: T, 
    value: SystemConfig[K][T]
  ): Promise<SystemConfig[K][T]> {
    return ipcRenderer.invoke('config:update-value', section, key, value)
  },
  
  // Reset to defaults
  async resetToDefaults(): Promise<SystemConfig> {
    return ipcRenderer.invoke('config:reset')
  },
  
  // Reset specific section to defaults
  async resetSection<K extends keyof SystemConfig>(section: K): Promise<SystemConfig[K]> {
    return ipcRenderer.invoke('config:reset-section', section)
  },
  
  // Check if config file exists
  async hasConfigFile(): Promise<boolean> {
    return ipcRenderer.invoke('config:has-file')
  },
  
  // Get config file path
  async getConfigPath(): Promise<string> {
    return ipcRenderer.invoke('config:get-path')
  },
}

contextBridge.exposeInMainWorld('ipc', handler)
contextBridge.exposeInMainWorld('config', configHandler)

export type IpcHandler = typeof handler
export type ConfigHandler = typeof configHandler
