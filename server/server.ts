// src/server.js
import { Server, Origins } from "boardgame.io/server";
import { Madrigal } from "../src/game/game";

const server = Server({
  games: [Madrigal],
  origins: [Origins.LOCALHOST],
});
const lobbyConfig = {
  apiPort: 8080,
};
server.run({ port: 8000, lobbyConfig });
