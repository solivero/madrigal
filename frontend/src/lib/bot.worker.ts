/// <reference lib="webworker" />
import { MCTSBot, RandomBot } from "boardgame.io/ai";
import { Madrigal } from "@madrigal/core";
import type { GameState, Player } from "@madrigal/core/dist/models";

type BotKind = "random" | "medium" | "hard" | "master";

interface InitMessage {
  type: "init";
  kind: BotKind;
}

interface PlayMessage {
  type: "play";
  requestId: number;
  state: any;
  playerID: string;
}

type InMessage = InitMessage | PlayMessage;

let bot: any = null;

// Objectives function: tells MCTS what to optimise for during rollouts.
// Without this, MCTS only sees the binary "game over" signal — which random
// rollouts rarely reach in a meaningful way in Madrigal. With these, the bot
// has dense feedback: "did I end the rollout with more points / more games
// won than the opponent?" — which dramatically improves pass timing and
// general play strength at modest iteration counts.
/** Build a layered objective set. Many thresholds approximate a continuous
 *  gradient — MCTSBot's Objectives only accept binary checkers, so we stack
 *  several at different point/game cut-offs and let weight do the math.
 *  `w` scales the overall importance of the heuristic. */
function buildObjectives(w: number) {
  return (G: GameState, _ctx: any, playerID?: string) => {
    const me = (playerID ?? "0") as Player;
    const opp: Player = me === "0" ? "1" : "0";
    const mine = G.players[me];
    const theirs = G.players[opp];
    const pointMargin = mine.points - theirs.points;
    const handAdvantage = mine.hand.length - theirs.hand.length;
    return {
      // Point-margin ladder (the bot prefers bigger leads)
      lead1:  { checker: () => pointMargin >= 1,  weight: 0.25 * w },
      lead3:  { checker: () => pointMargin >= 3,  weight: 0.35 * w },
      lead6:  { checker: () => pointMargin >= 6,  weight: 0.5 * w },
      lead10: { checker: () => pointMargin >= 10, weight: 0.7 * w },
      lead15: { checker: () => pointMargin >= 15, weight: 0.9 * w },
      // Avoid being far behind
      behind5: { checker: () => pointMargin <= -5, weight: -0.6 * w },
      // Card economy
      handLead:   { checker: () => handAdvantage >= 2, weight: 0.3 * w },
      // Long-game match state
      matchedOrBetterGames: {
        checker: () => mine.games >= theirs.games,
        weight: 0.4 * w,
      },
      aheadInGames: {
        checker: () => mine.games > theirs.games,
        weight: 1.6 * w,
      },
      wonGameOne: {
        checker: () => mine.games >= 1,
        weight: 1.2 * w,
      },
      wonMatch: {
        checker: () => mine.games >= 2,
        weight: 3.0 * w,
      },
    };
  };
}

function makeBot(kind: BotKind): any {
  if (kind === "random") {
    return new RandomBot({ enumerate: Madrigal.ai!.enumerate } as any);
  }
  const cfg =
    kind === "medium"
      ? { iterations: 60, playoutDepth: 14, weight: 1 }
      : kind === "hard"
        ? { iterations: 220, playoutDepth: 24, weight: 1.3 }
        : /* master */ { iterations: 1500, playoutDepth: 50, weight: 2.4 };
  const { weight, ...mctsCfg } = cfg;
  return new MCTSBot({
    game: Madrigal,
    enumerate: Madrigal.ai!.enumerate,
    objectives: buildObjectives(weight),
    ...mctsCfg,
  } as any);
}

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  if (msg.type === "init") {
    bot = makeBot(msg.kind);
    (self as DedicatedWorkerGlobalScope).postMessage({ type: "ready" });
  } else if (msg.type === "play") {
    if (!bot) {
      (self as DedicatedWorkerGlobalScope).postMessage({
        type: "error",
        requestId: msg.requestId,
        error: "Bot not initialised",
      });
      return;
    }
    try {
      const result = await bot.play(msg.state, msg.playerID);
      (self as DedicatedWorkerGlobalScope).postMessage({
        type: "action",
        requestId: msg.requestId,
        action: result.action,
      });
    } catch (err) {
      (self as DedicatedWorkerGlobalScope).postMessage({
        type: "error",
        requestId: msg.requestId,
        error: (err as Error).message,
      });
    }
  }
};

export {};
