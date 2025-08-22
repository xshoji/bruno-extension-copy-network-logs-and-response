# bruno-extension-copy-network-logs-and-response

This extension allows you to easily copy Bruno's network logs and responses to the clipboard.

[demp.mp4](https://github.com/user-attachments/assets/916f0950-a339-42c0-8153-94ad5d11c21e)



## Features

- Copy network logs and response body to clipboard in bulk
- Automatic masking of sensitive information (Cookie, Authorization Bearer, access tokens, etc.)
- One-click data collection and copying

## Installation

**Note: This extension is unofficial and uses a forceful implementation. Use at your own risk.**

1. Launch Bruno
2. Open Developer Tools
   - Windows/Linux: `F12` or `Ctrl+Shift+I`
   - Mac: `Cmd+Option+I`
3. Select the Console tab
4. Copy the contents of the `src.js` file and paste it into the console
5. Press Enter to execute

## Usage

1. After installing the extension, wait 500 ms (initialization time)
2. A "Copy" button will appear near the "Safe Mode" text on the Bruno screen
3. After executing an API request, open the "Timeline" tab in the right pane
4. Click on the Timeline you want to copy from the history list to display its details
5. Click the "Copy" button
6. Network logs and responses will be copied to the clipboard

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

You can modify the following settings in the Config object within the `src.js` file:

```javascript
const Config = {
  waitTimeForInitialization: 500,  // Initialization wait time (milliseconds)
  buttonPosition: "Safe Mode",      // Reference text for button placement
  buttonText: "Copy",               // Button text
  maskingLogFiledRegex: /([Cc]ookie:|[Aa]uthorization: Bearer|access_token|refresh_token|client_secret)(.*)/g  // Regular expression for masking targets
};
```

## Notes

- This extension is unofficial and may stop working due to Bruno updates
- When handling logs containing sensitive information, don't rely solely on the masking feature and verify the content before sharing
- You need to re-execute the extension every time you reload the page

## License

This project is released under the MIT License.
