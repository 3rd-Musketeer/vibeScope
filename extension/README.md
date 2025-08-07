# vibeScope - Chrome Extension

Modern, lightweight Chrome extension for seamless HTML content capture from web pages. Features a clean UI with popup-based project key validation and sidepanel capture interface.

## ✨ Features

- **🔑 Project Key Validation**: Secure authentication with auto-validation
- **📄 Full Page Capture**: Complete HTML extraction with one click  
- **🎯 Element Selection**: Interactive DOM element targeting with highlighting
- **🚀 Modern UX**: Clean 2-step flow (popup → sidepanel)
- **⚡ High Performance**: Optimized DOM operations and memory usage
- **🎨 Flat Design**: Modern CSS with utility-based styling

## 🏗️ Architecture

### Core Files
```
extension/
├── manifest.json          # Chrome Extensions API v3 config
├── background.js          # Minimal service worker (85 lines)
├── content-script.js      # Optimized DOM interaction
├── extension.css          # Unified design system (150 lines)
├── popup/
│   ├── popup.html        # Key validation interface
│   └── popup.js          # Auto-validation logic
├── sidepanel/
│   ├── sidepanel.html    # Capture-focused interface  
│   └── sidepanel.js      # Radio selection + preview
└── icons/               # SVG icons only
```

### Modern Design System
- **CSS Variables**: Consistent colors, spacing, typography
- **Utility Classes**: Tailwind-inspired utilities without build process
- **4px Grid System**: Perfect alignment and spacing
- **Flat UI**: Removed gradients, animations, visual noise

## 🚀 Installation

1. **Load Extension**:
   ```bash
   # Open Chrome → Extensions → Developer mode → Load unpacked
   # Select the extension/ folder
   ```

2. **Get Project Key**:
   - Obtain base64-encoded key: `backend_url|project_id|session_token`
   - Example: `aHR0cDovL2xvY2FsaG9zdDo4MDAwfHByb2plY3QtMXx0b2tlbi0xMjM=`

## 📖 Usage

### Simple 2-Step Flow

1. **Popup (Key Entry)**:
   - Click extension icon
   - Paste project key
   - Auto-validation with backend
   - "Start Scraping" button enabled when connected

2. **Sidepanel (Capture)**:
   - Choose: Full Page or Element Selection
   - Click capture button
   - Review preview with metadata
   - Submit to server

### Key Features

- **Auto-validation**: Real-time key validation on paste/input
- **Visual feedback**: Connection status with color indicators  
- **Inline preview**: Content size, title, URL display
- **Error handling**: Clear error messages and recovery

## 🛠️ Technical Details

### Performance Optimizations
- **Event throttling**: 60fps element highlighting with `requestAnimationFrame`
- **Memory management**: Proper cleanup and resource disposal
- **DOM efficiency**: Batched style updates, minimal reflows
- **Size limits**: HTML content truncation for large elements

### Modern Standards
- **Manifest V3**: Latest Chrome Extensions API
- **ES2020+**: Modern JavaScript features
- **Event delegation**: Single listeners instead of individual bindings
- **CSS Variables**: Dynamic theming without Sass/Less

### Security
- **CSP compliant**: No unsafe inline scripts
- **Minimal permissions**: Only required browser APIs
- **HTTPS only**: Secure backend communication
- **Input validation**: Comprehensive key format validation

## 📊 Code Reduction Results

Simplified from complex multi-file architecture to clean, focused implementation:

- **Total lines**: ~1000 → ~450 (55% reduction)
- **CSS**: 450 → 150 lines (67% reduction) 
- **Files**: 22 → 8 core files
- **Dependencies**: Zero external libraries

## 🎯 Browser Support

- ✅ **Chrome**: Full support (Manifest V3)
- ✅ **Edge**: Full support (Chromium-based)

## 🔧 Development

No build process required - works immediately:
```bash
# Load extension in Chrome
# Make changes to files
# Reload extension in chrome://extensions/
```

Perfect for rapid development and testing.