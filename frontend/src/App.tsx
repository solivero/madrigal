import "./App.css";
import React from "react";
import { Client, Lobby } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { Madrigal } from "@madrigal/core";
import { MadrigalBoard } from "./components/MadrigalBoard";

const server =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://backend-dot-madrigal-online.appspot.com";
console.log("Using server", server);
const App = Client({
  game: Madrigal,
  numPlayers: 2,
  debug: true,
  board: MadrigalBoard,
  multiplayer: SocketIO({
    server,
  }),
});
const lobby = () => (
  <Lobby
    gameServer={server}
    lobbyServer={server} //.replace("8000", "8080")}
    debug={true}
    gameComponents={[{ game: Madrigal, board: MadrigalBoard }]}
  />
);

export default lobby;
