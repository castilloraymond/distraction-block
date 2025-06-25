# Chrome Extension MVP - Granular Build Plan

## MVP Scope
A minimal website blocker that can:
- Add websites to block list via popup
- Block access to those websites
- Show a simple blocked page

## Phase 1: Project Setup

### Task 1.1: Create Basic Folder Structure
**Start**: Empty directory
**End**: Folder structure created
```
Create these folders:
- website-blocker/
  - src/
    - background/
    - popup/
    - pages/
    - assets/
      - icons/
```

### Task 1.2: Create Minimal Manifest
**Start**: Empty manifest.json
**End**: Valid manifest.json with minimal permissions
```json
Create manifest.json with:
- manifest_version: 3
- name: "Website Blocker"
- version: "1.0.0"
- description: "Block distracting websites"
```

### Task 1.3: Add Extension Icons
**Start**: No icons
**End**: Three icon files in assets/icons/
```
Create placeholder icons:
- icon-16.png (16x16)
- icon-48.png (48x48)  
- icon-128.png (128x128)
```

### Task 1.4: Update Manifest with Icons
**Start**: Manifest without icons
**End**: Manifest with icon references
```json
Add to manifest.json:
- "icons": {
    "16": "src/assets/icons/icon-16.png",
    "48": "src/assets/icons/icon-48.png",
    "128": "src/assets/icons/icon-128.png"
  }
```

## Phase 2: Background Service Worker

### Task 2.1: Create Empty Background Script
**Start**: No background script
**End**: Empty src/background/index.js file
```
Create src/background/index.js with:
console.log('Background script loaded');
```

### Task 2.2: Register Background Script in Manifest
**Start**: Manifest without background script
**End**: Background script registered
```json
Add to manifest.json:
- "background": {
    "service_worker": "src/background/index.js"
  }
```

### Task 2.3: Add Storage Permission
**Start**: No permissions in manifest
**End**: Storage permission added
```json
Add to manifest.json:
- "permissions": ["storage"]
```

### Task 2.4: Create Storage Module
**Start**: No storage handling
**End**: src/background/storage.js with get/set functions
```javascript
Create storage.js with:
- getBlockedSites() function
- saveBlockedSites(sites) function
- Both using chrome.storage.local
```

### Task 2.5: Add Message Listener to Background
**Start**: Background script without message handling
**End**: Background script listening for messages
```javascript
Add to index.js:
- chrome.runtime.onMessage.addListener
- Handle 'GET_BLOCKED_SITES' action
- Return empty array for now
```

## Phase 3: Popup Interface

### Task 3.1: Create Basic Popup HTML
**Start**: No popup files
**End**: src/popup/popup.html with basic structure
```html
Create popup.html with:
- <!DOCTYPE html>
- Basic head with UTF-8
- Empty body with id="app"
- Width: 300px style
```

### Task 3.2: Register Popup in Manifest
**Start**: Manifest without popup
**End**: Popup registered as action
```json
Add to manifest.json:
- "action": {
    "default_popup": "src/popup/popup.html"
  }
```

### Task 3.3: Create Popup JavaScript File
**Start**: No popup.js
**End**: src/popup/popup.js linked in HTML
```
Create popup.js with:
- console.log('Popup loaded');
Add script tag to popup.html
```

### Task 3.4: Create Popup CSS File
**Start**: No styling
**End**: src/popup/popup.css with basic styles
```css
Create popup.css with:
- body: margin 0, padding 10px, width 300px
- Basic font family
Link in popup.html
```

### Task 3.5: Add Input Field to Popup
**Start**: Empty popup body
**End**: Input field in popup
```html
Add to popup.html body:
- <input type="text" id="website-input" placeholder="example.com">
Style with basic CSS
```

### Task 3.6: Add Block Button to Popup
**Start**: Only input field
**End**: Button next to input
```html
Add to popup.html:
- <button id="add-button">Block</button>
Style with CSS (padding, cursor)
```

### Task 3.7: Add Website List Container
**Start**: Only input and button
**End**: Container for blocked sites list
```html
Add to popup.html:
- <div id="blocked-sites-list"></div>
Add basic styling
```

### Task 3.8: Handle Button Click
**Start**: Button does nothing
**End**: Button logs input value
```javascript
In popup.js:
- Get button element
- Add click listener
- Log input value to console
```

### Task 3.9: Validate Input on Button Click
**Start**: No validation
**End**: Basic URL validation
```javascript
In popup.js:
- Check if input is empty
- Basic pattern check (contains dot)
- Show alert if invalid
```

## Phase 4: Storage Integration

### Task 4.1: Send Add Site Message from Popup
**Start**: Button only validates
**End**: Sends message to background
```javascript
In popup.js:
- chrome.runtime.sendMessage
- Action: 'ADD_SITE'
- Include website in payload
```

### Task 4.2: Handle Add Site in Background
**Start**: Background doesn't handle ADD_SITE
**End**: Background receives and logs site
```javascript
In background/index.js:
- Add case for 'ADD_SITE'
- Log the website
- Send success response
```

### Task 4.3: Import Storage in Background
**Start**: Storage module not imported
**End**: Storage functions available
```javascript
In background/index.js:
- Import getBlockedSites and saveBlockedSites
- Test with console.log
```

### Task 4.4: Save Site to Storage
**Start**: ADD_SITE only logs
**End**: Site saved to storage
```javascript
In ADD_SITE handler:
- Get current sites
- Add new site (as object with url property)
- Save back to storage
```

### Task 4.5: Clear Input After Adding
**Start**: Input keeps value
**End**: Input cleared on success
```javascript
In popup.js:
- In sendMessage callback
- Clear input value if success
```

### Task 4.6: Load Sites on Popup Open
**Start**: List always empty
**End**: Popup requests sites on load
```javascript
In popup.js:
- On DOMContentLoaded
- Send GET_BLOCKED_SITES message
- Log response
```

### Task 4.7: Update GET_BLOCKED_SITES Handler
**Start**: Returns empty array
**End**: Returns actual sites from storage
```javascript
In background/index.js:
- GET_BLOCKED_SITES case
- Call getBlockedSites()
- Return in response
```

### Task 4.8: Display Sites in Popup
**Start**: Sites logged only
**End**: Sites shown as list
```javascript
In popup.js:
- Create renderBlockedSites function
- Create div for each site
- Append to blocked-sites-list
```

### Task 4.9: Style the Sites List
**Start**: Unstyled list
**End**: Styled list items
```css
In popup.css:
- .blocked-site style
- Padding, border, margin
- Hover effect
```

## Phase 5: Basic Blocking with DeclarativeNetRequest

### Task 5.1: Add Permissions for Blocking
**Start**: Only storage permission
**End**: Blocking permissions added
```json
Add to manifest.json:
- "declarativeNetRequest" permission
- "declarativeNetRequestFeedback" permission
- "host_permissions": ["<all_urls>"]
```

### Task 5.2: Create Rules Module
**Start**: No rules handling
**End**: src/background/rules.js exists
```javascript
Create rules.js with:
- Empty generateRules(sites) function
- Export the function
```

### Task 5.3: Generate Basic Rules
**Start**: generateRules returns nothing
**End**: Returns rules array
```javascript
In rules.js generateRules:
- Map sites to rules
- id: index + 1
- urlFilter: site.url
- action: { type: "redirect" }
```

### Task 5.4: Create Blocked Page
**Start**: No blocked page
**End**: src/pages/blocked.html exists
```html
Create blocked.html:
- Basic HTML structure
- <h1>Site Blocked</h1>
- <p>This site is blocked to help you focus</p>
```

### Task 5.5: Add Redirect URL to Rules
**Start**: Rules redirect nowhere
**End**: Rules redirect to blocked page
```javascript
In generateRules:
- Get extension URL: chrome.runtime.getURL()
- redirect.url: blocked.html path
```

### Task 5.6: Import Rules in Background
**Start**: Rules module not used
**End**: Rules module imported
```javascript
In background/index.js:
- Import generateRules
- Log "Rules module loaded"
```

### Task 5.7: Update Rules on Add Site
**Start**: Sites saved but not blocked
**End**: Rules updated after save
```javascript
In ADD_SITE handler after save:
- Generate rules from all sites
- Log rules array
```

### Task 5.8: Apply Rules with Chrome API
**Start**: Rules generated but not applied
**End**: Rules applied to browser
```javascript
After generating rules:
- chrome.declarativeNetRequest.updateDynamicRules
- removeRuleIds: get all existing
- addRules: new rules
```

### Task 5.9: Clear Existing Rules First
**Start**: Rules accumulate
**End**: Old rules cleared
```javascript
Before updateDynamicRules:
- getDynamicRules()
- Extract all current IDs
- Include in removeRuleIds
```

### Task 5.10: Update Rules on Extension Install
**Start**: No rules on fresh install
**End**: Rules loaded from storage on install
```javascript
Add to background/index.js:
- chrome.runtime.onInstalled listener
- Load sites from storage
- Apply rules
```

## Phase 6: Delete Functionality

### Task 6.1: Add Delete Button to Each Site
**Start**: Sites show URL only
**End**: Each site has delete button
```javascript
In renderBlockedSites:
- Add button element
- Text: "X" or "Delete"
- Add to each site div
```

### Task 6.2: Style Delete Button
**Start**: Unstyled delete button
**End**: Styled delete button
```css
In popup.css:
- .delete-button style
- Float right, red color
- Hover effect
```

### Task 6.3: Add Click Handler for Delete
**Start**: Delete button does nothing
**End**: Click logs site URL
```javascript
In renderBlockedSites:
- Add click listener to button
- Log site.url on click
```

### Task 6.4: Send Delete Message
**Start**: Delete only logs
**End**: Sends message to background
```javascript
On delete click:
- sendMessage with DELETE_SITE action
- Include site URL in payload
```

### Task 6.5: Handle Delete in Background
**Start**: No DELETE_SITE handler
**End**: Handler removes from storage
```javascript
In background/index.js:
- Add DELETE_SITE case
- Filter out the site
- Save updated list
```

### Task 6.6: Update Rules After Delete
**Start**: Storage updated but rules remain
**End**: Rules updated after delete
```javascript
In DELETE_SITE handler:
- After saving sites
- Regenerate and apply rules
```

### Task 6.7: Refresh Popup After Delete
**Start**: Popup shows old list
**End**: Popup updates immediately
```javascript
In delete response callback:
- If success, fetch sites again
- Re-render the list
```

## Phase 7: Polish and Testing

### Task 7.1: Add Loading State
**Start**: No feedback during operations
**End**: "Loading..." shown while fetching
```javascript
In popup.js:
- Show "Loading..." in list
- Replace after sites loaded
```

### Task 7.2: Improve URL Formatting
**Start**: Sites require perfect format
**End**: Auto-format URLs
```javascript
In popup validation:
- Remove http:// or https://
- Remove trailing slashes
- Add * for subdomains
```

### Task 7.3: Prevent Duplicate Sites
**Start**: Can add same site multiple times
**End**: Duplicates prevented
```javascript
In ADD_SITE handler:
- Check if site already exists
- Return error if duplicate
```

### Task 7.4: Show Error Messages
**Start**: Errors only in console
**End**: Errors shown in popup
```html
Add to popup:
- <div id="error-message"></div>
- Show/hide based on errors
```

### Task 7.5: Add Site Counter
**Start**: No indication of count
**End**: Shows "Blocking X sites"
```javascript
In popup render:
- Add counter element
- Update with sites.length
```

### Task 7.6: Style Blocked Page
**Start**: Unstyled blocked page
**End**: Centered, styled blocked page
```html
In blocked.html:
- Add CSS for centering
- Better typography
- Extension icon
```

### Task 7.7: Empty State Message
**Start**: Empty list shows nothing
**End**: Shows "No sites blocked yet"
```javascript
In renderBlockedSites:
- Check if sites.length === 0
- Show friendly message
```

### Task 7.8: Add Keyboard Support
**Start**: Must click button
**End**: Enter key adds site
```javascript
In popup.js:
- Add keypress listener to input
- Check for Enter key
- Trigger add function
```

### Task 7.9: Focus Input on Popup Open
**Start**: Must click input
**End**: Input auto-focused
```javascript
In popup.js:
- On DOMContentLoaded
- input.focus()
```

### Task 7.10: Test Full Flow
**Start**: Individual pieces work
**End**: Complete flow verified
```
Manual test:
1. Install extension
2. Add "example.com"
3. Visit example.com
4. Verify redirect
5. Delete site
6. Verify can visit again
```

## Success Criteria for MVP
- [ ] Can add websites to block list via popup
- [ ] Websites in list are blocked when visited  
- [ ] Shows blocked page when accessing blocked site
- [ ] Can view all blocked sites in popup
- [ ] Can delete sites from block list
- [ ] Rules persist across browser restarts