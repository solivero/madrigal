import { motion, AnimatePresence } from "framer-motion";
import type { Card } from "@madrigal/core/dist/models";
import { cardImageUrl } from "../../lib/serverUrl";
import { cardDescriptions } from "../../lib/cardCopy";
import { cn } from "../../lib/cn";

interface Props {
  card?: Card;
  /**
   * When true, render as a floating overlay anchored to the top-right of
   * the viewport (used for hover preview during play).
   * When false, render inline (legacy / mobile drawer use).
   */
  floating?: boolean;
}

export function CardDetail({ card, floating }: Props) {
  const content = card ? (
    <div
      className={cn(
        "parchment-panel rounded-lg p-3 shadow-2xl",
        floating ? "w-56" : "min-h-[18rem]"
      )}
    >
      <div
        className="aspect-[2/3] w-full overflow-hidden rounded-md border-2"
        style={{ borderColor: `var(--color-card-${card.color})` }}
      >
        <img
          src={cardImageUrl(card.color, card.normalizedName)}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <h3 className="font-display mt-2 text-base text-ink">{card.name}</h3>
      <p className="font-serif mt-1 text-[0.7rem] leading-snug text-ink-soft">
        {cardDescriptions[card.name]}
      </p>
      <div className="font-display mt-2 flex items-baseline gap-2 text-[0.7rem]">
        <span className="text-ink-soft">Base</span>
        <span>{card.basePoints}</span>
        <span className="ml-3 text-ink-soft">Now</span>
        <span
          className={cn(
            "text-sm",
            card.points > card.basePoints ? "gilded font-bold" : "text-ink"
          )}
        >
          {card.points}
        </span>
      </div>
      {Object.keys(card.effects).length > 0 && (
        <ul className="font-serif mt-1.5 space-y-0.5 text-[0.65rem]">
          {Object.entries(card.effects).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span className="text-ink-soft">{k}</span>
              <span className={v! > 0 ? "text-moss" : "text-burgundy"}>
                {v! > 0 ? "+" : ""}
                {v}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  if (!floating) {
    return (
      <div className="parchment-panel min-h-[18rem] rounded-lg p-4">
        <AnimatePresence mode="wait">
          {card ? (
            content
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif text-center italic text-ink-soft/60"
            >
              Tap a card to study it.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {card && (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 md:block"
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
