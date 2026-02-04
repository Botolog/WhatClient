import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { logger } from "./utils/logger"

const SETTINGS_FILE = join(process.cwd(), ".chitchat-settings.json")

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
  
  // Media Display
  mediaDisplayMode: "auto" | "indicator" | "ascii" | "kitty" | "iterm2" | "sixel" | "http"
  showMediaThumbnails: boolean
  maxThumbnailSize: number // pixels
  autoDownloadMediaOnEnter: boolean // Auto-download all media when entering chat
  
  // Advanced
  developerMode: boolean
  logLevel: "debug" | "info" | "warn" | "error"
  autoReconnect: boolean
  connectionTimeout: number
  mouseNaturalScroll: boolean
  mouseScrollSpeed: number // Lines scrolled per wheel tick (1-10)
  
  // WhatsApp Settings
  whatsapp: {
    autoMarkAsRead: boolean
    deleteOldMessages: boolean
    deleteOlderThan: number // days
  }
  
  // Slack Settings
  slack: {
    showThreads: boolean
    autoExpandThreads: boolean
  }
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
  
  mediaDisplayMode: "auto",
  showMediaThumbnails: true,
  maxThumbnailSize: 80,
  autoDownloadMediaOnEnter: false,
  
  developerMode: false,
  logLevel: "info",
  autoReconnect: true,
  connectionTimeout: 60,
  mouseNaturalScroll: true,
  mouseScrollSpeed: 3,
  
  whatsapp: {
    autoMarkAsRead: true,
    deleteOldMessages: false,
    deleteOlderThan: 30,
  },
  
  slack: {
    showThreads: true,
    autoExpandThreads: false,
  },
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

// Helper to get nested settings value
export function getNestedSetting(key: string): any {
  const parts = key.split('.')
  let value: any = currentSettings
  for (const part of parts) {
    value = value?.[part]
  }
  return value
}

// Helper to set nested settings value
export function setNestedSetting(key: string, value: any): void {
  const parts = key.split('.')
  if (parts.length === 1) {
    updateSetting(key as keyof AppSettings, value)
  } else {
    // Handle nested properties like "whatsapp.autoMarkAsRead"
    const obj: any = currentSettings
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {}
    }
    obj[parts[parts.length - 2]][parts[parts.length - 1]] = value
    saveSettings(currentSettings)
  }
}

// Settings menu structure for the TUI
export interface SettingItem {
  id: string
  label: string
  type: "toggle" | "radio" | "select" | "button" | "number" | "header"
  key?: keyof AppSettings | string // Allow nested keys like "whatsapp.autoMarkAsRead"
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  action?: () => void | Promise<void>
}

export interface SettingSection {
  title: string
  items: SettingItem[]
}

export interface SettingsPage {
  id: string
  title: string
  sections: SettingSection[]
}

// Main settings page
const MAIN_SETTINGS: SettingSection[] = [
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
      { id: "autoDownloadMediaOnEnter", label: "Auto-download Media on Chat Open", type: "toggle", key: "autoDownloadMediaOnEnter" },
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
      { id: "mouseNaturalScroll", label: "Mouse Natural Scroll", type: "toggle", key: "mouseNaturalScroll" },
      { id: "mouseScrollSpeed", label: "Mouse Scroll Speed (lines)", type: "number", key: "mouseScrollSpeed", min: 1, max: 10 },
    ]
  },
  {
    title: "📋 Actions",
    items: [
      { id: "clearMediaCache", label: "Clear Media Cache", type: "button" },
      { id: "clearCache", label: "Clear Cache", type: "button", action: () => { /* TODO */ } },
      { id: "exportSettings", label: "Export Settings", type: "button", action: () => { /* TODO */ } },
      { id: "resetSettings", label: "Reset to Defaults", type: "button", action: () => { 
        currentSettings = { ...DEFAULT_SETTINGS }
        saveSettings(currentSettings)
      }},
    ]
  },
]

// WhatsApp service settings
const WHATSAPP_SETTINGS: SettingSection[] = [
  {
    title: "📱 WhatsApp",
    items: [
      { id: "whatsapp.autoMarkAsRead", label: "Auto Mark as Read", type: "toggle", key: "whatsapp.autoMarkAsRead" },
      { id: "whatsapp.deleteOldMessages", label: "Delete Old Messages", type: "toggle", key: "whatsapp.deleteOldMessages" },
      { id: "whatsapp.deleteOlderThan", label: "Delete Messages Older Than (days)", type: "number", key: "whatsapp.deleteOlderThan", min: 1, max: 365 },
    ]
  },
]

// Slack service settings
const SLACK_SETTINGS: SettingSection[] = [
  {
    title: "💼 Slack",
    items: [
      { id: "slack.showThreads", label: "Show Threads", type: "toggle", key: "slack.showThreads" },
      { id: "slack.autoExpandThreads", label: "Auto Expand Threads", type: "toggle", key: "slack.autoExpandThreads" },
    ]
  },
]

// All settings pages
export const SETTINGS_PAGES: SettingsPage[] = [
  { id: "main", title: "Main Settings", sections: MAIN_SETTINGS },
  { id: "whatsapp", title: "WhatsApp", sections: WHATSAPP_SETTINGS },
  { id: "slack", title: "Slack", sections: SLACK_SETTINGS },
]

// Legacy export for backward compatibility
export const SETTINGS_MENU: SettingSection[] = MAIN_SETTINGS
