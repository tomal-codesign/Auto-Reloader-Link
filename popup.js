const timeInput = document.getElementById("timeInput");
const mainLinkInput = document.getElementById("mainLink");
const nextLinkInput = document.getElementById("nextLink");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const modalStopBtn = document.getElementById("modalStopBtn");
const countdownModal = document.getElementById("countdownModal");
const countdownText = document.getElementById("countdownText");

let activeTabId = null;

// Get current active tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) activeTabId = tabs[0].id;
});

// Start button
startBtn.addEventListener("click", () => {
  const seconds = parseInt(timeInput.value);
  const mainLink = mainLinkInput.value.trim();
  const nextLink = nextLinkInput.value.trim();
  if (!seconds || !mainLink) return;

  chrome.runtime.sendMessage({ action: "start", tabId: activeTabId, seconds, mainLink, nextLink });
});

// Stop button
stopBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "stop", tabId: activeTabId });
});

// Modal stop button
modalStopBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "stop", tabId: activeTabId });
});

// Listen for background messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tabId !== activeTabId) return;

  if (msg.action === "updateCountdown") {
    countdownText.textContent = `Next reload in ${msg.remaining}s`;
    countdownModal.style.display = "flex";
  }

  if (msg.action === "running") {
    startBtn.style.display = "none";
    stopBtn.style.display = "block";
    timeInput.disabled = true;
    mainLinkInput.disabled = true;
    nextLinkInput.disabled = true;
    countdownModal.style.display = "flex";
  }

  if (msg.action === "stopped") {
    startBtn.style.display = "block";
    stopBtn.style.display = "none";
    timeInput.disabled = false;
    mainLinkInput.disabled = false;
    nextLinkInput.disabled = false;
    countdownModal.style.display = "none";
  }
});
