import { motion } from "framer-motion";
import { Swords } from "lucide-react";

/** Brief "preparing the field" splash shown while the bot worker / online
 *  client warms up. Auto-dismisses via parent's timer or readiness signal. */
export function PreparingOverlay({ subtitle }: { subtitle?: string }) {
  return (
    <motion.div
      key="preparing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, y: 6 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="parchment-panel flex flex-col items-center gap-3 rounded-xl px-10 py-7 text-center shadow-2xl"
      >
        <motion.div
          animate={{ rotate: [0, 12, -12, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex size-12 items-center justify-center rounded-full border-2 border-gold-dark bg-burgundy text-candle"
        >
          <Swords className="size-6" />
        </motion.div>
        <h2 className="font-display text-2xl text-ink">Preparing the field…</h2>
        {subtitle && (
          <p className="font-serif text-sm italic text-ink-soft">
            {subtitle}
          </p>
        )}
        <div className="mt-1 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block size-1.5 rounded-full bg-burgundy"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
