# Social Media Research Assistant - Browser Extension

A Chrome/Edge extension that captures webpage content and integrates with your social media research backend for AI-powered content analysis.

## 🎯 Features

- **Full Page Capture**: Extract complete HTML content from any webpage
- **Element Selection**: Interactive DOM picker with visual highlighting
- **Visual Preview**: SnapDOM-powered element preview before submission
- **Project Integration**: Seamless connection to your research backend
- **Real-time Processing**: Monitor task status and processing progress
- **Cross-browser Support**: Works on both Chrome and Edge

## 🚀 Quick Start

### 1. Installation

#### Load as Unpacked Extension (Development)
1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension/` folder
4. The extension icon should appear in your toolbar

#### Extension Store (Coming Soon)
- Will be available on Chrome Web Store once finalized

### 2. Start Mock Server (For Testing)

```bash
# Navigate to mock server directory
cd extension/mock-server

# Install dependencies
npm install

# Start server
npm start
```

The mock server will run on `http://localhost:3001`

### 3. Get Your Project Key

For testing with mock server, use this project key:
```
aHR0cDovL2xvY2FsaG9zdDozMDAxfHRlc3QtcHJvamVjdC0xfG1vY2stdG9rZW4tMTIz
```

For production, your backend will generate project keys in the format:
```
base64(backend_url|project_id|session_token)
```

### 4. Connect Extension

1. Click the extension icon in your toolbar
2. The side panel will open automatically
3. Paste your project key in the configuration section
4. Click "Connect"
5. Status should change to "Connected" with green indicator

### 5. Capture Content

#### Full Page Capture
1. Navigate to any webpage (e.g., social media post)
2. In the side panel, click "Capture Full Page"
3. The entire page HTML will be extracted and sent to your backend
4. Check the activity log for processing status

#### Element Selection
1. Navigate to the target webpage
2. Click "Start Element Selection" in the side panel
3. Move your mouse over page elements (they'll highlight in blue)
4. Click on the element you want to capture
5. Preview the selected element in the side panel
6. Click "Submit to Backend" to process

## 🏗️ Architecture

### Extension Components

```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (API communication)
├── content-script.js      # DOM interaction & element selection
├── sidepanel/
│   ├── sidepanel.html    # Main UI
│   ├── sidepanel.js      # UI logic
│   └── sidepanel.css     # Styling
├── popup/                # Minimal launcher popup
├── lib/
│   └── snapdom.js       # Element preview generation
└── mock-server/         # Testing backend
```

### Communication Flow

1. **User Action** → Side Panel UI
2. **Side Panel** → Background Script (via `chrome.runtime.sendMessage`)
3. **Background Script** → Content Script (for DOM operations)
4. **Background Script** → Your Backend API (HTTP requests)
5. **Results** → Side Panel → User Feedback

### Data Flow

```
Page HTML → Extension → Your Backend → AI Processing → Structured Data
```

## 🔧 Configuration

### Project Key Format

Project keys are base64-encoded strings containing:
```
backend_url|project_id|session_token
```

Example:
- Raw: `https://api.example.com|proj-123|token-456`
- Encoded: `aHR0cHM6Ly9hcGkuZXhhbXBsZS5jb218cHJvai0xMjN8dG9rZW4tNDU2`

### Backend API Endpoints

Your backend must implement these endpoints:

- `GET /projects` - List available projects
- `POST /tasks` - Submit HTML content for processing
- `GET /tasks/{project_id}` - Get project tasks
- `GET /projects/{project_id}/stats` - Project statistics

### Request Format

```json
{
  "project_id": "your-project-id",
  "html": "<html>...</html>",
  "url": "https://example.com/page" // optional
}
```

## 🧪 Testing

### Mock Server Testing

1. Start mock server: `cd extension/mock-server && npm start`
2. Use test project key provided in server output
3. Test both full page and element capture modes
4. Check server logs for request processing

### Real Backend Testing

1. Set up your FastAPI backend (see main project documentation)
2. Generate a real project key from your frontend
3. Update extension configuration
4. Test with actual social media content

### Development Testing

1. Load extension in developer mode
2. Open browser DevTools (F12)
3. Check "Extensions" tab for extension console logs
4. Monitor network requests in "Network" tab
5. Use side panel activity log for user-facing feedback

## 🎨 User Interface

### Side Panel Layout

```
┌─────────────────────────────┐
│ 🔍 Research Assistant      │ ← Header with status
├─────────────────────────────┤
│ Project Configuration       │ ← Connection setup
│ [Project Key Input]         │
│ [Connect Button]            │
├─────────────────────────────┤
│ Content Capture             │ ← Main actions
│ [📄 Capture Full Page]      │
│ [🎯 Start Element Selection]│
├─────────────────────────────┤
│ Content Preview             │ ← Preview area
│ [Element Info & Image]      │
│ [Submit to Backend]         │
├─────────────────────────────┤
│ Activity Log                │ ← Status updates
│ • Connected successfully    │
│ • Element selected: div     │
│ • Content submitted (ID)    │
└─────────────────────────────┘
```

### Visual Feedback

- 🟢 **Connected**: Green status dot, backend info visible
- 🔴 **Disconnected**: Red status dot, connection form only
- 🔵 **Element Highlighting**: Blue border on hover during selection
- 📸 **Preview Images**: Visual representation of selected elements
- ⏳ **Loading States**: Spinner overlay during processing

## 🛠️ Development

### Setup Development Environment

```bash
# Clone the repository
git clone <your-repo>
cd extension/

# For mock server
cd mock-server/
npm install

# Load extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select extension/ folder
```

### File Modifications

After making changes to extension files:
1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension
3. Reload any open tabs using the extension
4. Check for errors in extension popup

### Debugging

- **Background Script**: Check extension service worker logs
- **Content Script**: Check webpage console logs  
- **Side Panel**: Check side panel console logs
- **Network**: Monitor requests in DevTools Network tab

### Building for Production

1. Ensure all placeholder icons are replaced with production assets
2. Update version in `manifest.json`
3. Test with real backend endpoints
4. Create extension package:
   ```bash
   # Zip the extension directory (excluding mock-server and .git)
   zip -r extension.zip extension/ -x "extension/mock-server/*" "extension/.git/*"
   ```

## 🚀 Deployment

### Chrome Web Store

1. Create Chrome Web Store developer account
2. Prepare store assets (screenshots, descriptions)
3. Upload extension package
4. Complete store listing
5. Submit for review

### Enterprise Distribution

For internal use, you can:
1. Package as `.crx` file
2. Distribute via group policy
3. Host on internal extension store

## 🐛 Troubleshooting

### Common Issues

**Extension doesn't load:**
- Check manifest.json syntax
- Verify all file paths exist
- Check browser console for errors

**Side panel doesn't open:**
- Ensure Chrome/Edge supports side panel API
- Try reloading extension
- Check extension permissions

**Connection fails:**
- Verify project key format (base64)
- Check backend server is running
- Monitor network requests for errors
- Verify CORS settings on backend

**Element selection doesn't work:**
- Check content script injection
- Verify page permissions
- Try refreshing the page

**Preview images don't generate:**
- Check SnapDOM library loading
- Verify web_accessible_resources in manifest
- Monitor console for errors

### Debug Commands

```javascript
// In extension console
chrome.storage.local.get().then(console.log); // Check stored data
chrome.runtime.sendMessage({type: 'GET_CONFIG'}); // Check config
```

## 📝 API Reference

### Chrome Extension APIs Used

- `chrome.runtime` - Message passing and extension lifecycle
- `chrome.storage` - Persistent configuration storage
- `chrome.tabs` - Active tab information
- `chrome.scripting` - Content script injection
- `chrome.sidePanel` - Side panel management

### Custom Message Types

```javascript
// Background ↔ Side Panel
{type: 'SET_PROJECT_KEY', projectKey: 'base64string'}
{type: 'GET_CONFIG'}
{type: 'SUBMIT_HTML', html: 'htmlstring', url: 'pageurl'}
{type: 'CAPTURE_FULL_PAGE'}

// Content Script ↔ Side Panel
{type: 'START_SELECTION'}
{type: 'STOP_SELECTION'}
{type: 'ELEMENT_SELECTED', element: {...}, url: 'pageurl'}
```

## 📄 License

This extension is part of the Social Media Research Assistant project. See main project license for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly with mock server
5. Submit pull request

## 📧 Support

For issues and questions:
- Check troubleshooting section above
- Review browser extension documentation
- Contact project maintainers