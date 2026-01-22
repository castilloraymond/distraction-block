// Audio Mode Content Script
console.log('Audio mode content script loaded for:', window.location.hostname);

// Skip if we're already on the blocked page
const isBlockedPage = window.location.href.includes('blocked.html');
if (isBlockedPage) {
  console.log('On blocked page, skipping checks');
} else {
  // Check immediately if this site should be blocked
  // This is a fallback for when declarativeNetRequest doesn't catch the request
  // (e.g., when served from service worker cache)
  chrome.runtime.sendMessage({
    action: 'CHECK_SHOULD_BLOCK',
    payload: { hostname: window.location.hostname }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error checking block status:', chrome.runtime.lastError);
      return;
    }

    if (response && response.shouldBlock && response.redirectUrl) {
      console.log('Site should be blocked, redirecting...');
      window.location.replace(response.redirectUrl);
      return;
    }

    // If not blocked, proceed with normal page mode checks
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkPageMode);
    } else {
      checkPageMode();
    }
  });
}

function checkPageMode() {
  // First check if temporarily disabled
  chrome.runtime.sendMessage({
    action: 'CHECK_TEMPORARY_WHITELIST',
    payload: { url: window.location.hostname }
  }, (tempResponse) => {
    if (tempResponse && tempResponse.isTemporarilyDisabled) {
      console.log('Audio mode temporarily disabled');
      // Schedule a page reload when the temporary disable expires
      if (tempResponse.remainingTime && tempResponse.remainingTime > 0) {
        console.log('Will re-enable audio mode in', tempResponse.remainingTime, 'ms');
        setTimeout(() => {
          console.log('Temporary disable expired, reloading page...');
          window.location.reload();
        }, tempResponse.remainingTime + 500); // Add 500ms buffer to ensure expiration
      }
      return;
    }
    
    // Check for active timer
    chrome.runtime.sendMessage({
      action: 'GET_ACTIVE_TIMER'
    }, (timerResponse) => {
      if (chrome.runtime.lastError) {
        console.error('Error checking timer:', chrome.runtime.lastError);
        return;
      }
    
    if (timerResponse && timerResponse.success && timerResponse.data) {
      // Timer is active - check if this site is in the timer's list
      const timer = timerResponse.data;
      chrome.runtime.sendMessage({
        action: 'GET_SITE_LISTS'
      }, (listsResponse) => {
        if (listsResponse && listsResponse.success) {
          const activeList = listsResponse.data.find(list => list.id === timer.siteListId);
          if (activeList && activeList.sites.includes(window.location.hostname.replace('www.', ''))) {
            console.log('Site is in active timer list');
            
            // Check if this specific page is allowed
            if (activeList.allowedPages && activeList.allowedPages.length > 0) {
              const pathname = window.location.pathname + window.location.search;
              const isPageAllowed = activeList.allowedPages.some(pattern => {
                if (pattern.startsWith('/')) {
                  return pathname.includes(pattern) || pathname.startsWith(pattern);
                } else {
                  return pathname.includes(pattern);
                }
              });
              
              if (isPageAllowed) {
                console.log('Page is allowed during timer');
                return;
              }
            }
            
            // If audio mode is enabled for the timer list and this is YouTube, show audio overlay
            const isYouTube = window.location.hostname.includes('youtube.com');
            if (activeList.audioMode && isYouTube) {
              console.log('Enabling audio mode for timer list');
              setTimeout(enableAudioMode, 500);
            }
          }
        }
      });
    } else {
      // No active timer - check individual site blocking
      checkIndividualSiteBlocking();
    }
    });
  });
}

function checkIndividualSiteBlocking() {
  chrome.runtime.sendMessage({
    action: 'CHECK_WHITELIST',
    payload: { 
      hostname: window.location.hostname,
      pathname: window.location.pathname + window.location.search
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error checking whitelist:', chrome.runtime.lastError);
      return;
    }
    
    if (response && response.isWhitelisted) {
      console.log('Page is whitelisted, allowing access');
      return;
    }
    
    // If not whitelisted, check for audio mode
    chrome.runtime.sendMessage({
      action: 'CHECK_AUDIO_MODE',
      payload: { url: window.location.hostname }
    }, (audioResponse) => {
      if (chrome.runtime.lastError) {
        console.error('Error checking audio mode:', chrome.runtime.lastError);
        return;
      }
      
      if (audioResponse && audioResponse.isAudioMode) {
        // Only enable audio mode for YouTube sites
        const isYouTube = window.location.hostname.includes('youtube.com');
        if (isYouTube) {
          console.log('Enabling audio mode for:', window.location.hostname);
          setTimeout(enableAudioMode, 500);
        }
      }
    });
  });
}

function enableAudioMode() {
  // Create and inject the audio mode overlay
  const overlay = document.createElement('div');
  overlay.id = 'audio-mode-overlay';
  overlay.innerHTML = `
    <div class="audio-mode-container">
      <div class="audio-mode-icon">🎵</div>
      <h1>Audio Mode Active</h1>
      <p>This site is in audio mode for productivity music.</p>
      <p>Visual content is hidden to prevent distractions.</p>
      <div class="audio-controls-hint">
        <p>Audio controls may be available through:</p>
        <ul>
          <li>Browser media controls</li>
          <li>Keyboard shortcuts (Space, ←, →)</li>
          <li>System media controls</li>
        </ul>
      </div>
      <button id="show-temporarily-btn">
        Show Site Temporarily (1 minute)
      </button>
    </div>
  `;
  
  // Styling for the overlay
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    color: white !important;
  `;
  
  // Container styling
  const containerStyle = `
    .audio-mode-container {
      text-align: center !important;
      max-width: 500px !important;
      padding: 40px !important;
      background: rgba(255,255,255,0.1) !important;
      border-radius: 20px !important;
      backdrop-filter: blur(10px) !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
    }
    .audio-mode-icon {
      font-size: 64px !important;
      margin-bottom: 20px !important;
    }
    .audio-mode-container h1 {
      margin: 0 0 20px 0 !important;
      font-size: 32px !important;
      font-weight: 300 !important;
      color: white !important;
    }
    .audio-mode-container p {
      margin: 10px 0 !important;
      font-size: 16px !important;
      opacity: 0.9 !important;
      color: white !important;
    }
    .audio-controls-hint {
      margin: 30px 0 !important;
      padding: 20px !important;
      background: rgba(255,255,255,0.1) !important;
      border-radius: 10px !important;
    }
    .audio-controls-hint ul {
      text-align: left !important;
      margin: 10px 0 !important;
      padding-left: 20px !important;
    }
    .audio-controls-hint li {
      margin: 5px 0 !important;
      color: white !important;
    }
    .audio-mode-container button {
      margin-top: 20px !important;
      padding: 12px 24px !important;
      background: rgba(255,255,255,0.2) !important;
      border: 1px solid rgba(255,255,255,0.3) !important;
      border-radius: 25px !important;
      color: white !important;
      font-size: 14px !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
    }
    .audio-mode-container button:hover {
      background: rgba(255,255,255,0.3) !important;
      transform: translateY(-2px) !important;
    }
  `;
  
  // Inject styles
  const styleElement = document.createElement('style');
  styleElement.textContent = containerStyle;
  document.head.appendChild(styleElement);
  
  // Hide the body content
  document.body.style.overflow = 'hidden';
  
  // Add the overlay
  document.body.appendChild(overlay);
  
  // Set up the temporary disable button
  const showTemporarilyBtn = document.getElementById('show-temporarily-btn');
  showTemporarilyBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'DISABLE_AUDIO_MODE_TEMPORARILY',
      payload: { url: window.location.hostname }
    }, (response) => {
      if (response && response.success) {
        window.location.reload();
      }
    });
  });
  
  // Set up keyboard shortcuts for audio control
  setupAudioKeyboardShortcuts();
}

function setupAudioKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Only handle if overlay is visible
    if (!document.getElementById('audio-mode-overlay')) return;
    
    switch(e.code) {
      case 'Space':
        e.preventDefault();
        // Try to find and trigger play/pause
        const playButton = document.querySelector('button[aria-label*="play"], button[aria-label*="pause"], .ytp-play-button');
        if (playButton) playButton.click();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        // Previous track/rewind
        const prevButton = document.querySelector('button[aria-label*="previous"], .ytp-prev-button');
        if (prevButton) prevButton.click();
        break;
      case 'ArrowRight':
        e.preventDefault();
        // Next track/forward
        const nextButton = document.querySelector('button[aria-label*="next"], .ytp-next-button');
        if (nextButton) nextButton.click();
        break;
    }
  });
}