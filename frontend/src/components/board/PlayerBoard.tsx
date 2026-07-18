import { useEffect, useMemo, useRef, useState } from "react";
import { range } from "lodash";
import type { Board, CardSlot as CardSlotType } from "@madrigal/core/dist/models";
import { CardSlot } from "./CardSlot";
import { cn } from "../../lib/cn";

interface Props {
  board: Board;
  isOpponent: boolean;
  activeCardId?: string;
  validTargets?: Set<number>;
  lastMoveSlot?: number | null;
  onClickSlot: (slot: CardSlotType) => void;
}

export function PlayerBoard({
  board,
  isOpponent,
  activeCardId,
  validTargets,
  lastMoveSlot,
  onClickSlot,
}: Props) {
  const rows = range(board.rows);
  const orderedSlots = isOpponent
    ? board.cardSlots.slice().reverse()
    : board.cardSlots;

  // Track which row indexes contain valid drop targets — those rows pulse.
  const pulsingRows = useMemo(() => {
    const set = new Set<number>();
    if (!validTargets || validTargets.size === 0) return set;
    for (const idx of validTargets) {
      set.add(Math.floor(idx / board.cols));
    }
    return set;
  }, [validTargets, board.cols]);

  // Track which rows just became fully populated to play a brief gold flash.
  const filledMaskRef = useRef<boolean[]>(rows.map(() => false));
  const [flashRow, setFlashRow] = useState<number | null>(null);
  useEffect(() => {
    const next = rows.map((r) => {
      // A row is "full" when every non-neutral color slot has a card.
      const start = r * board.cols;
      const slots = board.cardSlots.slice(start, start + board.cols);
      const coloredFilled = slots
        .filter((s) => s.color !== "neutral")
        .every((s) => !!s.card);
      return coloredFilled;
    });
    const prev = filledMaskRef.current;
    const newlyFilled = next.findIndex((v, i) => v && !prev[i]);
    if (newlyFilled >= 0) {
      setFlashRow(newlyFilled);
      const t = setTimeout(() => setFlashRow(null), 1200);
      filledMaskRef.current = next;
      return () => clearTimeout(t);
    }
    filledMaskRef.current = next;
  }, [board.cardSlots, board.cols, rows]);

  return (
    <div
      role="grid"
      aria-label={isOpponent ? "Opponent board" : "Your board"}
      className="flex flex-col gap-1.5"
    >
      {rows.map((rowIdx) => {
        const start = rowIdx * board.cols;
        const slotsThisRow = orderedSlots.slice(start, start + board.cols);
        return (
          <div
            key={rowIdx}
            className={cn(
              "grid justify-center gap-1.5 rounded-md",
              pulsingRows.has(rowIdx) && "row-pulse",
              flashRow === rowIdx && "row-flash"
            )}
            style={{
              // Width is now driven by slot height (height-first scaling).
              gridTemplateColumns: `repeat(${board.cols}, var(--slot-w))`,
            }}
          >
            {slotsThisRow.map((slot) => (
              <CardSlot
                key={slot.index}
                slot={slot}
                activeCardId={activeCardId}
                isValidTarget={validTargets?.has(slot.index)}
                isLastMove={lastMoveSlot === slot.index}
                onClick={onClickSlot}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
