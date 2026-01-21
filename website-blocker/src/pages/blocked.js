// Periodically check if timer is still active
function checkTimerStatus() {
  chrome.runtime.sendMessage({
    action: 'GET_ACTIVE_TIMER'
  }, (response) => {
    // If no active timer, this page should not be blocking anymore
    if (response && response.success && !response.data) {
      console.log('No active timer found, attempting to navigate away...');
      // Try to go back, or show a message
      document.getElementById('block-title').textContent = 'Timer Ended';
      document.getElementById('block-message').innerHTML =
        'The focus timer has ended. This site should no longer be blocked.<br><br>' +
        '<a href="#" id="go-back-link">Go Back</a> or try refreshing your browser.';
      document.getElementById('go-back-link').addEventListener('click', (e) => {
        e.preventDefault();
        history.back();
      });
    }
  });
}

// Check timer status every 5 seconds
setInterval(checkTimerStatus, 5000);

// Check for active timer
chrome.runtime.sendMessage({
  action: 'GET_ACTIVE_TIMER'
}, (response) => {
  if (response && response.success && response.data) {
    const timer = response.data;
    document.getElementById('block-title').textContent = 'Timer Active - Site Blocked';
    document.getElementById('timer-info').style.display = 'block';
    document.getElementById('block-message').textContent = 'This site is blocked as part of your focus session.';

    // Get list name
    chrome.runtime.sendMessage({
      action: 'GET_SITE_LISTS'
    }, (listResponse) => {
      if (listResponse && listResponse.success) {
        const list = listResponse.data.find(l => l.id === timer.siteListId);
        if (list) {
          document.getElementById('timer-list-name').textContent = `Focus List: ${list.name}`;
        }
      }
    });

    // Update remaining time
    function updateRemainingTime() {
      const now = Date.now();
      const remaining = Math.max(0, timer.duration - (now - timer.startTime));

      if (remaining === 0) {
        console.log('Timer reached 0, reloading page...');
        location.reload();
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      let timeString;
      if (hours > 0) {
        timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      document.getElementById('timer-remaining').textContent = `Time Remaining: ${timeString}`;
    }

    updateRemainingTime();
    setInterval(updateRemainingTime, 1000);

    // Handle end timer button
    document.getElementById('end-timer-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to end the focus timer early?')) {
        chrome.runtime.sendMessage({
          action: 'STOP_TIMER'
        }, (stopResponse) => {
          if (stopResponse && stopResponse.success) {
            console.log('Timer stopped successfully, reloading...');
            location.reload();
          }
        });
      }
    });
  } else {
    // No active timer, check for active schedules
    chrome.runtime.sendMessage({
      action: 'GET_ACTIVE_SCHEDULED_LISTS'
    }, (scheduleResponse) => {
      if (scheduleResponse && scheduleResponse.success && scheduleResponse.data && scheduleResponse.data.length > 0) {
        const scheduledList = scheduleResponse.data[0];
        document.getElementById('block-title').textContent = 'Scheduled Block Active';
        document.getElementById('schedule-info').style.display = 'block';
        document.getElementById('block-message').textContent = 'This site is blocked according to your schedule.';
        document.getElementById('schedule-list-name').textContent = `Schedule: ${scheduledList.name}`;
        document.getElementById('schedule-time-range').textContent =
          `${scheduledList.schedule.startTime} - ${scheduledList.schedule.endTime}`;
      } else {
        // No active timer or schedule
        console.log('No active timer or schedule on initial load');
        checkTimerStatus();
      }
    });
  }
});
