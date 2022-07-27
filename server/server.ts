// src/server.js
import { Server, Origins } from "boardgame.io/server";
import { Madrigal } from "@madrigal/core";

const server = Server({
  games: [Madrigal],
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT,
    "https://madrigal-online.appspot.com",
  ],
});
const lobbyConfig = {
  apiPort: 8080,
};
const port = process.env.PORT ? parseInt(process.env.PORT) : 8000;
console.log("Running server on port", port);
server.run({ port });
