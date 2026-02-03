import { createServer, IncomingMessage, ServerResponse } from "http"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, extname } from "path"
import { logger } from "./logger"

export class MediaServer {
  private server: ReturnType<typeof createServer> | null = null
  private port: number = 8765
  private mediaDir: string = ".media-cache"

  async start(): Promise<string> {
    if (this.server) {
      return `http://localhost:${this.port}`
    }

    return new Promise((resolve, reject) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        this.handleRequest(req, res)
      })

      this.server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          this.port++
          this.server?.listen(this.port)
        } else {
          reject(err)
        }
      })

      this.server.listen(this.port, () => {
        const url = `http://localhost:${this.port}`
        logger.info("MediaServer", "Started", { url })
        resolve(url)
      })
    })
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          logger.info("MediaServer", "Stopped")
          this.server = null
          resolve()
        })
      })
    }
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || "/"
    
    if (url === "/" || url === "/index.html") {
      this.serveGallery(res)
    } else if (url.startsWith("/media/")) {
      const filename = url.substring(7)
      this.serveMedia(filename, res)
    } else {
      res.writeHead(404)
      res.end("Not found")
    }
  }

  private serveGallery(res: ServerResponse): void {
    try {
      const files = readdirSync(this.mediaDir)
        .filter(f => this.isImageOrVideo(f))
        .map(f => ({
          name: f,
          url: `/media/${f}`,
          size: statSync(join(this.mediaDir, f)).size,
          type: this.getMediaType(f)
        }))

      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Media Gallery - ChatClient</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
    }
    h1 {
      text-align: center;
      color: #58a6ff;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .item {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s;
    }
    .item:hover {
      transform: scale(1.05);
      border-color: #58a6ff;
    }
    .item img, .item video {
      width: 100%;
      height: 200px;
      object-fit: cover;
      cursor: pointer;
    }
    .item-info {
      padding: 10px;
      font-size: 12px;
      color: #8b949e;
    }
    .item-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 5px;
      color: #c9d1d9;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .modal.active {
      display: flex;
    }
    .modal img, .modal video {
      max-width: 90%;
      max-height: 90%;
    }
    .modal-close {
      position: absolute;
      top: 20px;
      right: 30px;
      color: white;
      font-size: 40px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>📁 Media Gallery</h1>
  <div class="gallery">
    ${files.map(f => `
      <div class="item">
        ${f.type === 'image' 
          ? `<img src="${f.url}" alt="${f.name}" onclick="openModal('${f.url}')">`
          : `<video src="${f.url}" controls></video>`
        }
        <div class="item-info">
          <div class="item-name">${f.name}</div>
          <div>${(f.size / 1024).toFixed(1)} KB</div>
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="modal" id="modal" onclick="closeModal()">
    <span class="modal-close">&times;</span>
    <img id="modal-img" src="" alt="">
  </div>
  
  <script>
    function openModal(url) {
      document.getElementById('modal-img').src = url;
      document.getElementById('modal').classList.add('active');
    }
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }
  </script>
</body>
</html>
      `
      
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(html)
    } catch (err) {
      logger.error("MediaServer", "Gallery error", err)
      res.writeHead(500)
      res.end("Server error")
    }
  }

  private serveMedia(filename: string, res: ServerResponse): void {
    try {
      const filePath = join(this.mediaDir, filename)
      const ext = extname(filename).toLowerCase()
      const contentType = this.getContentType(ext)
      
      const data = readFileSync(filePath)
      res.writeHead(200, { "Content-Type": contentType })
      res.end(data)
    } catch (err) {
      res.writeHead(404)
      res.end("File not found")
    }
  }

  private isImageOrVideo(filename: string): boolean {
    const ext = extname(filename).toLowerCase()
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov'].includes(ext)
  }

  private getMediaType(filename: string): 'image' | 'video' {
    const ext = extname(filename).toLowerCase()
    return ['.mp4', '.webm', '.mov'].includes(ext) ? 'video' : 'image'
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
    }
    return types[ext] || 'application/octet-stream'
  }

  getUrl(): string | null {
    return this.server ? `http://localhost:${this.port}` : null
  }
}

export const mediaServer = new MediaServer()
