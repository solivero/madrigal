// src/server.js
const { Server, Origins } = require("boardgame.io/server");
const { TicTacToe } = require("./src/game/game");

const server = Server({
  games: [TicTacToe],
  origins: [Origins.LOCALHOST],
});

server.run(8000);
