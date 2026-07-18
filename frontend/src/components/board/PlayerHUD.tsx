import { motion } from "framer-motion";
import { Crown, Coins } from "lucide-react";
import type { PlayerState } from "@madrigal/core/dist/models";
import { cn } from "../../lib/cn";

interface Props {
  player: PlayerState;
  name: string;
  isCurrent: boolean;
  side: "top" | "bottom";
}

export function PlayerHUD({ player, name, isCurrent }: Props) {
  return (
    <motion.div
      animate={
        isCurrent
          ? {
              boxShadow: [
                "0 0 0 0 rgba(255,216,122,0)",
                "0 0 16px 2px rgba(255,216,122,0.35)",
                "0 0 0 0 rgba(255,216,122,0)",
              ],
            }
          : {}
      }
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "parchment-panel flex items-center gap-2.5 rounded-full px-2.5 py-1.5"
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full border",
          isCurrent
            ? "border-candle bg-burgundy text-candle"
            : "border-gold-dark/60 bg-parchment-dark/60 text-ink-soft"
        )}
        aria-hidden
      >
        <Crown className="size-3.5" />
      </span>
      <div className="font-display flex items-center gap-2 text-sm leading-none text-ink">
        <span className="truncate">{name}</span>
        {/* Passed pill always rendered (visibility toggled) so width stays
             constant when transitioning from playing → passed. */}
        <span
          className={cn(
            "font-display flex items-center gap-1 rounded-full border border-burgundy bg-burgundy/15 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.15em] text-burgundy transition-opacity",
            player.passed ? "opacity-100" : "invisible opacity-0"
          )}
          aria-hidden={!player.passed}
        >
          <span className="size-1.5 rounded-full bg-burgundy" />
          passed
        </span>
      </div>
      <span className="font-display flex items-center gap-1 text-xs text-ink-soft">
        <Coins className="size-3 text-gold-dark" />
        <span className="tabular-nums">{player.points}</span>
      </span>
      <div
        className="flex items-center gap-0.5"
        aria-label={`${player.games} of 2 games won`}
        title="Best of three"
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className={cn(
              "size-1.5 rounded-full border",
              i < player.games
                ? "bg-burgundy border-burgundy shadow-[0_0_4px_rgba(255,216,122,0.7)]"
                : "bg-transparent border-gold-dark/60"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}
