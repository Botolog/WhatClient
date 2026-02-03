import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { logger } from "./utils/logger"

const SETTINGS_FILE = join(process.cwd(), ".whatclient-settings.json")

export interface AppSettings {
  // Appearance
  theme: "dark" | "light" | "system"
  fontSize: "small" | "medium" | "large"
  showAvatars: boolean
  compactMode: boolean
  
  // Notifications
  notificationsEnabled: boolean
  notificationSound: boolean
  notificationPreview: boolean
  mutedChats: string[]
  
  // Privacy
  showReadReceipts: boolean
  showTypingIndicator: boolean
  showLastSeen: boolean
  
  // Chat
  enterToSend: boolean
  spellCheck: boolean
  autoDownloadMedia: "always" | "wifi" | "never"
  mediaQuality: "low" | "medium" | "high"
  
  // Advanced
  developerMode: boolean
  logLevel: "debug" | "info" | "warn" | "error"
  autoReconnect: boolean
  connectionTimeout: number
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  fontSize: "medium",
  showAvatars: true,
  compactMode: false,
  
  notificationsEnabled: true,
  notificationSound: true,
  notificationPreview: true,
  mutedChats: [],
  
  showReadReceipts: true,
  showTypingIndicator: true,
  showLastSeen: true,
  
  enterToSend: true,
  spellCheck: false,
  autoDownloadMedia: "wifi",
  mediaQuality: "medium",
  
  developerMode: false,
  logLevel: "info",
  autoReconnect: true,
  connectionTimeout: 60,
}

let currentSettings: AppSettings = { ...DEFAULT_SETTINGS }

export function loadSettings(): AppSettings {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = readFileSync(SETTINGS_FILE, "utf-8")
      const loaded = JSON.parse(data)
      currentSettings = { ...DEFAULT_SETTINGS, ...loaded }
      logger.info("Settings", "Loaded settings from file")
    } else {
      currentSettings = { ...DEFAULT_SETTINGS }
      logger.info("Settings", "Using default settings")
    }
  } catch (err) {
    logger.error("Settings", "Failed to load settings", err)
    currentSettings = { ...DEFAULT_SETTINGS }
  }
  return currentSettings
}

export function saveSettings(settings: AppSettings): boolean {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    currentSettings = settings
    logger.info("Settings", "Saved settings to file")
    return true
  } catch (err) {
    logger.error("Settings", "Failed to save settings", err)
    return false
  }
}

export function getSettings(): AppSettings {
  return currentSettings
}

export function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  currentSettings[key] = value
  saveSettings(currentSettings)
}

// Settings menu structure for the TUI
export interface SettingItem {
  id: string
  label: string
  type: "toggle" | "radio" | "select" | "button" | "number" | "header"
  key?: keyof AppSettings
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  action?: () => void
}

export interface SettingSection {
  title: string
  items: SettingItem[]
}

export const SETTINGS_MENU: SettingSection[] = [
  {
    title: "🎨 Appearance",
    items: [
      { id: "theme", label: "Theme", type: "radio", key: "theme", options: [
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
        { value: "system", label: "System" },
      ]},
      { id: "fontSize", label: "Font Size", type: "radio", key: "fontSize", options: [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" },
      ]},
      { id: "showAvatars", label: "Show Avatars", type: "toggle", key: "showAvatars" },
      { id: "compactMode", label: "Compact Mode", type: "toggle", key: "compactMode" },
    ]
  },
  {
    title: "🔔 Notifications",
    items: [
      { id: "notificationsEnabled", label: "Enable Notifications", type: "toggle", key: "notificationsEnabled" },
      { id: "notificationSound", label: "Notification Sound", type: "toggle", key: "notificationSound" },
      { id: "notificationPreview", label: "Show Message Preview", type: "toggle", key: "notificationPreview" },
    ]
  },
  {
    title: "🔒 Privacy",
    items: [
      { id: "showReadReceipts", label: "Show Read Receipts", type: "toggle", key: "showReadReceipts" },
      { id: "showTypingIndicator", label: "Show Typing Indicator", type: "toggle", key: "showTypingIndicator" },
      { id: "showLastSeen", label: "Show Last Seen", type: "toggle", key: "showLastSeen" },
    ]
  },
  {
    title: "💬 Chat",
    items: [
      { id: "enterToSend", label: "Enter to Send", type: "toggle", key: "enterToSend" },
      { id: "spellCheck", label: "Spell Check", type: "toggle", key: "spellCheck" },
      { id: "autoDownloadMedia", label: "Auto-Download Media", type: "select", key: "autoDownloadMedia", options: [
        { value: "always", label: "Always" },
        { value: "wifi", label: "WiFi Only" },
        { value: "never", label: "Never" },
      ]},
      { id: "mediaQuality", label: "Media Quality", type: "select", key: "mediaQuality", options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ]},
    ]
  },
  {
    title: "⚙️ Advanced",
    items: [
      { id: "developerMode", label: "Developer Mode", type: "toggle", key: "developerMode" },
      { id: "logLevel", label: "Log Level", type: "select", key: "logLevel", options: [
        { value: "debug", label: "Debug" },
        { value: "info", label: "Info" },
        { value: "warn", label: "Warning" },
        { value: "error", label: "Error" },
      ]},
      { id: "autoReconnect", label: "Auto Reconnect", type: "toggle", key: "autoReconnect" },
      { id: "connectionTimeout", label: "Connection Timeout (s)", type: "number", key: "connectionTimeout", min: 10, max: 300 },
    ]
  },
  {
    title: "📋 Actions",
    items: [
      { id: "clearCache", label: "Clear Cache", type: "button", action: () => { /* TODO */ } },
      { id: "exportSettings", label: "Export Settings", type: "button", action: () => { /* TODO */ } },
      { id: "resetSettings", label: "Reset to Defaults", type: "button", action: () => { 
        currentSettings = { ...DEFAULT_SETTINGS }
        saveSettings(currentSettings)
      }},
    ]
  },
]
