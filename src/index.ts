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

const DEMO_MODE = process.argv.includes("--demo")
logger.init()
logger.info("App", "Starting WhatsApp TUI", { demoMode: DEMO_MODE, args: process.argv })

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

const colors = {
  bg: "#111B21",
  surface: "#1F2C34",
  surfaceLight: "#2A3942",
  border: "#2A3942",
  primary: "#25D366",
  text: "#E9EDEF",
  textMuted: "#8696A0",
  sent: "#005C4B",
  received: "#1F2C34",
}

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
    
    // Re-render chats and messages with new dimensions
    if (chats.length > 0) {
      renderChats()
      updateSelection()
    }
    if (messages.length > 0) {
      renderMessages()
    }
    
    logger.debug("App", "Resize complete - UI updated")
  }
  
  process.stdout.on("resize", handleResize)

  let chats: ChatData[] = DEMO_MODE ? DEMO_CHATS : []
  let messages: MessageData[] = []
  let selectedChat = 0
  let currentChatId: string | null = null
  let focusArea: "chats" | "input" = "chats"
  let isReady = DEMO_MODE

  // Conditionally import WhatsApp
  let whatsapp: any = null
  if (!DEMO_MODE) {
    logger.info("App", "Importing WhatsApp service")
    const wa = await import("./services/whatsapp")
    whatsapp = wa.whatsapp
    logger.info("App", "WhatsApp service imported")
  }

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
    content: "?:Help │ ↑↓:Nav │ Ctrl+P:Pin │ Ctrl+M:Mute │ Ctrl+A:Archive │ Ctrl+R:Refresh │ Ctrl+Q:Quit",
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

  const chatItems: { box: BoxRenderable; nameText: TextRenderable }[] = []

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
    
    for (let i = 0; i < chatItems.length; i++) {
      chatListBox.remove(`chat-${i}`)
      logger.debug("RenderChats", `Removed old chat item ${i}`)
    }
    chatItems.length = 0

    const maxChats = Math.floor((height - 6) / 2) // Calculate based on terminal height
    logger.info("RenderChats", "Calculated maxChats", { maxChats, height })
    
    // Update chat list title with count
    updateChatListTitle()
    
    if (chats.length === 0) {
      logger.warn("RenderChats", "No chats to render!")
      return
    }
    
    for (let i = 0; i < Math.min(chats.length, maxChats); i++) {
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
      chatItems.push({ box: itemBox, nameText })
      logger.debug("RenderChats", `Added chat item ${i} to chatListBox`)
    }
    logger.info("RenderChats", "Finished renderChats()", { renderedCount: chatItems.length })
  }

  function updateSelection() {
    logger.debug("UpdateSelection", "Starting updateSelection()", { 
      selectedChat, 
      chatItemsCount: chatItems.length 
    })
    
    // Always use chatItems - renderChats() handles all chat rendering
    if (chatItems.length === 0) {
      logger.warn("UpdateSelection", "No items to update!")
      return
    }
    
    for (let i = 0; i < chatItems.length; i++) {
      chatItems[i].box.backgroundColor = i === selectedChat ? colors.surfaceLight : colors.surface
      chatItems[i].nameText.fg = i === selectedChat ? colors.primary : colors.text
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
        marginBottom: 1,
      })
      
      // Limit bubble width to 70% of message area for better readability
      const maxBubbleWidth = Math.floor(msgAreaWidth * 0.7)
      const bubble = new BoxRenderable(renderer, {
        id: `bubble-${msgCount}`,
        backgroundColor: msg.fromMe ? colors.sent : colors.received,
        borderStyle: "rounded",
        borderColor: msg.fromMe ? colors.sent : colors.border,
        padding: 1,
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
      logger.debug("App", "Loaded demo messages", { count: messages.length, chatId: currentChatId })
    } else if (whatsapp) {
      statusText.content = "○ Loading..."
      statusText.fg = colors.textMuted
      logger.info("App", "Loading messages from WhatsApp", { chatId: currentChatId })
      messages = await whatsapp.getMessages(currentChatId, 30)
      logger.info("App", "Messages loaded", { count: messages.length })
      await whatsapp.markAsRead(currentChatId)
    }
    
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
    } else if (whatsapp && isReady) {
      logger.info("MessageInput", "Sending real WhatsApp message", { chatId: currentChatId, body: value.trim().substring(0, 20) })
      statusText.content = "○ Typing..."
      statusText.fg = colors.textMuted
      messageInput.value = ""
      
      try {
        const sent = await whatsapp.sendMessage(currentChatId, value.trim())
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
      logger.warn("MessageInput", "Cannot send - whatsapp not ready", { hasWhatsapp: !!whatsapp, isReady })
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
      if (whatsapp) await whatsapp.destroy()
      process.exit(0)
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
        "│  Ctrl+R     Refresh chats                       │",
        "│  Ctrl+P     Pin/Unpin chat                      │",
        "│  Ctrl+M     Mute/Unmute chat                    │",
        "│  Ctrl+A     Archive chat                        │",
        "│  Ctrl+Q     Quit application                    │",
        "│  Ctrl+C     Quit application                    │",
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
    if (key.ctrl && key.name === "r" && isReady && whatsapp) {
      logger.info("App", "Refreshing chats")
      statusText.content = "○ Refreshing..."
      chats = await whatsapp.getChats()
      renderChats()
      updateSelection()
      if (currentChatId) {
        messages = await whatsapp.getMessages(currentChatId, 30)
        renderMessages()
      }
      statusText.content = "● Connected"
      statusText.fg = colors.primary
    }

    // Ctrl+P to pin/unpin chat
    if (key.ctrl && key.name === "p" && isReady && currentChatId && whatsapp) {
      const chat = chats[selectedChat]
      if (chat) {
        logger.info("App", "Toggling pin", { chatId: currentChatId, currentPin: chat.pinned })
        statusText.content = chat.pinned ? "○ Unpinning..." : "○ Pinning..."
        const success = await whatsapp.pinChat(currentChatId, !chat.pinned)
        if (success) {
          chats = await whatsapp.getChats()
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
    if (key.ctrl && key.name === "m" && isReady && currentChatId && whatsapp) {
      const chat = chats[selectedChat]
      if (chat) {
        logger.info("App", "Toggling mute", { chatId: currentChatId, currentMute: chat.muted })
        statusText.content = chat.muted ? "○ Unmuting..." : "○ Muting..."
        const success = await whatsapp.muteChat(currentChatId, !chat.muted)
        if (success) {
          chats = await whatsapp.getChats()
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
    if (key.ctrl && key.name === "a" && isReady && currentChatId && whatsapp) {
      const chat = chats[selectedChat]
      if (chat) {
        logger.info("App", "Archiving chat", { chatId: currentChatId })
        statusText.content = "○ Archiving..."
        const success = await whatsapp.archiveChat(currentChatId, true)
        if (success) {
          chats = await whatsapp.getChats()
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

  // Initialize
  if (DEMO_MODE) {
    logger.info("App", "Demo mode - rendering chats")
    renderChats()
    updateSelection()
  } else if (whatsapp) {
    logger.info("App", "Setting up WhatsApp event handlers in main")
    
    whatsapp.on("qr", (qr: string) => {
      logger.event("App", "qr received in main")
      statusText.content = "○ Scan QR..."
      loadingText.content = "Scan QR code\nin terminal"
      whatsapp.displayQrCode(qr)
    })

    whatsapp.on("authenticated", () => {
      logger.event("App", "authenticated in main")
      statusText.content = "○ Authenticated..."
      loadingText.content = "Loading..."
    })

    whatsapp.on("ready", async () => {
      logger.event("App", "ready in main - WhatsApp client is ready!")
      logger.info("App", "Setting isReady to true")
      isReady = true
      statusText.content = "○ Loading chats..."
      logger.info("App", "Loading chats after ready event")
      
      try {
        logger.debug("App", "Calling whatsapp.getChats()...")
        chats = await whatsapp.getChats()
        logger.info("App", "Chats loaded successfully", { 
          count: chats.length,
          firstChat: chats[0]?.name,
          lastChat: chats[chats.length - 1]?.name
        })
        
        if (chats.length === 0) {
          logger.warn("App", "No chats returned from WhatsApp!")
        }
        
        logger.debug("App", "Calling renderChats()...")
        renderChats()
        logger.debug("App", "Calling updateSelection()...")
        updateSelection()
        
        statusText.content = "● Connected"
        statusText.fg = colors.primary
        logger.info("App", "Ready event handling complete")
      } catch (err: any) {
        logger.error("App", "Error loading chats in ready handler", err)
        statusText.content = `✗ Load error: ${err.message?.slice(0, 20)}`
        statusText.fg = "#F15C6D"
      }
    })

    whatsapp.on("message", async () => {
      logger.event("App", "message in main")
      if (currentChatId) {
        messages = await whatsapp.getMessages(currentChatId, 30)
        renderMessages()
      }
      chats = await whatsapp.getChats()
      renderChats()
      updateSelection()
    })

    whatsapp.on("disconnected", (reason: string) => {
      logger.event("App", "disconnected in main", { reason })
      isReady = false
      statusText.content = `✗ ${reason}`
      statusText.fg = "#F15C6D"
    })

    // Typing indicator
    whatsapp.on("typing", ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      logger.event("App", "typing indicator", { chatId, isTyping, currentChatId })
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

    logger.info("App", "Calling whatsapp.initialize()")
    try {
      await whatsapp.initialize()
      logger.info("App", "whatsapp.initialize() completed")
    } catch (err: any) {
      logger.error("App", "whatsapp.initialize() failed", err)
      statusText.content = `✗ ${err.message?.slice(0, 30) || "Error"}`
      statusText.fg = "#F15C6D"
    }
  }
  
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
