import { motion } from "framer-motion";
import { Crown, Swords, RotateCcw } from "lucide-react";
import type { GameState, Player } from "@madrigal/core/dist/models";
import { cn } from "../../lib/cn";

interface Props {
  G: GameState;
  gameover: unknown;
  playerID: Player;
  onLeave?: () => void;
}

export function EndGameOverlay({ G, gameover, playerID, onLeave }: Props) {
  const me = G.players[playerID];
  const oppId: Player = playerID === "0" ? "1" : "0";
  const opp = G.players[oppId];

  const playerWon = me.games > opp.games;
  const tied = me.games === opp.games;
  const message =
    typeof gameover === "string"
      ? gameover
      : playerWon
        ? "Victory is thine!"
        : tied
          ? "An even match."
          : "Thy foe prevails.";

  const subtitle = playerWon
    ? "The realm sings thy name."
    : tied
      ? "Honour preserved on both sides."
      : "Sharpen thy steel for the rematch.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="parchment-panel relative mx-4 max-w-md rounded-xl p-6 text-center sm:p-10"
      >
        {/* big crown for victory, crossed swords otherwise */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 18,
            delay: 0.15,
          }}
          className={cn(
            "mx-auto mb-4 flex size-20 items-center justify-center rounded-full border-2",
            playerWon
              ? "border-candle bg-burgundy text-candle shadow-[0_0_60px_rgba(255,216,122,0.6)]"
              : "border-gold-dark/70 bg-ink/40 text-parchment"
          )}
        >
          {playerWon ? (
            <Crown className="size-10" />
          ) : (
            <Swords className="size-9" />
          )}
        </motion.div>

        <h2
          className={cn(
            "font-display text-4xl sm:text-5xl",
            playerWon ? "gilded" : "text-burgundy"
          )}
        >
          {message}
        </h2>
        <p className="font-serif mt-2 italic text-ink-soft">{subtitle}</p>

        {/* score summary */}
        <div className="font-display mx-auto mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-ink-soft">
              You
            </div>
            <div className="text-3xl">{me.games}</div>
          </div>
          <div className="font-serif text-ink-soft">vs</div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-ink-soft">
              Opponent
            </div>
            <div className="text-3xl">{opp.games}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onLeave) {
              onLeave();
            } else {
              window.location.reload();
            }
          }}
          className="font-display mt-7 inline-flex items-center gap-2 rounded-md border-2 border-gold-dark bg-burgundy px-6 py-2.5 text-parchment shadow-md transition hover:bg-burgundy-dark hover:shadow-lg"
        >
          <RotateCcw className="size-4" />
          Return to the lobby
        </button>
      </motion.div>
    </motion.div>
  );
}
