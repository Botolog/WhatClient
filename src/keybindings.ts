import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { logger } from "./utils/logger"

const KEYBINDINGS_FILE = join(process.cwd(), ".chitchat-keybindings.json")

export interface KeyBinding {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
}

export interface KeyBindings {
  // Global
  quit: KeyBinding
  settings: KeyBinding
  help: KeyBinding
  
  // Chat list actions
  refreshChats: KeyBinding
  pinChat: KeyBinding
  muteChat: KeyBinding
  archiveChat: KeyBinding
  
  // Message actions (configurable)
  jumpToReply: KeyBinding
  setReplyReference: KeyBinding
  openMedia: KeyBinding
  deleteMessageForMe: KeyBinding
  deleteMessageForEveryone: KeyBinding
  editMessage: KeyBinding
}

const DEFAULT_KEYBINDINGS: KeyBindings = {
  // Global
  quit: { key: "q", ctrl: true, description: "Quit application" },
  settings: { key: "f2", description: "Open settings" },
  help: { key: "?", description: "Toggle help" },
  
  // Chat list actions
  refreshChats: { key: "r", ctrl: true, description: "Refresh chat list" },
  pinChat: { key: "p", ctrl: true, description: "Pin/unpin chat" },
  muteChat: { key: "m", ctrl: true, description: "Mute/unmute chat" },
  archiveChat: { key: "a", ctrl: true, description: "Archive chat" },
  
  // Message actions (configurable)
  jumpToReply: { key: "space", description: "Jump to replied message" },
  setReplyReference: { key: "r", description: "Set as reply reference" },
  openMedia: { key: "return", description: "Open media" },
  deleteMessageForMe: { key: "backspace", description: "Delete message for me" },
  deleteMessageForEveryone: { key: "delete", description: "Delete message for everyone" },
  editMessage: { key: "insert", description: "Edit message" },
}

let currentKeybindings: KeyBindings = { ...DEFAULT_KEYBINDINGS }

export function loadKeybindings(): KeyBindings {
  try {
    if (existsSync(KEYBINDINGS_FILE)) {
      const data = readFileSync(KEYBINDINGS_FILE, "utf-8")
      const loaded = JSON.parse(data)
      currentKeybindings = { ...DEFAULT_KEYBINDINGS, ...loaded }
      logger.info("Keybindings", "Loaded keybindings from file")
    } else {
      currentKeybindings = { ...DEFAULT_KEYBINDINGS }
      logger.info("Keybindings", "Using default keybindings")
    }
  } catch (err) {
    logger.error("Keybindings", "Failed to load keybindings", err)
    currentKeybindings = { ...DEFAULT_KEYBINDINGS }
  }
  return currentKeybindings
}

export function saveKeybindings(keybindings: KeyBindings): boolean {
  try {
    writeFileSync(KEYBINDINGS_FILE, JSON.stringify(keybindings, null, 2))
    currentKeybindings = keybindings
    logger.info("Keybindings", "Saved keybindings to file")
    return true
  } catch (err) {
    logger.error("Keybindings", "Failed to save keybindings", err)
    return false
  }
}

export function getKeybindings(): KeyBindings {
  return currentKeybindings
}

export function resetKeybindings(): void {
  currentKeybindings = { ...DEFAULT_KEYBINDINGS }
  saveKeybindings(currentKeybindings)
}

export function matchesKeybinding(
  keyEvent: { name: string; ctrl?: boolean; shift?: boolean; alt?: boolean },
  binding: KeyBinding
): boolean {
  return (
    keyEvent.name === binding.key &&
    (binding.ctrl === undefined || keyEvent.ctrl === binding.ctrl) &&
    (binding.shift === undefined || keyEvent.shift === binding.shift) &&
    (binding.alt === undefined || keyEvent.alt === binding.alt)
  )
}

export function formatKeybinding(binding: KeyBinding): string {
  const parts: string[] = []
  if (binding.ctrl) parts.push("Ctrl")
  if (binding.shift) parts.push("Shift")
  if (binding.alt) parts.push("Alt")
  
  // Format key name nicely
  let keyName = binding.key
  if (keyName === "return") keyName = "Enter"
  else if (keyName === "escape") keyName = "Esc"
  else if (keyName === "space") keyName = "Space"
  else if (keyName === "backspace") keyName = "Backspace"
  else if (keyName === "delete") keyName = "Del"
  else if (keyName === "insert") keyName = "Ins"
  else if (keyName === "up") keyName = "↑"
  else if (keyName === "down") keyName = "↓"
  else if (keyName === "left") keyName = "←"
  else if (keyName === "right") keyName = "→"
  else keyName = keyName.toUpperCase()
  
  parts.push(keyName)
  return parts.join("+")
}

// Export default keybindings for reference
export { DEFAULT_KEYBINDINGS }
