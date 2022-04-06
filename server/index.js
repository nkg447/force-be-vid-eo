const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 4001;
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
const indexOf = require("lodash/indexOf");
const isEqual = require("lodash/isEqual");
const difference = require("lodash/difference");
const { v4: uuidv4 } = require("uuid");

const JOIN_CODE_MAP = {};

app.use(express.static("./server/public"));

io.on("connection", (socket) => {

  socket.on("create", ({ id, joinCode }) => {
    console.log("client connected", id);
    socket.leaveAll();
    socket.join(id);
    JOIN_CODE_MAP[joinCode] = id;
    io.to(id).emit("connection-id", { id: id });
  });
});

app.post("/api", function (req, resp) {
  const {id, command, ...otherData} = req.body;
  console.log(id, command);
  io.to(id).emit(command, { ...otherData });
  resp.send("OK");
});

app.get("/join", function (req, resp) {
  const joinCode = req.query.code;
  const id = getIdFromJoinCode(joinCode);
  console.log(joinCode, id);
  resp.redirect(`/?id=${id}`);
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

server.listen(port, () => console.log(`Listening on port ${port}`));
