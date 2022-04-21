const id = new URLSearchParams(window.location.search).get("id");
const SEEK_TIME = 30;
const VOLUME_SEEK = 0.1;
const PLAYBACK_SEEK = 0.1;
setAllIcons();
document.addEventListener("DOMContentLoaded", () => {
  if (id != null) {
    document.getElementById("player").style.display = "flex";
    enablePlayer();
  } else {
    document.getElementById("join").style.display = "unset";
  }
});

function enablePlayer() {
  const forward = document.getElementById("forward");
  const playPause = document.getElementById("play-pause");
  const play = document.getElementById("play");
  const pause = document.getElementById("pause");
  const rewind = document.getElementById("rewind");
  const louder = document.getElementById("louder");
  const quieter = document.getElementById("quieter");
  const faster = document.getElementById("faster");
  const slower = document.getElementById("slower");
  const previous = document.getElementById("previous");
  const next = document.getElementById("next");

  let isPaused = true;

  forward.onclick = () => {
    executeCommand("forward", { data: SEEK_TIME });
  };

  quieter.onclick = () => {
    executeCommand("quieter", { data: VOLUME_SEEK });
  };

  louder.onclick = () => {
    executeCommand("louder", { data: VOLUME_SEEK });
  };

  faster.onclick = () => {
    executeCommand("faster", { data: PLAYBACK_SEEK });
  };

  slower.onclick = () => {
    executeCommand("slower", { data: PLAYBACK_SEEK });
  };

  next.onclick = () => {
    executeCommand("next");
  };

  previous.onclick = () => {
    executeCommand("previous");
  };

  rewind.onclick = () => {
    executeCommand("rewind", { data: SEEK_TIME });
  };

  playPause.onclick = () => {
    if (isPaused) executeCommand("play");
    else executeCommand("pause");
    isPaused = !isPaused;
    if (isPaused) {
      pause.hidden = true;
      play.hidden = false;
    } else {
      pause.hidden = false;
      play.hidden = true;
    }
  };

  function executeCommand(command, data = {}) {
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ ...data, command: command, id: id }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((data) => data.text())
      .then(console.log)
      .catch(console.log);
  }
}
function setAllIcons() {
  let icons = document.getElementsByClassName("icon");
  for (let i = 0; i < icons.length; i++) {
    const src = icons[i].attributes.src.value;
    fetch(src)
      .then((data) => data.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "image/svg+xml");
        icons[i].append(doc.documentElement);
      });
  }
}
