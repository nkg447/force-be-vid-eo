const id = new URLSearchParams(window.location.search).get("id");

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
  const next = document.getElementById("next");
  const playPause = document.getElementById("play-pause");
  const play = document.getElementById("play");
  const pause = document.getElementById("pause");
  const previous = document.getElementById("previous");
  const rewind = document.getElementById("rewind");

  let isPaused = true;

  forward.onclick = () => {
    executeCommand("forward");
  };

  next.onclick = () => {
    executeCommand("next");
  };

  previous.onclick = () => {
    executeCommand("previous");
  };

  rewind.onclick = () => {
    executeCommand("rewind");
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

  function executeCommand(command) {
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ command: command, id: id }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((data) => data.text())
      .then(console.log)
      .catch(console.log);
  }
}
