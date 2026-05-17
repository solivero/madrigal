import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Swords,
  Users,
  Plus,
  RefreshCw,
  Bot,
  Lock,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";
import { SERVER_URL } from "../../lib/serverUrl";
import { Spinner } from "../ui/Spinner";
import { cn } from "../../lib/cn";
import type { BotDifficulty } from "./BotGameClient";

const GAME_NAME = "Madrigal";

interface Match {
  matchID: string;
  players: { id: number; name?: string }[];
  createdAt: number;
  unlisted?: boolean;
  gameover?: unknown;
}

export interface Session {
  matchID: string;
  playerID: string;
  credentials?: string;
  mode?: "online" | "bot";
  difficulty?: BotDifficulty;
  /** True if the session was created with `unlisted: true`. */
  private?: boolean;
}

/** boardgame.io match IDs are long. Show / accept a short 6-char code. */
function shortCode(matchID: string) {
  return matchID.slice(0, 6).toUpperCase();
}

export function Lobby({ onJoin }: { onJoin: (s: Session) => void }) {
  const [name, setName] = useState(
    () => localStorage.getItem("madrigal:name") ?? ""
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botPickerOpen, setBotPickerOpen] = useState(false);
  const [makePrivate, setMakePrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [pendingShare, setPendingShare] = useState<{
    matchID: string;
    playerID: string;
    credentials?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/games/${GAME_NAME}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setError("Could not reach the herald (server). Is it running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, []);

  function rememberName() {
    localStorage.setItem("madrigal:name", name);
  }

  async function createMatch() {
    if (!name.trim()) {
      setError("Enter thy name first.");
      return;
    }
    rememberName();
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/games/${GAME_NAME}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numPlayers: 2, unlisted: makePrivate }),
      });
      const { matchID } = await res.json();
      const credentials = await joinMatchOnly(matchID, "0");
      if (makePrivate) {
        // Hold here and let the user copy the code before entering the game.
        setPendingShare({ matchID, playerID: "0", credentials });
      } else {
        onJoin({
          matchID,
          playerID: "0",
          credentials,
          mode: "online",
        });
      }
    } catch {
      setError("Could not create match.");
    } finally {
      setLoading(false);
    }
  }

  /** Issues a /join and returns the credentials. */
  async function joinMatchOnly(
    matchID: string,
    playerID: string
  ): Promise<string | undefined> {
    rememberName();
    const res = await fetch(
      `${SERVER_URL}/games/${GAME_NAME}/${matchID}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerID, playerName: name || "Sir Unknown" }),
      }
    );
    if (!res.ok) throw new Error("join failed");
    const { playerCredentials } = await res.json();
    return playerCredentials;
  }

  async function joinMatch(matchID: string, playerID: string) {
    try {
      const credentials = await joinMatchOnly(matchID, playerID);
      onJoin({ matchID, playerID, credentials, mode: "online" });
    } catch {
      setError("Could not join.");
    }
  }

  /** Look up a full matchID from a short code via the public list, then
   *  the unlisted list (via direct GET — boardgame.io only returns this if
   *  isGameover is set, so this is best-effort: in practice the server
   *  returns the match for a known ID). */
  async function joinByCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a match code.");
      return;
    }
    if (!name.trim()) {
      setError("Enter thy name first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // First try public list
      const res = await fetch(`${SERVER_URL}/games/${GAME_NAME}`);
      const { matches: pub } = await res.json();
      let candidate: Match | undefined = pub.find(
        (m: Match) => shortCode(m.matchID) === code
      );
      // Fall back to unlisted listing (boardgame.io supports ?isGameover=false&unlisted=true)
      if (!candidate) {
        try {
          const r2 = await fetch(
            `${SERVER_URL}/games/${GAME_NAME}?isGameover=false`
          );
          const d2 = await r2.json();
          candidate = d2.matches.find(
            (m: Match) => shortCode(m.matchID) === code
          );
        } catch {
          /* ignore */
        }
      }
      if (!candidate) {
        // boardgame.io's GET /games/:name/:id returns the match if it exists,
        // even unlisted. But we don't have the full id from a code alone, so
        // we ask the user to enter the full ID as a fallback.
        if (code.length > 6) {
          // Treat as full match ID
          const seatRes = await fetch(
            `${SERVER_URL}/games/${GAME_NAME}/${code}`
          );
          if (seatRes.ok) {
            candidate = await seatRes.json();
          }
        }
      }
      if (!candidate) {
        setError("No match found for that code.");
        return;
      }
      const openSeat = candidate.players.find((p) => !p.name);
      if (!openSeat) {
        setError("That match is full.");
        return;
      }
      await joinMatch(candidate.matchID, String(openSeat.id));
    } catch {
      setError("Could not find the match.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  function enterMatch() {
    if (!pendingShare) return;
    onJoin({
      matchID: pendingShare.matchID,
      playerID: pendingShare.playerID,
      credentials: pendingShare.credentials,
      mode: "online",
      private: true,
    });
    setPendingShare(null);
  }

  return (
    <div className="min-h-full safe-top safe-bottom px-4 py-8 sm:px-8 md:px-[160px]">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto mb-8 max-w-3xl text-center"
      >
        <motion.img
          src="/crest.svg"
          alt=""
          className="mx-auto h-20 w-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <h1 className="font-display gilded mt-4 text-5xl sm:text-7xl">
          Madrigal
        </h1>
        <p className="font-serif mt-2 italic text-parchment-dark">
          A duel of wit, courtiers, and steel.
        </p>
      </motion.header>

      <section className="parchment-panel mx-auto max-w-2xl rounded-lg p-6 sm:p-8">
        <label className="block">
          <span className="font-display text-sm uppercase tracking-widest text-ink-soft">
            Thy name, traveller
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sir Lancelot"
            className="font-serif mt-2 w-full rounded-md border border-gold-dark/60 bg-parchment/60 px-4 py-2 text-lg text-ink placeholder:text-ink/40 focus:border-burgundy focus:outline-none"
          />
        </label>

        {/* Private-match toggle row */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-gold-dark/40 bg-parchment/50 px-3 py-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={makePrivate}
              onChange={(e) => setMakePrivate(e.target.checked)}
              className="size-4 accent-burgundy"
            />
            <Lock className="size-3.5 text-ink-soft" />
            <span className="font-display text-sm text-ink">
              Private match
            </span>
          </label>
          <span className="font-serif text-[0.65rem] italic text-ink-soft">
            {makePrivate
              ? "Friends will need a code to join."
              : "Anyone can join from the public list."}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={createMatch}
            disabled={loading}
            className="group flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-gold-dark bg-burgundy px-4 py-3 font-display text-parchment shadow-md transition hover:bg-burgundy-dark hover:shadow-lg disabled:opacity-50"
          >
            {makePrivate ? (
              <Lock className="size-4" />
            ) : (
              <Plus className="size-4 transition group-hover:rotate-90" />
            )}
            New {makePrivate ? "Private" : ""} Match
          </button>
          <button
            type="button"
            onClick={() => setBotPickerOpen((o) => !o)}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-gold-dark bg-moss px-4 py-3 font-display text-parchment shadow-md transition hover:bg-moss/80"
          >
            <Bot className="size-4" />
            Play vs Bot
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-md border border-gold-dark/60 bg-parchment-dark/40 px-4 py-3 font-display text-ink hover:bg-parchment-dark/70"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Join-by-code row */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.toUpperCase().slice(0, 12))
              }
              placeholder="Enter match code"
              className="font-display w-full rounded-md border border-gold-dark/60 bg-parchment/60 py-2 pl-9 pr-3 text-sm uppercase tracking-[0.18em] text-ink placeholder:text-ink/40 placeholder:tracking-normal focus:border-burgundy focus:outline-none"
              maxLength={12}
            />
          </div>
          <button
            type="button"
            onClick={joinByCode}
            disabled={!joinCode.trim() || loading}
            className="flex items-center justify-center gap-2 rounded-md border-2 border-gold-dark bg-wood-dark px-4 py-2 font-display text-sm text-parchment hover:bg-wood disabled:opacity-40"
          >
            <Swords className="size-3.5" /> Join with code
          </button>
        </div>

        <AnimatePresence>
          {botPickerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="rounded-md border border-gold-dark/40 bg-parchment/50 p-3">
                <p className="font-display text-xs uppercase tracking-widest text-ink-soft">
                  Choose thy foe
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      {
                        id: "easy",
                        title:
                          "Plays uniformly at random. No reasoning. Beats nobody.",
                      },
                      {
                        id: "medium",
                        title:
                          "MCTS — 60 simulations per move, depth 14. Beats Random ~85% of games. Thinks ~1–2 s.",
                      },
                      {
                        id: "hard",
                        title:
                          "MCTS — 180 simulations per move, depth 22, with point-margin heuristic. Thinks ~3–6 s.",
                      },
                      {
                        id: "master",
                        title:
                          "MCTS — 500 simulations per move, depth 36, aggressive winning-line objectives. Thinks ~6–12 s.",
                      },
                    ] as Array<{ id: BotDifficulty; title: string }>
                  ).map(({ id, title }) => (
                    <button
                      key={id}
                      type="button"
                      title={title}
                      onClick={() =>
                        onJoin({
                          matchID: "local",
                          playerID: "0",
                          mode: "bot",
                          difficulty: id,
                        })
                      }
                      className="font-display rounded border border-gold-dark/60 bg-parchment-dark/40 px-2 py-1.5 text-sm text-ink capitalize hover:bg-burgundy hover:text-parchment"
                    >
                      {id}
                    </button>
                  ))}
                </div>
                <p className="font-serif mt-2 text-[0.7rem] italic text-ink-soft">
                  Hover each option for details. Easy = random; Medium / Hard
                  use Monte-Carlo Tree Search with varying depth.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="font-serif mt-4 rounded border border-burgundy/40 bg-burgundy/10 p-3 text-sm text-burgundy">
            {error}
          </p>
        )}

        <div className="mt-8">
          <h2 className="font-display flex items-center gap-2 text-xl text-ink">
            <Users className="size-5" /> Open matches
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {matches.length === 0 && !loading && (
              <p className="font-serif italic text-ink-soft">
                No quests await. Forge one above.
              </p>
            )}
            {loading && matches.length === 0 && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {matches.map((m) => {
              const openSeat = m.players.find((p) => !p.name);
              const full = !openSeat;
              return (
                <motion.div
                  key={m.matchID}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between gap-3 rounded-md border border-gold-dark/40 bg-parchment/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-display flex items-center gap-2 text-sm text-ink">
                      <span>Match</span>
                      <span className="font-mono rounded bg-wood-dark/15 px-1.5 py-0.5 text-[0.7rem] tracking-[0.15em] text-ink">
                        {shortCode(m.matchID)}
                      </span>
                    </div>
                    <div className="font-serif truncate text-xs text-ink-soft">
                      {m.players
                        .map((p) => p.name ?? "(open seat)")
                        .join(" vs ")}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={full || !name.trim()}
                    onClick={() =>
                      openSeat &&
                      joinMatch(m.matchID, String(openSeat.id))
                    }
                    className="flex shrink-0 items-center gap-1 rounded-md border border-gold-dark bg-moss px-3 py-1.5 font-display text-sm text-parchment hover:bg-moss/80 disabled:opacity-40"
                  >
                    <Swords className="size-3.5" />
                    {full ? "Full" : "Join"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="font-serif mx-auto mt-8 max-w-2xl text-center text-xs italic text-parchment-dark/60"
      >
        Open both match links in two tabs to play against thyself in practice.
      </motion.footer>

      {/* Private-match share-code modal */}
      <AnimatePresence>
        {pendingShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="parchment-panel w-full max-w-md rounded-lg p-6 text-center"
            >
              <Lock className="mx-auto size-6 text-burgundy" />
              <h2 className="font-display mt-2 text-2xl text-ink">
                Private match created
              </h2>
              <p className="font-serif mt-1 text-sm italic text-ink-soft">
                Share this code with a friend so they may join.
              </p>
              <button
                type="button"
                onClick={() => copyCode(shortCode(pendingShare.matchID))}
                className="mt-4 mx-auto flex items-center gap-3 rounded-lg border-2 border-gold-dark bg-parchment-dark/60 px-5 py-3 hover:bg-parchment-dark/80"
              >
                <span className="font-display text-3xl tracking-[0.3em] text-burgundy">
                  {shortCode(pendingShare.matchID)}
                </span>
                {copied ? (
                  <Check className="size-5 text-moss" />
                ) : (
                  <Copy className="size-5 text-ink-soft" />
                )}
              </button>
              <p className="font-serif mt-3 text-[0.7rem] italic text-ink-soft">
                {copied ? "Copied to clipboard." : "Tap to copy."}
              </p>
              <button
                type="button"
                onClick={enterMatch}
                className="font-display mt-5 inline-flex items-center gap-2 rounded-md border-2 border-gold-dark bg-burgundy px-6 py-2.5 text-parchment hover:bg-burgundy-dark"
              >
                Enter the lists
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
