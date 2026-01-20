console.log('Popup loaded');

const addButton = document.getElementById('add-button');
const input = document.getElementById('website-input');
const audioModeCheckbox = document.getElementById('audio-mode-checkbox');
const whitelistSection = document.getElementById('whitelist-section');
const whitelistInput = document.getElementById('whitelist-input');
const addWhitelistButton = document.getElementById('add-whitelist-button');
const closeWhitelistButton = document.getElementById('close-whitelist-button');
const whitelistSiteName = document.getElementById('whitelist-site-name');
const whitelistList = document.getElementById('whitelist-list');

// Site Lists Elements
const createListBtn = document.getElementById('create-list-btn');
const createListModal = document.getElementById('create-list-modal');
const listNameInput = document.getElementById('list-name-input');
const listAudioModeCheckbox = document.getElementById('list-audio-mode-checkbox');
const createListConfirm = document.getElementById('create-list-confirm');
const createListCancel = document.getElementById('create-list-cancel');
const siteListsContainer = document.getElementById('site-lists-container');

// Timer Elements
const timerHours = document.getElementById('timer-hours');
const timerMinutes = document.getElementById('timer-minutes');
const timerSiteList = document.getElementById('timer-site-list');
const startTimerBtn = document.getElementById('start-timer-btn');
const timerControls = document.getElementById('timer-controls');
const timerDisplay = document.getElementById('timer-display');
const timerListName = document.getElementById('timer-list-name');
const timerCenterTime = document.getElementById('timer-center-time');
const doughnutProgress = document.getElementById('doughnut-progress');
const stopTimerBtn = document.getElementById('stop-timer-btn');

let currentWhitelistSite = null;
let timerInterval = null;
let currentScheduleListId = null;

// Schedule Modal Elements
const editScheduleModal = document.getElementById('edit-schedule-modal');
const scheduleEnabledCheckbox = document.getElementById('schedule-enabled-checkbox');
const scheduleOptions = document.getElementById('schedule-options');
const scheduleStartTime = document.getElementById('schedule-start-time');
const scheduleEndTime = document.getElementById('schedule-end-time');
const scheduleSaveBtn = document.getElementById('schedule-save');
const scheduleCancelBtn = document.getElementById('schedule-cancel');

function formatUrl(website) {
  let url = website.toLowerCase().trim();
  
  // Remove protocol
  url = url.replace(/^https?:\/\//, '');
  
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  
  // Remove www prefix
  url = url.replace(/^www\./, '');
  
  // Remove any path, query params, or hash
  url = url.split('/')[0].split('?')[0].split('#')[0];
  
  // Sanitize: remove any non-alphanumeric characters except dots and hyphens
  url = url.replace(/[^a-z0-9.-]/g, '');
  
  return url;
}

function isValidDomain(domain) {
  // Check if domain is not empty
  if (!domain || domain.length === 0) {
    return false;
  }
  
  // Check for at least one dot
  if (!domain.includes('.')) {
    return false;
  }
  
  // Check for valid domain format (alphanumeric, dots, and hyphens)
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return false;
  }
  
  // Check for common invalid patterns
  if (domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }
  
  if (domain.includes('..')) {
    return false;
  }
  
  // Check if domain has valid TLD (at least 2 characters)
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (tld.length < 2) {
    return false;
  }
  
  return true;
}

addButton.addEventListener('click', () => {
  const website = input.value.trim();
  
  if (!website) {
    alert('Please enter a website');
    return;
  }
  
  const formattedUrl = formatUrl(website);
  
  if (!isValidDomain(formattedUrl)) {
    alert('Please enter a valid domain name (e.g., example.com, youtube.com)');
    return;
  }
  
  const audioMode = audioModeCheckbox.checked;
  
  chrome.runtime.sendMessage({
    action: 'ADD_SITE',
    payload: { website: formattedUrl, audioMode: audioMode }
  }, (response) => {
    const errorDiv = document.getElementById('error-message');
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      errorDiv.textContent = 'Extension error: ' + chrome.runtime.lastError.message;
      errorDiv.style.display = 'block';
      return;
    }
    if (response && response.success) {
      console.log('Site added successfully');
      input.value = '';
      audioModeCheckbox.checked = false;
      errorDiv.style.display = 'none';
      loadSites();
    } else {
      const errorMsg = response?.error || 'Failed to add site';
      errorDiv.textContent = errorMsg;
      errorDiv.style.display = 'block';
    }
  });
});

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addButton.click();
  }
});

// Whitelist event listeners
addWhitelistButton.addEventListener('click', () => {
  let url = whitelistInput.value.trim();
  if (!url) {
    alert('Please enter a URL or pattern');
    return;
  }
  
  // Basic sanitization for URL patterns
  // Allow only alphanumeric, forward slash, hyphen, underscore, question mark, equals, ampersand, dot
  url = url.replace(/[^a-zA-Z0-9/\-_?=&.]/g, '');
  
  if (!url.startsWith('/')) {
    alert('URL pattern must start with / (e.g., /watch?v=abc123)');
    return;
  }
  
  console.log('Sending ADD_WHITELIST with:', { site: currentWhitelistSite, url: url });
  
  try {
    chrome.runtime.sendMessage({
      action: 'ADD_WHITELIST',
      payload: { site: currentWhitelistSite, url: url }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        alert('Failed to add to whitelist: ' + chrome.runtime.lastError.message);
        return;
      }
      
      console.log('ADD_WHITELIST response:', response);
      if (response && response.success) {
        whitelistInput.value = '';
        loadWhitelist(currentWhitelistSite);
        loadSites(); // Refresh main list to show whitelist badge
      } else {
        console.error('Whitelist error:', response);
        alert('Failed to add to whitelist: ' + (response?.error || 'Unknown error'));
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error sending message: ' + error.message);
  }
});

closeWhitelistButton.addEventListener('click', () => {
  whitelistSection.style.display = 'none';
  currentWhitelistSite = null;
});

whitelistInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addWhitelistButton.click();
  }
});

function loadSites() {
  const listContainer = document.getElementById('blocked-sites-list');
  listContainer.innerHTML = '<div>Loading...</div>';
  
  chrome.runtime.sendMessage({
    action: 'GET_BLOCKED_SITES'
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading sites:', chrome.runtime.lastError);
      listContainer.innerHTML = '<div style="text-align: center; color: #dc2626; padding: 20px;">Error loading sites</div>';
      return;
    }
    if (response && response.success) {
      console.log('Blocked sites:', response.data);
      renderBlockedSites(response.data);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSites();
  loadSiteLists();
  loadActiveTimer();
  input.focus();
});

// Clean up timer intervals when popup closes to prevent memory leaks
window.addEventListener('beforeunload', () => {
  stopTimerUpdates();
});

// Site Lists Event Listeners
createListBtn.addEventListener('click', () => {
  createListModal.style.display = 'flex';
  listNameInput.focus();
});

createListCancel.addEventListener('click', () => {
  createListModal.style.display = 'none';
  listNameInput.value = '';
  listAudioModeCheckbox.checked = false;
});

createListConfirm.addEventListener('click', () => {
  const name = listNameInput.value.trim();
  const audioMode = listAudioModeCheckbox.checked;
  
  if (!name) {
    alert('Please enter a list name');
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'CREATE_SITE_LIST',
    payload: { name: name, audioMode: audioMode }
  }, (response) => {
    if (response && response.success) {
      createListModal.style.display = 'none';
      listNameInput.value = '';
      listAudioModeCheckbox.checked = false;
      loadSiteLists();
    } else {
      alert('Failed to create list: ' + (response?.error || 'Unknown error'));
    }
  });
});

listNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    createListConfirm.click();
  }
});

// Schedule Modal Event Listeners
scheduleEnabledCheckbox.addEventListener('change', () => {
  scheduleOptions.style.display = scheduleEnabledCheckbox.checked ? 'block' : 'none';
});

scheduleCancelBtn.addEventListener('click', () => {
  editScheduleModal.style.display = 'none';
  currentScheduleListId = null;
});

scheduleSaveBtn.addEventListener('click', () => {
  if (!currentScheduleListId) return;

  const enabled = scheduleEnabledCheckbox.checked;
  const days = [];
  document.querySelectorAll('.schedule-days input:checked').forEach(cb => {
    days.push(cb.value);
  });

  const schedule = {
    enabled: enabled,
    days: days,
    startTime: scheduleStartTime.value,
    endTime: scheduleEndTime.value
  };

  chrome.runtime.sendMessage({
    action: 'UPDATE_SITE_LIST',
    payload: { id: currentScheduleListId, updates: { schedule: schedule } }
  }, (response) => {
    if (response && response.success) {
      editScheduleModal.style.display = 'none';
      currentScheduleListId = null;
      loadSiteLists();
    } else {
      alert('Failed to save schedule: ' + (response?.error || 'Unknown error'));
    }
  });
});

function openScheduleModal(list) {
  currentScheduleListId = list.id;

  // Reset and populate form
  const schedule = list.schedule || { enabled: false, days: [], startTime: '06:00', endTime: '11:00' };

  scheduleEnabledCheckbox.checked = schedule.enabled;
  scheduleOptions.style.display = schedule.enabled ? 'block' : 'none';
  scheduleStartTime.value = schedule.startTime || '06:00';
  scheduleEndTime.value = schedule.endTime || '11:00';

  // Reset day checkboxes
  document.querySelectorAll('.schedule-days input').forEach(cb => {
    cb.checked = schedule.days && schedule.days.includes(cb.value);
  });

  editScheduleModal.style.display = 'flex';
}

// Timer Event Listeners
startTimerBtn.addEventListener('click', () => {
  const hours = parseInt(timerHours.value) || 0;
  const minutes = parseInt(timerMinutes.value) || 0;
  const selectedListId = timerSiteList.value;
  
  if (!selectedListId) {
    alert('Please select a site list');
    return;
  }
  
  if (hours === 0 && minutes === 0) {
    alert('Please set a duration');
    return;
  }
  
  const duration = (hours * 60 + minutes) * 60 * 1000; // Convert to milliseconds
  
  chrome.runtime.sendMessage({
    action: 'START_TIMER',
    payload: { siteListId: selectedListId, duration: duration }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error starting timer:', chrome.runtime.lastError);
      alert('Extension error: ' + chrome.runtime.lastError.message);
      return;
    }
    if (response && response.success) {
      showTimerDisplay();
      startTimerUpdates();
    } else {
      alert('Failed to start timer: ' + (response?.error || 'Unknown error'));
    }
  });
});

stopTimerBtn.addEventListener('click', () => {
  if (confirm('Stop the focus timer?')) {
    chrome.runtime.sendMessage({
      action: 'STOP_TIMER'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error stopping timer:', chrome.runtime.lastError);
        alert('Extension error: ' + chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        showTimerControls();
        stopTimerUpdates();
      } else {
        alert('Failed to stop timer');
      }
    });
  }
});

function renderBlockedSites(sites) {
  const listContainer = document.getElementById('blocked-sites-list');
  const counterDiv = document.getElementById('site-counter');
  
  // Remove the blocking counter text
  counterDiv.style.display = 'none';
  
  listContainer.innerHTML = '';
  
  if (sites.length === 0) {
    listContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No sites blocked yet</div>';
    return;
  }
  
  sites.forEach(site => {
    const siteDiv = document.createElement('div');
    siteDiv.className = 'blocked-site';
    
    const siteLeft = document.createElement('div');
    siteLeft.className = 'blocked-site-left';
    
    const siteText = document.createElement('span');
    siteText.className = 'blocked-site-url';
    siteText.textContent = site.url;
    siteLeft.appendChild(siteText);
    
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'blocked-site-badges';
    
    if (site.audioMode) {
      const audioBadge = document.createElement('span');
      audioBadge.className = 'badge badge-audio';
      audioBadge.textContent = '♪ Audio';
      badgesContainer.appendChild(audioBadge);
    }
    
    if (site.whitelist && site.whitelist.length > 0) {
      const whitelistBadge = document.createElement('span');
      whitelistBadge.className = 'badge badge-allowed';
      whitelistBadge.textContent = `${site.whitelist.length} allowed`;
      badgesContainer.appendChild(whitelistBadge);
    }
    
    siteLeft.appendChild(badgesContainer);
    siteDiv.appendChild(siteLeft);
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'blocked-site-controls';
    
    const whitelistButton = document.createElement('button');
    whitelistButton.className = 'btn btn-primary btn-sm';
    whitelistButton.textContent = 'Allow Pages';
    whitelistButton.addEventListener('click', () => {
      openWhitelist(site.url);
    });
    controlsContainer.appendChild(whitelistButton);
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => {
      if (confirm(`Remove ${site.url} from blocked sites?`)) {
        chrome.runtime.sendMessage({
          action: 'DELETE_SITE',
          payload: { website: site.url }
        }, (response) => {
          if (response && response.success) {
            console.log('Site deleted successfully');
            loadSites();
          } else {
            console.error('Failed to delete site');
          }
        });
      }
    });
    controlsContainer.appendChild(deleteButton);
    
    siteDiv.appendChild(controlsContainer);
    listContainer.appendChild(siteDiv);
  });
}

function openWhitelist(siteUrl) {
  currentWhitelistSite = siteUrl;
  whitelistSiteName.textContent = siteUrl;
  whitelistSection.style.display = 'block';
  whitelistInput.placeholder = 'e.g., /watch?v=abc123 or /channel/UCexample';
  loadWhitelist(siteUrl);
}

function loadWhitelist(siteUrl) {
  chrome.runtime.sendMessage({
    action: 'GET_WHITELIST',
    payload: { site: siteUrl }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading whitelist:', chrome.runtime.lastError);
      return;
    }
    
    if (response && response.success) {
      renderWhitelist(response.data || []);
    } else {
      console.error('Failed to load whitelist:', response);
      renderWhitelist([]);
    }
  });
}

function renderWhitelist(whitelist) {
  whitelistList.innerHTML = '';
  
  if (whitelist.length === 0) {
    whitelistList.innerHTML = '<div style="text-align: center; color: #666; padding: 10px; font-size: 12px;">No allowed pages yet</div>';
    return;
  }
  
  whitelist.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'whitelist-item';
    
    const urlSpan = document.createElement('span');
    urlSpan.textContent = item;
    itemDiv.appendChild(urlSpan);
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-whitelist';
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'REMOVE_WHITELIST',
        payload: { site: currentWhitelistSite, url: item }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error removing whitelist:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          loadWhitelist(currentWhitelistSite);
          loadSites(); // Refresh main list
        } else {
          console.error('Failed to remove whitelist item:', response);
        }
      });
    });
    itemDiv.appendChild(removeButton);
    
    whitelistList.appendChild(itemDiv);
  });
}

// Site Lists Functions
function loadSiteLists() {
  chrome.runtime.sendMessage({
    action: 'GET_SITE_LISTS'
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading site lists:', chrome.runtime.lastError);
      renderSiteLists([]);
      return;
    }
    if (response && response.success) {
      renderSiteLists(response.data);
    } else {
      console.error('Failed to load site lists:', response);
      renderSiteLists([]);
    }
  });
}

function renderSiteLists(siteLists) {
  siteListsContainer.innerHTML = '';
  
  if (siteLists.length === 0) {
    siteListsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div>Create your first site list to get started with focus sessions</div>
      </div>
    `;
    return;
  }
  
  siteLists.forEach(list => {
    const listDiv = document.createElement('div');
    listDiv.className = 'site-list-item';
    
    // List Header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'list-header';
    
    const headerLeft = document.createElement('div');
    headerLeft.className = 'list-header-left';
    
    const nameContainer = document.createElement('div');
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'list-name';
    nameSpan.textContent = list.name;
    nameContainer.appendChild(nameSpan);
    
    const metaSpan = document.createElement('div');
    metaSpan.className = 'list-meta';
    metaSpan.textContent = `${list.sites.length} sites`;
    nameContainer.appendChild(metaSpan);
    
    headerLeft.appendChild(nameContainer);
    
    // Add badges
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'list-badges';
    
    if (list.audioMode) {
      const audioBadge = document.createElement('span');
      audioBadge.className = 'badge badge-audio';
      audioBadge.textContent = '♪ Audio';
      badgesContainer.appendChild(audioBadge);
    }
    
    if (list.allowedPages && list.allowedPages.length > 0) {
      const allowedBadge = document.createElement('span');
      allowedBadge.className = 'badge badge-allowed';
      allowedBadge.textContent = `${list.allowedPages.length} allowed`;
      badgesContainer.appendChild(allowedBadge);
    }

    // Add schedule badge
    if (list.schedule && list.schedule.enabled) {
      const scheduleBadge = document.createElement('span');
      scheduleBadge.className = 'badge badge-schedule';
      scheduleBadge.textContent = '⏰ Scheduled';
      badgesContainer.appendChild(scheduleBadge);
    }

    headerLeft.appendChild(badgesContainer);
    headerDiv.appendChild(headerLeft);
    
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'list-controls';
    
    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-btn';
    expandBtn.textContent = '▼';
    expandBtn.addEventListener('click', () => {
      const content = listDiv.querySelector('.list-content');
      content.classList.toggle('expanded');
      expandBtn.textContent = content.classList.contains('expanded') ? '▲' : '▼';
    });
    controlsDiv.appendChild(expandBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-xs';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${list.name}" list?`)) {
        chrome.runtime.sendMessage({
          action: 'DELETE_SITE_LIST',
          payload: { id: list.id }
        }, (response) => {
          if (response && response.success) {
            loadSiteLists();
          } else {
            alert('Failed to delete list');
          }
        });
      }
    });
    controlsDiv.appendChild(deleteBtn);
    
    headerDiv.appendChild(controlsDiv);
    listDiv.appendChild(headerDiv);
    
    // List Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'list-content';
    
    // Sites in list
    const sitesDiv = document.createElement('div');
    sitesDiv.className = 'list-sites';
    
    if (list.sites.length === 0) {
      sitesDiv.innerHTML = '<div style="color: #666; font-size: 11px; margin-bottom: 8px;">No sites added yet</div>';
    } else {
      list.sites.forEach(site => {
        const siteDiv = document.createElement('div');
        siteDiv.className = 'list-site';
        
        const siteSpan = document.createElement('span');
        siteSpan.className = 'list-site-url';
        siteSpan.textContent = site;
        siteDiv.appendChild(siteSpan);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger btn-xs';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
          if (confirm(`Remove ${site} from this list?`)) {
            chrome.runtime.sendMessage({
              action: 'REMOVE_SITE_FROM_LIST',
              payload: { listId: list.id, site: site }
            }, (response) => {
              if (response && response.success) {
                loadSiteLists();
              } else {
                alert('Failed to remove site');
              }
            });
          }
        });
        siteDiv.appendChild(removeBtn);
        
        sitesDiv.appendChild(siteDiv);
      });
    }
    
    contentDiv.appendChild(sitesDiv);
    
    // Add site form
    const addSiteForm = document.createElement('div');
    addSiteForm.className = 'add-site-form';
    
    const siteInput = document.createElement('input');
    siteInput.type = 'text';
    siteInput.placeholder = 'Enter site (e.g., example.com)';
    addSiteForm.appendChild(siteInput);
    
    const addSiteBtn = document.createElement('button');
    addSiteBtn.className = 'btn btn-success btn-sm';
    addSiteBtn.textContent = 'Add';
    addSiteBtn.addEventListener('click', () => {
      const site = siteInput.value.trim();
      if (!site) {
        alert('Please enter a site');
        return;
      }
      
      const formattedSite = formatUrl(site);
      
      if (!isValidDomain(formattedSite)) {
        alert('Please enter a valid domain name (e.g., example.com, youtube.com)');
        return;
      }
      
      // Remember if this list was expanded before adding
      const wasExpanded = contentDiv.classList.contains('expanded');
      
      chrome.runtime.sendMessage({
        action: 'ADD_SITE_TO_LIST',
        payload: { listId: list.id, site: formattedSite }
      }, (response) => {
        if (response && response.success) {
          siteInput.value = '';
          // Store the expansion state
          const expandedLists = new Set();
          document.querySelectorAll('.list-content.expanded').forEach(content => {
            const listItem = content.closest('.site-list-item');
            const listName = listItem.querySelector('.list-name').textContent;
            expandedLists.add(listName);
          });
          
          // Reload lists
          loadSiteLists();
          
          // Restore expansion state after a short delay
          setTimeout(() => {
            document.querySelectorAll('.site-list-item').forEach(listItem => {
              const listName = listItem.querySelector('.list-name').textContent;
              if (expandedLists.has(listName)) {
                const content = listItem.querySelector('.list-content');
                const expandBtn = listItem.querySelector('.expand-btn');
                content.classList.add('expanded');
                expandBtn.textContent = '▲';
              }
            });
          }, 50);
        } else {
          alert('Failed to add site: ' + (response?.error || 'Unknown error'));
        }
      });
    });
    addSiteForm.appendChild(addSiteBtn);
    
    siteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addSiteBtn.click();
      }
    });
    
    contentDiv.appendChild(addSiteForm);
    
    // Allowed Pages Section
    const allowedPagesSection = document.createElement('div');
    allowedPagesSection.className = 'allowed-pages-section';
    
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header';
    sectionHeader.textContent = 'Allowed Pages';
    allowedPagesSection.appendChild(sectionHeader);
    
    // Allowed pages list
    const allowedPagesList = document.createElement('div');
    allowedPagesList.className = 'allowed-pages-list';
    
    if (!list.allowedPages || list.allowedPages.length === 0) {
      allowedPagesList.innerHTML = '<div style="color: #666; font-size: 11px; margin-bottom: 8px;">No allowed pages yet</div>';
    } else {
      list.allowedPages.forEach(page => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'allowed-page-item';
        
        const pageSpan = document.createElement('span');
        pageSpan.className = 'allowed-page-url';
        pageSpan.textContent = page;
        pageDiv.appendChild(pageSpan);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger btn-xs';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
          chrome.runtime.sendMessage({
            action: 'REMOVE_ALLOWED_PAGE',
            payload: { listId: list.id, page: page }
          }, (response) => {
            if (response && response.success) {
              loadSiteLists();
            } else {
              alert('Failed to remove allowed page');
            }
          });
        });
        pageDiv.appendChild(removeBtn);
        
        allowedPagesList.appendChild(pageDiv);
      });
    }
    
    allowedPagesSection.appendChild(allowedPagesList);
    
    // Add allowed page form
    const addPageForm = document.createElement('div');
    addPageForm.className = 'add-page-form';
    
    const pageInput = document.createElement('input');
    pageInput.type = 'text';
    pageInput.placeholder = 'Enter URL pattern (e.g., /watch?v=abc123)';
    addPageForm.appendChild(pageInput);
    
    const addPageBtn = document.createElement('button');
    addPageBtn.className = 'btn btn-primary btn-sm';
    addPageBtn.textContent = 'Allow';
    addPageBtn.addEventListener('click', () => {
      const page = pageInput.value.trim();
      if (!page) {
        alert('Please enter a URL pattern');
        return;
      }
      
      chrome.runtime.sendMessage({
        action: 'ADD_ALLOWED_PAGE',
        payload: { listId: list.id, page: page }
      }, (response) => {
        if (response && response.success) {
          pageInput.value = '';
          loadSiteLists();
        } else {
          alert('Failed to add allowed page: ' + (response?.error || 'Unknown error'));
        }
      });
    });
    addPageForm.appendChild(addPageBtn);
    
    pageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addPageBtn.click();
      }
    });
    
    allowedPagesSection.appendChild(addPageForm);
    contentDiv.appendChild(allowedPagesSection);

    // Schedule Section
    const scheduleSection = document.createElement('div');
    scheduleSection.className = 'schedule-section';

    const scheduleSectionHeader = document.createElement('div');
    scheduleSectionHeader.className = 'section-header';
    scheduleSectionHeader.textContent = 'Schedule';
    scheduleSection.appendChild(scheduleSectionHeader);

    const scheduleContent = document.createElement('div');

    if (list.schedule && list.schedule.enabled) {
      const scheduleInfo = document.createElement('div');
      scheduleInfo.className = 'schedule-info';
      const daysText = list.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
      scheduleInfo.innerHTML = `<strong>Active:</strong> ${daysText}<br>${list.schedule.startTime} - ${list.schedule.endTime}`;
      scheduleContent.appendChild(scheduleInfo);
    } else {
      const noSchedule = document.createElement('div');
      noSchedule.style.cssText = 'color: #666; font-size: 11px; margin-bottom: 8px;';
      noSchedule.textContent = 'No schedule configured';
      scheduleContent.appendChild(noSchedule);
    }

    const editScheduleBtn = document.createElement('button');
    editScheduleBtn.className = 'schedule-btn';
    editScheduleBtn.textContent = list.schedule && list.schedule.enabled ? '✏️ Edit Schedule' : '⏰ Add Schedule';
    editScheduleBtn.style.marginTop = '8px';
    editScheduleBtn.addEventListener('click', () => {
      openScheduleModal(list);
    });
    scheduleContent.appendChild(editScheduleBtn);

    scheduleSection.appendChild(scheduleContent);
    contentDiv.appendChild(scheduleSection);

    listDiv.appendChild(contentDiv);

    siteListsContainer.appendChild(listDiv);
  });
}

// Timer Functions
function loadActiveTimer() {
  chrome.runtime.sendMessage({
    action: 'GET_ACTIVE_TIMER'
  }, (response) => {
    if (response && response.success && response.data) {
      showTimerDisplay();
      startTimerUpdates();
    } else {
      showTimerControls();
      populateTimerSiteList();
    }
  });
}

function populateTimerSiteList() {
  chrome.runtime.sendMessage({
    action: 'GET_SITE_LISTS'
  }, (response) => {
    if (response && response.success) {
      const siteLists = response.data;
      timerSiteList.innerHTML = '<option value="">Select a site list</option>';
      
      siteLists.forEach(list => {
        const option = document.createElement('option');
        option.value = list.id;
        option.textContent = `${list.name} (${list.sites.length} sites)`;
        timerSiteList.appendChild(option);
      });
      
      // Enable/disable start button based on available lists
      startTimerBtn.disabled = siteLists.length === 0;
      if (siteLists.length === 0) {
        startTimerBtn.textContent = 'No Site Lists Available';
      } else {
        startTimerBtn.textContent = 'Start Timer';
      }
    }
  });
}

function showTimerControls() {
  timerControls.style.display = 'block';
  timerDisplay.style.display = 'none';
  populateTimerSiteList();
}

function showTimerDisplay() {
  timerControls.style.display = 'none';
  timerDisplay.style.display = 'block';
}

function startTimerUpdates() {
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimerUpdates() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  chrome.runtime.sendMessage({
    action: 'GET_ACTIVE_TIMER'
  }, (response) => {
    if (response && response.success && response.data) {
      const timer = response.data;
      const now = Date.now();
      const elapsed = now - timer.startTime;
      const remaining = Math.max(0, timer.duration - elapsed);
      
      if (remaining === 0) {
        // Timer completed
        showTimerControls();
        stopTimerUpdates();
        alert('🎉 Focus session completed!');
        return;
      }
      
      // Get list name
      chrome.runtime.sendMessage({
        action: 'GET_SITE_LISTS'
      }, (listResponse) => {
        if (listResponse && listResponse.success) {
          const list = listResponse.data.find(l => l.id === timer.siteListId);
          if (list) {
            timerListName.textContent = list.name;
          }
        }
      });
      
      // Update time display in center
      timerCenterTime.textContent = formatTime(remaining);
      
      // Update doughnut progress
      const progress = (elapsed / timer.duration);
      const circumference = 2 * Math.PI * 42; // radius = 42
      const dashArray = circumference;
      const dashOffset = circumference * (1 - progress);
      
      doughnutProgress.style.strokeDasharray = dashArray;
      doughnutProgress.style.strokeDashoffset = dashOffset;
    } else {
      // Timer no longer active
      showTimerControls();
      stopTimerUpdates();
    }
  });
}

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}