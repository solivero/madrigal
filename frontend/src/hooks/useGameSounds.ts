import { useEffect, useRef } from "react";
import { Howl, Howler } from "howler";
import type { GameState, Player } from "@madrigal/core/dist/models";
import { soundUrl } from "../lib/serverUrl";
import {
  playThwack,
  playPass,
  playPick,
  playRoundChime,
  playFanfare,
} from "../lib/synth";

interface LogAction {
  type: string;
  payload: { type?: string; args?: unknown[] };
}
interface LogEntry {
  action: LogAction;
  turn?: number;
  phase?: string;
}

// Dedupe "missing audio" warnings across all hook instances.
const warnedMissing = new Set<string>();

export function useGameSounds({
  G,
  ctx,
  log,
  muted,
}: {
  G: GameState;
  ctx?: { phase?: string; gameover?: unknown };
  log: readonly LogEntry[] | undefined;
  muted: boolean;
}) {
  // Howl instances cached by card normalised name.
  const howlsRef = useRef<Map<string, Howl>>(new Map());
  // Move signatures we've already played for.
  const seenRef = useRef<Set<string>>(new Set());

  function getOrLoad(name: string): Howl {
    let h = howlsRef.current.get(name);
    if (!h) {
      h = new Howl({
        src: [soundUrl(name)],
        onloaderror: () => {
          if (!warnedMissing.has(name)) {
            warnedMissing.add(name);
            console.debug(
              `[sound] missing audio for '${name}' — using procedural fallback`
            );
          }
        },
      });
      howlsRef.current.set(name, h);
    }
    return h;
  }

  /** Always play the procedural thwack; layer the card's voice MP3 if it
   *  exists. The thwack guarantees feedback even when the MP3 404s. */
  function playForCard(name: string) {
    if (muted) return;
    playThwack({ volume: 0.5 });
    const h = getOrLoad(name);
    const state = h.state();
    if (state === "loaded") {
      h.stop().play();
    } else if (state === "loading") {
      h.once("load", () => {
        if (!muted) h.play();
      });
    }
    // else: 404'd — the thwack is the whole audio. No further action.
  }

  // Preload sounds for cards in hands.
  useEffect(() => {
    if (muted) return;
    const allHands = [
      ...(G.players["0"]?.hand ?? []),
      ...(G.players["1"]?.hand ?? []),
    ];
    const unique = new Set(allHands.map((c) => c.normalizedName));
    for (const name of unique) getOrLoad(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [G.players["0"]?.hand.length, G.players["1"]?.hand.length, muted]);

  // Move sounds — process new log entries.
  useEffect(() => {
    if (muted || !log) return;
    for (let i = 0; i < log.length; i++) {
      const entry = log[i];
      if (!entry || entry.action.type !== "MAKE_MOVE") continue;
      const moveType = entry.action.payload.type;
      const moveArgs = (entry.action.payload.args as unknown[]) ?? [];
      const sig = `${i}-${moveType}-${moveArgs.join("|")}`;
      if (seenRef.current.has(sig)) continue;
      seenRef.current.add(sig);

      if (
        moveType === "playCardFromHand" ||
        moveType === "playCardFromBoard"
      ) {
        const [, boardSlot, boardPlayer] = moveArgs as [
          string,
          number,
          Player,
        ];
        const cardName =
          G.players[boardPlayer]?.board.cardSlots[boardSlot]?.card
            ?.normalizedName;
        if (cardName) {
          playForCard(cardName);
        } else {
          playThwack({ volume: 0.35 });
        }
      } else if (moveType === "pass") {
        playPass();
      } else if (moveType === "selectGraveyardCard") {
        playPick();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.length, muted]);

  // Round transition chime — fires when phase changes (game1 → game2 → game3).
  const prevPhaseRef = useRef(ctx?.phase);
  useEffect(() => {
    if (!muted && ctx?.phase && prevPhaseRef.current !== ctx.phase) {
      if (prevPhaseRef.current) {
        playRoundChime();
      }
      prevPhaseRef.current = ctx.phase;
    }
  }, [ctx?.phase, muted]);

  // End-game fanfare.
  const playedFanfareRef = useRef(false);
  useEffect(() => {
    if (muted) return;
    if (ctx?.gameover !== undefined && !playedFanfareRef.current) {
      const me = G.players["0"];
      const opp = G.players["1"];
      const playerWon = me.games > opp.games;
      playFanfare({ win: playerWon });
      playedFanfareRef.current = true;
    }
    if (ctx?.gameover === undefined) playedFanfareRef.current = false;
  }, [ctx?.gameover, muted, G.players]);

  // Keep Howler global state aligned in case anything outside this hook plays.
  useEffect(() => {
    Howler.mute(muted);
  }, [muted]);
}
