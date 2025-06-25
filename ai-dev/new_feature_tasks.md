# New Feature Tasks - Site Lists & Timer Functionality

## Feature Overview
Add the ability to create lists of blocked sites and implement timer-based blocking with visual progress tracking.

## Phase 1: Site List Management

### Task 1.1: Create Site List Data Structure
**Start**: Current storage only has individual blocked sites
**End**: Storage structure supports site lists
```javascript
Extend storage.js to support:
{
  siteLists: [
    {
      id: 'unique-id',
      name: 'Focus Mode',
      sites: ['facebook.com', 'twitter.com'],
      audioMode: true,
      allowedPages: ['facebook.com/messages']
    }
  ]
}
```

### Task 1.2: Add Site List Functions to Storage Module
**Start**: Storage only has individual site functions
**End**: Storage has site list CRUD functions
```javascript
Add to storage.js:
- getSiteLists()
- saveSiteList(list)
- deleteSiteList(id)
- updateSiteList(id, updates)
```

### Task 1.3: Create Site List UI Container
**Start**: Popup only shows individual sites
**End**: Popup has dedicated area for site lists
```html
Add to popup.html:
- <div id="site-lists-section">
- <h3>Site Lists</h3>
- <div id="site-lists-container"></div>
- <button id="create-list-btn">Create New List</button>
```

### Task 1.4: Display Existing Site Lists
**Start**: Empty site lists container
**End**: Shows existing site lists with names
```javascript
In popup.js:
- Load site lists from storage
- Render each list with name
- Add basic CSS styling for list items
```

### Task 1.5: Add Create New List Modal
**Start**: Create button does nothing
**End**: Opens modal for new list creation
```html
Create modal in popup.html:
- Overlay div with form
- List name input field
- Cancel/Create buttons
- Hidden by default
```

### Task 1.6: Handle New List Creation
**Start**: Modal exists but non-functional
**End**: Can create new empty site list
```javascript
In popup.js:
- Handle create button click
- Validate list name
- Save new list to storage
- Refresh list display
```

### Task 1.7: Add Sites to List Interface
**Start**: Lists exist but can't add sites
**End**: Each list has "Add Site" functionality
```html
For each list item:
- Add "Add Site" button
- Add input field (hidden by default)
- Show/hide on button click
```

### Task 1.8: Implement Add Site to List
**Start**: Add site interface exists
**End**: Can add sites to specific lists
```javascript
In popup.js:
- Handle add site button for each list
- Validate site URL
- Update list in storage
- Refresh list display
```

### Task 1.9: Display Sites in Each List
**Start**: Lists show names only
**End**: Lists show contained sites
```javascript
In popup.js:
- Expand each list to show sites
- Add toggle to expand/collapse
- Style site items differently from list names
```

### Task 1.10: Add Remove Site from List
**Start**: Sites display but can't be removed
**End**: Each site has remove button
```html
For each site in list:
- Add small "×" button
- Handle click to remove site
- Update storage and display
```

## Phase 2: Audio Mode & Allowed Pages

### Task 2.1: Add Audio Mode Checkbox to List
**Start**: Lists don't have audio mode option
**End**: Each list has audio mode checkbox
```html
Add to list creation/edit:
- <label><input type="checkbox" id="audio-mode"> Audio Mode</label>
- Save audio mode state in list data
```

### Task 2.2: Add Allowed Pages Section
**Start**: Lists only have sites to block
**End**: Lists have allowed pages section
```html
For each list:
- Add "Allowed Pages" section
- Add input field for allowed page URLs
- Add list container for allowed pages
```

### Task 2.3: Implement Add Allowed Page
**Start**: Allowed pages section exists
**End**: Can add allowed pages to lists
```javascript
In popup.js:
- Handle add allowed page
- Validate URL format
- Save to list in storage
- Display in allowed pages section
```

### Task 2.4: Display and Remove Allowed Pages
**Start**: Can add allowed pages
**End**: Allowed pages display with remove option
```javascript
In popup.js:
- Show all allowed pages in list
- Add remove button for each
- Handle removal and storage update
```

## Phase 3: Timer Functionality

### Task 3.1: Create Timer Data Structure
**Start**: No timer storage
**End**: Storage supports active timers
```javascript
Extend storage.js:
{
  activeTimer: {
    id: 'timer-id',
    siteListId: 'list-id',
    startTime: timestamp,
    duration: 5400000, // 1.5 hours in ms
    isActive: true
  }
}
```

### Task 3.2: Add Timer Functions to Storage
**Start**: Storage has no timer functions
**End**: Storage has timer CRUD functions
```javascript
Add to storage.js:
- getActiveTimer()
- startTimer(siteListId, duration)
- stopTimer()
- isTimerActive()
```

### Task 3.3: Add Timer Section to Popup
**Start**: Popup has no timer controls
**End**: Popup has timer section
```html
Add to popup.html:
- <div id="timer-section">
- <h3>Focus Timer</h3>
- <div id="timer-controls"></div>
- <div id="timer-display"></div>
```

### Task 3.4: Create Timer Duration Input
**Start**: Empty timer controls
**End**: Input for timer duration
```html
Add to timer controls:
- Hours input (0-23)
- Minutes input (0-59)
- Site list dropdown selection
- Start Timer button
```

### Task 3.5: Handle Start Timer
**Start**: Timer controls exist but non-functional
**End**: Can start timer for selected site list
```javascript
In popup.js:
- Validate duration inputs
- Get selected site list
- Start timer via storage
- Update display to show active timer
```

### Task 3.6: Display Active Timer Status
**Start**: Timer starts but no display
**End**: Shows timer status when active
```javascript
In popup.js:
- Check for active timer on popup open
- Display timer info if active
- Show which site list is being blocked
- Hide start controls when timer active
```

### Task 3.7: Add Stop Timer Functionality
**Start**: Timer runs but can't be stopped
**End**: Can stop active timer
```html
When timer active:
- Show "Stop Timer" button
- Handle stop timer click
- Update storage and display
```

## Phase 4: Time Tracking & Display

### Task 4.1: Create Timer Display Component
**Start**: Basic timer status display
**End**: Dedicated timer display with time info
```html
Create timer display:
- Time elapsed section
- Time remaining section
- Progress bar container
```

### Task 4.2: Calculate and Display Elapsed Time
**Start**: Shows timer is active only
**End**: Shows elapsed time (HH:MM:SS)
```javascript
In popup.js:
- Calculate elapsed time from start
- Format as HH:MM:SS
- Update every second when popup open
```

### Task 4.3: Calculate and Display Remaining Time
**Start**: Shows elapsed time only
**End**: Shows remaining time (HH:MM:SS)
```javascript
In popup.js:
- Calculate remaining time
- Format as HH:MM:SS
- Update every second
- Handle timer completion
```

### Task 4.4: Add Visual Progress Bar
**Start**: Time displays as text only
**End**: Visual progress bar shows completion
```css
Add progress bar:
- CSS for progress bar styling
- JavaScript to update progress percentage
- Smooth transitions between updates
```

### Task 4.5: Handle Timer Completion
**Start**: Timer runs indefinitely
**End**: Timer stops automatically when complete
```javascript
In background/index.js:
- Check timer completion periodically
- Stop timer when duration reached
- Send notification to popup if open
```

### Task 4.6: Add Timer Completion Notification
**Start**: Timer stops silently
**End**: Shows completion notification
```javascript
In popup.js:
- Listen for timer completion message
- Show success message
- Reset timer display to controls
```

## Phase 5: Integration with Blocking System

### Task 5.1: Update Background Blocking Logic
**Start**: Only blocks individually added sites
**End**: Blocks sites from active timer list
```javascript
In background/index.js:
- Check for active timer
- Get sites from active timer's list
- Apply blocking rules for timer sites
```

### Task 5.2: Handle Audio Mode in Blocking
**Start**: Audio mode setting not used
**End**: Audio mode affects blocking behavior
```javascript
In background blocking:
- Check if timer list has audio mode enabled
- Apply audio-specific blocking if enabled
- Reference existing audio-mode.js logic
```

### Task 5.3: Handle Allowed Pages During Timer
**Start**: All sites in list are blocked during timer
**End**: Allowed pages remain accessible
```javascript
In background blocking:
- Get allowed pages from active timer list
- Create exceptions for allowed pages
- Allow access to allowed pages only
```

### Task 5.4: Update Blocked Page for Timer Mode
**Start**: Blocked page doesn't show timer info
**End**: Blocked page shows timer status
```html
Update blocked.html:
- Show "Timer Active" message
- Display remaining time
- Show which focus list is active
```

### Task 5.5: Add Timer Override Option
**Start**: No way to bypass timer block
**End**: Blocked page has emergency override
```html
Add to blocked page:
- "End Timer Early" button
- Confirmation dialog
- Send message to background to stop timer
```

## Testing Checklist

After each task, verify:
- [ ] Feature works in isolation
- [ ] Doesn't break existing functionality
- [ ] Data persists across browser restarts
- [ ] UI updates reflect storage changes
- [ ] Error cases are handled gracefully 