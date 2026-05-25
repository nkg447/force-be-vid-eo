/**
 * Enhanced Video Player Class
 * 
 * This module provides a standardized interface for controlling video playback
 * across different streaming platforms through a Chrome extension.
 * It handles common video operations and platform-specific implementations.
 */

// Configuration constants
const CONFIG = {
  // Default step values for various operations
  DEFAULT_VOLUME_STEP: 0.1,
  DEFAULT_PLAYBACK_STEP: 0.1,
  DEFAULT_SEEK_TIME: 10,
  // Signaling server for WebRTC communication
  SIGNALING_SERVER: "https://signallite.nikunjgupta.dev",
  // Supported streaming platforms and their selectors
  PLATFORMS: {
    NETFLIX: {
      domain: "netflix",
      getVideo: (videoId) => document.evaluate(`//*[@id="${videoId}"]/video`, document).iterateNext()
    },
    PRIME: {
      domain: "primevideo",
      getVideo: () => document.querySelector(".rendererContainer video")
    },
    HOTSTAR: {
      domain: "hotstar",
      getVideo: () => document.querySelector(".playing")
    },
    YOUTUBE: {
      domain: "youtube",
      getVideo: () => document.querySelector(".video-stream.html5-main-video")
    }
  }
};

/**
 * Player class for controlling video playback with extensive logging and validation
 */
class Player {
  /**
   * Create a new Player instance
   * @param {HTMLVideoElement} video - The video element to control
   */
  constructor(video) {
    this.video = video;
    
    // Validate video element
    if (!video) {
      console.error("Player initialization failed: No video element provided");
    } else {
      console.log("Player initialized with video element:", video);
    }
    
    // Store initial state for logging changes
    this.initialState = {
      volume: video ? video.volume : null,
      playbackRate: video ? video.playbackRate : null
    };
  }

  /**
   * Play the video
   * @returns {Promise|undefined} - The play promise or undefined if video is invalid
   */
  play = () => {
    if (!this.validateVideo("play")) return;
    
    console.log("Playing video");
    try {
      const playPromise = this.video.play();
      
      // Handle play promise (required for some browsers)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing video:", error);
          // Autoplay might be blocked, add user interaction handling if needed
        });
      }
      
      return playPromise;
    } catch (error) {
      console.error("Exception while playing video:", error);
    }
  };

  /**
   * Pause the video
   */
  pause = () => {
    if (!this.validateVideo("pause")) return;
    
    console.log("Pausing video");
    try {
      this.video.pause();
    } catch (error) {
      console.error("Error pausing video:", error);
    }
  };

  /**
   * Seek forward in the video
   * @param {number|string} data - Seconds to seek forward
   */
  forward = (data) => {
    if (!this.validateVideo("forward")) return;
    
    try {
      const seconds = Number(data) || CONFIG.DEFAULT_SEEK_TIME;
      const oldTime = this.video.currentTime;
      const newTime = Math.min(oldTime + seconds, this.video.duration);
      
      this.video.currentTime = newTime;
      console.log(`Seeking forward ${seconds}s: ${oldTime.toFixed(1)}s → ${newTime.toFixed(1)}s`);
    } catch (error) {
      console.error("Error seeking forward:", error);
    }
  };

  /**
   * Seek backward in the video
   * @param {number|string} data - Seconds to seek backward
   */
  rewind = (data) => {
    if (!this.validateVideo("rewind")) return;
    
    try {
      const seconds = Number(data) || CONFIG.DEFAULT_SEEK_TIME;
      const oldTime = this.video.currentTime;
      const newTime = Math.max(oldTime - seconds, 0);
      
      this.video.currentTime = newTime;
      console.log(`Seeking backward ${seconds}s: ${oldTime.toFixed(1)}s → ${newTime.toFixed(1)}s`);
    } catch (error) {
      console.error("Error seeking backward:", error);
    }
  };

  /**
   * Increase video volume
   * @param {number|string} data - Volume increment (0-1 scale)
   */
  louder = (data) => {
    if (!this.validateVideo("louder")) return;
    
    try {
      const increment = Number(data) || CONFIG.DEFAULT_VOLUME_STEP;
      const oldVolume = this.video.volume;
      const newVolume = Math.min(oldVolume + increment, 1.0);
      
      this.video.volume = newVolume;
      console.log(`Increasing volume by ${increment.toFixed(2)}: ${oldVolume.toFixed(2)} → ${newVolume.toFixed(2)}`);
    } catch (error) {
      console.error("Error increasing volume:", error);
    }
  };

  /**
   * Decrease video volume
   * @param {number|string} data - Volume decrement (0-1 scale)
   */
  quieter = (data) => {
    if (!this.validateVideo("quieter")) return;
    
    try {
      const decrement = Number(data) || CONFIG.DEFAULT_VOLUME_STEP;
      const oldVolume = this.video.volume;
      const newVolume = Math.max(oldVolume - decrement, 0.0);
      
      this.video.volume = newVolume;
      console.log(`Decreasing volume by ${decrement.toFixed(2)}: ${oldVolume.toFixed(2)} → ${newVolume.toFixed(2)}`);
    } catch (error) {
      console.error("Error decreasing volume:", error);
    }
  };

  /**
   * Increase playback speed
   * @param {number|string} data - Playback rate increment
   */
  faster = (data) => {
    if (!this.validateVideo("faster")) return;
    
    try {
      const increment = Number(data) || CONFIG.DEFAULT_PLAYBACK_STEP;
      const oldRate = this.video.playbackRate;
      const newRate = oldRate + increment;
      
      this.video.playbackRate = newRate;
      console.log(`Increasing playback rate by ${increment.toFixed(2)}: ${oldRate.toFixed(2)}x → ${newRate.toFixed(2)}x`);
    } catch (error) {
      console.error("Error increasing playback rate:", error);
    }
  };

  /**
   * Decrease playback speed
   * @param {number|string} data - Playback rate decrement
   */
  slower = (data) => {
    if (!this.validateVideo("slower")) return;
    
    try {
      const decrement = Number(data) || CONFIG.DEFAULT_PLAYBACK_STEP;
      const oldRate = this.video.playbackRate;
      const newRate = Math.max(oldRate - decrement, 0.1); // Prevent negative or zero playback rate
      
      this.video.playbackRate = newRate;
      console.log(`Decreasing playback rate by ${decrement.toFixed(2)}: ${oldRate.toFixed(2)}x → ${newRate.toFixed(2)}x`);
    } catch (error) {
      console.error("Error decreasing playback rate:", error);
    }
  };

  /**
   * Navigate to next video in playlist (platform-specific implementation)
   * Placeholder for future implementation
   */
  next = () => {
    console.log("Next video function called - implementation is platform-specific");
    // Placeholder for implementation based on platform
    // This could trigger navigation buttons or API calls depending on platform
  };

  /**
   * Navigate to previous video in playlist (platform-specific implementation)
   * Placeholder for future implementation
   */
  previous = () => {
    console.log("Previous video function called - implementation is platform-specific");
    // Placeholder for implementation based on platform
  };

  /**
   * Toggle fullscreen mode with cross-browser support
   */
  fullscreen = () => {
    if (!this.validateVideo("fullscreen")) return;
    
    try {
      const videoElement = this.video;
      
      // Check if currently in fullscreen mode
      const isFullScreen = 
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      
      console.log(`Fullscreen toggle: current state is ${isFullScreen ? 'fullscreen' : 'normal'}`);
      
      if (isFullScreen) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        console.log("Exiting fullscreen mode");
      } else {
        // Enter fullscreen
        if (videoElement.requestFullscreen) {
          videoElement.requestFullscreen();
        } else if (videoElement.webkitRequestFullscreen) {
          videoElement.webkitRequestFullscreen();
        } else if (videoElement.mozRequestFullScreen) {
          videoElement.mozRequestFullScreen();
        } else if (videoElement.msRequestFullscreen) {
          videoElement.msRequestFullscreen();
        }
        console.log("Entering fullscreen mode");
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };
  
  /**
   * Validate video element before performing operations
   * @param {string} operation - Name of the operation being performed
   * @returns {boolean} - Whether the video element is valid
   */
  validateVideo(operation) {
    if (!this.video) {
      console.error(`Cannot ${operation}: No valid video element found`);
      return false;
    }
    
    if (!(this.video instanceof HTMLVideoElement)) {
      console.warn(`Warning: ${operation} - Element may not be a proper video element`);
    }
    
    return true;
  }
}

/**
 * Get the appropriate video player for the current website
 * @returns {Player} A Player instance for the detected video element
 */
function getCurrentPlayer() {
  const host = window.location.host;
  console.log(`Detecting video player for: ${host}`);
  
  let video = null;
  
  // Check for platform-specific video elements
  if (host.includes(CONFIG.PLATFORMS.NETFLIX.domain)) {
    const videoId = window.location.pathname.split("/")[2];
    console.log(`Detected Netflix, looking for video with ID: ${videoId}`);
    video = CONFIG.PLATFORMS.NETFLIX.getVideo(videoId);
  } else if (host.includes(CONFIG.PLATFORMS.PRIME.domain)) {
    console.log("Detected Amazon Prime Video");
    video = CONFIG.PLATFORMS.PRIME.getVideo();
  } else if (host.includes(CONFIG.PLATFORMS.HOTSTAR.domain)) {
    console.log("Detected Hotstar");
    video = CONFIG.PLATFORMS.HOTSTAR.getVideo();
  } else if (host.includes(CONFIG.PLATFORMS.YOUTUBE.domain)) {
    console.log("Detected YouTube");
    video = CONFIG.PLATFORMS.YOUTUBE.getVideo();
  } else {
    console.log("Unknown platform, looking for any video element");
    video = document.querySelector("video");
  }
  
  if (!video) {
    console.error("No video element found on the page");
  } else {
    console.log("Video element found:", video);
  }
  
  return new Player(video);
}

/**
 * Process a command received via WebRTC
 * @param {Object} message - The parsed message object
 * @param {string} message.type - Command type
 * @param {*} message.data - Command data
 */
function processCommand(message) {
  const { data, type } = message;
  console.log(`Processing command: ${type}`, data);
  
  const player = getCurrentPlayer();
  
  const commandMap = {
    play: () => player.play(),
    pause: () => player.pause(),
    forward: () => player.forward(data),
    rewind: () => player.rewind(data),
    louder: () => player.louder(data),
    quieter: () => player.quieter(data),
    faster: () => player.faster(data),
    slower: () => player.slower(data),
    fullscreen: () => player.fullscreen(),
    next: () => player.next(),
    previous: () => player.previous()
  };
  
  if (commandMap[type]) {
    commandMap[type]();
  } else {
    console.warn(`Unknown command received: ${type}`);
  }
}

// Listen for messages from the extension background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Received message from background script:", request);
  
  try {
    if (!request || !request.id) {
      console.error("Invalid message format, missing ID");
      sendResponse("Error: Invalid message format");
      return;
    }
    
    console.log(`Initializing WebRTC client with ID: ${request.id}`);
    
    // Initialize WebRTC client for communication
    const client = new WebRTCClient(
      CONFIG.SIGNALING_SERVER,
      request.id,
      (event) => {
        try {
          console.log("WebRTC data received:", event.data);
          const message = JSON.parse(event.data);
          processCommand(message);
        } catch (error) {
          console.error("Error processing WebRTC message:", error);
        }
      }
    );
    
    sendResponse("ID Received Successfully");
  } catch (error) {
    console.error("Error in message handler:", error);
    sendResponse("Error: " + error.message);
  }
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Export key functions for testing or external access
window.videoPlayerUtils = {
  Player,
  getCurrentPlayer,
  processCommand
};