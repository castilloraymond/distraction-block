# Chrome Extension Architecture - Website Blocker

## Project Overview

This Chrome extension helps users block distracting websites by intercepting navigation requests and displaying a block page instead. The extension uses Chrome's declarativeNetRequest API for efficient blocking and provides a user-friendly interface for managing blocked sites.

## Folder Structure

```
website-blocker/
├── manifest.json              # Extension configuration
├── package.json              # NPM dependencies (for development)
├── webpack.config.js         # Build configuration (optional)
├── .gitignore               # Git ignore file
├── README.md                # Project documentation
│
├── src/                     # Source code directory
│   ├── background/          # Background service worker
│   │   ├── index.js        # Main background script
│   │   ├── rules.js        # Blocking rules management
│   │   └── storage.js      # Chrome storage operations
│   │
│   ├── popup/              # Extension popup UI
│   │   ├── popup.html      # Popup HTML structure
│   │   ├── popup.js        # Popup logic
│   │   └── popup.css       # Popup styles
│   │
│   ├── options/            # Options page
│   │   ├── options.html    # Settings page HTML
│   │   ├── options.js      # Settings logic
│   │   └── options.css     # Settings styles
│   │
│   ├── content/            # Content scripts
│   │   ├── blocker.js      # Main content script
│   │   └── blocked.js      # Script for blocked page
│   │
│   ├── pages/              # Static pages
│   │   ├── blocked.html    # Page shown when site is blocked
│   │   └── blocked.css     # Blocked page styles
│   │
│   ├── utils/              # Shared utilities
│   │   ├── constants.js    # App constants
│   │   ├── validators.js   # URL validation
│   │   └── time.js         # Time-based blocking utilities
│   │
│   └── assets/             # Static assets
│       ├── icons/          # Extension icons
│       │   ├── icon-16.png
│       │   ├── icon-48.png
│       │   └── icon-128.png
│       └── images/         # Other images
│
├── dist/                   # Built extension (generated)
└── tests/                  # Unit tests
    ├── background/
    ├── popup/
    └── utils/
```

## Component Descriptions

### 1. **Manifest.json**
The heart of the extension - defines permissions, scripts, and extension metadata.

```json
{
  "manifest_version": 3,
  "name": "Website Blocker",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "declarativeNetRequest",
    "declarativeNetRequestFeedback"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "src/background/index.js"
  },
  "action": {
    "default_popup": "src/popup/popup.html"
  },
  "options_page": "src/options/options.html"
}
```

### 2. **Background Service Worker (src/background/)**

#### `index.js`
- Manages the extension's lifecycle
- Handles messages from popup and content scripts
- Coordinates blocking rule updates
- Manages scheduled blocking (time-based)

#### `rules.js`
- Creates and updates declarativeNetRequest rules
- Converts user-defined blocked sites to Chrome rules
- Handles dynamic rule updates

#### `storage.js`
- Wrapper around Chrome storage API
- Manages persistent data (blocked sites, settings)
- Provides data migration utilities

### 3. **Popup Interface (src/popup/)**

#### `popup.html/js/css`
- Quick toggle to enable/disable blocking
- Add new site to block list
- View recently blocked sites
- Quick access to options

### 4. **Options Page (src/options/)**

#### `options.html/js/css`
- Comprehensive blocked sites management
- Import/export blocked sites
- Schedule-based blocking configuration
- Whitelist management
- Block page customization

### 5. **Content Scripts (src/content/)**

#### `blocker.js`
- Injected into web pages
- Handles dynamic content blocking
- Communicates with background script

#### `blocked.js`
- Runs on the blocked page
- Handles "unblock temporarily" functionality
- Shows blocking statistics

### 6. **Static Pages (src/pages/)**

#### `blocked.html`
- Displayed when a site is blocked
- Shows reason for blocking
- Provides temporary unblock option
- Motivational quotes/productivity tips

### 7. **Utilities (src/utils/)**

#### `constants.js`
```javascript
export const STORAGE_KEYS = {
  BLOCKED_SITES: 'blockedSites',
  SETTINGS: 'settings',
  STATISTICS: 'statistics'
};

export const DEFAULT_SETTINGS = {
  enabled: true,
  showNotifications: true,
  blockSubdomains: true
};
```

#### `validators.js`
- URL pattern validation
- Domain extraction
- Wildcard pattern support

#### `time.js`
- Schedule parsing
- Time-based blocking logic
- Timezone handling

## State Management

### Storage Architecture

The extension uses Chrome's storage API with the following structure:

```javascript
{
  // Chrome Storage Local
  blockedSites: [
    {
      id: 'unique-id',
      pattern: '*.facebook.com/*',
      enabled: true,
      createdAt: timestamp,
      schedule: {
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        startTime: '09:00',
        endTime: '17:00'
      }
    }
  ],
  
  settings: {
    enabled: true,
    showNotifications: true,
    blockSubdomains: true,
    redirectUrl: 'blocked.html',
    motivationalQuotes: true
  },
  
  statistics: {
    totalBlocked: 156,
    sitesBlocked: {
      'facebook.com': 45,
      'twitter.com': 38
    },
    lastReset: timestamp
  },
  
  temporaryUnblocks: [
    {
      site: 'facebook.com',
      until: timestamp
    }
  ]
}
```

### State Flow

1. **User adds a blocked site via popup/options**
   - UI component sends message to background script
   - Background script updates storage
   - Background script updates declarativeNetRequest rules
   - All UI components receive storage change event

2. **Website blocking occurs**
   - Browser intercepts request via declarativeNetRequest
   - Redirects to blocked page
   - Blocked page loads and queries current state
   - Statistics are updated in background

3. **Temporary unblock requested**
   - Blocked page sends message to background
   - Background adds temporary exception
   - Rules are updated to exclude the site temporarily
   - Timer is set to re-enable blocking

## Communication Patterns

### Message Passing Structure

```javascript
// Message format
{
  action: 'ADD_BLOCKED_SITE',
  payload: {
    pattern: '*.example.com/*'
  }
}

// Response format
{
  success: true,
  data: { /* response data */ },
  error: null
}
```

### Communication Channels

1. **Popup ↔ Background**
   ```javascript
   // In popup.js
   chrome.runtime.sendMessage({
     action: 'GET_BLOCKED_SITES'
   }, response => {
     updateUI(response.data);
   });
   ```

2. **Options ↔ Background**
   ```javascript
   // In options.js
   chrome.storage.onChanged.addListener((changes, area) => {
     if (area === 'local' && changes.blockedSites) {
       refreshBlockedSitesList(changes.blockedSites.newValue);
     }
   });
   ```

3. **Content Script ↔ Background**
   ```javascript
   // In content script
   chrome.runtime.sendMessage({
     action: 'CHECK_IF_BLOCKED',
     payload: { url: window.location.href }
   });
   ```

## Service Connections

### Background Service Worker as Central Hub

The background service worker acts as the central coordinator:

1. **Storage Service**: All storage operations go through background
2. **Rules Engine**: Updates blocking rules based on state changes
3. **Message Router**: Routes messages between components
4. **Timer Service**: Manages scheduled blocking and temporary unblocks
5. **Statistics Collector**: Aggregates blocking statistics

### Event-Driven Architecture

```javascript
// Example event flow in background/index.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'ADD_BLOCKED_SITE':
      handleAddBlockedSite(request.payload)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response
      
    case 'TEMPORARY_UNBLOCK':
      handleTemporaryUnblock(request.payload)
        .then(result => sendResponse({ success: true, data: result }));
      return true;
  }
});
```

## Development Workflow

### Build Process (Optional)

If using webpack for development:

```javascript
// webpack.config.js
module.exports = {
  entry: {
    background: './src/background/index.js',
    popup: './src/popup/popup.js',
    options: './src/options/options.js',
    content: './src/content/blocker.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  }
};
```

### Testing Strategy

1. **Unit Tests**: Test utilities and pure functions
2. **Integration Tests**: Test message passing and storage
3. **E2E Tests**: Test full blocking flow using Puppeteer

## Best Practices

1. **Performance**
   - Use declarativeNetRequest for efficient blocking
   - Minimize content script injection
   - Cache frequently accessed data

2. **Security**
   - Validate all URL patterns
   - Sanitize user inputs
   - Use content security policy

3. **User Experience**
   - Provide clear feedback on actions
   - Make temporary unblock easy
   - Show productivity statistics

4. **Maintainability**
   - Keep components loosely coupled
   - Use consistent message formats
   - Document storage schema changes

## Future Enhancements

1. **Sync Storage**: Sync blocked sites across devices
2. **Categories**: Pre-defined categories (social media, news, etc.)
3. **Focus Sessions**: Pomodoro-style blocking sessions
4. **Analytics Dashboard**: Detailed productivity analytics
5. **Password Protection**: Require password to unblock
6. **API Integration**: Sync with productivity apps