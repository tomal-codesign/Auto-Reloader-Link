const timeInput = document.getElementById("timeInput");
const mainLinkInput = document.getElementById("mainLink");
const nextLinkInput = document.getElementById("nextLink");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const countdownModal = document.getElementById("countdownModal");
const countdownDisplay = document.getElementById("countdown");
const cancelBtn = document.getElementById("cancelBtn");

// Load saved settings
chrome.storage.local.get(["seconds", "mainLink", "nextLink"], (data) => {
  if (data.seconds) timeInput.value = data.seconds;
  if (data.mainLink) mainLinkInput.value = data.mainLink;
  if (data.nextLink) nextLinkInput.value = data.nextLink;
});

// Start button
startBtn.addEventListener("click", () => {
  const seconds = parseInt(timeInput.value);
  const mainLink = mainLinkInput.value.trim();
  const nextLink = nextLinkInput.value.trim();

  if (!seconds || !mainLink) {
    alert("Enter valid time & main link!");
    return;
  }

  chrome.storage.local.set({ seconds, mainLink, nextLink });

  chrome.runtime.sendMessage({
    action: "start",
    seconds,
    mainLink,
    nextLink
  });
});

// Stop button
stopBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "stop" });
});

// Cancel button in modal
cancelBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "stop" });
});

// Listen for background messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "updateCountdown") {
    countdownDisplay.textContent = `Next reload in ${msg.remaining}s`;
    countdownModal.style.display = "flex"; // show modal
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
    countdownModal.style.display = "none"; // hide modal
  }
});
