/**
 * WebRTC Media Player Controller
 * 
 * This script handles the WebRTC connection for a shared media player experience.
 * It extracts the session ID from URL parameters, establishes a WebRTC connection,
 * and provides controls for a synchronized media playback experience.
 */

// Configuration constants
const CONFIG = {
  SIGNALING_SERVER: "https://signallite.nikunjgupta.dev",
  SEEK_TIME: 30,          // Time to seek forward/backward in seconds
  VOLUME_STEP: 0.1,       // Volume adjustment step
  PLAYBACK_RATE_STEP: 0.1 // Playback speed adjustment step
};

// Initialize variables
let channel = null;
let isPaused = true;

// Extract session ID from URL parameters
const sessionId = new URLSearchParams(window.location.search).get("id");
console.log(`Session ID: ${sessionId ? sessionId : 'None - Join mode active'}`);

/**
 * Initialize the WebRTC client connection
 * @param {string} id - The session identifier
 * @returns {Object} - The WebRTC client instance
 */
function initializeWebRTCClient(id) {
  if (!id) {
    console.log("No session ID provided, skipping WebRTC initialization");
    return null;
  }
  
  console.log(`Initializing WebRTC client for session: ${id}`);
  
  try {
    const client = new WebRTCClient(
      CONFIG.SIGNALING_SERVER,
      id,
      (event) => {
        // Event handler for WebRTC events
        console.log(`WebRTC event received:`, event);
      },
      (c) => {
        // Channel handler
        console.log("Data channel established successfully");
        channel = c;
      }
    );
    
    // Create and send offer to establish connection
    client.createOffer();
    return client;
  } catch (error) {
    console.error("Failed to initialize WebRTC client:", error);
    showErrorMessage("Connection failed. Please try again.");
    return null;
  }
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
  // Implementation for showing error messages
  console.error(`ERROR: ${message}`);
  // Could add DOM-based error message display here
}

/**
 * Initialize the player UI and controls
 */
function enablePlayer() {
  console.log("Setting up player controls");
  
  // Get all control elements
  const controls = {
    forward: document.getElementById("forward"),
    playPause: document.getElementById("play-pause"),
    play: document.getElementById("play"),
    pause: document.getElementById("pause"),
    rewind: document.getElementById("rewind"),
    louder: document.getElementById("louder"),
    quieter: document.getElementById("quieter"),
    faster: document.getElementById("faster"),
    slower: document.getElementById("slower"),
    previous: document.getElementById("previous"),
    next: document.getElementById("next"),
    fullscreen: document.getElementById("fullscreen")
  };
  
  // Validate all required elements exist
  for (const [key, element] of Object.entries(controls)) {
    if (!element) {
      console.error(`Missing control element: ${key}`);
    }
  }

  // Set up event handlers for controls
  
  // Time controls
  controls.forward.onclick = () => {
    executeCommand("forward", { data: CONFIG.SEEK_TIME });
    console.log(`Seeking forward ${CONFIG.SEEK_TIME} seconds`);
  };

  controls.rewind.onclick = () => {
    executeCommand("rewind", { data: CONFIG.SEEK_TIME });
    console.log(`Seeking backward ${CONFIG.SEEK_TIME} seconds`);
  };

  // Volume controls
  controls.quieter.onclick = () => {
    executeCommand("quieter", { data: CONFIG.VOLUME_STEP });
    console.log(`Decreasing volume by ${CONFIG.VOLUME_STEP}`);
  };

  controls.louder.onclick = () => {
    executeCommand("louder", { data: CONFIG.VOLUME_STEP });
    console.log(`Increasing volume by ${CONFIG.VOLUME_STEP}`);
  };

  // Playback rate controls
  controls.faster.onclick = () => {
    executeCommand("faster", { data: CONFIG.PLAYBACK_RATE_STEP });
    console.log(`Increasing playback rate by ${CONFIG.PLAYBACK_RATE_STEP}`);
  };

  controls.slower.onclick = () => {
    executeCommand("slower", { data: CONFIG.PLAYBACK_RATE_STEP });
    console.log(`Decreasing playback rate by ${CONFIG.PLAYBACK_RATE_STEP}`);
  };

  // Navigation controls
  controls.next.onclick = () => {
    executeCommand("next");
    console.log("Navigating to next item");
  };

  controls.previous.onclick = () => {
    executeCommand("previous");
    console.log("Navigating to previous item");
  };

  // Display controls
  controls.fullscreen.onclick = () => {
    executeCommand("fullscreen");
    console.log("Toggling fullscreen mode");
  };

  // Play/Pause control
  controls.playPause.onclick = () => {
    if (isPaused) {
      executeCommand("play");
      console.log("Play command sent");
    } else {
      executeCommand("pause");
      console.log("Pause command sent");
    }
    
    // Toggle pause state and update UI
    isPaused = !isPaused;
    if (isPaused) {
      controls.pause.hidden = true;
      controls.play.hidden = false;
    } else {
      controls.pause.hidden = false;
      controls.play.hidden = true;
    }
  };
}

/**
 * Send a command to the remote peer via the WebRTC data channel
 * @param {string} command - The command to execute
 * @param {Object} data - Additional data for the command
 */
function executeCommand(command, data = {}) {
  if (!channel) {
    console.error("Cannot execute command: Data channel not established");
    return;
  }
  
  try {
    const message = JSON.stringify({
      type: command,
      data: data,
    });
    
    channel.send(message);
    console.log(`Command sent: ${command}`, data);
  } catch (error) {
    console.error(`Failed to send command ${command}:`, error);
  }
}

/**
 * Load and set SVG icons for all elements with the 'icon' class
 */
function setAllIcons() {
  console.log("Loading SVG icons");
  const icons = document.getElementsByClassName("icon");
  
  for (let i = 0; i < icons.length; i++) {
    const iconElement = icons[i];
    const src = iconElement.attributes.src.value;
    
    fetch(src)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load icon: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "image/svg+xml");
        iconElement.append(doc.documentElement);
      })
      .catch(error => {
        console.error(`Error loading icon from ${src}:`, error);
        // Add fallback icon or placeholder
      });
  }
}

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded, initializing application");
  
  // Load SVG icons
  setAllIcons();
  
  // Initialize UI based on session ID
  if (sessionId) {
    console.log("Session ID found, enabling player mode");
    document.getElementById("player").style.display = "flex";
    
    // Initialize WebRTC and player controls
    initializeWebRTCClient(sessionId);
    enablePlayer();
  } else {
    console.log("No session ID found, enabling join mode");
    document.getElementById("join").style.display = "unset";
  }
});

// Export functions for potential reuse or testing
window.playerUtils = {
  executeCommand,
  initializeWebRTCClient
};