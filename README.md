# ChitChat

Universal terminal messaging client built with OpenTUI.

Supports: WhatsApp, Slack, Discord*, Telegram*, Signal*
(*coming soon)

## Install

```bash
npm install
~/.bun/bin/bun run src/index.ts
```

### WhatsApp Setup
Scan QR code with WhatsApp → Settings → Linked Devices.

### Slack Setup
- **Have a token already?** See [SLACK_TOKEN_ONLY.md](./SLACK_TOKEN_ONLY.md)
- **Need to create one?** See [SLACK_SETUP.md](./SLACK_SETUP.md)

## Demo

```bash
~/.bun/bin/bun run src/index.ts --demo
```

## Keys

- `↑↓` Navigate
- `Enter` Select/Send
- `Tab` Switch focus
- `?` Help
- `Ctrl+Q` Quit

## Tech

- OpenTUI - Terminal UI
- whatsapp-web.js - WhatsApp API
- Bun - Runtime
