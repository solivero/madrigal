import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Card as CardType } from "@madrigal/core/dist/models";
import { Card } from "./Card";
import { cn } from "../../lib/cn";

interface Props {
  hand: CardType[];
  hidden?: boolean;
  onSelect?: (card: CardType) => void;
  onHover?: (card: CardType | null) => void;
  onDragStart?: (card: CardType) => void;
  onDragEnd?: (card: CardType, point: { x: number; y: number }) => void;
  draggable?: boolean;
  activeCardId?: string;
  label?: string;
  /** "xs" for face-down opponent cards, "md" for the player's hand. */
  size?: "xs" | "sm" | "md";
  /** When true, the hand fans out in a gentle curve (Hearthstone-style).
   *  Only applied when there are 2+ cards. */
  curved?: boolean;
}

/** Compute rotation + Y offset for each card so the hand fans out in an arc.
 *  Center card is at 0°, outer cards tilt away symmetrically and dip lower. */
function fanTransform(idx: number, total: number) {
  if (total < 2) return { rotate: 0, y: 0 };
  const center = (total - 1) / 2;
  const offset = idx - center; // signed offset from centre
  // Less sweep when many cards (avoid extreme angles)
  const angleStep = Math.min(4.5, 24 / Math.max(total, 1));
  const rotate = offset * angleStep;
  // Parabolic dip — outer cards sit lower than the centre
  const y = Math.abs(offset) * Math.abs(offset) * 1.2;
  return { rotate, y };
}

export function Hand({
  hand,
  hidden,
  onSelect,
  onHover,
  onDragStart,
  onDragEnd,
  draggable,
  activeCardId,
  label,
  size = "md",
  curved,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const total = hand.length;

  // Negative margin so cards overlap like a Hearthstone fan. Tighter overlap
  // for face-down opponent hand; player hand overlaps more as count grows.
  const overlap =
    size === "xs"
      ? Math.min(28, Math.max(8, total * 2))
      : Math.min(46, Math.max(12, (total - 4) * 6 + 16));

  return (
    <div
      className={cn(
        "hand-strip flex w-full items-end justify-center px-2 pb-1",
        // Opponent (xs/hidden) gets a tighter, no-headroom layout;
        // player hand reserves room above for hover-lift.
        size === "xs" ? "pt-1" : "pt-6",
        // While any card is being dragged, allow it to escape horizontally
        draggingId && "hand-strip-dragging"
      )}
      aria-label={label}
      onMouseLeave={() => {
        if (draggingId) return;
        onHover?.(null);
      }}
    >
      {/* popLayout makes an exiting card pop out of the layout immediately,
          so its absence does not shift siblings while it animates out. */}
      <AnimatePresence initial={false} mode="popLayout">
        {hand.map((card, idx) => {
          const fan = curved ? fanTransform(idx, total) : { rotate: 0, y: 0 };
          const isDragging = draggingId === card.id;
          const center = (total - 1) / 2;
          // Cards closer to the centre stack higher so the fan reads correctly.
          const stackZ = 10 + Math.round(20 - Math.abs(idx - center));
          // `layout` triggers per-frame layout measurements; disable it on the
          // dragged card so framer-motion isn't measuring sibling positions
          // while the user is moving the pointer.
          const anyDragging = draggingId != null;
          return (
            <motion.div
              key={card.id}
              layout={!anyDragging}
              initial={{ y: 60 + fan.y, opacity: 0, rotate: fan.rotate - 8 }}
              animate={
                isDragging
                  ? /* While dragging, neutralise the fan transform on this
                       wrapper so the inner Card responds 1:1 to drag motion
                       without compounding rotations. */
                    { y: 0, opacity: 1, rotate: 0, zIndex: 9999 }
                  : { y: fan.y, opacity: 1, rotate: fan.rotate }
              }
              exit={{ y: -40, opacity: 0, scale: 0.85 }}
              whileHover={
                isDragging
                  ? undefined
                  : {
                      y: -22,
                      rotate: 0,
                      zIndex: 200,
                      transition: { type: "spring", stiffness: 280, damping: 22 },
                    }
              }
              whileFocus={
                isDragging
                  ? undefined
                  : { y: -22, rotate: 0, zIndex: 200 }
              }
              transition={
                isDragging
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 260, damping: 24 }
              }
              style={{
                transformOrigin: "50% 100%",
                marginLeft: idx === 0 ? 0 : `-${overlap}px`,
                zIndex: isDragging ? 9999 : stackZ,
              }}
              className="relative snap-center"
              onMouseEnter={() => {
                if (hidden || draggingId) return;
                onHover?.(card);
              }}
              onFocus={() => {
                if (hidden || draggingId) return;
                onHover?.(card);
              }}
            >
              <Card
                card={card}
                hidden={hidden}
                selected={card.id === activeCardId}
                onClick={() => onSelect?.(card)}
                layoutId={anyDragging ? undefined : `card-${card.id}`}
                size={size}
                draggable={!hidden && draggable}
                onDragStart={() => {
                  setDraggingId(card.id);
                  onDragStart?.(card);
                }}
                onDragEnd={(point) => {
                  setDraggingId(null);
                  onDragEnd?.(card, point);
                }}
              />
              {/* Suppress rotation visually whilst dragging so the card stays
                  level under the pointer — without changing the fan layout. */}
              {isDragging && null}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
