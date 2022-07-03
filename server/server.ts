// src/server.js
import { Server, Origins } from "boardgame.io/server";
import { Madrigal } from "../src/game/game";

const server = Server({
  games: [Madrigal],
  origins: [Origins.LOCALHOST_IN_DEVELOPMENT],
});
const lobbyConfig = {
  apiPort: 8080,
};
const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
server.run({ port, lobbyConfig });
