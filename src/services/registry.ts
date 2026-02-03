import { logger } from "../utils/logger"

export interface ServiceTheme {
  bg: string
  surface: string
  surfaceLight: string
  border: string
  primary: string
  text: string
  textMuted: string
  sent: string
  received: string
  accent: string
  titleBar: string
}

export interface ServiceConfig {
  id: string
  name: string
  icon: string
  description: string
  theme: ServiceTheme
  enabled: boolean
  hasAuth: boolean
}

export const SERVICES: Record<string, ServiceConfig> = {
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "📱",
    description: "WhatsApp Messenger",
    enabled: true,
    hasAuth: true,
    theme: {
      bg: "#111B21",
      surface: "#1F2C34",
      surfaceLight: "#2A3942",
      border: "#2A3942",
      primary: "#25D366",
      text: "#E9EDEF",
      textMuted: "#8696A0",
      sent: "#005C4B",
      received: "#1F2C34",
      accent: "#25D366",
      titleBar: "#128C7E",
    }
  },
  discord: {
    id: "discord",
    name: "Discord",
    icon: "🎮",
    description: "Discord Chat",
    enabled: true,
    hasAuth: true,
    theme: {
      bg: "#313338",
      surface: "#2B2D31",
      surfaceLight: "#383A40",
      border: "#3F4147",
      primary: "#5865F2",
      text: "#DBDEE1",
      textMuted: "#949BA4",
      sent: "#5865F2",
      received: "#2B2D31",
      accent: "#5865F2",
      titleBar: "#5865F2",
    }
  },
  slack: {
    id: "slack",
    name: "Slack",
    icon: "💼",
    description: "Slack Workspace",
    enabled: true,
    hasAuth: true,
    theme: {
      bg: "#1A1D21",
      surface: "#222529",
      surfaceLight: "#2C2F33",
      border: "#3D3D40",
      primary: "#E01E5A",
      text: "#D1D2D3",
      textMuted: "#9B9C9E",
      sent: "#E01E5A",
      received: "#222529",
      accent: "#E01E5A",
      titleBar: "#E01E5A",
    }
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    description: "Telegram Messenger",
    enabled: true,
    hasAuth: true,
    theme: {
      bg: "#17212B",
      surface: "#1E2C3A",
      surfaceLight: "#253341",
      border: "#2B3E50",
      primary: "#2AABEE",
      text: "#F5F5F5",
      textMuted: "#8B9BA3",
      sent: "#2B5278",
      received: "#1E2C3A",
      accent: "#2AABEE",
      titleBar: "#2AABEE",
    }
  },
  signal: {
    id: "signal",
    name: "Signal",
    icon: "🔒",
    description: "Signal Private Messenger",
    enabled: false,
    hasAuth: true,
    theme: {
      bg: "#1B1C1F",
      surface: "#2C2C2E",
      surfaceLight: "#3A3A3C",
      border: "#48484A",
      primary: "#3A76F0",
      text: "#FFFFFF",
      textMuted: "#8E8E93",
      sent: "#3A76F0",
      received: "#2C2C2E",
      accent: "#3A76F0",
      titleBar: "#3A76F0",
    }
  },
  matrix: {
    id: "matrix",
    name: "Matrix",
    icon: "🔗",
    description: "Matrix/Element Chat",
    enabled: false,
    hasAuth: true,
    theme: {
      bg: "#15191E",
      surface: "#1A1F25",
      surfaceLight: "#21262C",
      border: "#2D333B",
      primary: "#0DBD8B",
      text: "#FFFFFF",
      textMuted: "#8B949E",
      sent: "#0DBD8B",
      received: "#1A1F25",
      accent: "#0DBD8B",
      titleBar: "#0DBD8B",
    }
  },
}

export function getService(id: string): ServiceConfig | null {
  return SERVICES[id] || null
}

export function getEnabledServices(): ServiceConfig[] {
  return Object.values(SERVICES).filter(s => s.enabled)
}

export function getAllServices(): ServiceConfig[] {
  return Object.values(SERVICES)
}

export function getServiceTheme(id: string): ServiceTheme {
  const service = SERVICES[id]
  if (!service) {
    logger.warn("Registry", "Unknown service, using WhatsApp theme", { id })
    return SERVICES.whatsapp.theme
  }
  return service.theme
}
