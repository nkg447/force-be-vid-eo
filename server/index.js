const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 4001;
const loggyApiKey = process.env.LOGGY_API_KEY;
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors({ credentials: true }));
const server = http.createServer(app);
const io = socketIo(server, {
  allowEIO3: true,
  cors: {
    origin: true,
    credentials: true,
  },
});
const requestIp = require("request-ip");
app.use(requestIp.mw());
const indexOf = require("lodash/indexOf");
const isEqual = require("lodash/isEqual");
const difference = require("lodash/difference");
const { v4: uuidv4 } = require("uuid");

const JOIN_CODE_MAP = {};

app.use(express.static("./server/public"));

io.on("connection", (socket) => {
  socket.on("create", ({ id, joinCode }) => {
    const clientIp = socket.request.connection.remoteAddress;
    log({ connected: id, clientIp });
    socket.leaveAll();
    socket.join(id);
    JOIN_CODE_MAP[joinCode] = id;
    io.to(id).emit("connection-id", { id: id });
  });
});

app.post("/api", function (req, resp) {
  const ip = req.clientIp;
  const { id, command, ...otherData } = req.body;
  log({ id, command, ip });
  io.to(id).emit(command, { ...otherData });
  resp.send("OK");
});

app.get("/join", function (req, resp) {
  const ip = req.clientIp;
  const joinCode = req.query.code;
  const id = getIdFromJoinCode(joinCode);
  log({ joinCode, id, ip });
  resp.redirect(`/app?id=${id}`);
});

function getIdFromJoinCode(joinCode) {
  const id = JOIN_CODE_MAP[joinCode];
  delete JOIN_CODE_MAP[joinCode];
  return id;
}

function getConnectionId(req) {
  const id = req.body.id;
  return id;
}

function log(data) {
  console.log(data);
  fetch(`http://logs-01.loggly.com/inputs/${loggyApiKey}/tag/http/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
    redirect: "follow",
  })
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));
}

server.listen(port, () => console.log(`Listening on port ${port}`));
