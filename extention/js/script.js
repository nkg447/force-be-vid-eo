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
    BUTTON_IMAGE: "#enable-btn > img",
    STATUS_TEXT: "#enable-btn > #status"
  },
  
  // Local storage prefix for tab-specific data
  STORAGE_PREFIX: "document-",
  
  // Delay before sending ID to content script (ms)
  SEND_ID_DELAY: 1000
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
 * Clean up localStorage by removing entries for closed tabs
 */
function localStorageCleanup() {
  console.log("Performing localStorage cleanup");
  
  const keys = Object.keys(localStorage);
  const toKeep = [];
  
  chrome.tabs.query({})
    .then((tabs) => {
      // Create list of storage keys for open tabs
      tabs.forEach(tab => {
        toKeep.push(`${CONFIG.STORAGE_PREFIX}${tab.id}`);
      });
      
      // Remove storage for closed tabs
      let removedCount = 0;
      keys.forEach(key => {
        if (!toKeep.includes(key)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      });
      
      console.log(`Cleanup complete: removed ${removedCount} items, kept ${toKeep.length} items`);
    })
    .catch(error => {
      console.error("Error during localStorage cleanup:", error);
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
function sendId(sessionId) {
  console.log(`Preparing to send session ID: ${sessionId}`);
  
  doOnCurrentTab((tab) => {
    console.log(`Sending session ID to tab ${tab.id}`);
    
    chrome.tabs.sendMessage(
      tab.id,
      { id: sessionId },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          // Retry once after a delay
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { id: sessionId });
          }, 2000);
        } else {
          console.log("Content script response:", response);
        }
      }
    );
  });
}

/**
 * Inject required scripts into current tab
 */
function injectScripts() {
  console.log("Injecting content scripts");
  
  doOnCurrentTab((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["./js/external/webrtc-client.0.0.1.js", "./js/common.js"],
    })
    .then(() => {
      console.log("Scripts injected successfully");
    })
    .catch(error => {
      console.error("Script injection failed:", error);
    });
  });
}

/**
 * Configure popup UI for enabled state
 */
function setPopupUI() {
  console.log("Setting up popup UI for enabled state");
  
  // Inject scripts and show connection information
  injectScripts();
  
  // Display connection information
  const connectInfo = document.getElementById(CONFIG.UI.CONNECT_INFO);
  if (connectInfo) {
    connectInfo.style.display = "unset";
  }
  
  // Send the session ID after a short delay
  // This allows time for content scripts to initialize
  setTimeout(() => sendId(uuid), CONFIG.SEND_ID_DELAY);
}

/**
 * Setup enable button click handler
 * @param {string} sessionId - The session identifier to use
 */
function setupEnableButton(sessionId) {
  const enableBtn = document.getElementById(CONFIG.UI.ENABLE_BUTTON);
  if (!enableBtn) {
    console.error("Enable button not found");
    return;
  }
  
  enableBtn.onclick = () => {
    console.log("Enable button clicked");
    
    // Update button UI to show enabled state
    const buttonImage = document.querySelector(CONFIG.UI.BUTTON_IMAGE);
    if (buttonImage) {
      buttonImage.src = "./images/icon/on-button.png";
    }
    
    const statusText = document.querySelector(CONFIG.UI.STATUS_TEXT);
    if (statusText) {
      statusText.innerHTML = "Enabled";
    }
    
    // Show connection information and save state
    setPopupUI();
    
    // Save popup state for this tab
    doOnCurrentTab((tab) => {
      const storageKey = `${CONFIG.STORAGE_PREFIX}${tab.id}`;
      localStorage.setItem(storageKey, document.body.innerHTML);
      console.log(`State saved to localStorage: ${storageKey}`);
    });
  };
}

/**
 * Initialize the extension popup
 */
function initializePopup() {
  console.log("Initializing extension popup");
  
  // Check if current tab is supported
  doOnCurrentTab((tab) => {
    if (isTabSupported(tab)) {
      document.getElementById(CONFIG.UI.ENABLE_BUTTON).style.display = "flex";
    } else {
      document.getElementById(CONFIG.UI.NOT_SUPPORTED).style.display = "unset";
    }
  });
  
  // Restore saved popup state if it exists
  doOnCurrentTab((tab) => {
    const storageKey = `${CONFIG.STORAGE_PREFIX}${tab.id}`;
    const savedHTML = localStorage.getItem(storageKey);
    
    if (savedHTML) {
      console.log(`Restoring saved state for tab ${tab.id}`);
      document.body.innerHTML = savedHTML;
      setPopupUI();
    }
  });
  
  // Set up server information and QR code
  showQR(uuid);
  setupEnableButton(uuid);
  localStorageCleanup();
}

const uuid = generateCode();
console.log(`Generated session code: ${uuid}`);
initializePopup();

// Export functions for debugging or testing
window.extensionUtils = {
  generateCode,
  isTabSupported,
  sendId,
  doOnCurrentTab,
  localStorageCleanup
};