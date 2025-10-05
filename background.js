let tabsState = {};

// Helper: safe sendMessage to avoid "Receiving end does not exist" error
function safeSendMessage(message) {
  try {
    chrome.runtime.sendMessage(message, () => {
      if (chrome.runtime.lastError) {
        // No receiver, safe to ignore
      }
    });
  } catch (e) {
    // ignore any unexpected error
  }
}

// Listen for popup messages
chrome.runtime.onMessage.addListener((msg, sender) => {
  const tabId = msg.tabId;
  if (!tabId) return;

  if (msg.action === "start") {
    if (tabsState[tabId]?.isRunning) return;

    tabsState[tabId] = {
      isRunning: true,
      seconds: msg.seconds,
      remaining: msg.seconds,
      mainLink: msg.mainLink,
      nextLink: msg.nextLink || msg.mainLink,
      currentLink: msg.mainLink,
      intervalId: null
    };

    startTabCountdown(tabId);
  }

  if (msg.action === "stop") stopTab(tabId);
});

// Countdown & auto-reload logic
function startTabCountdown(tabId) {
  const state = tabsState[tabId];
  if (!state) return;

  state.intervalId = setInterval(() => {
    state.remaining--;
    sendCountdown(tabId, state.remaining);

    if (state.remaining <= 0) {
      state.remaining = state.seconds;
      state.currentLink = state.currentLink === state.mainLink ? state.nextLink : state.mainLink;

      // Safely update tab
      try {
        chrome.tabs.get(tabId, (tab) => {
          try {
            if (chrome.runtime.lastError || !tab) {
              stopTab(tabId);
              return;
            }

            chrome.tabs.update(tabId, { url: state.currentLink }, () => {
              if (chrome.runtime.lastError) stopTab(tabId);
            });
          } catch (e) { }
        });
      } catch (e) { }
    }
  }, 1000);

  sendRunningStatus(tabId);
}

// Stop auto-reloader for a tab
function stopTab(tabId) {
  const state = tabsState[tabId];
  if (!state) return;

  clearInterval(state.intervalId);
  delete tabsState[tabId];
  sendStoppedStatus(tabId);
}

// Messaging helpers
function sendCountdown(tabId, remaining) {
  safeSendMessage({ action: "updateCountdown", tabId, remaining });
}

function sendRunningStatus(tabId) {
  safeSendMessage({ action: "running", tabId });
}

function sendStoppedStatus(tabId) {
  safeSendMessage({ action: "stopped", tabId });
}

// Cleanup if tab is closed manually
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabsState[tabId]) stopTab(tabId);
});
