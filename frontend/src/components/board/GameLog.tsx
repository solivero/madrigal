import { motion, AnimatePresence } from "framer-motion";
import { Scroll } from "lucide-react";
import type { GameEvent } from "@madrigal/core/dist/models";

export function GameLog({ events }: { events: GameEvent[] | undefined }) {
  const items = (events ?? []).slice(-12).reverse();
  return (
    <div className="parchment-panel flex h-full flex-col rounded-lg p-3">
      <h3 className="font-display mb-2 flex items-center gap-2 text-sm uppercase tracking-widest text-ink-soft">
        <Scroll className="size-4" /> Chronicle
      </h3>
      <div className="font-serif flex-1 space-y-1 overflow-y-auto text-xs leading-snug text-ink">
        <AnimatePresence initial={false}>
          {items.map((e, i) => (
            <motion.div
              key={`${e.time}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="font-mono text-[0.6rem] text-ink-soft/70">
                {e.time
                  ? new Date(e.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>{" "}
              <span className="font-display text-burgundy">P{e.player}</span>{" "}
              {e.description}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
