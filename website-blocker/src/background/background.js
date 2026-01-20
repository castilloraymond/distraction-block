// Storage functions
async function getBlockedSites() {
  const result = await chrome.storage.local.get(['blockedSites']);
  return result.blockedSites || [];
}

async function saveBlockedSites(sites) {
  await chrome.storage.local.set({ blockedSites: sites });
}

// Site List Storage Functions
async function getSiteLists() {
  const result = await chrome.storage.local.get(['siteLists']);
  return result.siteLists || [];
}

// Timer Storage Functions
async function getActiveTimer() {
  const result = await chrome.storage.local.get(['activeTimer']);
  return result.activeTimer || null;
}

async function startTimer(siteListId, duration) {
  const timer = {
    id: `timer-${Date.now()}`,
    siteListId: siteListId,
    startTime: Date.now(),
    duration: duration,
    isActive: true
  };
  
  await chrome.storage.local.set({ activeTimer: timer });
  
  // Create an alarm for when the timer expires
  const alarmName = 'focusTimerExpiration';
  await chrome.alarms.create(alarmName, {
    when: Date.now() + duration
  });
  console.log('Created alarm for timer expiration in', duration, 'ms at', new Date(Date.now() + duration).toISOString());
  
  // Create a periodic backup alarm that checks every minute
  await chrome.alarms.create('timerExpirationCheck', {
    delayInMinutes: 1,
    periodInMinutes: 1
  });
  console.log('Created periodic backup alarm');
  
  return timer;
}

async function stopTimer() {
  await chrome.storage.local.remove(['activeTimer']);
  
  // Clear both alarms
  await chrome.alarms.clear('focusTimerExpiration');
  await chrome.alarms.clear('timerExpirationCheck');
  console.log('Cleared timer alarms');
}

async function isTimerActive() {
  const timer = await getActiveTimer();
  if (!timer || !timer.isActive) return false;
  
  const elapsed = Date.now() - timer.startTime;
  if (elapsed >= timer.duration) {
    await stopTimer();
    return false;
  }
  
  return true;
}

async function saveSiteList(list) {
  const siteLists = await getSiteLists();
  const existingIndex = siteLists.findIndex(l => l.id === list.id);
  
  if (existingIndex >= 0) {
    siteLists[existingIndex] = list;
  } else {
    siteLists.push(list);
  }
  
  await chrome.storage.local.set({ siteLists });
  return list;
}

async function deleteSiteList(id) {
  const siteLists = await getSiteLists();
  const filteredLists = siteLists.filter(list => list.id !== id);
  await chrome.storage.local.set({ siteLists: filteredLists });
}

async function updateSiteList(id, updates) {
  const siteLists = await getSiteLists();
  const listIndex = siteLists.findIndex(l => l.id === id);
  
  if (listIndex >= 0) {
    siteLists[listIndex] = { ...siteLists[listIndex], ...updates };
    await chrome.storage.local.set({ siteLists });
    return siteLists[listIndex];
  }
  
  throw new Error('Site list not found');
}

// Rules functions
// Rule ID ranges: Timer rules: 50000-99999, Individual site rules: 1000-49999
async function generateRules(sites) {
  const redirectUrl = chrome.runtime.getURL('src/pages/blocked.html');
  console.log('Redirect URL:', redirectUrl);
  
  const rules = [];
  
  // Check for active timer
  const activeTimer = await getActiveTimer();
  const isActive = await isTimerActive();
  
  if (activeTimer && isActive) {
    // Timer is active - block sites from the active timer's list
    // Use ID range 50000-99999 for timer rules
    const siteLists = await getSiteLists();
    const activeList = siteLists.find(list => list.id === activeTimer.siteListId);
    
    if (activeList && activeList.sites) {
      let ruleIdCounter = 50000;
      
      activeList.sites.forEach(site => {
        const baseId = ruleIdCounter;
        ruleIdCounter += 500; // Large gap to accommodate allow rules
        
        // Create allow rules for allowed pages (higher priority)
        if (activeList.allowedPages && activeList.allowedPages.length > 0) {
          activeList.allowedPages.forEach((pattern, patternIndex) => {
            rules.push({
              id: baseId + 100 + patternIndex,
              priority: 2,
              action: { type: "allow" },
              condition: {
                urlFilter: `*://${site}${pattern}*`,
                resourceTypes: ["main_frame"]
              }
            });
            rules.push({
              id: baseId + 200 + patternIndex,
              priority: 2,
              action: { type: "allow" },
              condition: {
                urlFilter: `*://www.${site}${pattern}*`,
                resourceTypes: ["main_frame"]
              }
            });
          });
        }
        
        // For timer lists, show audio mode only for YouTube, block others normally
        const isYouTube = site.includes('youtube.com');
        
        if (!activeList.audioMode || !isYouTube) {
          // Regular blocking rules for non-YouTube sites or non-audio mode
          rules.push({
            id: baseId,
            priority: 1,
            action: { 
              type: "redirect",
              redirect: { url: redirectUrl }
            },
            condition: {
              urlFilter: `*://${site}/*`,
              resourceTypes: ["main_frame"]
            }
          });
          
          rules.push({
            id: baseId + 1,
            priority: 1,
            action: { 
              type: "redirect",
              redirect: { url: redirectUrl }
            },
            condition: {
              urlFilter: `*://www.${site}/*`,
              resourceTypes: ["main_frame"]
            }
          });
        }
      });
    }
  } else {
    // No active timer - use individual site blocking
    // Use ID range 1000-49999 for individual site rules
    let ruleIdCounter = 1000;
    
    sites.forEach((site) => {
      const baseId = ruleIdCounter;
      ruleIdCounter += 500; // Large gap to accommodate allow rules
      const domain = site.url;
      
      // Create allow rules for whitelisted patterns (higher priority)
      if (site.whitelist && site.whitelist.length > 0) {
        site.whitelist.forEach((pattern, patternIndex) => {
          rules.push({
            id: baseId + 100 + patternIndex,
            priority: 2,
            action: { type: "allow" },
            condition: {
              urlFilter: `*://${domain}${pattern}*`,
              resourceTypes: ["main_frame"]
            }
          });
          rules.push({
            id: baseId + 200 + patternIndex,
            priority: 2,
            action: { type: "allow" },
            condition: {
              urlFilter: `*://www.${domain}${pattern}*`,
              resourceTypes: ["main_frame"]
            }
          });
        });
      }
      
      // For individual sites, show audio mode only for YouTube, block others normally
      const isYouTube = domain.includes('youtube.com');
      
      if (!site.audioMode || !isYouTube) {
        // Regular blocking rules for non-YouTube sites or non-audio mode sites
        rules.push({
          id: baseId,
          priority: 1,
          action: { 
            type: "redirect",
            redirect: { url: redirectUrl }
          },
          condition: {
            urlFilter: `*://${domain}/*`,
            resourceTypes: ["main_frame"]
          }
        });
        
        // Rule for www version
        rules.push({
          id: baseId + 1,
          priority: 1,
          action: { 
            type: "redirect",
            redirect: { url: redirectUrl }
          },
          condition: {
            urlFilter: `*://www.${domain}/*`,
            resourceTypes: ["main_frame"]
          }
        });
      }
    });
  }
  
  return rules;
}

// Mutex for rule updates to prevent race conditions
let ruleUpdateQueue = Promise.resolve();
let isUpdatingRules = false;

async function updateRules(newRules) {
  // Queue the update to prevent concurrent modifications
  ruleUpdateQueue = ruleUpdateQueue.then(async () => {
    if (isUpdatingRules) {
      console.log('Rule update already in progress, waiting...');
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return updateRules(newRules);
    }
    
    try {
      isUpdatingRules = true;
      console.log('Updating rules:', newRules.length, 'rules');
      
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingIds = existingRules.map(rule => rule.id);
      console.log('Removing existing rule IDs:', existingIds.length, 'rules');
      
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: newRules
      });
      
      console.log('Rules updated successfully');
    } catch (error) {
      console.error('Error updating rules:', error);
      throw error;
    } finally {
      isUpdatingRules = false;
    }
  }).catch(error => {
    console.error('Error in rule update queue:', error);
    isUpdatingRules = false;
  });
  
  return ruleUpdateQueue;
}

console.log('Background script loaded');

// Check for expired timers - called on startup and periodically
async function checkAndCleanExpiredTimer() {
  try {
    const timer = await getActiveTimer();
    if (timer) {
      const elapsed = Date.now() - timer.startTime;
      console.log(`Checking timer: elapsed ${elapsed}ms, duration ${timer.duration}ms`);
      
      if (elapsed >= timer.duration) {
        console.log('Found expired timer, cleaning up...');

        // Clear both alarms first
        await chrome.alarms.clear('focusTimerExpiration');
        await chrome.alarms.clear('timerExpirationCheck');

        // Remove timer from storage
        await chrome.storage.local.remove(['activeTimer']);

        // Update rules to remove timer-based blocking
        // This is critical - must happen after timer is removed so generateRules sees no active timer
        try {
          const sites = await getBlockedSites();
          const rules = await generateRules(sites);
          await updateRules(rules);
          console.log('Rules updated successfully after timer expiration');
        } catch (ruleError) {
          console.error('Error updating rules after timer expiration:', ruleError);
          // Retry rule update once
          try {
            const sites = await getBlockedSites();
            const rules = await generateRules(sites);
            await updateRules(rules);
            console.log('Rules updated successfully on retry');
          } catch (retryError) {
            console.error('Failed to update rules on retry:', retryError);
          }
        }

        // Update icon
        await updateExtensionIcon(false);

        console.log('Expired timer cleaned up successfully');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking for expired timer:', error);
    return false;
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    console.log('Extension installed/reloaded, reason:', details.reason);
    
    // Run migration on install or update
    if (details.reason === 'install' || details.reason === 'update') {
      await runMigrations();
    }
    
    // Check for expired timers
    await checkAndCleanExpiredTimer();
    
    const sites = await getBlockedSites();
    console.log('Sites on install:', sites);
    const rules = await generateRules(sites);
    console.log('Rules generated on install:', rules);
    await updateRules(rules);
    console.log('Rules applied on install');
    
    // Set correct icon based on timer state
    const activeTimer = await getActiveTimer();
    const isActive = await isTimerActive();
    await updateExtensionIcon(activeTimer && isActive);
  } catch (error) {
    console.error('Error applying rules on install:', error);
  }
});

// Check for expired timers when service worker starts up
chrome.runtime.onStartup.addListener(async () => {
  try {
    console.log('Service worker started up');
    await checkAndCleanExpiredTimer();
  } catch (error) {
    console.error('Error on startup:', error);
  }
});

// Migration function to handle data structure changes
async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // Check migration version
    const result = await chrome.storage.local.get(['migrationVersion']);
    const currentVersion = result.migrationVersion || 0;
    
    // Migration 1: Add whitelist property to sites
    if (currentVersion < 1) {
      console.log('Running migration 1: Adding whitelist property');
      const sites = await getBlockedSites();
      let needsSave = false;
      
      sites.forEach(site => {
        if (!site.whitelist) {
          site.whitelist = [];
          needsSave = true;
        }
      });
      
      if (needsSave) {
        await saveBlockedSites(sites);
        console.log('Migration 1 complete');
      }
    }
    
    // Update migration version
    await chrome.storage.local.set({ migrationVersion: 1 });
    console.log('All migrations complete');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.action);
  
  switch (request.action) {
    case 'GET_BLOCKED_SITES':
      handleGetBlockedSites(sendResponse);
      return true;
    case 'ADD_SITE':
      handleAddSite(request.payload, sendResponse);
      return true;
    case 'DELETE_SITE':
      handleDeleteSite(request.payload.website, sendResponse);
      return true;
    case 'CHECK_AUDIO_MODE':
      handleCheckAudioMode(request.payload.url, sendResponse);
      return true;
    case 'ADD_WHITELIST':
      handleAddWhitelist(request.payload)
        .then(result => sendResponse(result))
        .catch(error => {
          console.error('Error in ADD_WHITELIST:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    case 'REMOVE_WHITELIST':
      handleRemoveWhitelist(request.payload, sendResponse).catch(error => {
        console.error('Error in REMOVE_WHITELIST:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'GET_WHITELIST':
      handleGetWhitelist(request.payload.site, sendResponse).catch(error => {
        console.error('Error in GET_WHITELIST:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'CHECK_WHITELIST':
      handleCheckWhitelist(request.payload, sendResponse).catch(error => {
        console.error('Error in CHECK_WHITELIST:', error);
        sendResponse({ isWhitelisted: false, isBlocked: true });
      });
      return true;
    case 'TEST_MESSAGE':
      console.log('Test message received');
      sendResponse({ success: true, message: 'Test successful' });
      return true;
    case 'GET_SITE_LISTS':
      handleGetSiteLists(sendResponse).catch(error => {
        console.error('Error in GET_SITE_LISTS:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'CREATE_SITE_LIST':
      handleCreateSiteList(request.payload, sendResponse).catch(error => {
        console.error('Error in CREATE_SITE_LIST:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'DELETE_SITE_LIST':
      handleDeleteSiteList(request.payload.id, sendResponse).catch(error => {
        console.error('Error in DELETE_SITE_LIST:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'UPDATE_SITE_LIST':
      handleUpdateSiteList(request.payload, sendResponse).catch(error => {
        console.error('Error in UPDATE_SITE_LIST:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'ADD_SITE_TO_LIST':
      handleAddSiteToList(request.payload, sendResponse).catch(error => {
        console.error('Error in ADD_SITE_TO_LIST:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'REMOVE_SITE_FROM_LIST':
      handleRemoveSiteFromList(request.payload, sendResponse).catch(error => {
        console.error('Error in REMOVE_SITE_FROM_LIST:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'ADD_ALLOWED_PAGE':
      handleAddAllowedPage(request.payload, sendResponse).catch(error => {
        console.error('Error in ADD_ALLOWED_PAGE:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'REMOVE_ALLOWED_PAGE':
      handleRemoveAllowedPage(request.payload, sendResponse).catch(error => {
        console.error('Error in REMOVE_ALLOWED_PAGE:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'GET_ACTIVE_TIMER':
      handleGetActiveTimer(sendResponse).catch(error => {
        console.error('Error in GET_ACTIVE_TIMER:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'START_TIMER':
      handleStartTimer(request.payload, sendResponse).catch(error => {
        console.error('Error in START_TIMER:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'STOP_TIMER':
      handleStopTimer(sendResponse).catch(error => {
        console.error('Error in STOP_TIMER:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'DISABLE_AUDIO_MODE_TEMPORARILY':
      handleDisableAudioModeTemporarily(request.payload, sendResponse).catch(error => {
        console.error('Error in DISABLE_AUDIO_MODE_TEMPORARILY:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    case 'CHECK_TEMPORARY_WHITELIST':
      handleCheckTemporaryWhitelist(request.payload, sendResponse).catch(error => {
        console.error('Error in CHECK_TEMPORARY_WHITELIST:', error);
        sendResponse({ isTemporarilyDisabled: false });
      });
      return true;
    default:
      console.log('Unknown action:', request.action);
      return false;
  }
});

async function handleGetBlockedSites(sendResponse) {
  try {
    const sites = await getBlockedSites();
    sendResponse({ success: true, data: sites });
  } catch (error) {
    console.error('Error in handleGetBlockedSites:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAddSite(request, sendResponse) {
  try {
    const { website, audioMode } = request;
    console.log('Adding site:', website, 'Audio mode:', audioMode);
    const sites = await getBlockedSites();
    
    if (sites.some(site => site.url === website)) {
      sendResponse({ success: false, error: 'Site already blocked' });
      return;
    }
    
    const newSite = { url: website, audioMode: audioMode || false, whitelist: [] };
    sites.push(newSite);
    await saveBlockedSites(sites);
    console.log('Saved sites:', sites);
    
    const rules = await generateRules(sites);
    console.log('Generated rules for sites:', rules);
    await updateRules(rules);
    
    // Verify rules were applied
    const appliedRules = await chrome.declarativeNetRequest.getDynamicRules();
    console.log('Currently active rules:', appliedRules);
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error adding site:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDeleteSite(website, sendResponse) {
  try {
    const sites = await getBlockedSites();
    const filteredSites = sites.filter(site => site.url !== website);
    await saveBlockedSites(filteredSites);
    
    const rules = await generateRules(filteredSites);
    await updateRules(rules);
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCheckAudioMode(hostname, sendResponse) {
  try {
    console.log('Checking audio mode for hostname:', hostname);
    const sites = await getBlockedSites();
    console.log('All sites:', sites);
    const site = sites.find(s => {
      const siteHostname = s.url.replace('www.', '');
      const checkHostname = hostname.replace('www.', '');
      console.log('Comparing:', siteHostname, 'vs', checkHostname, 'audioMode:', s.audioMode);
      return siteHostname === checkHostname && s.audioMode;
    });
    
    console.log('Found audio mode site:', site);
    sendResponse({ isAudioMode: !!site });
  } catch (error) {
    console.error('Error in handleCheckAudioMode:', error);
    sendResponse({ isAudioMode: false });
  }
}

async function handleAddWhitelist(payload) {
  console.log('handleAddWhitelist called with:', payload);
  const { site, url } = payload;
  const sites = await getBlockedSites();
  console.log('Current sites:', sites);
  const siteObj = sites.find(s => s.url === site);
  console.log('Found site object:', siteObj);
  
  if (siteObj) {
    if (!siteObj.whitelist) siteObj.whitelist = [];
    if (!siteObj.whitelist.includes(url)) {
      siteObj.whitelist.push(url);
      console.log('Adding to whitelist:', url);
      await saveBlockedSites(sites);
      console.log('Saved sites with whitelist:', sites);
      
      // Update rules to account for whitelist
      const rules = await generateRules(sites);
      await updateRules(rules);
    }
    return { success: true };
  } else {
    console.error('Site not found:', site);
    throw new Error('Site not found');
  }
}

async function handleRemoveWhitelist(payload, sendResponse) {
  try {
    const { site, url } = payload;
    const sites = await getBlockedSites();
    const siteObj = sites.find(s => s.url === site);
    
    if (siteObj && siteObj.whitelist) {
      siteObj.whitelist = siteObj.whitelist.filter(item => item !== url);
      await saveBlockedSites(sites);
      
      // Update rules
      const rules = await generateRules(sites);
      await updateRules(rules);
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Site not found' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetWhitelist(site, sendResponse) {
  try {
    const sites = await getBlockedSites();
    const siteObj = sites.find(s => s.url === site);
    sendResponse({ success: true, data: siteObj?.whitelist || [] });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCheckWhitelist(payload, sendResponse) {
  try {
    const { hostname, pathname } = payload;
    const sites = await getBlockedSites();
    
    const site = sites.find(s => {
      const siteHostname = s.url.replace('www.', '');
      const checkHostname = hostname.replace('www.', '');
      return siteHostname === checkHostname;
    });
    
    if (site && site.whitelist) {
      const isWhitelisted = site.whitelist.some(pattern => {
        // Check if the current path matches any whitelist pattern
        if (pattern.startsWith('/')) {
          return pathname.includes(pattern) || pathname.startsWith(pattern);
        } else {
          return pathname.includes(pattern);
        }
      });
      sendResponse({ isWhitelisted, isBlocked: !isWhitelisted && !site.audioMode });
    } else {
      sendResponse({ isWhitelisted: false, isBlocked: true });
    }
  } catch (error) {
    sendResponse({ isWhitelisted: false, isBlocked: true });
  }
}

// Site List Handler Functions
async function handleGetSiteLists(sendResponse) {
  try {
    const siteLists = await getSiteLists();
    sendResponse({ success: true, data: siteLists });
  } catch (error) {
    console.error('Error in handleGetSiteLists:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCreateSiteList(payload, sendResponse) {
  try {
    console.log('Creating site list with payload:', payload);
    const { name, audioMode } = payload;
    
    if (!name || name.trim() === '') {
      sendResponse({ success: false, error: 'List name is required' });
      return;
    }
    
    const newList = {
      id: `list-${Date.now()}`,
      name: name.trim(),
      sites: [],
      audioMode: audioMode || false,
      allowedPages: []
    };
    
    console.log('Saving new list:', newList);
    await saveSiteList(newList);
    console.log('List saved successfully');
    sendResponse({ success: true, data: newList });
  } catch (error) {
    console.error('Error in handleCreateSiteList:', error);
    sendResponse({ success: false, error: error.message || 'Failed to create list' });
  }
}

async function handleDeleteSiteList(id, sendResponse) {
  try {
    await deleteSiteList(id);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error in handleDeleteSiteList:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateSiteList(payload, sendResponse) {
  try {
    const { id, updates } = payload;
    const updatedList = await updateSiteList(id, updates);
    sendResponse({ success: true, data: updatedList });
  } catch (error) {
    console.error('Error in handleUpdateSiteList:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAddSiteToList(payload, sendResponse) {
  try {
    const { listId, site } = payload;
    const siteLists = await getSiteLists();
    const list = siteLists.find(l => l.id === listId);
    
    if (!list) {
      sendResponse({ success: false, error: 'List not found' });
      return;
    }
    
    if (!list.sites.includes(site)) {
      list.sites.push(site);
      await saveSiteList(list);
    }
    
    sendResponse({ success: true, data: list });
  } catch (error) {
    console.error('Error in handleAddSiteToList:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRemoveSiteFromList(payload, sendResponse) {
  try {
    const { listId, site } = payload;
    const siteLists = await getSiteLists();
    const list = siteLists.find(l => l.id === listId);
    
    if (!list) {
      sendResponse({ success: false, error: 'List not found' });
      return;
    }
    
    list.sites = list.sites.filter(s => s !== site);
    await saveSiteList(list);
    
    sendResponse({ success: true, data: list });
  } catch (error) {
    console.error('Error in handleRemoveSiteFromList:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleAddAllowedPage(payload, sendResponse) {
  try {
    const { listId, page } = payload;
    const siteLists = await getSiteLists();
    const list = siteLists.find(l => l.id === listId);
    
    if (!list) {
      sendResponse({ success: false, error: 'List not found' });
      return;
    }
    
    if (!list.allowedPages) {
      list.allowedPages = [];
    }
    
    if (!list.allowedPages.includes(page)) {
      list.allowedPages.push(page);
      await saveSiteList(list);
    }
    
    sendResponse({ success: true, data: list });
  } catch (error) {
    console.error('Error in handleAddAllowedPage:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleRemoveAllowedPage(payload, sendResponse) {
  try {
    const { listId, page } = payload;
    const siteLists = await getSiteLists();
    const list = siteLists.find(l => l.id === listId);
    
    if (!list) {
      sendResponse({ success: false, error: 'List not found' });
      return;
    }
    
    if (list.allowedPages) {
      list.allowedPages = list.allowedPages.filter(p => p !== page);
      await saveSiteList(list);
    }
    
    sendResponse({ success: true, data: list });
  } catch (error) {
    console.error('Error in handleRemoveAllowedPage:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Timer Handler Functions
async function handleGetActiveTimer(sendResponse) {
  try {
    // First check and clean any expired timers
    const wasExpired = await checkAndCleanExpiredTimer();
    if (wasExpired) {
      console.log('Timer was expired, returning null');
      sendResponse({ success: true, data: null });
      return;
    }
    
    const timer = await getActiveTimer();
    const isActive = await isTimerActive();
    
    if (timer && isActive) {
      sendResponse({ success: true, data: timer });
    } else {
      sendResponse({ success: true, data: null });
    }
  } catch (error) {
    console.error('Error in handleGetActiveTimer:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStartTimer(payload, sendResponse) {
  try {
    const { siteListId, duration } = payload;
    
    // Check if site list exists
    const siteLists = await getSiteLists();
    const list = siteLists.find(l => l.id === siteListId);
    
    if (!list) {
      sendResponse({ success: false, error: 'Site list not found' });
      return;
    }
    
    const timer = await startTimer(siteListId, duration);
    
    // Update blocking rules to include timer sites
    const sites = await getBlockedSites();
    const rules = await generateRules(sites);
    await updateRules(rules);
    
    // Change icon to indicate active timer
    await updateExtensionIcon(true);
    
    sendResponse({ success: true, data: timer });
  } catch (error) {
    console.error('Error in handleStartTimer:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStopTimer(sendResponse) {
  try {
    await stopTimer();
    
    // Update blocking rules to remove timer sites and revert to individual sites
    const sites = await getBlockedSites();
    const rules = await generateRules(sites);
    await updateRules(rules);
    
    // Revert icon to normal
    await updateExtensionIcon(false);
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error in handleStopTimer:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Temporary whitelist storage functions (using chrome.storage.session for persistence)
async function getTemporaryWhitelist() {
  const result = await chrome.storage.session.get(['temporaryWhitelist']);
  return result.temporaryWhitelist || {};
}

async function setTemporaryWhitelist(whitelist) {
  await chrome.storage.session.set({ temporaryWhitelist: whitelist });
}

async function cleanupExpiredWhitelist(whitelist) {
  const now = Date.now();
  const cleaned = {};
  let hasExpired = false;
  
  for (const [domain, expireTime] of Object.entries(whitelist)) {
    if (now < expireTime) {
      cleaned[domain] = expireTime;
    } else {
      hasExpired = true;
    }
  }
  
  if (hasExpired) {
    await setTemporaryWhitelist(cleaned);
  }
  
  return cleaned;
}

async function handleDisableAudioModeTemporarily(payload, sendResponse) {
  try {
    const { url } = payload;
    const domain = url.replace('www.', '');
    
    // Get current whitelist and clean up expired entries
    let whitelist = await getTemporaryWhitelist();
    whitelist = await cleanupExpiredWhitelist(whitelist);
    
    // Add to temporary whitelist for 1 minute
    const expireTime = Date.now() + 60000; // 1 minute
    whitelist[domain] = expireTime;
    
    await setTemporaryWhitelist(whitelist);
    
    console.log('Added to temporary whitelist:', domain, 'expires at:', new Date(expireTime));
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error in handleDisableAudioModeTemporarily:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCheckTemporaryWhitelist(payload, sendResponse) {
  try {
    const { url } = payload;
    const domain = url.replace('www.', '');

    // Get current whitelist and clean up expired entries
    let whitelist = await getTemporaryWhitelist();
    whitelist = await cleanupExpiredWhitelist(whitelist);

    const expireTime = whitelist[domain];
    const now = Date.now();
    const isTemporarilyDisabled = expireTime && now < expireTime;
    const remainingTime = isTemporarilyDisabled ? expireTime - now : 0;
    sendResponse({ isTemporarilyDisabled, remainingTime });
  } catch (error) {
    console.error('Error in handleCheckTemporaryWhitelist:', error);
    sendResponse({ isTemporarilyDisabled: false });
  }
}

// Extension icon management
async function updateExtensionIcon(isTimerActive) {
  try {
    console.log('Updating extension icon, timer active:', isTimerActive);
    
    if (isTimerActive) {
      // Use badge to indicate timer is active (more reliable than icon changes)
      await chrome.action.setBadgeText({ text: '⏲' });
      await chrome.action.setBadgeBackgroundColor({ color: '#059669' });
      
      // Also try to change the icon title to provide feedback
      await chrome.action.setTitle({ title: 'Website Blocker - Focus Timer Active' });
    } else {
      // Clear badge and title when timer is not active
      await chrome.action.setBadgeText({ text: '' });
      await chrome.action.setTitle({ title: 'Website Blocker' });
    }
  } catch (error) {
    console.error('Error updating extension icon/badge:', error);
  }
}

// Alarm listener for automatic timer expiration
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm triggered:', alarm.name, 'at', new Date().toISOString());
  
  if (alarm.name === 'focusTimerExpiration' || alarm.name === 'timerExpirationCheck') {
    if (alarm.name === 'focusTimerExpiration') {
      console.log('Focus timer expired - cleaning up');
    } else {
      console.log('Periodic timer check running');
    }
    
    try {
      // Check if timer has expired and clean it up if needed
      const wasExpired = await checkAndCleanExpiredTimer();
      
      if (wasExpired) {
        console.log('Timer was expired and cleaned up');
        // Clear the periodic check alarm since timer is done
        await chrome.alarms.clear('timerExpirationCheck');
        await chrome.alarms.clear('focusTimerExpiration');
      } else if (alarm.name === 'focusTimerExpiration') {
        // Main alarm fired but timer wasn't expired yet - this shouldn't happen
        console.warn('focusTimerExpiration alarm fired but timer not expired');
      } else {
        // Periodic check - timer is still active
        console.log('Periodic check: timer still active');
      }
    } catch (error) {
      console.error('Error handling alarm:', error);
      // Even on error, try to clear the timer and update rules
      if (alarm.name === 'focusTimerExpiration') {
        try {
          await chrome.storage.local.remove(['activeTimer']);
          await chrome.alarms.clear('focusTimerExpiration');
          await chrome.alarms.clear('timerExpirationCheck');
          // Critical: Update rules to remove timer-based blocking
          const sites = await getBlockedSites();
          const rules = await generateRules(sites);
          await updateRules(rules);
          await updateExtensionIcon(false);
          console.log('Emergency cleanup completed - rules updated');
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
      }
    }
  }
});