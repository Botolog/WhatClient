import { 
  BoxRenderable, 
  TextRenderable,
  ScrollBoxRenderable,
  type CliRenderer
} from "@opentui/core"
import { getAllServices, getEnabledServices, type ServiceConfig } from "../services/registry"
import { logger } from "../utils/logger"

export interface MainMenuState {
  selectedIndex: number
  services: ServiceConfig[]
}

const menuColors = {
  bg: "#0D1117",
  surface: "#161B22",
  surfaceLight: "#21262D",
  border: "#30363D",
  primary: "#58A6FF",
  text: "#C9D1D9",
  textMuted: "#8B949E",
  accent: "#58A6FF",
  titleBar: "#161B22",
}

export function createMainMenuState(): MainMenuState {
  return {
    selectedIndex: 0,
    services: getEnabledServices(),
  }
}

export function renderMainMenu(
  width: number,
  height: number,
  state: MainMenuState,
  onRender: (lines: string[]) => void
) {
  const lines: string[] = []
  const boxWidth = Math.min(70, width - 4)
  const boxHeight = Math.min(30, height - 4)
  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length))
  const center = (s: string, w: number) => {
    const padding = Math.max(0, w - s.length)
    const left = Math.floor(padding / 2)
    const right = padding - left
    return " ".repeat(left) + s + " ".repeat(right)
  }

  // ASCII Art Logo
  const logo = [
    "  _____ _           _    _____ _ _            _   ",
    " / ____| |         | |  / ____| (_)          | |  ",
    "| |    | |__   __ _| |_| |    | |_  ___ _ __ | |_ ",
    "| |    | '_ \\ / _` | __| |    | | |/ _ \\ '_ \\| __|",
    "| |____| | | | (_| | |_| |____| | |  __/ | | | |_ ",
    " \\_____|_| |_|\\__,_|\\__|\\_____|_|_|\\___|_| |_|\\__|",
  ]

  lines.push("╭" + "─".repeat(boxWidth - 2) + "╮")
  
  // Logo section
  lines.push("│" + " ".repeat(boxWidth - 2) + "│")
  for (const logoLine of logo) {
    lines.push("│" + center(logoLine, boxWidth - 2) + "│")
  }
  lines.push("│" + " ".repeat(boxWidth - 2) + "│")
  lines.push("│" + center("Universal Messaging Client", boxWidth - 2) + "│")
  lines.push("│" + center("v1.0.0", boxWidth - 2) + "│")
  lines.push("│" + " ".repeat(boxWidth - 2) + "│")
  lines.push("├" + "─".repeat(boxWidth - 2) + "┤")
  lines.push("│" + center("Select a Service", boxWidth - 2) + "│")
  lines.push("│" + " ".repeat(boxWidth - 2) + "│")

  // Service list
  state.services.forEach((service, idx) => {
    const isSelected = idx === state.selectedIndex
    const prefix = isSelected ? " ▸ " : "   "
    const status = service.enabled ? "" : " (coming soon)"
    const serviceText = `${prefix}${service.icon}  ${service.name}${status}`
    
    if (isSelected) {
      const highlighted = `\x1b[7m${pad(serviceText, boxWidth - 2)}\x1b[0m`
      lines.push("│" + highlighted + "│")
      lines.push("│" + pad(`      ${service.description}`, boxWidth - 2) + "│")
    } else {
      lines.push("│" + pad(serviceText, boxWidth - 2) + "│")
    }
  })

  lines.push("│" + " ".repeat(boxWidth - 2) + "│")
  lines.push("├" + "─".repeat(boxWidth - 2) + "┤")
  lines.push("│" + center("↑↓ Navigate │ Enter Select │ S Settings │ Q Quit", boxWidth - 2) + "│")
  lines.push("╰" + "─".repeat(boxWidth - 2) + "╯")

  onRender(lines)
}

export function navigateMenu(state: MainMenuState, direction: "up" | "down"): void {
  if (direction === "up" && state.selectedIndex > 0) {
    state.selectedIndex--
  } else if (direction === "down" && state.selectedIndex < state.services.length - 1) {
    state.selectedIndex++
  }
}

export function getSelectedService(state: MainMenuState): ServiceConfig | null {
  return state.services[state.selectedIndex] || null
}

export function renderGlobalSettings(
  width: number,
  height: number,
  selectedItem: number,
  onRender: (lines: string[]) => void
) {
  const lines: string[] = []
  const boxWidth = Math.min(60, width - 4)
  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length))

  const settingsItems = [
    { label: "Default Service", value: "WhatsApp", type: "select" },
    { label: "Start Minimized", value: false, type: "toggle" },
    { label: "Auto-connect on Launch", value: true, type: "toggle" },
    { label: "Show Notifications", value: true, type: "toggle" },
    { label: "Notification Sound", value: true, type: "toggle" },
    { label: "Theme Mode", value: "Dark", type: "select" },
    { label: "Language", value: "English", type: "select" },
    { label: "Check for Updates", value: true, type: "toggle" },
    { label: "Send Anonymous Usage Data", value: false, type: "toggle" },
    { label: "Reset All Settings", value: null, type: "button" },
  ]

  lines.push("╭" + "─".repeat(boxWidth - 2) + "╮")
  lines.push("│" + pad(" ⚙️  Global Settings", boxWidth - 2) + "│")
  lines.push("├" + "─".repeat(boxWidth - 2) + "┤")
  lines.push("│" + " ".repeat(boxWidth - 2) + "│")

  settingsItems.forEach((item, idx) => {
    const isSelected = idx === selectedItem
    const prefix = isSelected ? " ▸ " : "   "
    let valueStr = ""
    
    if (item.type === "toggle") {
      valueStr = item.value ? " [●]" : " [○]"
    } else if (item.type === "select") {
      valueStr = ` [${item.value}]`
    } else if (item.type === "button") {
      valueStr = " →"
    }
    
    const line = `${prefix}${item.label}${valueStr}`
    if (isSelected) {
      lines.push("│" + `\x1b[7m${pad(line, boxWidth - 2)}\x1b[0m` + "│")
    } else {
      lines.push("│" + pad(line, boxWidth - 2) + "│")
    }
  })

  lines.push("│" + " ".repeat(boxWidth - 2) + "│")
  lines.push("├" + "─".repeat(boxWidth - 2) + "┤")
  lines.push("│" + pad(" ↑↓ Navigate │ Enter Toggle │ Esc Back", boxWidth - 2) + "│")
  lines.push("╰" + "─".repeat(boxWidth - 2) + "╯")

  onRender(lines)
}
