# Website Blocker - Distraction Block Chrome Extension

A powerful Chrome extension designed to help you stay focused and productive by blocking distracting websites with advanced features including focus timers, audio mode for YouTube, and flexible site management.

## 🌟 Features

### 🛡️ Smart Website Blocking
- Block any website instantly with simple URL input
- Individual site management with easy add/remove functionality
- Temporary whitelist system for specific pages

### ⏰ Focus Timer Sessions
- Create custom site lists for different focus scenarios
- Set timed blocking sessions (hours and minutes)
- Visual timer display with countdown and progress indicator
- Extension badge shows active timer status

### 🎵 YouTube Audio Mode
- Special audio-only mode for YouTube (music/podcasts)
- Hides visual content while preserving audio controls
- Keyboard shortcuts for media control (Space, ←, →)
- Temporary disable option (1 minute)

### 📋 Site List Management
- Create multiple themed lists (e.g., "Social Media", "News Sites")
- Bulk site management within lists
- Audio mode toggle per list
- Allowed pages system for exceptions

### 🎯 Allowed Pages System
- Whitelist specific pages/URLs within blocked sites
- Pattern-based matching for flexible rules
- Per-site and per-list configurations

## 🚀 Installation

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/distraction-block.git
   cd distraction-block
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the `website-blocker` folder

5. The extension icon will appear in your toolbar

### From Chrome Web Store
*Coming soon - extension will be published to Chrome Web Store*

## 📖 How to Use

### Basic Site Blocking
1. Click the extension icon in your toolbar
2. Enter a website URL (e.g., `facebook.com`)
3. Optionally enable "Audio Mode" for YouTube sites
4. Click "Block" to add the site

### Focus Timer Sessions
1. Create a site list by clicking "Create New List"
2. Add sites to your list using the input field
3. Set your desired focus duration (hours and minutes)
4. Select your site list and click "Start Focus Session"
5. The timer badge will appear on the extension icon

### Audio Mode (YouTube Only)
1. Add `youtube.com` with "Audio Mode" enabled, or
2. Add YouTube to a site list with audio mode enabled
3. When visiting YouTube, you'll see an audio-only overlay
4. Use keyboard shortcuts or the temporary disable button

### Managing Allowed Pages
1. Click "Allow Pages" next to any blocked site
2. Add URL patterns for pages you want to access
3. Examples: `/watch?v=abc123`, `/channel/UCexample`

## ⚙️ Configuration

### Site Lists
- **Regular Lists**: Block sites completely during timer sessions
- **Audio Mode Lists**: YouTube shows audio overlay, others blocked normally
- **Allowed Pages**: Specific URLs that remain accessible

### Timer Settings
- Duration: 1 minute to 23 hours 59 minutes
- Visual countdown with progress ring
- End session early option available

### Audio Mode Settings
- Only works on YouTube domains (`youtube.com`, `www.youtube.com`)
- Preserves audio/video playback functionality
- Temporary disable: 1-minute access to full site

## 🛠️ Technical Details

### Architecture
- **Manifest V3** Chrome extension
- **Service Worker** background script for rule management
- **Content Scripts** for audio mode overlay
- **Declarative Net Request** API for efficient blocking

### Files Structure
```
website-blocker/
├── manifest.json              # Extension configuration
├── src/
│   ├── background/
│   │   └── background.js      # Service worker & rule management
│   ├── content/
│   │   └── audio-mode.js      # Audio mode overlay logic
│   ├── popup/
│   │   ├── popup.html         # Extension popup interface
│   │   ├── popup.js           # Popup functionality
│   │   └── popup.css          # Styling
│   ├── pages/
│   │   └── blocked.html       # Block page shown for blocked sites
│   └── assets/
│       └── icons/             # Extension icons
```

### Permissions
- `storage`: Save blocked sites and preferences
- `declarativeNetRequest`: Block websites efficiently
- `host_permissions`: Apply blocking rules to all websites

## 🔧 Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of JavaScript, HTML, CSS
- Chrome Extensions development familiarity

### Setup Development Environment
1. Clone the repository
2. Make changes to files in the `website-blocker/src/` directory
3. Go to `chrome://extensions/` and click the refresh icon on the extension
4. Test your changes

### Key Components

#### Background Script (`background.js`)
- Manages blocking rules using Declarative Net Request API
- Handles timer functionality and storage
- Processes messages from popup and content scripts

#### Popup Interface (`popup.js`, `popup.html`, `popup.css`)
- Main user interface for managing sites and timers
- Real-time timer display with visual progress
- Site list management and configuration

#### Content Script (`audio-mode.js`)
- Injects audio mode overlay on YouTube sites
- Handles temporary disable functionality
- Provides keyboard shortcuts for media control

## 🐛 Troubleshooting

### Extension Not Working
1. Check if extension is enabled in `chrome://extensions/`
2. Try disabling and re-enabling the extension
3. Reload the extension after any updates

### Sites Not Being Blocked
1. Verify the site is in your blocked list
2. Check if there's an active timer that might affect blocking
3. Ensure you're using the correct URL format (without `http://` or `https://`)

### Timer Not Starting
1. Ensure you have created at least one site list
2. Check that the selected site list contains websites
3. Verify the timer duration is set correctly

### Audio Mode Not Working
1. Audio mode only works on YouTube (`youtube.com`)
2. Check if the site has audio mode enabled in settings
3. Try refreshing the YouTube page

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines
1. Follow existing code style and structure
2. Test thoroughly across different scenarios
3. Update documentation for new features
4. Ensure compatibility with Chrome's latest APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern Chrome Extensions Manifest V3 API
- Uses Declarative Net Request for efficient website blocking
- Designed with user experience and productivity in mind

---

**Stay focused, stay productive!** 🎯

*For support or feature requests, please open an issue on GitHub.*