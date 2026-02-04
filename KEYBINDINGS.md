# Keybindings Configuration

ChitChat supports fully configurable keybindings through a JSON configuration file.

## Configuration File

The keybindings are stored in `.chitchat-keybindings.json` in the application directory. This file is automatically created with default keybindings on first run.

## Keybinding Format

Each keybinding has the following structure:

```json
{
  "key": "string",
  "ctrl": boolean (optional),
  "shift": boolean (optional),
  "alt": boolean (optional),
  "description": "string"
}
```

### Key Names

Common key names:
- Letter keys: `"a"`, `"b"`, `"c"`, etc.
- Special keys: `"return"`, `"escape"`, `"space"`, `"backspace"`, `"delete"`, `"insert"`, `"tab"`
- Arrow keys: `"up"`, `"down"`, `"left"`, `"right"`
- Function keys: `"f1"`, `"f2"`, `"f3"`, etc.

### Modifiers

- `ctrl`: true/false - Ctrl key must be pressed
- `shift`: true/false - Shift key must be pressed
- `alt`: true/false - Alt key must be pressed

If a modifier is not specified or set to `false`, it should not be pressed.

## Available Keybindings

### Global
- `quit` - Quit application (default: Ctrl+Q)
- `settings` - Open settings (default: F2)
- `help` - Toggle help (default: ?)

### Navigation
- `navigateUp` - Navigate up (default: ↑)
- `navigateDown` - Navigate down (default: ↓)
- `navigateLeft` - Navigate left (default: ←)
- `navigateRight` - Navigate right (default: →)
- `selectItem` - Select item (default: Enter)
- `goBack` - Go back (default: Esc)

### Chat List
- `refreshChats` - Refresh chat list (default: Ctrl+R)
- `pinChat` - Pin/unpin chat (default: Ctrl+P)
- `muteChat` - Mute/unmute chat (default: Ctrl+M)
- `archiveChat` - Archive chat (default: Ctrl+A)

### Message Navigation
- `messageUp` - Previous message (default: ↑)
- `messageDown` - Next message (default: ↓)
- `jumpToReply` - Jump to replied message (default: Space)
- `setReplyReference` - Set as reply reference (default: R)
- `openMedia` - Open media (default: Enter)
- `deleteMessageForMe` - Delete message for me (default: Backspace)
- `deleteMessageForEveryone` - Delete message for everyone (default: Delete)
- `editMessage` - Edit message (default: Insert)

### Input
- `sendMessage` - Send message (default: Enter)
- `newLine` - New line (default: Shift+Enter)
- `cancelEdit` - Cancel edit (default: Esc)

### Settings Navigation
- `settingsUp` - Previous setting (default: ↑)
- `settingsDown` - Next setting (default: ↓)
- `settingsToggle` - Toggle setting (default: Enter)
- `settingsClose` - Close settings (default: Esc)
- `settingsNextPage` - Next settings page (default: Tab)
- `settingsPrevPage` - Previous settings page (default: Shift+Tab)

## Example Customizations

### Change reply keybinding to Ctrl+R
```json
{
  "setReplyReference": {
    "key": "r",
    "ctrl": true,
    "description": "Set as reply reference"
  }
}
```

### Change media open to M key
```json
{
  "openMedia": {
    "key": "m",
    "description": "Open media"
  }
}
```

### Use Vim-style navigation
```json
{
  "messageUp": {
    "key": "k",
    "description": "Previous message"
  },
  "messageDown": {
    "key": "j",
    "description": "Next message"
  }
}
```

## Notes

- **Terminal Limitations**: Some key combinations (like Ctrl+Enter) may not work in all terminals due to how they handle key events. If a keybinding doesn't work, try a different key combination.
- **Conflicts**: Avoid assigning the same key combination to multiple actions in the same context.
- **Reload**: Changes to the keybindings file require restarting the application.
- **Reset**: Delete `.chitchat-keybindings.json` to restore default keybindings.

## Troubleshooting

If keybindings aren't working:

1. Check the log file (`chitchat.log`) for keybinding loading errors
2. Verify your JSON syntax is correct
3. Ensure key names match the expected format
4. Test if the key combination works in your terminal (some terminals don't support all combinations)
5. Try using a different key combination

## Default Keybindings File

The default keybindings file is included as `.chitchat-keybindings.json` and serves as a reference for customization.
