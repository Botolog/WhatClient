import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs"
import { join } from "path"
import { createHash } from "crypto"

const CACHE_DIR = join(process.cwd(), ".media-cache")

export class MediaCache {
  private inMemoryCache: Map<string, string> = new Map()

  constructor() {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true })
    }
  }

  private getFilePath(chatName: string, filename: string, timestamp: number, extension: string = ""): string {
    // Hash: chatname + filename + timestamp for unique identification
    const hashInput = `${chatName}_${filename}_${timestamp}`
    const hash = createHash("md5").update(hashInput).digest("hex")
    return join(CACHE_DIR, `${hash}${extension}`)
  }

  async cache(chatName: string, filename: string, timestamp: number, data: Buffer, mimetype: string): Promise<string> {
    const ext = this.getExtensionFromMimetype(mimetype)
    const filePath = this.getFilePath(chatName, filename, timestamp, ext)
    
    // Only write if doesn't exist
    if (!existsSync(filePath)) {
      writeFileSync(filePath, data)
    }
    
    // Add to in-memory cache
    this.inMemoryCache.set(filePath, filePath)
    
    return filePath
  }

  get(chatName: string, filename: string, timestamp: number, mimetype: string): string | null {
    const ext = this.getExtensionFromMimetype(mimetype)
    const filePath = this.getFilePath(chatName, filename, timestamp, ext)
    
    // Check in-memory cache first (instant)
    if (this.inMemoryCache.has(filePath)) {
      return filePath
    }
    
    // Only check filesystem if not in memory cache
    if (existsSync(filePath)) {
      this.inMemoryCache.set(filePath, filePath)
      return filePath
    }
    return null
  }

  has(chatName: string, filename: string, timestamp: number, mimetype: string): boolean {
    const ext = this.getExtensionFromMimetype(mimetype)
    const filePath = this.getFilePath(chatName, filename, timestamp, ext)
    return existsSync(filePath)
  }
  
  clear(): void {
    // Clear all cached media files
    if (existsSync(CACHE_DIR)) {
      rmSync(CACHE_DIR, { recursive: true, force: true })
      mkdirSync(CACHE_DIR, { recursive: true })
    }
    // Clear in-memory cache
    this.inMemoryCache.clear()
  }

  private getExtensionFromMimetype(mimetype: string): string {
    const mimeMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/quicktime": ".mov",
      "audio/mpeg": ".mp3",
      "audio/ogg": ".ogg",
      "audio/wav": ".wav",
      "audio/webm": ".webm",
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    }
    return mimeMap[mimetype] || ""
  }
}

export const mediaCache = new MediaCache()
