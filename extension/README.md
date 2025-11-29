# SatyaTrail Chrome Extension

AI-powered news verification extension that instantly fact-checks any webpage using GPT-5 and real-time evidence gathering.

## Features

- 🔍 **Full Page Verification** - Analyze entire webpages for misinformation
- ⚡ **Quick Check** - Verify selected text instantly
- 📊 **Detailed Results** - Claim-by-claim verdicts with evidence
- 🎯 **Confidence Scores** - Know how reliable the verification is
- ✏️ **Suggested Corrections** - Get accurate information when misinformation is detected
- 🔗 **Evidence Sources** - View supporting evidence from trusted sources

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension` folder from this project
5. The SatyaTrail icon should appear in your toolbar

### Icons Setup

Before loading the extension, you need to create icon files. You can:

**Option 1: Use placeholder icons**
```bash
# From the extension folder
# Create simple colored square icons (requires ImageMagick)
convert -size 16x16 xc:#6366f1 icons/icon16.png
convert -size 32x32 xc:#6366f1 icons/icon32.png
convert -size 48x48 xc:#6366f1 icons/icon48.png
convert -size 128x128 xc:#6366f1 icons/icon128.png
```

**Option 2: Create your own icons**
Place PNG files of sizes 16x16, 32x32, 48x48, and 128x128 in the `icons` folder.

## Usage

### Verify a Page

1. Navigate to any news article or webpage
2. Click the SatyaTrail icon in your toolbar
3. Click **"Verify This Page"**
4. Wait for the AI analysis (typically 10-30 seconds)
5. Review the verdict, claims, and evidence

### Quick Check (Selected Text)

1. Select any text on a webpage
2. Right-click and choose **"Verify with SatyaTrail"**
   OR
3. Click the extension icon and click **"Quick Check (Selected Text)"**

### Context Menu

Right-click on any page to access:
- **Verify with SatyaTrail** (when text is selected)
- **Verify this page**

## Configuration

Click the ⚙️ settings icon in the extension popup to configure:

- **API Server URL** - Backend server address (default: `https://satyatrail.onrender.com`)
- **Auto-verify news sites** - Automatically verify when visiting news sites
- **Show notifications** - Enable/disable desktop notifications

## Backend Requirements

The extension requires the SatyaTrail backend server running. Make sure:

1. The backend is running at the configured URL
2. Environment variables are set (`OPENAI_API_KEY`, `TAVILY_API_KEY`)
3. The server is accessible from your browser

```bash
# Start the backend
cd backend
npm run dev
```

## API Endpoints Used

The extension communicates with these backend endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/verify/extension/analyze` | POST | Full page analysis |
| `/api/v1/verify/extension/quick` | POST | Quick text verification |
| `/api/v1/verify/extension/status` | GET | Health check |

## Permissions

The extension requires these Chrome permissions:

- `activeTab` - Access current tab content
- `scripting` - Execute scripts to extract page content
- `storage` - Save settings and results
- `contextMenus` - Right-click menu integration
- `notifications` - Show verification results

## Troubleshooting

### Extension not working

1. Check if the backend server is running
2. Verify the API URL in settings
3. Check the browser console for errors (right-click extension icon → Inspect popup)

### Verification fails

1. Ensure you have valid API keys in the backend `.env`
2. Check the backend logs for errors
3. Try with a simpler webpage first

### Icons not showing

Make sure icon files exist in the `icons` folder with correct sizes (16, 32, 48, 128 px)

## Development

### File Structure

```
extension/
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic
├── content.js         # Content script (runs on pages)
├── background.js      # Service worker
├── icons/             # Extension icons
└── README.md          # This file
```

### Making Changes

1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the SatyaTrail extension
4. Changes will be applied immediately

## License

Part of the SatyaTrail project.

