import { appendFileSync, writeFileSync } from "fs"

const LOG_FILE = "whatclient.log"

function timestamp(): string {
  return new Date().toISOString()
}

function formatMessage(level: string, context: string, message: string, data?: any): string {
  let line = `[${timestamp()}] [${level}] [${context}] ${message}`
  if (data !== undefined) {
    try {
      line += ` | ${JSON.stringify(data)}`
    } catch {
      line += ` | [Circular or non-serializable data]`
    }
  }
  return line + "\n"
}

export const logger = {
  init() {
    writeFileSync(LOG_FILE, `=== WhatsApp TUI Log Started ${timestamp()} ===\n`)
  },

  info(context: string, message: string, data?: any) {
    const line = formatMessage("INFO", context, message, data)
    appendFileSync(LOG_FILE, line)
  },

  warn(context: string, message: string, data?: any) {
    const line = formatMessage("WARN", context, message, data)
    appendFileSync(LOG_FILE, line)
  },

  error(context: string, message: string, error?: any) {
    let errorData: any = undefined
    if (error) {
      errorData = {
        message: error.message || String(error),
        stack: error.stack,
        name: error.name,
      }
    }
    const line = formatMessage("ERROR", context, message, errorData)
    appendFileSync(LOG_FILE, line)
  },

  debug(context: string, message: string, data?: any) {
    const line = formatMessage("DEBUG", context, message, data)
    appendFileSync(LOG_FILE, line)
  },

  event(context: string, eventName: string, data?: any) {
    const line = formatMessage("EVENT", context, `Event: ${eventName}`, data)
    appendFileSync(LOG_FILE, line)
  },
}
