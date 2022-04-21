const SERVER_BASE = "https://forcebevideo.herokuapp.com";
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

  next = () => {
    const title = document.title;
    if (title.includes("stash")) {
      const btn = document.getElementById("playNext");
      if (btn) {
        btn.click();
      } else {
        const id = this.video.src.split("/")[4];
        this.video.src = this.video.src.replace(id, id + 1);
      }
    }
  };

  previous = () => {
    const title = document.title;
    if (title.includes("stash")) {
      const id = this.video.src.split("/")[4];
      this.video.src = this.video.src.replace(id, id - 1);
    }
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

socket.on("forward", ({ data }) => {
  console.log("forward");
  getCurrentPlayer().forward(data);
});

socket.on("rewind", ({ data }) => {
  console.log("rewind");
  getCurrentPlayer().rewind(data);
});

socket.on("louder", ({ data }) => {
  console.log("louder");
  getCurrentPlayer().louder(data);
});

socket.on("quieter", ({ data }) => {
  console.log("quieter");
  getCurrentPlayer().quieter(data);
});

socket.on("faster", ({ data }) => {
  console.log("faster");
  getCurrentPlayer().faster(data);
});

socket.on("slower", ({ data }) => {
  console.log("slower");
  getCurrentPlayer().slower(data);
});

socket.on("next", ({ data }) => {
  console.log("next");
  getCurrentPlayer().next();
});

socket.on("previous", ({ data }) => {
  console.log("previous");
  getCurrentPlayer().previous();
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
  } else if (host.includes("hotstar")) {
    video = document.querySelector(".playing");
  } else if (host.includes("youtube")) {
    video = document.querySelector(".video-stream.html5-main-video");
  } else {
    video = document.querySelector("video");
  }
  return new Player(video);
}
