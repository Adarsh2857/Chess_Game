const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const chess = new Chess();
let players = {};

io.on("connection", (socket) => {
    console.log("A player connected");

    // Assign player roles
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("playerRole", null);
    }

    // Send board state to player
    socket.emit("boardState", chess.fen());

    // Handle move
    socket.on("move", (move) => {
        if (chess.move(move)) {
            io.emit("move", move);
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("A player disconnected");
        if (players.white === socket.id) players.white = null;
        if (players.black === socket.id) players.black = null;
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
