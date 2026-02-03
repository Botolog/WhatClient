export type MediaDisplayMode = 'indicator' | 'ascii' | 'kitty' | 'iterm2' | 'sixel' | 'http'

export interface TerminalCapabilities {
  supportsKitty: boolean
  supportsITerm2: boolean
  supportsSixel: boolean
  supportsColors: boolean
  colorDepth: number
}

export function detectTerminalCapabilities(): TerminalCapabilities {
  const term = process.env.TERM || ""
  const termProgram = process.env.TERM_PROGRAM || ""
  const colorterm = process.env.COLORTERM || ""

  return {
    supportsKitty: term === "xterm-kitty" || termProgram === "WezTerm",
    supportsITerm2: termProgram === "iTerm.app",
    supportsSixel: term.includes("xterm") || term.includes("mlterm") || term === "foot",
    supportsColors: colorterm === "truecolor" || colorterm === "24bit" || term.includes("256color"),
    colorDepth: colorterm === "truecolor" || colorterm === "24bit" ? 24 : term.includes("256color") ? 8 : 4,
  }
}

export function getOptimalDisplayMode(capabilities: TerminalCapabilities, userPreference?: MediaDisplayMode): MediaDisplayMode {
  if (userPreference && userPreference !== 'indicator') {
    // Check if user preference is supported
    if (userPreference === 'kitty' && capabilities.supportsKitty) return 'kitty'
    if (userPreference === 'iterm2' && capabilities.supportsITerm2) return 'iterm2'
    if (userPreference === 'sixel' && capabilities.supportsSixel) return 'sixel'
    if (userPreference === 'ascii' && capabilities.supportsColors) return 'ascii'
    if (userPreference === 'http') return 'http'
  }

  // Auto-detect best mode
  if (capabilities.supportsKitty) return 'kitty'
  if (capabilities.supportsITerm2) return 'iterm2'
  if (capabilities.supportsSixel) return 'sixel'
  if (capabilities.supportsColors) return 'ascii'
  return 'indicator'
}
