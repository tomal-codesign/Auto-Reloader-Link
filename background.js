let intervalId;
let isRunning = false;
let remaining = 0;
let currentLink = "";
let mainLink = "";
let nextLink = "";
let seconds = 60;
let activeTabId = null;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "start") {
    if (isRunning) return;
    isRunning = true;

    seconds = msg.seconds;
    mainLink = msg.mainLink;
    nextLink = msg.nextLink;
    currentLink = mainLink;
    remaining = seconds;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) activeTabId = tabs[0].id;
      sendRunningStatus();
      startCountdown();
    });
  }

  if (msg.action === "stop") stopReload();
});

function startCountdown() {
  if (!isRunning) return;

  // Clear any existing interval
  clearInterval(intervalId);

  intervalId = setInterval(() => {
    remaining--;
    sendCountdown(remaining);

    if (remaining <= 0) {
      // Reset timer
      remaining = seconds;

      // Switch link
      currentLink = currentLink === mainLink ? nextLink || mainLink : mainLink;

      // Navigate tab safely
      if (activeTabId !== null) {
        chrome.tabs.get(activeTabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            stopReload();
            return;
          }
          chrome.tabs.update(activeTabId, { url: currentLink }, () => {
            // do nothing, countdown continues
          });
        });
      }
    }
  }, 1000);
}

function stopReload() {
  clearInterval(intervalId);
  isRunning = false;
  activeTabId = null;
  sendStoppedStatus();
}

function sendCountdown(value) {
  chrome.runtime.sendMessage({ action: "updateCountdown", remaining: value }, () => {
    if (chrome.runtime.lastError) return; // ignore if popup closed
  });
}

function sendRunningStatus() {
  chrome.runtime.sendMessage({ action: "running" }, () => {
    if (chrome.runtime.lastError) return;
  });
}

function sendStoppedStatus() {
  chrome.runtime.sendMessage({ action: "stopped" }, () => {
    if (chrome.runtime.lastError) return;
  });
}
