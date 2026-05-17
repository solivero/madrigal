import { Client } from "boardgame.io/client";
import { Local } from "boardgame.io/multiplayer";
import { RandomBot, MCTSBot } from "boardgame.io/ai";
import { Madrigal } from "./game";
import type { GameState, Player } from "./models";

export type BotKind = "random" | "mcts";

export interface SimResult {
  winner: Player | null;
  turns: number;
  crashed?: string;
  finalPoints: { "0": number; "1": number };
  finalGames: { "0": number; "1": number };
}

interface SimOptions {
  bot0?: BotKind;
  bot1?: BotKind;
  seed?: string | number;
  maxTurns?: number;
  iterations?: number;
}

function botClass(kind: BotKind, iterations: number): any {
  if (kind === "random") return RandomBot;
  class TunedMCTS extends MCTSBot {
    constructor(opts: any) {
      super({ ...opts, iterations, playoutDepth: 20 });
    }
  }
  return TunedMCTS;
}

export async function runSimulation(
  opts: SimOptions = {}
): Promise<SimResult> {
  const {
    bot0 = "random",
    bot1 = "random",
    seed,
    maxTurns = 1000,
    iterations = 50,
  } = opts;

  const bots = {
    "0": botClass(bot0, iterations),
    "1": botClass(bot1, iterations),
  };

  const client = Client({
    game: Madrigal,
    multiplayer: Local({ bots }),
    playerID: "0",
  });

  client.start();

  let turns = 0;
  let crashed: string | undefined;

  try {
    await new Promise<void>((resolve) => {
      const start = Date.now();
      const tick = () => {
        const state = client.getState();
        if (!state) {
          setTimeout(tick, 10);
          return;
        }
        if (state.ctx.gameover !== undefined) {
          return resolve();
        }
        if (turns >= maxTurns) {
          crashed = `Exceeded ${maxTurns} turns`;
          return resolve();
        }
        if (Date.now() - start > 60_000) {
          crashed = "Wall-clock timeout (60s)";
          return resolve();
        }
        turns = state.ctx.turn ?? turns;
        setTimeout(tick, 5);
      };
      tick();
    });
  } catch (e) {
    crashed = (e as Error).message;
  }

  const state = client.getState();
  const G = state?.G as GameState | undefined;
  const p0 = G?.players[0];
  const p1 = G?.players[1];

  let winner: Player | null = null;
  if (p0 && p1) {
    if (p0.games > p1.games) winner = "0";
    else if (p1.games > p0.games) winner = "1";
  }

  client.stop();

  return {
    winner,
    turns,
    crashed,
    finalPoints: { "0": p0?.points ?? 0, "1": p1?.points ?? 0 },
    finalGames: { "0": p0?.games ?? 0, "1": p1?.games ?? 0 },
  };
}
