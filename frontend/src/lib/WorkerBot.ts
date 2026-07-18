// A boardgame.io-compatible bot that runs MCTS inside a Web Worker so the
// UI thread is never blocked. One worker per difficulty per game session.
//
// Usage:
//   const Cls = createWorkerBotClass("medium");
//   Local({ bots: { "1": Cls } });
//
// boardgame.io's Local transport instantiates the class with
// `{ enumerate, seed, game }`. We ignore `enumerate` because the worker
// imports the game's own enumerate directly.

import BotWorker from "./bot.worker.ts?worker";

type BotKind = "random" | "medium" | "hard" | "master";

/** Minimum "thinking" time per difficulty so the bot doesn't pop moves out
 *  instantaneously. Real MCTS computation may exceed this — we only pad
 *  if the worker returns faster than the floor. A small random jitter
 *  (±15%) helps the bot feel human rather than metronomic. */
const MIN_THINK_MS: Record<BotKind, number> = {
  random: 700,
  medium: 1300,
  hard: 2200,
  master: 3200,
};
function thinkFloor(kind: BotKind) {
  const base = MIN_THINK_MS[kind];
  const jitter = (Math.random() - 0.5) * 0.3 * base; // ±15 %
  return Math.max(0, base + jitter);
}

interface PendingRequest {
  resolve: (value: { action: any }) => void;
  reject: (err: Error) => void;
}

class WorkerBotInstance {
  private worker: Worker;
  private nextRequestId = 1;
  private pending = new Map<number, PendingRequest>();
  private readyPromise: Promise<void>;
  private kind: BotKind;

  constructor(kind: BotKind) {
    this.kind = kind;
    this.worker = new BotWorker();
    this.worker.addEventListener("message", (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "ready") return;
      const handler = this.pending.get(msg.requestId);
      if (!handler) return;
      this.pending.delete(msg.requestId);
      if (msg.type === "error") {
        handler.reject(new Error(msg.error));
      } else {
        handler.resolve({ action: msg.action });
      }
    });

    this.readyPromise = new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data?.type === "ready") {
          this.worker.removeEventListener("message", handler);
          resolve();
        }
      };
      this.worker.addEventListener("message", handler);
    });

    this.worker.postMessage({ type: "init", kind });
  }

  async play(state: any, playerID: string): Promise<{ action: any }> {
    await this.readyPromise;
    const requestId = this.nextRequestId++;
    const start = performance.now();
    const floor = thinkFloor(this.kind);

    const result = await new Promise<{ action: any }>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker.postMessage({ type: "play", requestId, state, playerID });
    });

    // Pad to minimum thinking time so the bot doesn't move instantly.
    const elapsed = performance.now() - start;
    const remaining = floor - elapsed;
    if (remaining > 0) {
      await new Promise((r) => setTimeout(r, remaining));
    }
    return result;
  }

  terminate() {
    this.worker.terminate();
  }
}

export function createWorkerBotClass(kind: BotKind) {
  // boardgame.io will `new` this class with {game, enumerate, seed}. We
  // construct a wrapper that delegates `.play()` to a worker.
  return class {
    private impl: WorkerBotInstance;
    constructor(_opts: any) {
      this.impl = new WorkerBotInstance(kind);
    }
    play(state: any, playerID: string) {
      return this.impl.play(state, playerID);
    }
  };
}
