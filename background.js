chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm fired:', alarm.name);
  
  if (alarm.name.startsWith('task-')) {
    chrome.storage.local.get(['tasks', 'customSound'], async (result) => {
      const tasks = result.tasks || [];
      const taskId = parseInt(alarm.name.split('-')[1]);
      const task = tasks.find(t => t.id === taskId);

      if (task) {
        console.log('Task found, showing notification:', task.text);
        
        // 1. Play Sound
        await playSound(result.customSound); // Pass custom sound if exists

        // 2. Show Notification
        chrome.notifications.create(alarm.name, {
          type: 'basic',
          iconUrl: 'icon.png',
          title: 'Brainbrio Reminder',
          message: task.text,
          priority: 2,
          requireInteraction: true,
          buttons: [{ title: 'Stop Alarm' }]
        });
      }
    });
  }
});

// Handle Notification Button Click (Stop Alarm)
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // 'Stop Alarm' button
    stopSound();
    chrome.notifications.clear(notificationId);
  }
});

// Handle Notification Close (User clicks X or closes it)
chrome.notifications.onClosed.addListener((notificationId) => {
  stopSound();
});

// --- Offscreen Audio Logic ---
async function playSound(customSoundData) {
  const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
  
  // Check if offscreen doc exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Notification sound',
    });
  }
  
  const source = customSoundData || 'default'; 
  
  if (source !== 'default') {
      try {
        chrome.runtime.sendMessage({
            type: 'play-sound',
            target: 'offscreen',
            source: source
        });
      } catch (e) {
        console.error('Error sending audio message:', e);
      }
  }
}

async function stopSound() {
  try {
    chrome.runtime.sendMessage({
      type: 'stop-sound',
      target: 'offscreen'
    });
  } catch (e) {
    // Ignore error if offscreen is closed or message fails
  }
}
