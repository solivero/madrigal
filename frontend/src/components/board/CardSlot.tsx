import { memo } from "react";
import { motion } from "framer-motion";
import type { CardSlot as CardSlotType } from "@madrigal/core/dist/models";
import { Card } from "./Card";
import { cn } from "../../lib/cn";

const ROW_TINT: Record<string, string> = {
  green: "rgba(74, 122, 58, 0.10)",
  blue: "rgba(44, 90, 122, 0.10)",
  red: "rgba(168, 52, 44, 0.10)",
  gold: "rgba(200, 154, 58, 0.10)",
  neutral: "rgba(0, 0, 0, 0.20)",
};

const ROW_BORDER: Record<string, string> = {
  green: "rgba(120, 180, 90, 0.55)",
  blue: "rgba(90, 150, 200, 0.6)",
  red: "rgba(220, 90, 80, 0.55)",
  gold: "rgba(220, 180, 90, 0.6)",
  neutral: "rgba(212, 168, 87, 0.28)",
};

interface Props {
  slot: CardSlotType;
  activeCardId?: string;
  isValidTarget?: boolean;
  isLastMove?: boolean;
  onClick: (slot: CardSlotType) => void;
}

function CardSlotImpl({
  slot,
  activeCardId,
  isValidTarget,
  isLastMove,
  onClick,
}: Props) {
  const isEmpty = !slot.card;
  const tint = ROW_TINT[slot.color] ?? ROW_TINT.neutral;
  const border = ROW_BORDER[slot.color] ?? ROW_BORDER.neutral;
  return (
    <motion.div
      role="gridcell"
      data-slot-index={slot.index}
      data-slot-player={slot.player}
      whileHover={isEmpty ? { backgroundColor: "rgba(212,168,87,0.10)" } : {}}
      animate={
        isValidTarget
          ? {
              boxShadow: [
                "0 0 0 0 rgba(255, 216, 122, 0)",
                "0 0 12px 1px rgba(255, 216, 122, 0.55)",
                "0 0 0 0 rgba(255, 216, 122, 0)",
              ],
            }
          : { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
      }
      transition={
        isValidTarget
          ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
      onClick={() => onClick(slot)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(slot);
        }
      }}
      tabIndex={0}
      className={cn(
        "relative flex items-center justify-center rounded-md border cursor-pointer transition-colors outline-none focus-visible:border-candle",
        isEmpty ? "" : "bg-transparent",
        isValidTarget && "!border-candle/80",
        isLastMove && !isEmpty && "last-move-card"
      )}
      style={{
        borderColor: isValidTarget ? "var(--color-candle)" : border,
        backgroundColor: isEmpty ? tint : "transparent",
        // Use the responsive slot dimensions defined on .board-frame.
        // Fallback to old fixed values if the var isn't set (shouldn't happen
        // in normal usage, but keeps the slot useful out-of-context).
        minWidth: "var(--slot-w, 52px)",
        minHeight: "var(--slot-h, 74px)",
      }}
    >
      {slot.card && (
        <Card
          card={slot.card}
          selected={slot.card.id === activeCardId}
          layoutId={`card-${slot.card.id}`}
          size="sm"
        />
      )}
    </motion.div>
  );
}

export const CardSlot = memo(CardSlotImpl, (prev, next) => {
  // Re-render only when something visible to this slot actually changed.
  if (prev.slot !== next.slot) return false;
  if (prev.isValidTarget !== next.isValidTarget) return false;
  if (prev.isLastMove !== next.isLastMove) return false;
  // activeCardId matters only when this slot holds the active card.
  const wasActive = prev.slot.card?.id === prev.activeCardId;
  const isActive = next.slot.card?.id === next.activeCardId;
  if (wasActive !== isActive) return false;
  if (prev.onClick !== next.onClick) return false;
  return true;
});
