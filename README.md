# bruno-extension-copy-network-logs-and-response

This extension adds a "Copy" button to Bruno that copies network logs and response body to the clipboard with one click.

[demp.mp4](https://github.com/user-attachments/assets/9673247b-dde4-417e-bacc-240e735be0a6)

## Features

- Copy network logs and response body to clipboard in bulk
- No need to click the Timeline tab — just press Copy after a response arrives
- Automatic masking of sensitive information (Cookie, Authorization Bearer, access tokens, etc.)

## Installation

**Note: This extension is unofficial and uses a forceful implementation. Use at your own risk.**

### Option A: Build Bruno with userscript support (recommended)

Build a customized Bruno (v3.0.2) that automatically loads userscripts on startup.

#### Prerequisites

- Node.js v22.12.0
- git, npm

#### Steps

```bash
./build-bruno-with-userscripts.sh
```

This script will:

1. Clone Bruno v3.0.2
2. Apply `bruno-v3.0.2-userscript-feature.patch` to add userscript support
3. Copy `src.js` to the userscripts directory (`~/Library/Application Support/bruno/userscripts/`)
4. Build the Electron app

The built app is output to `bruno-userscript-build/packages/bruno-electron/out/`.

With this approach, the userscript is loaded automatically every time Bruno starts — no manual steps required.

### Option B: Paste into DevTools console (no build required)

If you don't mind running the script manually each time you launch Bruno, you can use `src.js` with the official Bruno app:

1. Launch Bruno (official version)
2. Open Developer Tools
   - Windows/Linux: `F12` or `Ctrl+Shift+I`
   - Mac: `Cmd+Option+I`
3. Select the Console tab
4. Copy the contents of `src.js` and paste it into the console
5. Press Enter to execute

> This needs to be done every time you launch Bruno.

## Usage

1. A "Copy" button will appear near the "Dev Tools" text on the Bruno screen
2. Execute an API request
3. Click the "Copy" button — the network logs and response are copied to the clipboard

## Copied Content

- **Network Logs**: Request details (URL, headers, parameters, etc.)
- **Response Body**: Response data from the API
- **Timestamp**: Execution time (formatted)

## Security Features

The following sensitive information is automatically masked:

- Cookie
- Authorization Bearer tokens
- access_token
- refresh_token
- client_secret

## Configuration

You can modify the following settings in the Config object within `src.js`:

```javascript
const Config = {
  includeApplicationMessage: false,       // Whether to include application messages
  includeConnectionProcessDetails: false, // Whether to include connection process details
  waitTimeForInitialization: 500,         // Initialization wait time (milliseconds)
  buttonPosition: "Dev Tools",            // Reference text for button placement
  buttonText: "Copy",                     // Copy Button text
  maskingLogFieldRegex: /([Cc]ookie:|[Aa]uthorization: Bearer|access_token|refresh_token|client_secret)(.*)/g
};
```

## Files

| File | Description |
|------|-------------|
| `src.js` | Userscript (for build with userscript support) |
| `src-consolepaste-version.js` | Userscript (for pasting into DevTools console) |
| `build-bruno-with-userscripts.sh` | Build automation script |
| `bruno-v3.0.2-userscript-feature.patch` | Patch that adds userscript loading to Bruno v3.0.2 |

## Notes

- This extension is unofficial and may stop working due to Bruno updates
- When handling logs containing sensitive information, don't rely solely on the masking feature and verify the content before sharing

## License

This project is released under the MIT License.
