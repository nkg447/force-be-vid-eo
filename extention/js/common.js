class Player {
  constructor(video) {
    this.video = video;
  }

  play = () => {
    this.video.play();
  };

  pause = () => {
    this.video.pause();
  };

  forward = (data) => {
    this.video.currentTime += Number(data);
  };

  rewind = (data) => {
    this.video.currentTime -= Number(data);
  };

  louder = (data) => {
    this.video.volume += Number(data);
  };

  quieter = (data) => {
    this.video.volume -= Number(data);
  };

  faster = (data) => {
    this.video.playbackRate += Number(data);
  };

  slower = (data) => {
    this.video.playbackRate -= Number(data);
  };

  next = () => {};

  previous = () => {};

  fullscreen = () => {
    const videoHolder = this.video;
    if (document.fullScreen) document.cancelFullScreen();
    if (document.webkitIsFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.msIsFullScreen) {
      document.msExitFullscreen();
    } else if (document.mozIsFullScreen) {
      document.mozCancelFullScreen();
    } else {
      if (document.cancelFullScreen) videoHolder.requestFullscreen();
      else if (document.webkitCancelFullScreen)
        videoHolder.webkitRequestFullScreen();
      else if (document.msExitFullscreen) videoHolder.msRequestFullscreen();
      else if (document.mozCancelFullScreen) videoHolder.mozRequestFullScreen();
    }
  };
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Received message from background script:", request);
  const client = new WebRTCClient(
    "https://signallite.nikunjgupta.dev",
    request.id,
    (event) => {
      const { data, type } = JSON.parse(event.data);
      if (type == "play") {
        console.log("playing");
        getCurrentPlayer().play();
      } else if (type == "pause") {
        console.log("pausing");
        getCurrentPlayer().pause();
      } else if (type == "forward") {
        console.log("forwarding");
        getCurrentPlayer().forward(data);
      } else if (type == "rewind") {
        console.log("rewinding");
        getCurrentPlayer().rewind(data);
      } else if (type == "louder") {
        console.log("louder");
        getCurrentPlayer().louder(data);
      } else if (type == "quieter") {
        console.log("quieter");
        getCurrentPlayer().quieter(data);
      } else if (type == "faster") {
        console.log("faster");
        getCurrentPlayer().faster(data);
      } else if (type == "slower") {
        console.log("slower");
        getCurrentPlayer().slower(data);
      } else if (type == "fullscreen") {
        console.log("fullscreen");
        getCurrentPlayer().fullscreen();
      } else if (type == "next") {
        console.log("next");
        getCurrentPlayer().next();
      } else if (type == "previous") {
        console.log("previous");
        getCurrentPlayer().previous();
      } else {
        console.log("Unknown command", type);
      }
    }
  );
  sendResponse("Id Received");
});

function getCurrentPlayer() {
  const host = window.location.host;
  let video = null;
  if (host.includes("netflix")) {
    const videoId = window.location.pathname.split("/")[2];
    video = document
      .evaluate(`//*[@id="${videoId}"]/video`, document)
      .iterateNext();
  } else if (host.includes("primevideo")) {
    video = document.querySelector(".rendererContainer video");
  } else if (host.includes("hotstar")) {
    video = document.querySelector(".playing");
  } else if (host.includes("youtube")) {
    video = document.querySelector(".video-stream.html5-main-video");
  } else {
    video = document.querySelector("video");
  }
  return new Player(video);
}
