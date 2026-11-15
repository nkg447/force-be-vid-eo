/**
 * Chrome Extension Background Script
 * 
 * This script handles the popup UI and communication with content scripts
 * for a browser extension that enables synchronized video playback
 * across multiple platforms via WebRTC.
 */

const CONFIG = {
  SERVER_BASE: "https://nikunjgupta.dev/force-be-vid-eo/app",
  
  // List of supported streaming platforms and local development environments
  SUPPORTED_PLATFORMS: [
    "https://www.netflix.com",
    "https://www.hotstar.com",
    "https://www.primevideo.com",
    "https://www.youtube.com",
    "file://",
    "http://localhost:3000",
  ],
  
  // UI element IDs for easier maintenance
  UI: {
    ENABLE_BUTTON: "enable-btn",
    NOT_SUPPORTED: "not-supported",
    CONNECT_INFO: "connect-info",
    QR_CODE: "qr",
    QR_LINK: "qr-link",
    CONNECTION_STATUS: "connection-status",
    INVITE_INFO: "invite-info",
    BUTTON_IMAGE: "#enable-btn > img",
    STATUS_TEXT: "#enable-btn > #status"
  }
};

/**
 * Generate a cryptographically secure 6-character alphanumeric session code
 * @returns {string} A random 6-char uppercase alphanumeric code (e.g. "X4R9KP")
 */
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
};

/**
 * Execute a callback function on the current active tab
 * @param {Function} callback - Function to execute with the tab object
 */
function doOnCurrentTab(callback) {
  console.log("Querying for current active tab");
  
  chrome.tabs
    .query({
      active: true,
      currentWindow: true,
    })
    .then((tabs) => {
      if (tabs && tabs.length > 0) {
        console.log("Current tab:", tabs[0].url);
        callback(tabs[0]);
      } else {
        console.error("No active tab found");
      }
    })
    .catch(error => {
      console.error("Error querying tabs:", error);
    });
}

/**
 * Check if the current tab is on a supported platform
 * @param {Object} tab - Chrome tab object
 * @returns {boolean} Whether the tab URL is supported
 */
function isTabSupported(tab) {
  if (!tab || !tab.url) {
    console.warn("Invalid tab or missing URL");
    return false;
  }
  
  for (const platform of CONFIG.SUPPORTED_PLATFORMS) {
    if (tab.url.startsWith(platform)) {
      console.log(`Supported platform detected: ${platform}`);
      return true;
    }
  }
  
  console.log(`Unsupported URL: ${tab.url}`);
  return false;
}

/**
 * Generate and display QR code for connection
 * @param {string} sessionId - The session identifier to encode in the QR
 */
function showQR(sessionId) {
  const link = `${CONFIG.SERVER_BASE}?id=${sessionId}`;
  console.log(`Generating QR code for: ${link}`);
  
  try {
    // Create QR code using QRious library
    const qr = new QRious({
      element: document.getElementById(CONFIG.UI.QR_CODE),
      size: 150,
      value: link,
      background: "#ffffff",
      foreground: "black",
      level: "H" // High error correction
    });
    
    // Set text link as fallback
    const linkElement = document.getElementById(CONFIG.UI.QR_LINK);
    if (linkElement) {
      linkElement.innerText = link;
      linkElement.href = link;
    }
    
    console.log("QR code generated successfully");
  } catch (error) {
    console.error("Error generating QR code:", error);
    // Fallback for QR generation failure
    const qrElement = document.getElementById(CONFIG.UI.QR_CODE);
    if (qrElement) {
      qrElement.insertAdjacentHTML('afterend', 
        `<p class="error">QR generation failed. Use link below:</p>`);
    }
  }
}

/**
 * Send session ID to content script
 * @param {string} sessionId - The session identifier to send
 */
function sendId(sessionId, tabId) {
  console.log(`Preparing to send session ID: ${sessionId}`);
  chrome.tabs.sendMessage(tabId, { id: sessionId }, (response) => {
    if (chrome.runtime.lastError || (typeof response === 'string' && response.startsWith('Error:'))) {
      console.error("Error initializing connection:", chrome.runtime.lastError || response);
      updateConnectionStatus(5);
    } else {
      console.log("Content script response:", response);
    }
  });
}

/**
 * Inject required scripts into current tab
 */
function injectScripts(tabId, sessionId) {
  console.log("Injecting content scripts");
  chrome.scripting.executeScript({
    target: { tabId },
    files: ["./js/external/webrtc-client.js", "./js/common.js"],
  })
    .then(() => {
      console.log("Scripts injected successfully");
      sendId(sessionId, tabId);
    })
    .catch(error => {
      console.error("Script injection failed:", error);
      updateConnectionStatus(5);
      const enableBtn = document.getElementById(CONFIG.UI.ENABLE_BUTTON);
      enableBtn.onclick = () => setupConnection(tabId, sessionId);
    });
}

function updateConnectionStatus(stage) {
  const statuses = {
    0: "Disconnected",
    1: "Waiting for peer...",
    2: "Connected",
    3: "Connected (signaling offline)",
    4: "Reconnecting...",
    5: "Connection failed"
  };
  document.getElementById(CONFIG.UI.CONNECTION_STATUS).textContent = statuses[stage] || "Connecting...";
  document.getElementById(CONFIG.UI.INVITE_INFO).hidden = stage === 2 || stage === 3;
}

function showEnabled(sessionId, stage) {
  const enableBtn = document.getElementById(CONFIG.UI.ENABLE_BUTTON);
  enableBtn.onclick = null;
  document.querySelector(CONFIG.UI.BUTTON_IMAGE).src = "./images/icon/on-button.png";
  document.querySelector(CONFIG.UI.STATUS_TEXT).textContent = "Enabled";
  document.getElementById(CONFIG.UI.CONNECT_INFO).style.display = "unset";
  showQR(sessionId);
  updateConnectionStatus(stage);
}

function setupConnection(tabId, sessionId) {
  activeSessionId = sessionId;
  showEnabled(sessionId, 1);
  injectScripts(tabId, sessionId);
}

/**
 * Initialize the extension popup
 */
function initializePopup() {
  console.log("Initializing extension popup");
  doOnCurrentTab((tab) => {
    if (!isTabSupported(tab)) {
      document.getElementById(CONFIG.UI.NOT_SUPPORTED).style.display = "unset";
      return;
    }
    activeTabId = tab.id;
    const enableBtn = document.getElementById(CONFIG.UI.ENABLE_BUTTON);
    enableBtn.style.display = "flex";
    chrome.tabs.sendMessage(tab.id, { type: 'get-connection-status' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.id) {
        enableBtn.onclick = () => setupConnection(tab.id, generateCode());
        return;
      }
      activeSessionId = response.id;
      showEnabled(response.id, response.stage);
    });
  });
}

let activeTabId = null;
let activeSessionId = null;
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'connection-status' && sender.tab &&
      sender.tab.id === activeTabId && message.id === activeSessionId) {
    updateConnectionStatus(message.stage);
  }
});
initializePopup();

// Export functions for debugging or testing
window.extensionUtils = {
  generateCode,
  isTabSupported,
  sendId,
  doOnCurrentTab
};