import { 
  createCliRenderer, 
  BoxRenderable, 
  TextRenderable,
  InputRenderable,
  InputRenderableEvents,
  ScrollBoxRenderable,
  type KeyEvent 
} from "@opentui/core"
import { logger } from "./utils/logger"
import { loadSettings, saveSettings, getSettings, updateSetting, SETTINGS_MENU, type AppSettings, type SettingSection } from "./settings"
import { SERVICES, getServiceTheme, getEnabledServices, type ServiceConfig, type ServiceTheme } from "./services/registry"
import { createMainMenuState, renderMainMenu, navigateMenu, getSelectedService, renderGlobalSettings, type MainMenuState } from "./ui/mainMenu"

const DEMO_MODE = process.argv.includes("--demo")
logger.info("App", "Starting ChatClient", { demoMode: DEMO_MODE, args: process.argv })

// App view state
type AppView = "main_menu" | "global_settings" | "service"
let currentView: AppView = "main_menu"
let currentServiceId: string | null = null
let mainMenuState: MainMenuState = createMainMenuState()
let globalSettingsItem = 0

interface ChatData {
  id: string
  name: string
  isGroup: boolean
  unreadCount: number
  pinned: boolean
  muted: boolean
  archived: boolean
  participantCount?: number
  lastMessage?: { body: string; timestamp: number; fromMe: boolean }
}

interface MessageData {
  id: string
  body: string
  timestamp: number
  fromMe: boolean
  author?: string
  hasMedia: boolean
  type: string
  ack?: number
  isForwarded?: boolean
  forwardingScore?: number
  isStarred?: boolean
  hasQuotedMsg?: boolean
  quotedMsgBody?: string
}

const DEMO_CHATS: ChatData[] = [
  { id: "1", name: "John Doe", isGroup: false, unreadCount: 2, pinned: true, muted: false, archived: false, lastMessage: { body: "Hey, how are you?", timestamp: Date.now() / 1000, fromMe: false } },
  { id: "2", name: "Jane Smith", isGroup: false, unreadCount: 0, pinned: false, muted: false, archived: false, lastMessage: { body: "See you tomorrow!", timestamp: Date.now() / 1000 - 3600, fromMe: true } },
  { id: "3", name: "Work Group", isGroup: true, unreadCount: 5, pinned: false, muted: false, archived: false, participantCount: 12, lastMessage: { body: "Meeting at 3pm", timestamp: Date.now() / 1000 - 7200, fromMe: false } },
  { id: "4", name: "Family", isGroup: true, unreadCount: 0, pinned: false, muted: true, archived: false, participantCount: 8, lastMessage: { body: "Happy birthday! 🎂", timestamp: Date.now() / 1000 - 86400, fromMe: false } },
  { id: "5", name: "Bob Wilson", isGroup: false, unreadCount: 1, pinned: false, muted: false, archived: false, lastMessage: { body: "Thanks for the help!", timestamp: Date.now() / 1000 - 172800, fromMe: false } },
]

const DEMO_MESSAGES: Record<string, MessageData[]> = {
  "1": [
    { id: "m1", body: "Hey there! 👋", timestamp: Date.now() / 1000 - 300, fromMe: false, hasMedia: false, type: "chat", ack: 3 },
    { id: "m2", body: "Hi! How are you doing?", timestamp: Date.now() / 1000 - 240, fromMe: true, hasMedia: false, type: "chat", ack: 3 },
    { id: "m3", body: "I'm good! Working on that project.", timestamp: Date.now() / 1000 - 180, fromMe: false, hasMedia: false, type: "chat", ack: 3, isStarred: true },
    { id: "m4", body: "Let me know if you need help!", timestamp: Date.now() / 1000 - 120, fromMe: true, hasMedia: false, type: "chat", ack: 2 },
    { id: "m5", body: "Hey, how are you?", timestamp: Date.now() / 1000 - 60, fromMe: false, hasMedia: false, type: "chat", ack: 0, hasQuotedMsg: true, quotedMsgBody: "Let me know if you need help!" },
  ],
  "2": [
    { id: "m1", body: "Are you coming to the party?", timestamp: Date.now() / 1000 - 7200, fromMe: false, hasMedia: false, type: "chat", ack: 3 },
    { id: "m2", body: "Yes! What time?", timestamp: Date.now() / 1000 - 7000, fromMe: true, hasMedia: false, type: "chat", ack: 3 },
    { id: "m3", body: "8pm at my place", timestamp: Date.now() / 1000 - 6800, fromMe: false, hasMedia: false, type: "chat", ack: 3, isStarred: true },
    { id: "m4", body: "See you tomorrow!", timestamp: Date.now() / 1000 - 3600, fromMe: true, hasMedia: false, type: "chat", ack: 3 },
  ],
  "3": [
    { id: "m1", body: "Team, don't forget the meeting", timestamp: Date.now() / 1000 - 10000, fromMe: false, author: "Boss", hasMedia: false, type: "chat", ack: 3, isForwarded: true },
    { id: "m2", body: "I'll be there", timestamp: Date.now() / 1000 - 9000, fromMe: true, hasMedia: false, type: "chat", ack: 3 },
    { id: "m3", body: "Same here 👍", timestamp: Date.now() / 1000 - 8500, fromMe: false, author: "Alice", hasMedia: false, type: "chat", ack: 3, hasQuotedMsg: true, quotedMsgBody: "Team, don't forget the meeting" },
    { id: "m4", body: "Meeting at 3pm", timestamp: Date.now() / 1000 - 7200, fromMe: false, author: "Boss", hasMedia: false, type: "chat", ack: 3, isStarred: true },
  ],
  "4": [
    { id: "m1", body: "Happy birthday! 🎂🎉", timestamp: Date.now() / 1000 - 90000, fromMe: false, author: "Mom", hasMedia: false, type: "chat", ack: 3, isForwarded: true, forwardingScore: 5 },
    { id: "m2", body: "Thanks everyone!", timestamp: Date.now() / 1000 - 89000, fromMe: true, hasMedia: false, type: "chat", ack: 3 },
    { id: "m3", body: "🎈🎁", timestamp: Date.now() / 1000 - 88000, fromMe: false, author: "Dad", hasMedia: false, type: "chat", ack: 3 },
  ],
  "5": [
    { id: "m1", body: "Can you help me with the code?", timestamp: Date.now() / 1000 - 200000, fromMe: false, hasMedia: false, type: "chat", ack: 3 },
    { id: "m2", body: "Sure, what's the issue?", timestamp: Date.now() / 1000 - 199000, fromMe: true, hasMedia: false, type: "chat", ack: 3, hasQuotedMsg: true, quotedMsgBody: "Can you help me with the code?" },
    { id: "m3", body: "", timestamp: Date.now() / 1000 - 198000, fromMe: false, hasMedia: true, type: "image", ack: 3 },
    { id: "m4", body: "", timestamp: Date.now() / 1000 - 197000, fromMe: true, hasMedia: true, type: "document", ack: 3 },
    { id: "m5", body: "", timestamp: Date.now() / 1000 - 196000, fromMe: false, hasMedia: true, type: "ptt", ack: 3 },
    { id: "m6", body: "I fixed it, thanks!", timestamp: Date.now() / 1000 - 172800, fromMe: false, hasMedia: false, type: "chat", ack: 3, isStarred: true },
  ],
}

// Dynamic colors based on current service (default to WhatsApp)
let colors: ServiceTheme = getServiceTheme("whatsapp")

function setServiceTheme(serviceId: string) {
  colors = getServiceTheme(serviceId)
  currentServiceId = serviceId
  logger.info("App", "Theme changed", { serviceId, primary: colors.primary })
}

// Cleanup function to restore terminal on exit
let cleanupDone = false
function cleanupTerminal() {
  if (cleanupDone) return
  cleanupDone = true
  
  // Disable all mouse tracking modes
  process.stdout.write('\x1b[?1000l') // X11 mouse tracking
  process.stdout.write('\x1b[?1002l') // Button event tracking  
  process.stdout.write('\x1b[?1003l') // Any event tracking
  process.stdout.write('\x1b[?1006l') // SGR mouse mode
  process.stdout.write('\x1b[?1015l') // urxvt mouse mode
  process.stdout.write('\x1b[?1005l') // UTF-8 mouse mode
  
  // Restore cursor and clear
  process.stdout.write('\x1b[?25h') // Show cursor
  process.stdout.write('\x1b[0m')   // Reset colors
  process.stdout.write('\x1b[2J\x1b[H') // Clear screen
}

// Register cleanup handlers
process.on('exit', cleanupTerminal)
process.on('SIGINT', () => { cleanupTerminal(); process.exit(0) })
process.on('SIGTERM', () => { cleanupTerminal(); process.exit(0) })
process.on('uncaughtException', (err) => { 
  cleanupTerminal()
  console.error('Uncaught exception:', err)
  process.exit(1)
})

async function main() {
  logger.info("App", "main() starting")
  
  logger.debug("App", "Creating CLI renderer")
  const renderer = await createCliRenderer({ exitOnCtrlC: false })
  logger.info("App", "CLI renderer created")

  let width = process.stdout.columns || 80
  let height = process.stdout.rows || 24
  const chatListWidth = 32
  let msgAreaWidth = width - chatListWidth - 2
  logger.debug("App", "Terminal dimensions", { width, height, chatListWidth, msgAreaWidth })

  // Handle terminal resize - update dimensions and re-render
  function handleResize() {
    const newWidth = process.stdout.columns || 80
    const newHeight = process.stdout.rows || 24
    
    if (newWidth === width && newHeight === height) {
      return // No actual change
    }
    
    width = newWidth
    height = newHeight
    msgAreaWidth = width - chatListWidth - 2
    logger.info("App", "Terminal resized - updating UI", { width, height, msgAreaWidth })
    
    // Update UI component dimensions
    mainBox.width = width
    mainBox.height = height
    rightPanel.width = msgAreaWidth
    rightPanel.height = height - 2
    chatListBox.height = height - 2
    messagesScroll.width = msgAreaWidth
    messagesScroll.height = height - 8
    statusBar.width = width
    titleBar.width = width
    contentRow.width = width
    contentRow.height = height - 2
    inputArea.width = msgAreaWidth
    messageInput.width = msgAreaWidth - 8
    chatHeader.width = msgAreaWidth
    
    // Update menu dimensions
    if (menuBox) {
      menuBox.width = width
      menuBox.height = height
    }
    
    // Update settings dimensions
    if (settingsBox) {
      settingsBox.width = width
      settingsBox.height = height
    }
    
    // Re-render based on current view
    if (currentView === "main_menu") {
      // Menu will auto-update with new dimensions
    } else if (currentView === "service") {
      if (chats.length > 0) {
        renderChats()
        updateSelection()
      }
      if (messages.length > 0) {
        renderMessages()
      }
    }
    
    // Rebuild settings if open
    if (showSettings) {
      buildSettingsItems()
    }
    
    logger.debug("App", "Resize complete - UI updated")
  }
  
  process.stdout.on("resize", handleResize)

  let chats: ChatData[] = DEMO_MODE ? DEMO_CHATS : []
  let messages: MessageData[] = []
  let selectedChat = 0
  let currentChatId: string | null = null
  let focusArea: "chats" | "input" | "settings" = "chats"
  let isReady = DEMO_MODE
  
  // Settings state
  let showSettings = false
  let settingsSection = 0
  let settingsItem = 0
  const settings = loadSettings()

  // Placeholder functions - will be defined after UI components are created
  let showMainMenu: () => void
  let showServiceView: () => void
  let showGlobalSettingsView: () => void
  let enterService: (serviceId: string) => void
  let exitToMainMenu: () => void

  // Service manager for multi-service support
  const { getServiceInstance, destroyAllServices } = await import("./services/index")
  let activeService: any = null
  let activeServiceId: string | null = null

  // Main container
  const mainBox = new BoxRenderable(renderer, {
    id: "main",
    width: width,
    height: height,
    flexDirection: "column",
    backgroundColor: colors.bg,
  })

  // Title bar
  const titleBar = new BoxRenderable(renderer, {
    id: "title",
    width: width,
    height: 1,
    backgroundColor: "#128C7E",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 1,
    paddingRight: 1,
  })
  const modeLabel = DEMO_MODE ? " [DEMO]" : ""
  const titleText = new TextRenderable(renderer, {
    id: "title-text",
    content: `📱 WhatsApp TUI Client${modeLabel}`,
    fg: "#FFFFFF",
  })
  titleBar.add(titleText)

  // Content row
  const contentRow = new BoxRenderable(renderer, {
    id: "content",
    width: width,
    height: height - 2,
    flexDirection: "row",
  })

  // Chat list
  const chatListBox = new BoxRenderable(renderer, {
    id: "chat-list",
    width: chatListWidth,
    height: height - 2,
    borderStyle: "rounded",
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    title: DEMO_MODE ? " Chats (5) " : " Chats ",
    titleAlignment: "center",
    flexDirection: "column",
    padding: 1,
  })
  
  // Function to update chat list title with count
  function updateChatListTitle() {
    chatListBox.title = ` Chats (${chats.length}) `
    logger.debug("UI", "Updated chat list title", { count: chats.length })
  }

  const loadingText = new TextRenderable(renderer, {
    id: "loading-text",
    content: DEMO_MODE ? "Demo mode active" : "Initializing...\nScan QR in terminal",
    fg: colors.textMuted,
  })

  // Add loading text - will be removed when chats are rendered
  // In demo mode, renderChats() will be called immediately after setup
  if (!DEMO_MODE) {
    logger.debug("Init", "Non-demo mode - adding loading text to chatListBox")
    chatListBox.add(loadingText)
  } else {
    logger.debug("Init", "Demo mode - loading text not added, renderChats() will handle display")
  }

  // Right panel
  const rightPanel = new BoxRenderable(renderer, {
    id: "right-panel",
    width: msgAreaWidth,
    height: height - 2,
    flexDirection: "column",
    backgroundColor: colors.bg,
  })

  // Chat header
  const chatHeader = new BoxRenderable(renderer, {
    id: "chat-header",
    width: msgAreaWidth,
    height: 2,
    backgroundColor: colors.surface,
    paddingLeft: 2,
    flexDirection: "row",
    alignItems: "center",
  })
  const chatHeaderText = new TextRenderable(renderer, {
    id: "chat-header-text",
    content: "Select a chat",
    fg: colors.text,
  })
  const chatHeaderMsgCount = new TextRenderable(renderer, {
    id: "chat-header-count",
    content: "",
    fg: colors.textMuted,
  })
  chatHeader.add(chatHeaderText)
  chatHeader.add(chatHeaderMsgCount)
  
  // Function to update chat header with message count and group info
  function updateChatHeader(chatName: string, msgCount: number, chat?: ChatData) {
    chatHeaderText.content = chatName
    
    let infoStr = ""
    if (chat?.isGroup && chat.participantCount) {
      infoStr = ` (${chat.participantCount} members)`
    } else if (msgCount > 0) {
      infoStr = ` (${msgCount} messages)`
    }
    chatHeaderMsgCount.content = infoStr
    logger.debug("UI", "Updated chat header", { chatName, msgCount, isGroup: chat?.isGroup, participantCount: chat?.participantCount })
  }

  // Messages scroll
  const messagesScroll = new ScrollBoxRenderable(renderer, {
    id: "messages-scroll",
    width: msgAreaWidth,
    height: height - 8,
    stickyScroll: true,
    stickyStart: "bottom",
  })

  const emptyMsgText = new TextRenderable(renderer, {
    id: "empty-msg",
    content: "Select a chat to view messages\n\nUse ↑↓ to navigate\nPress Enter to select\nTab to switch focus",
    fg: colors.textMuted,
  })
  messagesScroll.add(emptyMsgText)

  // Input area
  const inputArea = new BoxRenderable(renderer, {
    id: "input-area",
    width: msgAreaWidth,
    height: 3,
    borderStyle: "rounded",
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 1,
    paddingRight: 1,
  })

  const messageInput = new InputRenderable(renderer, {
    id: "message-input",
    width: msgAreaWidth - 8,
    placeholder: "Type a message...",
    backgroundColor: colors.surfaceLight,
    focusedBackgroundColor: colors.surfaceLight,
    textColor: colors.text,
    cursorColor: colors.primary,
  })
  
  // Log input changes for debugging
  messageInput.on(InputRenderableEvents.CHANGE, (value: string) => {
    logger.debug("InputChange", "Input value changed", { length: value.length, preview: value.substring(0, 20) })
  })

  const sendHint = new TextRenderable(renderer, {
    id: "send-hint",
    content: " ⏎",
    fg: colors.textMuted,
  })

  inputArea.add(messageInput)
  inputArea.add(sendHint)
  rightPanel.add(chatHeader)
  rightPanel.add(messagesScroll)
  rightPanel.add(inputArea)

  // Status bar
  const statusBar = new BoxRenderable(renderer, {
    id: "status",
    width: width,
    height: 1,
    backgroundColor: colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 1,
    paddingRight: 1,
  })
  const statusText = new TextRenderable(renderer, {
    id: "status-text",
    content: DEMO_MODE ? "● Demo Mode" : "○ Connecting...",
    fg: DEMO_MODE ? colors.primary : colors.textMuted,
  })
  const helpText = new TextRenderable(renderer, {
    id: "help-text",
    content: "?:Help │ F2:Settings │ ↑↓:Nav │ Ctrl+P:Pin │ Ctrl+M:Mute │ Ctrl+A:Archive │ Ctrl+R:Refresh │ Ctrl+Q:Quit",
    fg: colors.textMuted,
  })
  statusBar.add(statusText)
  statusBar.add(helpText)

  // Build tree
  contentRow.add(chatListBox)
  contentRow.add(rightPanel)
  mainBox.add(titleBar)
  mainBox.add(contentRow)
  mainBox.add(statusBar)
  renderer.root.add(mainBox)

  // ========== MAIN MENU (OpenTUI components) ==========
  const menuBox = new BoxRenderable(renderer, {
    id: "menu-box",
    width: width,
    height: height,
    backgroundColor: "#0D1117",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  })

  const menuTitle = new TextRenderable(renderer, {
    id: "menu-title",
    content: "═══════════════════════════════════════",
    fg: "#58A6FF",
  })
  
  const menuLogo = new TextRenderable(renderer, {
    id: "menu-logo", 
    content: "💬 ChatClient",
    fg: "#FFFFFF",
  })
  
  const menuSubtitle = new TextRenderable(renderer, {
    id: "menu-subtitle",
    content: "Universal Messaging Client v1.0",
    fg: "#8B949E",
  })

  const menuSpacer = new TextRenderable(renderer, {
    id: "menu-spacer",
    content: " ",
    fg: "#8B949E",
  })

  const menuInstructions = new TextRenderable(renderer, {
    id: "menu-instructions",
    content: "Select a service:",
    fg: "#C9D1D9",
  })

  // Service menu items (use BoxRenderable for background color support)
  const menuItemBoxes: { box: BoxRenderable; text: TextRenderable }[] = []
  const services = getEnabledServices()
  
  for (let i = 0; i < services.length; i++) {
    const svc = services[i]
    const itemBox = new BoxRenderable(renderer, {
      id: `menu-item-box-${i}`,
      width: 30,
      height: 1,
      backgroundColor: i === 0 ? "#30363D" : "#0D1117",
      justifyContent: "center",
    })
    const itemText = new TextRenderable(renderer, {
      id: `menu-item-${i}`,
      content: `${svc.icon}  ${svc.name}`,
      fg: i === 0 ? "#FFFFFF" : "#8B949E",
    })
    itemBox.add(itemText)
    menuItemBoxes.push({ box: itemBox, text: itemText })
  }

  const menuFooter = new TextRenderable(renderer, {
    id: "menu-footer",
    content: "↑↓ Navigate │ Enter Select │ S Settings │ Q Quit",
    fg: "#6E7681",
  })

  // Add all to menu
  menuBox.add(menuTitle)
  menuBox.add(menuLogo)
  menuBox.add(menuSubtitle)
  menuBox.add(menuSpacer)
  menuBox.add(menuInstructions)
  for (const item of menuItemBoxes) {
    menuBox.add(item.box)
  }
  menuBox.add(menuSpacer)
  menuBox.add(menuFooter)

  renderer.root.add(menuBox)
  
  // Start with menu visible, main hidden
  mainBox.visible = false
  menuBox.visible = true

  // Menu selection state
  let menuSelectedIndex = 0

  // ========== SETTINGS VIEW (OpenTUI components) ==========
  const settingsBox = new BoxRenderable(renderer, {
    id: "settings-box",
    width: width,
    height: height,
    backgroundColor: "#0D1117",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  })

  const settingsTitle = new TextRenderable(renderer, {
    id: "settings-title",
    content: "⚙️  Settings",
    fg: "#58A6FF",
  })

  const settingsSpacer = new TextRenderable(renderer, {
    id: "settings-spacer",
    content: " ",
    fg: "#8B949E",
  })

  // Settings items will be dynamically built - track IDs for removal
  let settingsItemIds: string[] = []
  
  function buildSettingsItems() {
    // Remove all previously added dynamic items by ID
    for (const id of settingsItemIds) {
      settingsBox.remove(id)
    }
    settingsItemIds = []
    
    // Add title
    settingsBox.add(settingsTitle)
    settingsBox.add(settingsSpacer)
    
    // Build items from SETTINGS_MENU
    SETTINGS_MENU.forEach((section, sIdx) => {
      // Section header
      const headerId = `settings-section-${sIdx}`
      const sectionHeader = new TextRenderable(renderer, {
        id: headerId,
        content: section.title,
        fg: "#8B949E",
      })
      settingsBox.add(sectionHeader)
      settingsItemIds.push(headerId)
      
      section.items.forEach((menuItem, iIdx) => {
        const isSelected = sIdx === settingsSection && iIdx === settingsItem
        
        let valueStr = ""
        if (menuItem.key) {
          const val = settings[menuItem.key]
          if (menuItem.type === "toggle") {
            valueStr = val ? " [●]" : " [○]"
          } else if (menuItem.type === "radio" || menuItem.type === "select") {
            const opt = menuItem.options?.find(o => o.value === val)
            valueStr = ` [${opt?.label || val}]`
          } else if (menuItem.type === "number") {
            valueStr = ` [${val}]`
          }
        } else if (menuItem.type === "button") {
          valueStr = " →"
        }
        
        const boxId = `settings-item-box-${sIdx}-${iIdx}`
        const itemBox = new BoxRenderable(renderer, {
          id: boxId,
          width: 50,
          height: 1,
          backgroundColor: isSelected ? "#30363D" : "#0D1117",
          justifyContent: "flex-start",
          paddingLeft: 2,
        })
        
        const itemText = new TextRenderable(renderer, {
          id: `settings-item-${sIdx}-${iIdx}`,
          content: `${isSelected ? "▸ " : "  "}${menuItem.label}${valueStr}`,
          fg: isSelected ? "#FFFFFF" : "#8B949E",
        })
        
        itemBox.add(itemText)
        settingsBox.add(itemBox)
        settingsItemIds.push(boxId)
      })
      
      // Add spacer after section
      const spacerId = `settings-section-spacer-${sIdx}`
      const sectionSpacer = new TextRenderable(renderer, {
        id: spacerId,
        content: " ",
        fg: "#8B949E",
      })
      settingsBox.add(sectionSpacer)
      settingsItemIds.push(spacerId)
    })
    
    // Footer
    const footerId = "settings-footer"
    const settingsFooter = new TextRenderable(renderer, {
      id: footerId,
      content: "↑↓ Navigate │ Enter Toggle │ Esc Close",
      fg: "#6E7681",
    })
    settingsBox.add(settingsFooter)
    settingsItemIds.push(footerId)
  }

  renderer.root.add(settingsBox)
  settingsBox.visible = false
  
  function updateMenuSelection() {
    for (let i = 0; i < menuItemBoxes.length; i++) {
      const isSelected = i === menuSelectedIndex
      menuItemBoxes[i].box.backgroundColor = isSelected ? "#30363D" : "#0D1117"
      menuItemBoxes[i].text.fg = isSelected ? "#FFFFFF" : "#8B949E"
    }
  }

  // Define view switching functions now that UI components exist
  showMainMenu = () => {
    mainBox.visible = false
    menuBox.visible = true
    currentView = "main_menu"
    updateMenuSelection()
    logger.debug("App", "Showing main menu")
  }

  showServiceView = () => {
    menuBox.visible = false
    mainBox.visible = true
    logger.debug("App", "Showing service view")
  }

  showGlobalSettingsView = () => {
    console.clear()
    renderGlobalSettings(width, height, globalSettingsItem, (lines) => {
      const startY = Math.max(1, Math.floor((height - lines.length) / 2))
      const boxWidth = Math.min(60, width - 4)
      const startX = Math.max(1, Math.floor((width - boxWidth) / 2))
      lines.forEach((line, i) => {
        process.stdout.write(`\x1b[${startY + i};${startX}H${line}`)
      })
    })
  }

  enterService = async (serviceId: string) => {
    setServiceTheme(serviceId)
    activeServiceId = serviceId
    currentView = "service"
    
    // Update all UI component colors
    mainBox.backgroundColor = colors.bg
    titleBar.backgroundColor = colors.titleBar
    chatListBox.borderColor = colors.primary
    chatListBox.backgroundColor = colors.surface
    rightPanel.backgroundColor = colors.bg
    chatHeader.backgroundColor = colors.surface
    chatHeaderText.fg = colors.text
    chatHeaderMsgCount.fg = colors.textMuted
    messagesScroll.backgroundColor = colors.bg
    inputArea.borderColor = colors.border
    statusBar.backgroundColor = colors.surface
    statusText.fg = colors.primary
    statusText.content = DEMO_MODE ? "● Demo Mode" : "○ Connecting..."
    helpText.fg = colors.textMuted
    
    const service = SERVICES[serviceId]
    titleText.content = `${service?.icon || "💬"} ${service?.name || serviceId} Client${modeLabel}`
    
    showServiceView()
    mainBox.visible = true
    renderChats()
    updateSelection()
    
    if (DEMO_MODE) {
      isReady = true
      logger.info("App", "Entered service (demo mode)", { serviceId })
      return
    }
    
    // Load and initialize the service
    logger.info("App", "Loading service", { serviceId })
    try {
      activeService = await getServiceInstance(serviceId)
      if (!activeService) {
        statusText.content = `✗ ${service?.name || serviceId} not available`
        statusText.fg = "#F15C6D"
        logger.error("App", "Service not available", { serviceId })
        return
      }
      
      // Setup event handlers for this service
      setupServiceEventHandlers()
      
      // Initialize the service
      await activeService.initialize()
      logger.info("App", "Service initialized", { serviceId })
    } catch (err: any) {
      logger.error("App", "Service initialization failed", { serviceId, error: err.message })
      statusText.content = `✗ ${err.message?.slice(0, 30) || "Error"}`
      statusText.fg = "#F15C6D"
    }
  }
  
  function setupServiceEventHandlers() {
    if (!activeService) return
    
    // Remove any existing listeners first
    activeService.removeAllListeners()
    
    activeService.on("qr", (qr: string) => {
      logger.event("App", "qr received")
      statusText.content = "○ Scan QR..."
      loadingText.content = "Scan QR code\nin terminal"
      if (activeService.displayQrCode) {
        activeService.displayQrCode(qr)
      }
    })

    activeService.on("authenticated", () => {
      logger.event("App", "authenticated")
      statusText.content = "○ Authenticated..."
      loadingText.content = "Loading..."
    })

    activeService.on("ready", async () => {
      logger.event("App", "ready - service is ready!")
      isReady = true
      statusText.content = "○ Loading chats..."
      
      try {
        chats = await activeService.getChats()
        logger.info("App", "Chats loaded", { count: chats.length })
        
        renderChats()
        updateSelection()
        loadingText.content = ""
        statusText.content = "● Connected"
        statusText.fg = colors.primary
      } catch (err: any) {
        logger.error("App", "Error loading chats", err)
        statusText.content = `✗ ${err.message?.slice(0, 20)}`
        statusText.fg = "#F15C6D"
      }
    })

    activeService.on("message", async () => {
      logger.event("App", "message received")
      if (currentChatId) {
        messages = await activeService.getMessages(currentChatId, 30)
        renderMessages()
        await activeService.markAsRead(currentChatId)
        const chatIdx = chats.findIndex(c => c.id === currentChatId)
        if (chatIdx >= 0) {
          chats[chatIdx].unreadCount = 0
        }
      }
      chats = await activeService.getChats()
      renderChats()
      updateSelection()
    })

    activeService.on("disconnected", (reason: string) => {
      logger.event("App", "disconnected", { reason })
      isReady = false
      statusText.content = `✗ ${reason}`
      statusText.fg = "#F15C6D"
    })

    activeService.on("typing", ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      if (chatId === currentChatId) {
        if (isTyping) {
          chatHeaderMsgCount.content = " typing..."
          chatHeaderMsgCount.fg = colors.primary
        } else {
          chatHeaderMsgCount.content = messages.length > 0 ? ` (${messages.length} messages)` : ""
          chatHeaderMsgCount.fg = colors.textMuted
        }
      }
    })
    
    logger.info("App", "Service event handlers set up")
  }

  exitToMainMenu = () => {
    currentView = "main_menu"
    currentServiceId = null
    showMainMenu()
    logger.info("App", "Returned to main menu")
  }

  const chatItems: { box: BoxRenderable; nameText: TextRenderable; chatIdx: number }[] = []
  let chatItemIds: string[] = [] // Track IDs for proper removal

  function truncate(str: string, len: number): string {
    return str.length <= len ? str : str.slice(0, len - 1) + "…"
  }

  function renderChats() {
    logger.info("RenderChats", "Starting renderChats()", { 
      chatsCount: chats.length, 
      chatItemsCount: chatItems.length,
      height,
      DEMO_MODE 
    })
    
    chatListBox.remove("loading-text")
    logger.debug("RenderChats", "Removed loading text")
    
    // Remove all previously rendered chat items by their actual IDs
    for (const id of chatItemIds) {
      chatListBox.remove(id)
    }
    chatItems.length = 0
    chatItemIds = []

    const maxChats = Math.floor((height - 6) / 2) // Calculate based on terminal height
    logger.info("RenderChats", "Calculated maxChats", { maxChats, height })
    
    // Update chat list title with count
    updateChatListTitle()
    
    if (chats.length === 0) {
      logger.warn("RenderChats", "No chats to render!")
      return
    }
    
    // Calculate scroll offset to keep selected chat visible
    let startIdx = 0
    if (selectedChat >= maxChats) {
      startIdx = selectedChat - maxChats + 1
    }
    const endIdx = Math.min(chats.length, startIdx + maxChats)
    
    for (let i = startIdx; i < endIdx; i++) {
      const displayIdx = i - startIdx
      logger.debug("RenderChats", `Rendering chat ${i}`, { chatName: chats[i]?.name })
      const chat = chats[i]
      const itemBox = new BoxRenderable(renderer, {
        id: `chat-${i}`,
        width: chatListWidth - 4,
        height: 2,
        backgroundColor: i === selectedChat ? colors.surfaceLight : colors.surface,
        flexDirection: "column",
        paddingLeft: 1,
      })
      
      const badge = chat.unreadCount > 0 ? ` (${chat.unreadCount})` : ""
      const pin = chat.pinned ? "📌 " : ""
      const group = chat.isGroup ? "👥 " : ""
      const muted = chat.muted ? "🔇 " : ""
      // Highlight unread chats with brighter text
      const hasUnread = chat.unreadCount > 0
      const nameText = new TextRenderable(renderer, {
        id: `chat-name-${i}`,
        content: pin + group + muted + truncate(chat.name, chatListWidth - 16) + badge,
        fg: i === selectedChat ? colors.primary : (hasUnread ? "#FFFFFF" : colors.text),
      })
      
      // Format last message time
      let timeStr = ""
      if (chat.lastMessage?.timestamp) {
        const msgDate = new Date(chat.lastMessage.timestamp * 1000)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 0) {
          timeStr = `${msgDate.getHours().toString().padStart(2, '0')}:${msgDate.getMinutes().toString().padStart(2, '0')}`
        } else if (diffDays === 1) {
          timeStr = "Yesterday"
        } else if (diffDays < 7) {
          timeStr = msgDate.toLocaleDateString('en-US', { weekday: 'short' })
        } else {
          timeStr = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      }
      
      const preview = chat.lastMessage?.body || ""
      const previewWithTime = timeStr ? `${truncate(preview, chatListWidth - 14)} ${timeStr}` : truncate(preview, chatListWidth - 6)
      const msgText = new TextRenderable(renderer, {
        id: `chat-msg-${i}`,
        content: previewWithTime,
        fg: colors.textMuted,
      })
      
      itemBox.add(nameText)
      itemBox.add(msgText)
      chatListBox.add(itemBox)
      chatItems.push({ box: itemBox, nameText, chatIdx: i })
      chatItemIds.push(`chat-${i}`)
      logger.debug("RenderChats", `Added chat item ${i} to chatListBox`)
    }
    logger.info("RenderChats", "Finished renderChats()", { renderedCount: chatItems.length })
  }

  function updateSelection() {
    logger.debug("UpdateSelection", "Starting updateSelection()", { 
      selectedChat, 
      chatItemsCount: chatItems.length 
    })
    
    if (chatItems.length === 0) {
      logger.warn("UpdateSelection", "No items to update!")
      return
    }
    
    // Check if selected chat is visible in current view
    const isVisible = chatItems.some(item => item.chatIdx === selectedChat)
    if (!isVisible) {
      // Need to re-render to show selected chat
      renderChats()
      return
    }
    
    // Update visual selection
    for (let i = 0; i < chatItems.length; i++) {
      const chatIdx = chatItems[i].chatIdx
      const isSelected = chatIdx === selectedChat
      chatItems[i].box.backgroundColor = isSelected ? colors.surfaceLight : colors.surface
      const hasUnread = chats[chatIdx]?.unreadCount > 0
      chatItems[i].nameText.fg = isSelected ? colors.primary : (hasUnread ? "#FFFFFF" : colors.text)
    }
    
    if (chats[selectedChat]) {
      chatHeaderText.content = chats[selectedChat].name
      logger.debug("UpdateSelection", "Updated header", { chatName: chats[selectedChat].name })
    }
    logger.debug("UpdateSelection", "Finished updateSelection()")
  }

  let msgCount = 0
  function renderMessages() {
    logger.info("RenderMessages", "Starting renderMessages()", { 
      messagesCount: messages.length, 
      currentMsgCount: msgCount,
      currentChatId 
    })
    
    for (let i = 0; i < msgCount; i++) {
      messagesScroll.remove(`msg-${i}`)
    }
    messagesScroll.remove("empty-msg")
    msgCount = 0
    logger.debug("RenderMessages", "Cleared old messages")

    if (messages.length === 0) {
      messagesScroll.add(emptyMsgText)
      return
    }

    // Helper to format date for separator
    function formatDateSeparator(date: Date): string {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (date.toDateString() === today.toDateString()) {
        return "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday"
      } else {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      }
    }

    let lastDateStr = ""
    for (const msg of messages) {
      // Add date separator if date changed
      const msgDate = new Date(msg.timestamp * 1000)
      const dateStr = msgDate.toDateString()
      if (dateStr !== lastDateStr) {
        lastDateStr = dateStr
        const separatorBox = new BoxRenderable(renderer, {
          id: `date-sep-${msgCount}`,
          width: msgAreaWidth - 4,
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 1,
          marginBottom: 1,
        })
        const separatorText = new TextRenderable(renderer, {
          id: `date-text-${msgCount}`,
          content: `── ${formatDateSeparator(msgDate)} ──`,
          fg: colors.textMuted,
        })
        separatorBox.add(separatorText)
        messagesScroll.add(separatorBox)
      }
      const msgBox = new BoxRenderable(renderer, {
        id: `msg-${msgCount}`,
        width: msgAreaWidth - 4,
        flexDirection: "row",
        justifyContent: msg.fromMe ? "flex-end" : "flex-start",
        marginBottom: 0,
      })
      
      // Limit bubble width to 70% of message area for better readability
      const maxBubbleWidth = Math.floor(msgAreaWidth * 0.7)
      const bubble = new BoxRenderable(renderer, {
        id: `bubble-${msgCount}`,
        backgroundColor: msg.fromMe ? colors.sent : colors.received,
        borderStyle: "rounded",
        borderColor: msg.fromMe ? colors.primary : colors.textMuted,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 0,
        paddingBottom: 0,
        maxWidth: maxBubbleWidth,
      })
      
      // Forwarded message indicator
      if (msg.isForwarded) {
        const forwardedText = new TextRenderable(renderer, {
          id: `forwarded-${msgCount}`,
          content: msg.forwardingScore && msg.forwardingScore > 4 ? "⤳ Forwarded many times" : "⤳ Forwarded",
          fg: colors.textMuted,
        })
        bubble.add(forwardedText)
      }
      
      // Quoted message (reply) preview
      if (msg.hasQuotedMsg && msg.quotedMsgBody) {
        const quotedText = new TextRenderable(renderer, {
          id: `quoted-${msgCount}`,
          content: `┃ ${truncate(msg.quotedMsgBody, 40)}`,
          fg: colors.textMuted,
        })
        bubble.add(quotedText)
      }
      
      // Show author name for group messages
      if (msg.author && !msg.fromMe) {
        const authorText = new TextRenderable(renderer, {
          id: `author-${msgCount}`,
          content: msg.author,
          fg: colors.primary,
        })
        bubble.add(authorText)
      }
      
      // Media type icons
      let mediaIcon = ""
      if (msg.hasMedia) {
        switch (msg.type) {
          case "image": mediaIcon = "📷 "; break
          case "video": mediaIcon = "🎬 "; break
          case "audio": mediaIcon = "🎵 "; break
          case "ptt": mediaIcon = "🎤 "; break
          case "document": mediaIcon = "📄 "; break
          case "sticker": mediaIcon = "🏷️ "; break
          case "location": mediaIcon = "📍 "; break
          case "contact": mediaIcon = "👤 "; break
          default: mediaIcon = "📎 "; break
        }
      }
      const content = msg.body || (msg.hasMedia ? `${mediaIcon}[${msg.type}]` : "")
      const bubbleText = new TextRenderable(renderer, {
        id: `bubble-text-${msgCount}`,
        content: truncate(content, msgAreaWidth - 20),
        fg: colors.text,
      })
      
      const date = new Date(msg.timestamp * 1000)
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      
      // Message status: ✓ sent, ✓✓ delivered, blue ✓✓ read
      let ackStr = ""
      let ackColor = colors.textMuted
      if (msg.fromMe && msg.ack !== undefined) {
        if (msg.ack === 0) { ackStr = " ⏳" } // Pending
        else if (msg.ack === 1) { ackStr = " ✓" } // Sent
        else if (msg.ack === 2) { ackStr = " ✓✓" } // Delivered
        else if (msg.ack >= 3) { ackStr = " ✓✓"; ackColor = "#53BDEB" } // Read (blue)
      }
      
      // Starred indicator
      const starStr = msg.isStarred ? " ⭐" : ""
      
      const timeText = new TextRenderable(renderer, {
        id: `time-${msgCount}`,
        content: `  ${timeStr}${ackStr}${starStr}`,
        fg: ackColor,
      })
      
      bubble.add(bubbleText)
      bubble.add(timeText)
      msgBox.add(bubble)
      messagesScroll.add(msgBox)
      msgCount++
      logger.debug("RenderMessages", `Added message ${msgCount}`, { fromMe: msg.fromMe, bodyLen: msg.body?.length })
    }
    logger.info("RenderMessages", "Finished renderMessages()", { renderedCount: msgCount })
  }

  // Settings view rendering
  function renderSettings() {
    // Hide main UI and menu
    mainBox.visible = false
    menuBox.visible = false
    settingsBox.visible = true
    
    // Build settings items
    buildSettingsItems()
    
    logger.debug("App", "Settings rendered")
  }
  
  function getSettingsItemCount(sectionIdx: number): number {
    return SETTINGS_MENU[sectionIdx]?.items.length || 0
  }
  
  function getTotalSettingsItems(): { section: number; item: number }[] {
    const items: { section: number; item: number }[] = []
    SETTINGS_MENU.forEach((section, sIdx) => {
      section.items.forEach((_, iIdx) => {
        items.push({ section: sIdx, item: iIdx })
      })
    })
    return items
  }
  
  function navigateSettings(direction: "up" | "down") {
    const allItems = getTotalSettingsItems()
    const currentIdx = allItems.findIndex(i => i.section === settingsSection && i.item === settingsItem)
    let newIdx = currentIdx
    
    if (direction === "up") {
      newIdx = Math.max(0, currentIdx - 1)
    } else {
      newIdx = Math.min(allItems.length - 1, currentIdx + 1)
    }
    
    settingsSection = allItems[newIdx].section
    settingsItem = allItems[newIdx].item
    
    // Update selection visually
    buildSettingsItems()
  }
  
  function toggleCurrentSetting() {
    const section = SETTINGS_MENU[settingsSection]
    const item = section?.items[settingsItem]
    if (!item) return
    
    if (item.type === "toggle" && item.key) {
      const currentVal = settings[item.key] as boolean
      updateSetting(item.key, !currentVal as any)
      buildSettingsItems()
    } else if ((item.type === "radio" || item.type === "select") && item.key && item.options) {
      const currentVal = settings[item.key]
      const currentIdx = item.options.findIndex(o => o.value === currentVal)
      const nextIdx = (currentIdx + 1) % item.options.length
      const newVal = item.options[nextIdx].value
      updateSetting(item.key, newVal as any)
      buildSettingsItems()
    } else if (item.type === "number" && item.key) {
      const currentVal = settings[item.key] as number
      const newVal = currentVal + 10
      const clampedVal = Math.min(item.max || 300, Math.max(item.min || 0, newVal > (item.max || 300) ? (item.min || 0) : newVal))
      updateSetting(item.key, clampedVal as any)
      buildSettingsItems()
    } else if (item.type === "button" && item.action) {
      item.action()
      buildSettingsItems()
    }
  }

  async function selectChat(index: number) {
    logger.info("App", "selectChat() called", { index, chatCount: chats.length })
    if (index < 0 || index >= chats.length) {
      logger.warn("App", "selectChat() invalid index", { index })
      return
    }
    
    selectedChat = index
    currentChatId = chats[index].id
    logger.info("App", "Chat selected", { chatId: currentChatId, chatName: chats[index].name })
    updateSelection()
    
    if (DEMO_MODE) {
      messages = [...(DEMO_MESSAGES[currentChatId] || [])]
      // Mark as read in demo mode
      chats[index].unreadCount = 0
      logger.debug("App", "Loaded demo messages", { count: messages.length, chatId: currentChatId })
    } else if (activeService) {
      statusText.content = "○ Loading..."
      statusText.fg = colors.textMuted
      logger.info("App", "Loading messages from WhatsApp", { chatId: currentChatId })
      messages = await activeService.getMessages(currentChatId, 30)
      logger.info("App", "Messages loaded", { count: messages.length })
      await activeService.markAsRead(currentChatId)
      // Update local unread count
      chats[index].unreadCount = 0
    }
    
    // Re-render chats to update unread indicator
    renderChats()
    renderMessages()
    updateChatHeader(chats[index].name, messages.length, chats[index])
    statusText.content = DEMO_MODE ? "● Demo Mode" : "● Connected"
    statusText.fg = colors.primary
  }

  // Message sending
  messageInput.on(InputRenderableEvents.ENTER, async (value: string) => {
    logger.info("MessageInput", "ENTER pressed", { 
      valueLength: value.length, 
      currentChatId, 
      isReady, 
      DEMO_MODE 
    })
    
    if (!value.trim()) {
      logger.debug("MessageInput", "Empty message, ignoring")
      return
    }
    if (!currentChatId) {
      logger.warn("MessageInput", "No chat selected, cannot send")
      return
    }
    
    if (DEMO_MODE) {
      logger.info("MessageInput", "Sending demo message", { body: value.trim() })
      const newMsg: MessageData = {
        id: `m${Date.now()}`,
        body: value.trim(),
        timestamp: Date.now() / 1000,
        fromMe: true,
        hasMedia: false,
        type: "chat",
        ack: 1,
      }
      messages.push(newMsg)
      logger.debug("MessageInput", "Added message to messages array", { count: messages.length })
      renderMessages()
      messageInput.value = ""
      statusText.content = "● Sent!"
      setTimeout(() => { statusText.content = "● Demo Mode" }, 1000)
    } else if (activeService && isReady) {
      logger.info("MessageInput", "Sending real WhatsApp message", { chatId: currentChatId, body: value.trim().substring(0, 20) })
      statusText.content = "○ Typing..."
      statusText.fg = colors.textMuted
      messageInput.value = ""
      
      try {
        const sent = await activeService.sendMessage(currentChatId, value.trim())
        if (sent) {
          logger.info("MessageInput", "Message sent successfully", { messageId: sent.id })
          messages.push(sent)
          renderMessages()
          statusText.content = "● Sent ✓"
          statusText.fg = colors.primary
        } else {
          logger.error("MessageInput", "sendMessage returned null")
          statusText.content = "✗ Failed to send"
          statusText.fg = "#F15C6D"
        }
      } catch (err: any) {
        logger.error("MessageInput", "sendMessage threw exception", err)
        statusText.content = "✗ Error sending"
        statusText.fg = "#F15C6D"
      }
      setTimeout(() => { statusText.content = "● Connected"; statusText.fg = colors.primary }, 2000)
    } else {
      logger.warn("MessageInput", "Cannot send - activeService not ready", { hasWhatsapp: !!activeService, isReady })
    }
  })

  // Keyboard handling
  renderer.keyInput.on("keypress", async (key: KeyEvent) => {
    logger.debug("Keyboard", "Key pressed", { 
      name: key.name, 
      ctrl: key.ctrl, 
      shift: key.shift,
      focusArea,
      isReady,
      selectedChat,
      chatsCount: chats.length
    })
    
    // Ctrl+Q or Ctrl+C to quit
    if (key.ctrl && (key.name === "q" || key.name === "c")) {
      logger.info("App", "User requested exit", { key: key.name })
      cleanupTerminal()
      if (activeService) await activeService.destroy()
      process.exit(0)
    }

    // Main menu navigation
    if (currentView === "main_menu") {
      if (key.name === "up" && menuSelectedIndex > 0) {
        menuSelectedIndex--
        updateMenuSelection()
        return
      }
      if (key.name === "down" && menuSelectedIndex < services.length - 1) {
        menuSelectedIndex++
        updateMenuSelection()
        return
      }
      if (key.name === "return") {
        const service = services[menuSelectedIndex]
        if (service && service.enabled) {
          enterService(service.id)
        }
        return
      }
      if (key.name === "q" || key.name === "Q") {
        cleanupTerminal()
        if (activeService) await activeService.destroy()
        process.exit(0)
      }
      return
    }

    // Global settings navigation
    if (currentView === "global_settings") {
      if (key.name === "escape") {
        currentView = "main_menu"
        showMainMenu()
        return
      }
      if (key.name === "up" && globalSettingsItem > 0) {
        globalSettingsItem--
        showGlobalSettingsView()
        return
      }
      if (key.name === "down" && globalSettingsItem < 9) {
        globalSettingsItem++
        showGlobalSettingsView()
        return
      }
      return
    }

    // Escape to go back to main menu from service view
    if (currentView === "service" && key.name === "escape" && focusArea === "chats" && !showSettings) {
      exitToMainMenu()
      return
    }

    // Ctrl+, or F2 to open settings (only in service view)
    if (currentView === "service" && ((key.name === "," && key.ctrl) || key.name === "f2")) {
      showSettings = !showSettings
      if (showSettings) {
        focusArea = "settings"
        settingsSection = 0
        settingsItem = 0
        renderSettings()
        logger.debug("App", "Settings opened")
      } else {
        // Restore service view
        settingsBox.visible = false
        mainBox.visible = true
        menuBox.visible = false
        renderChats()
        if (messages.length > 0) renderMessages()
        logger.debug("App", "Settings closed")
      }
      return
    }

    // Settings navigation when settings view is open
    if (showSettings) {
      if (key.name === "escape") {
        showSettings = false
        focusArea = "chats"
        // Restore service view
        settingsBox.visible = false
        mainBox.visible = true
        menuBox.visible = false
        renderChats()
        if (messages.length > 0) renderMessages()
        logger.debug("App", "Settings closed via Escape")
        return
      }
      if (key.name === "up") {
        navigateSettings("up")
        return
      }
      if (key.name === "down") {
        navigateSettings("down")
        return
      }
      if (key.name === "return" || key.name === "space") {
        toggleCurrentSetting()
        return
      }
      // Left/Right for radio/select to cycle options
      if (key.name === "left" || key.name === "right") {
        const section = SETTINGS_MENU[settingsSection]
        const item = section?.items[settingsItem]
        if (item && (item.type === "radio" || item.type === "select") && item.key && item.options) {
          const currentVal = settings[item.key]
          const currentIdx = item.options.findIndex(o => o.value === currentVal)
          const direction = key.name === "right" ? 1 : -1
          const nextIdx = (currentIdx + direction + item.options.length) % item.options.length
          const newVal = item.options[nextIdx].value
          updateSetting(item.key, newVal as any)
          ;(settings as any)[item.key] = newVal
          renderSettings()
        } else if (item && item.type === "number" && item.key) {
          const currentVal = settings[item.key] as number
          const step = key.name === "right" ? 10 : -10
          const newVal = Math.min(item.max || 300, Math.max(item.min || 0, currentVal + step))
          updateSetting(item.key, newVal as any)
          ;(settings as any)[item.key] = newVal
          renderSettings()
        }
        return
      }
      return // Don't process other keys while in settings
    }

    if (key.name === "tab" && isReady) {
      focusArea = focusArea === "chats" ? "input" : "chats"
      chatListBox.borderColor = focusArea === "chats" ? colors.primary : colors.border
      inputArea.borderColor = focusArea === "input" ? colors.primary : colors.border
      if (focusArea === "input") messageInput.focus()
      logger.debug("Keyboard", "Tab pressed - switched focus", { focusArea })
    }

    if (focusArea === "chats" && isReady) {
      if (key.name === "up" && selectedChat > 0) {
        selectedChat--
        updateSelection()
        logger.debug("App", "Chat nav up", { selectedChat })
      } else if (key.name === "down" && selectedChat < chats.length - 1) {
        selectedChat++
        updateSelection()
        logger.debug("App", "Chat nav down", { selectedChat })
      } else if (key.name === "return" && chats.length > 0) {
        await selectChat(selectedChat)
        focusArea = "input"
        chatListBox.borderColor = colors.border
        inputArea.borderColor = colors.primary
        messageInput.focus()
      }
    }

    // Number keys 1-9 for quick chat selection
    if (isReady && key.name && /^[1-9]$/.test(key.name)) {
      const idx = parseInt(key.name) - 1
      if (idx < chats.length) {
        logger.debug("App", "Quick select chat", { key: key.name, idx })
        await selectChat(idx)
        focusArea = "input"
        chatListBox.borderColor = colors.border
        inputArea.borderColor = colors.primary
        messageInput.focus()
      }
    }

    // Escape to go back to chat list
    if (key.name === "escape" && focusArea === "input") {
      focusArea = "chats"
      chatListBox.borderColor = colors.primary
      inputArea.borderColor = colors.border
      logger.debug("App", "Escape - back to chats")
    }

    // ? or F1 for help
    if (key.name === "?" || key.name === "f1") {
      const helpLines = [
        "╭─────────────── WhatsApp TUI Help ───────────────╮",
        "│                                                 │",
        "│  Navigation                                     │",
        "│  ───────────                                    │",
        "│  Tab        Switch between chat list and input  │",
        "│  ↑ / ↓      Navigate chat list                  │",
        "│  1-9        Quick select chat by number         │",
        "│  Enter      Select chat / Send message          │",
        "│  Escape     Return to chat list                 │",
        "│                                                 │",
        "│  Actions                                        │",
        "│  ───────                                        │",
        "│  F2/Ctrl+,  Open Settings                       │",
        "│  Ctrl+R     Refresh chats                       │",
        "│  Ctrl+P     Pin/Unpin chat                      │",
        "│  Ctrl+M     Mute/Unmute chat                    │",
        "│  Ctrl+A     Archive chat                        │",
        "│  Ctrl+Q     Quit application                    │",
        "│                                                 │",
        "│  Press any key to close this help               │",
        "╰─────────────────────────────────────────────────╯",
      ]
      console.clear()
      console.log("\n".repeat(3))
      helpLines.forEach(line => console.log("  " + line))
      console.log("\n  Press any key to continue...")
      logger.debug("App", "Help screen shown")
    }

    // Ctrl+R to refresh chats
    if (key.ctrl && key.name === "r" && isReady && activeService) {
      logger.info("App", "Refreshing chats")
      statusText.content = "○ Refreshing..."
      chats = await activeService.getChats()
      renderChats()
      updateSelection()
      if (currentChatId) {
        messages = await activeService.getMessages(currentChatId, 30)
        renderMessages()
      }
      statusText.content = "● Connected"
      statusText.fg = colors.primary
    }

    // Ctrl+P to pin/unpin chat
    if (key.ctrl && key.name === "p" && isReady && currentChatId && activeService) {
      const chat = chats[selectedChat]
      if (chat) {
        logger.info("App", "Toggling pin", { chatId: currentChatId, currentPin: chat.pinned })
        statusText.content = chat.pinned ? "○ Unpinning..." : "○ Pinning..."
        const success = await activeService.pinChat(currentChatId, !chat.pinned)
        if (success) {
          chats = await activeService.getChats()
          renderChats()
          updateSelection()
          statusText.content = chat.pinned ? "● Unpinned" : "● Pinned"
        } else {
          statusText.content = "✗ Failed"
        }
        setTimeout(() => { statusText.content = "● Connected"; statusText.fg = colors.primary }, 1500)
      }
    }

    // Ctrl+M to mute/unmute chat
    if (key.ctrl && key.name === "m" && isReady && currentChatId && activeService) {
      const chat = chats[selectedChat]
      if (chat) {
        logger.info("App", "Toggling mute", { chatId: currentChatId, currentMute: chat.muted })
        statusText.content = chat.muted ? "○ Unmuting..." : "○ Muting..."
        const success = await activeService.muteChat(currentChatId, !chat.muted)
        if (success) {
          chats = await activeService.getChats()
          renderChats()
          updateSelection()
          statusText.content = chat.muted ? "● Unmuted" : "● Muted"
        } else {
          statusText.content = "✗ Failed"
        }
        setTimeout(() => { statusText.content = "● Connected"; statusText.fg = colors.primary }, 1500)
      }
    }

    // Ctrl+A to archive chat
    if (key.ctrl && key.name === "a" && isReady && currentChatId && activeService) {
      const chat = chats[selectedChat]
      if (chat) {
        logger.info("App", "Archiving chat", { chatId: currentChatId })
        statusText.content = "○ Archiving..."
        const success = await activeService.archiveChat(currentChatId, true)
        if (success) {
          chats = await activeService.getChats()
          renderChats()
          updateSelection()
          statusText.content = "● Archived"
        } else {
          statusText.content = "✗ Failed"
        }
        setTimeout(() => { statusText.content = "● Connected"; statusText.fg = colors.primary }, 1500)
      }
    }
  })

  // Initialize - show main menu first
  currentView = "main_menu"
  mainBox.visible = false
  menuBox.visible = true
  updateMenuSelection()
  
  logger.info("App", "Main menu initialized")
  
  // Periodic state logging every 30 seconds
  setInterval(() => {
    logger.info("StateLog", "=== Periodic State Report ===", {
      isReady,
      DEMO_MODE,
      chatsCount: chats.length,
      messagesCount: messages.length,
      selectedChat,
      currentChatId,
      focusArea,
      chatItemsCount: chatItems.length,
      uptime: process.uptime().toFixed(0) + "s",
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB"
    })
  }, 30000)
  
  logger.info("App", "main() finished setup - periodic logging enabled")
}

main().catch((err) => {
  logger.error("App", "main() FATAL CRASH", err)
  console.error("FATAL:", err)
  process.exit(1)
})

// Uncaught exception handlers
process.on("uncaughtException", (err) => {
  logger.error("Process", "UNCAUGHT EXCEPTION", err)
  console.error("Uncaught Exception:", err)
})

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Process", "UNHANDLED REJECTION", { reason: String(reason) })
  console.error("Unhandled Rejection:", reason)
})

// Signal handlers for graceful shutdown
process.on("SIGTERM", () => {
  logger.info("Process", "Received SIGTERM - shutting down")
  process.exit(0)
})

process.on("SIGINT", () => {
  logger.info("Process", "Received SIGINT - shutting down")
  process.exit(0)
})
