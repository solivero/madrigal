import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { Madrigal } from "@madrigal/core";
import { MadrigalBoard } from "./components/board/MadrigalBoard";
import { Lobby, type Session } from "./components/lobby/Lobby";
import { BotGameClient } from "./components/lobby/BotGameClient";
import { Scenery } from "./components/ui/Scenery";
import { PreparingOverlay } from "./components/ui/PreparingOverlay";
import { SERVER_URL } from "./lib/serverUrl";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const GAME_NAME = "Madrigal";

const OnlineClient = Client({
  game: Madrigal,
  numPlayers: 2,
  debug: false,
  board: MadrigalBoard,
  multiplayer: SocketIO({ server: SERVER_URL }),
});

/** Best-effort: tell boardgame.io we've left the match so the server can
 *  drop our seat (and delete the match once empty). */
async function leaveMatch(session: Session) {
  if (!session.credentials || session.mode === "bot") return;
  try {
    await fetch(
      `${SERVER_URL}/games/${GAME_NAME}/${session.matchID}/leave`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerID: session.playerID,
          credentials: session.credentials,
        }),
      }
    );
  } catch {
    /* ignore — server may be unreachable; the match will time out */
  }
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [preparing, setPreparing] = useState(false);

  // Show "Preparing the field…" briefly after a session is created — long
  // enough to mask the bot worker init and module load, short enough to feel
  // snappy. Master gets a touch more because the worker has heavier MCTS.
  useEffect(() => {
    if (!session) return;
    setPreparing(true);
    const dur =
      session.mode === "bot" && session.difficulty === "master" ? 1400 : 850;
    const t = setTimeout(() => setPreparing(false), dur);
    return () => clearTimeout(t);
  }, [session]);

  const requestLeave = useCallback(() => {
    if (!session) return;
    if (session.mode === "bot") {
      setSession(null);
      return;
    }
    setConfirmLeave(true);
  }, [session]);

  const doLeave = useCallback(async () => {
    if (session) await leaveMatch(session);
    setSession(null);
    setConfirmLeave(false);
  }, [session]);

  return (
    <>
      <Scenery />
      <AnimatePresence mode="wait">
        {session ? (
          <motion.div
            key="game"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {session.mode === "bot" ? (
              <BotGameClient difficulty={session.difficulty ?? "medium"} />
            ) : (
              <OnlineClient
                matchID={session.matchID}
                playerID={session.playerID}
                credentials={session.credentials}
              />
            )}
            <button
              type="button"
              onClick={requestLeave}
              className="fixed top-2 right-2 z-50 rounded-md border border-gold/60 bg-wood-dark/80 px-3 py-1 font-display text-sm text-parchment backdrop-blur hover:bg-burgundy"
            >
              Leave
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="lobby"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Lobby onJoin={setSession} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preparing-the-field splash on session entry */}
      <AnimatePresence>
        {session && preparing && (
          <PreparingOverlay
            subtitle={
              session.mode === "bot"
                ? session.difficulty === "master"
                  ? "Thy foe consults the stars…"
                  : session.difficulty === "hard"
                    ? "Thy foe sharpens its steel."
                    : "Thy foe is summoned."
                : "Awaiting all combatants."
            }
          />
        )}
      </AnimatePresence>

      {/* Confirmation when leaving an online match */}
      <AnimatePresence>
        {confirmLeave && session && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="parchment-panel w-full max-w-sm rounded-lg p-6 text-center"
            >
              <h2 className="font-display text-2xl text-burgundy">
                Abandon the field?
              </h2>
              <p className="font-serif mt-2 text-sm italic text-ink-soft">
                The match will be ended and removed from the lobby.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLeave(false)}
                  className="font-display rounded-md border border-gold-dark/60 bg-parchment-dark/40 px-4 py-2 text-sm text-ink hover:bg-parchment-dark/70"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={doLeave}
                  className="font-display rounded-md border-2 border-gold-dark bg-burgundy px-4 py-2 text-sm text-parchment hover:bg-burgundy-dark"
                >
                  Yes, leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
