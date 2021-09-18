import "./App.css";
import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { Madrigal } from "./game/game";
import { MadrigalBoard } from "./components/MadrigalBoard";

const App = Client({
  game: Madrigal,
  numPlayers: 2,
  debug: true,
  board: MadrigalBoard,
  multiplayer: SocketIO({ server: "localhost:8000" }),
});

export default App;
