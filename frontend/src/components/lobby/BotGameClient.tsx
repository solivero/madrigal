import { useMemo } from "react";
import { Client } from "boardgame.io/react";
import { Local } from "boardgame.io/multiplayer";
import { Madrigal } from "@madrigal/core";
import { MadrigalBoard } from "../board/MadrigalBoard";
import { createWorkerBotClass } from "../../lib/WorkerBot";

export type BotDifficulty = "easy" | "medium" | "hard" | "master";

export function BotGameClient({
  difficulty,
}: {
  difficulty: BotDifficulty;
}) {
  const C = useMemo(() => {
    const kind =
      difficulty === "easy"
        ? "random"
        : difficulty === "medium"
          ? "medium"
          : difficulty === "hard"
            ? "hard"
            : "master";
    const Bot = createWorkerBotClass(kind);
    return Client({
      game: Madrigal,
      board: MadrigalBoard,
      numPlayers: 2,
      debug: false,
      multiplayer: Local({ bots: { "1": Bot } }),
    });
  }, [difficulty]);

  return <C playerID="0" />;
}
