import pkg from "whatsapp-web.js"
const { Client, LocalAuth } = pkg
import qrcode from "qrcode-terminal"
import { EventEmitter } from "events"
import { Logger } from "../utils/logger"

const logger = new Logger("whatsapp.log", "WhatsApp")

export interface ChatData {
  id: string
  name: string
  isGroup: boolean
  unreadCount: number
  pinned: boolean
  muted: boolean
  archived: boolean
  participantCount?: number
  lastMessage?: {
    body: string
    timestamp: number
    fromMe: boolean
  }
}

export interface MessageData {
  id: string
  body: string
  timestamp: number
  fromMe: boolean
  author?: string
  authorName?: string
  hasMedia: boolean
  type: string
  ack?: number
  isForwarded?: boolean
  forwardingScore?: number
  isStarred?: boolean
  hasQuotedMsg?: boolean
  quotedMsgBody?: string
}

export interface ContactData {
  id: string
  name: string
  number: string
  isMyContact: boolean
  isGroup: boolean
  isBlocked: boolean
}

class WhatsAppService extends EventEmitter {
  private client: pkg.Client
  private ready = false
  private qrCode: string | null = null

  constructor() {
    super()
    logger.info("WhatsApp", "Creating WhatsApp client")
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-translate",
          "--metrics-recording-only",
          "--mute-audio",
          "--safebrowsing-disable-auto-update",
          "--disable-features=site-per-process",
        ],
        timeout: 120000,
      },
    })
    logger.info("WhatsApp", "Client created, setting up event handlers")
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    logger.info("WhatsApp", "=== Setting up ALL event handlers ===")

    this.client.on("qr", (qr) => {
      logger.event("WhatsApp", "EVENT: qr received", { qrLength: qr.length })
      logger.debug("WhatsApp", "QR code first 50 chars", { preview: qr.substring(0, 50) })
      this.qrCode = qr
      this.emit("qr", qr)
      logger.debug("WhatsApp", "Emitted qr event to listeners")
    })

    this.client.on("ready", () => {
      logger.event("WhatsApp", "EVENT: ready - WhatsApp client is fully ready!")
      logger.info("WhatsApp", "Setting this.ready = true")
      this.ready = true
      this.qrCode = null
      this.emit("ready")
      logger.info("WhatsApp", "Emitted ready event to listeners")
    })

    this.client.on("authenticated", () => {
      logger.event("WhatsApp", "EVENT: authenticated - session validated")
      this.emit("authenticated")
      logger.debug("WhatsApp", "Emitted authenticated event")
    })

    this.client.on("auth_failure", (msg) => {
      logger.error("WhatsApp", "EVENT: auth_failure", { message: msg })
      this.emit("auth_failure", msg)
    })

    this.client.on("disconnected", (reason) => {
      logger.event("WhatsApp", "EVENT: disconnected", { reason })
      logger.warn("WhatsApp", "Setting this.ready = false due to disconnect")
      this.ready = false
      this.emit("disconnected", reason)
    })

    this.client.on("message", (message) => {
      logger.event("WhatsApp", "EVENT: message received", { 
        id: message.id._serialized, 
        from: message.from,
        body: message.body?.substring(0, 30),
        type: message.type
      })
      this.emit("message", this.formatMessage(message))
    })

    this.client.on("message_create", (message) => {
      logger.event("WhatsApp", "EVENT: message_create", { 
        id: message.id._serialized, 
        fromMe: message.fromMe,
        to: message.to
      })
      this.emit("message_create", this.formatMessage(message))
    })

    this.client.on("message_ack", (message, ack) => {
      logger.event("WhatsApp", "EVENT: message_ack", { id: message.id._serialized, ack })
      this.emit("message_ack", { id: message.id._serialized, ack })
    })

    // Typing indicator
    this.client.on("chat_typing", (chat) => {
      logger.event("WhatsApp", "EVENT: chat_typing", { chatId: chat.id._serialized })
      this.emit("typing", { chatId: chat.id._serialized, isTyping: true })
    })

    this.client.on("chat_stopped_typing", (chat) => {
      logger.event("WhatsApp", "EVENT: chat_stopped_typing", { chatId: chat.id._serialized })
      this.emit("typing", { chatId: chat.id._serialized, isTyping: false })
    })

    this.client.on("change_state", (state) => {
      logger.event("WhatsApp", "EVENT: change_state", { state })
      this.emit("state_change", state)
    })

    this.client.on("loading_screen", (percent, message) => {
      logger.event("WhatsApp", "EVENT: loading_screen", { percent, message })
    })

    this.client.on("remote_session_saved", () => {
      logger.event("WhatsApp", "EVENT: remote_session_saved")
    })

    logger.info("WhatsApp", "=== All event handlers registered ===")
  }

  async initialize(maxRetries: number = 3): Promise<void> {
    logger.info("WhatsApp", "Starting initialization", { maxRetries })
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info("WhatsApp", `Initialization attempt ${attempt}/${maxRetries}`)
      
      try {
        await this.initializeOnce()
        logger.info("WhatsApp", "Initialization successful!")
        return
      } catch (err: any) {
        logger.error("WhatsApp", `Attempt ${attempt} failed`, { error: err.message })
        
        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
          logger.info("WhatsApp", `Retrying in ${backoffMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoffMs))
        } else {
          logger.error("WhatsApp", "All initialization attempts failed")
          throw err
        }
      }
    }
  }

  private initializeOnce(): Promise<void> {
    return new Promise((resolve, reject) => {
      const readyHandler = () => {
        logger.info("WhatsApp", "Initialization complete - ready")
        this.removeListener("auth_failure", failHandler)
        resolve()
      }
      const failHandler = (msg: string) => {
        logger.error("WhatsApp", "Initialization failed", { message: msg })
        this.removeListener("ready", readyHandler)
        reject(new Error(`Authentication failed: ${msg}`))
      }
      this.once("ready", readyHandler)
      this.once("auth_failure", failHandler)
      
      logger.info("WhatsApp", "Calling client.initialize()")
      this.client.initialize().catch((err) => {
        logger.error("WhatsApp", "client.initialize() threw error", err)
        reject(err)
      })
    })
  }

  isReady(): boolean {
    return this.ready
  }

  getQrCode(): string | null {
    return this.qrCode
  }

  displayQrCode(qr: string) {
    qrcode.generate(qr, { small: true })
  }

  async getChats(): Promise<ChatData[]> {
    logger.info("WhatsApp", "=== getChats() START ===", { ready: this.ready })
    if (!this.ready) {
      logger.warn("WhatsApp", "getChats() called but client not ready!")
      return []
    }
    try {
      // Use direct Store access - client.getChats() hangs in newer versions
      logger.debug("WhatsApp", "Using direct Store.Chat access...")
      const pupPage = (this.client as any).pupPage
      if (!pupPage) {
        logger.error("WhatsApp", "pupPage not available!")
        return []
      }
      
      const rawChats = await pupPage.evaluate(() => {
        // @ts-ignore - accessing WhatsApp Web internals
        const store = window.Store
        if (!store || !store.Chat) {
          return { error: "Store.Chat not available" }
        }
        const chats = store.Chat.getModelsArray()
        return chats.map((c: any) => ({
          id: c.id?._serialized || String(c.id),
          name: c.name || c.contact?.pushname || c.contact?.name || "Unknown",
          isGroup: !!c.isGroup,
          unreadCount: c.unreadCount || 0,
          archived: !!c.archived,
          pinned: !!c.pin,
          muted: c.mute?.expiration > 0,
          timestamp: c.t || 0,
          lastMessageBody: c.lastReceivedKey ? "" : "", // Will get from lastMessage
          participantCount: c.isGroup ? (c.groupMetadata?.participants?.length || 0) : 0
        }))
      })
      
      if (rawChats.error) {
        logger.error("WhatsApp", "Store access failed", { error: rawChats.error })
        return []
      }
      
      logger.info("WhatsApp", "Raw chats from Store", { 
        totalCount: rawChats.length,
        firstThree: rawChats.slice(0, 3).map((c: any) => ({ name: c.name, id: c.id }))
      })
      
      const chats = rawChats as any[]
      
      const filtered = chats.filter((chat) => !chat.archived)
      logger.debug("WhatsApp", "After archive filter", { count: filtered.length })
      
      const formatted = filtered.map((chat) => {
        const f = this.formatChat(chat)
        logger.debug("WhatsApp", "Formatted chat", { name: f.name, id: f.id, unread: f.unreadCount })
        return f
      })
      
      const sorted = formatted.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        const aTime = a.lastMessage?.timestamp ?? 0
        const bTime = b.lastMessage?.timestamp ?? 0
        return bTime - aTime
      })
      
      logger.info("WhatsApp", "=== getChats() COMPLETE ===", { 
        finalCount: sorted.length,
        firstChat: sorted[0]?.name,
        lastChat: sorted[sorted.length - 1]?.name 
      })
      return sorted
    } catch (err) {
      logger.error("WhatsApp", "getChats() EXCEPTION", err)
      return []
    }
  }

  async getMessages(chatId: string, limit: number = 50): Promise<MessageData[]> {
    logger.debug("WhatsApp", "getMessages() called", { chatId, limit, ready: this.ready })
    if (!this.ready) {
      logger.warn("WhatsApp", "getMessages() called but not ready")
      return []
    }
    try {
      const chat = await this.client.getChatById(chatId)
      const messages = await chat.fetchMessages({ limit })
      logger.info("WhatsApp", "Got messages", { chatId, count: messages.length })
      return messages.map((msg) => this.formatMessage(msg))
    } catch (err) {
      logger.error("WhatsApp", "getMessages() error", err)
      return []
    }
  }

  async sendMessage(chatId: string, content: string): Promise<MessageData | null> {
    logger.info("WhatsApp", "sendMessage() called", { chatId, contentLength: content.length })
    if (!this.ready) {
      logger.warn("WhatsApp", "sendMessage() called but not ready")
      return null
    }
    try {
      const chat = await this.client.getChatById(chatId)
      const message = await chat.sendMessage(content)
      logger.info("WhatsApp", "Message sent", { messageId: message.id._serialized })
      return this.formatMessage(message)
    } catch (err) {
      logger.error("WhatsApp", "sendMessage() error", err)
      return null
    }
  }

  async markAsRead(chatId: string): Promise<void> {
    logger.debug("WhatsApp", "markAsRead() called", { chatId })
    if (!this.ready) return
    try {
      const chat = await this.client.getChatById(chatId)
      await chat.sendSeen()
      logger.debug("WhatsApp", "Marked as read", { chatId })
    } catch (err) {
      logger.error("WhatsApp", "markAsRead() error", err)
    }
  }

  async pinChat(chatId: string, pin: boolean): Promise<boolean> {
    logger.info("WhatsApp", "pinChat() called", { chatId, pin })
    if (!this.ready) return false
    try {
      const chat = await this.client.getChatById(chatId)
      if (pin) {
        await chat.pin()
      } else {
        await chat.unpin()
      }
      logger.info("WhatsApp", "Chat pin toggled", { chatId, pin })
      return true
    } catch (err) {
      logger.error("WhatsApp", "pinChat() error", err)
      return false
    }
  }

  async muteChat(chatId: string, mute: boolean): Promise<boolean> {
    logger.info("WhatsApp", "muteChat() called", { chatId, mute })
    if (!this.ready) return false
    try {
      const chat = await this.client.getChatById(chatId)
      if (mute) {
        await chat.mute()
      } else {
        await chat.unmute()
      }
      logger.info("WhatsApp", "Chat mute toggled", { chatId, mute })
      return true
    } catch (err) {
      logger.error("WhatsApp", "muteChat() error", err)
      return false
    }
  }

  async archiveChat(chatId: string, archive: boolean): Promise<boolean> {
    logger.info("WhatsApp", "archiveChat() called", { chatId, archive })
    if (!this.ready) return false
    try {
      const chat = await this.client.getChatById(chatId)
      if (archive) {
        await chat.archive()
      } else {
        await chat.unarchive()
      }
      logger.info("WhatsApp", "Chat archive toggled", { chatId, archive })
      return true
    } catch (err) {
      logger.error("WhatsApp", "archiveChat() error", err)
      return false
    }
  }

  async getContactInfo(contactId: string): Promise<ContactData | null> {
    if (!this.ready) return null
    try {
      const contact = await this.client.getContactById(contactId)
      return {
        id: contact.id._serialized,
        name: contact.name || contact.pushname || contact.number || "Unknown",
        number: contact.number || "",
        isMyContact: contact.isMyContact,
        isGroup: contact.isGroup,
        isBlocked: contact.isBlocked,
      }
    } catch {
      return null
    }
  }

  private formatChat(chat: any): ChatData {
    // Handle both whatsapp-web.js Chat objects and plain Store objects
    const chatId = chat.id?._serialized || chat.id
    const chatName = chat.name || "Unknown"
    
    logger.debug("WhatsApp", "formatChat() called", { 
      chatId, 
      chatName,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount
    })
    
    const formatted: ChatData = {
      id: chatId,
      name: chatName,
      isGroup: !!chat.isGroup,
      unreadCount: chat.unreadCount || 0,
      pinned: !!chat.pinned || !!chat.pin,
      muted: !!chat.muted || !!chat.isMuted,
      archived: !!chat.archived,
      participantCount: chat.participantCount,
      lastMessage: chat.timestamp
        ? {
            body: chat.lastMessageBody || "",
            timestamp: chat.timestamp,
            fromMe: false,
          }
        : undefined,
    }
    logger.debug("WhatsApp", "formatChat() complete", { name: formatted.name, id: formatted.id })
    return formatted
  }

  private formatMessage(message: pkg.Message): MessageData {
    logger.debug("WhatsApp", "formatMessage() called", { 
      id: message.id._serialized, 
      fromMe: message.fromMe, 
      type: message.type 
    })
    const msgAny = message as any
    return {
      id: message.id._serialized,
      body: message.body || "",
      timestamp: message.timestamp,
      fromMe: message.fromMe,
      author: message.author,
      hasMedia: message.hasMedia,
      type: message.type,
      ack: message.ack,
      isForwarded: msgAny.isForwarded || false,
      forwardingScore: msgAny.forwardingScore,
      isStarred: msgAny.isStarred || false,
      hasQuotedMsg: msgAny.hasQuotedMsg || false,
      quotedMsgBody: msgAny._data?.quotedMsg?.body,
    }
  }

  async destroy(): Promise<void> {
    logger.info("WhatsApp", "Destroying client")
    try {
      await this.client.destroy()
      this.ready = false
      logger.info("WhatsApp", "Client destroyed")
    } catch (err) {
      logger.error("WhatsApp", "Error destroying client", err)
    }
  }

  async reconnect(): Promise<void> {
    logger.info("WhatsApp", "Attempting to reconnect...")
    try {
      await this.destroy()
      logger.info("WhatsApp", "Client destroyed, waiting before reconnect...")
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Recreate client
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-extensions",
            "--disable-background-networking",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-translate",
            "--metrics-recording-only",
            "--mute-audio",
            "--safebrowsing-disable-auto-update",
            "--disable-features=site-per-process",
          ],
          timeout: 120000,
        },
      })
      
      this.setupEventHandlers()
      await this.initialize()
      logger.info("WhatsApp", "Reconnection successful!")
    } catch (err) {
      logger.error("WhatsApp", "Reconnection failed", err)
      throw err
    }
  }

  getConnectionState(): { ready: boolean; hasQr: boolean } {
    return {
      ready: this.ready,
      hasQr: this.qrCode !== null
    }
  }
}

export const whatsapp = new WhatsAppService()
