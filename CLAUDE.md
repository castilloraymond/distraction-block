# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Extension (Manifest V3) for blocking distracting websites with focus timer sessions, YouTube audio-only mode, scheduled blocking, and site list management.

## Development

This is a vanilla JavaScript Chrome extension with no build system or package manager.

### Loading the Extension
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `website-blocker` folder
4. After code changes, click the refresh icon on the extension card

### Testing Changes
- Reload extension after modifying `background.js` or `manifest.json`
- Refresh the popup by closing and reopening it
- For content script changes, refresh the target page

## Architecture

### Three-Tier Message-Based Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Popup UI       │◄───►│  Background Service  │◄───►│ Content Scripts │
│  (popup.js)     │     │  Worker (background  │     │ (audio-mode.js) │
│                 │     │  .js)                │     │ (blocked.js)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Chrome APIs         │
                    │  - storage.local     │
                    │  - storage.session   │
                    │  - declarativeNetReq │
                    │  - alarms            │
                    └──────────────────────┘
```

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `website-blocker/src/background/background.js` | Service worker: rule management, storage, timers, message routing | ~1,260 |
| `website-blocker/src/popup/popup.js` | Popup UI: site management, timer display, list configuration | ~1,055 |
| `website-blocker/src/content/audio-mode.js` | YouTube audio overlay injection and controls | ~280 |
| `website-blocker/src/pages/blocked.js` | Block page interactions and temporary whitelist | ~110 |

### Rule ID Ranges
- `1000-49999`: Individual blocked sites
- `50000-99999`: Timer-based site list blocking

### Storage Schema

```javascript
// chrome.storage.local
{
  blockedSites: [{ id, url, audioMode, allowedPages[], ruleId }],
  siteLists: [{ id, name, sites[], audioMode, allowedPages[], schedule }],
  activeTimer: { id, siteListId, startTime, duration, isActive }
}

// chrome.storage.session
{
  temporaryWhitelist: { [url]: expirationTime }
}
```

### Message Passing

All cross-script communication uses `chrome.runtime.sendMessage` with action-based routing:
- `GET_BLOCKED_SITES`, `ADD_BLOCKED_SITE`, `REMOVE_BLOCKED_SITE`
- `START_TIMER`, `STOP_TIMER`, `GET_TIMER_STATE`
- `ADD_TO_TEMPORARY_WHITELIST`, `CHECK_TEMPORARY_WHITELIST`

## Workflow Rules

### Standard Task Workflow
1. Write plan to `task/todo-<date in yyyymmdd>.md` with checkable items
2. Check in for plan verification before starting work
3. Work through items, marking complete as you go
4. Add review section with summary of changes

### Coding Protocol
- Write minimum code required for the task
- No sweeping or unrelated edits
- Don't break existing functionality
- If user action required (e.g., config changes), state clearly
