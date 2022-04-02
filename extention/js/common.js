const SERVER_BASE = "http://localhost:4001";
const socket = io.connect(SERVER_BASE);

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
}

socket.on("play", (data) => {
  console.log("playing");
  getCurrentPlayer().play();
});

socket.on("pause", (data) => {
  console.log("pause");
  getCurrentPlayer().pause();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  socket.emit("create", { id: request.id, joinCode: request.joinCode });
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
  }
  return new Player(video);
}
