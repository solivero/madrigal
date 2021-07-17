import "./App.css";
import { Client } from "boardgame.io/react";
import { Madrigal } from "./game/game";
import { MadrigalBoard } from "./components/MadrigalBoard";

const App = Client({
  game: Madrigal,
  numPlayers: 2,
  debug: true,
  board: MadrigalBoard,
});

export default App;
