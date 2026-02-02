# WhatsApp TUI Client

A terminal-based WhatsApp client built with [OpenTUI](https://opentui.com/) and [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).

![WhatsApp TUI](https://img.shields.io/badge/WhatsApp-TUI-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

## Features

- 📱 **Full WhatsApp Web functionality** - Send and receive messages
- 💬 **Chat list** - Browse all your chats with unread indicators
- 📨 **Message view** - See messages with timestamps and read receipts
- ⌨️ **Keyboard shortcuts** - Navigate quickly without a mouse
- 🌙 **Dark theme** - WhatsApp-style dark interface
- 🔐 **Persistent sessions** - Login once, stay logged in
- 📌 **Pinned chats** - Pinned chats appear at the top with 📌 icon
- 🔔 **Unread count** - See unread message counts with highlight
- 👥 **Group indicators** - Group chats show 👥 icon and member count
- 🔇 **Muted chats** - Muted chats show 🔇 icon
- 📅 **Date separators** - Messages grouped by date (Today, Yesterday, etc.)
- ✓✓ **Read receipts** - Blue ticks for read messages
- 📷 **Media icons** - Different icons for images, videos, audio, documents
- ⌨️ **Typing indicator** - See when contacts are typing
- 🔄 **Auto retry** - Connection retry with exponential backoff
- 📝 **Comprehensive logging** - Detailed logs in `whatclient.log`
- 🎮 **Demo mode** - Try the UI without WhatsApp connection

## Requirements

- [Bun](https://bun.sh) runtime (v1.0+)
- A terminal with Unicode support (80x24 minimum)

## Installation

```bash
# Clone the repository
git clone https://github.com/Botolog/WhatClient.git
cd WhatClient

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
npm install

# Try demo mode first (no WhatsApp needed)
~/.bun/bin/bun run src/index.ts --demo

# Or start with real WhatsApp connection
~/.bun/bin/bun run src/index.ts
```

## Demo Mode

Try the TUI without connecting to WhatsApp:

```bash
~/.bun/bin/bun run src/index.ts --demo
```

Demo mode includes mock chats and messages for testing the interface.

## WhatsApp Connection

On first run without `--demo`, you'll see a QR code in your terminal:

1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Scan the QR code displayed in the terminal

Your session will be saved in `.wwebjs_auth/` for future runs.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `?` / `F1` | Show help screen |
| `Tab` | Switch focus between chat list and input |
| `↑` / `↓` | Navigate chat list |
| `Enter` | Select chat / Send message |
| `1-9` | Quick select chat by position |
| `Escape` | Return to chat list from input |
| `Ctrl+R` | Refresh chats and messages |
| `Ctrl+P` | Pin/Unpin selected chat |
| `Ctrl+M` | Mute/Unmute selected chat |
| `Ctrl+A` | Archive selected chat |
| `Ctrl+Q` | Quit application |
| `Ctrl+C` | Quit application |

## Project Structure

```
src/
├── services/
│   └── whatsapp.ts      # WhatsApp Web API wrapper with logging
├── utils/
│   └── logger.ts        # File logging utility
├── index.ts             # Main TUI application
├── test-whatsapp.ts     # Minimal WhatsApp test (no GUI)
└── funcs.ts             # Hebrew text utilities
```

## Log Files

- `whatclient.log` - Main application logs
- `whatsapp-test.log` - Test script logs

## Configuration

The app stores authentication data in `.wwebjs_auth/` directory. To logout, simply delete this folder.

## Troubleshooting

### QR Code not showing
Make sure your terminal supports Unicode characters. Try a different terminal emulator.

### Connection issues
- Check your internet connection
- Delete `.wwebjs_auth/` and `.wwebjs_cache/` folders and re-authenticate
- Make sure WhatsApp Web isn't open in another browser

### Performance issues
- Close other WhatsApp Web sessions
- Restart the application

## Tech Stack

- **[OpenTUI](https://opentui.com/)** - Terminal UI framework
- **[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)** - WhatsApp Web API
- **[Bun](https://bun.sh)** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript

## License

ISC License

## Disclaimer

This project is not affiliated with WhatsApp Inc. Use at your own risk and in accordance with WhatsApp's Terms of Service.
