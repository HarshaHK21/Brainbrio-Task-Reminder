let activeAudio = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'play-sound') {
    playAudio(msg.source);
    sendResponse(true);
  } else if (msg.type === 'stop-sound') {
    stopAudio();
    sendResponse(true);
  }
});

function playAudio(source) {
  stopAudio(); // Stop any currently playing audio first
  activeAudio = new Audio(source);
  activeAudio.play();
}

function stopAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
}
