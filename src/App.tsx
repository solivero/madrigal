import "./App.css";
import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { Madrigal } from "./game/game";
import { MadrigalBoard } from "./components/MadrigalBoard";

const server =
  process.env.NODE_ENV === "development"
    ? "localhost:8000"
    : "https://backend-dot-madrigal-online.appspot.com";
const App = Client({
  game: Madrigal,
  numPlayers: 2,
  debug: true,
  board: MadrigalBoard,
  multiplayer: SocketIO({
    server,
  }),
});

export default App;
