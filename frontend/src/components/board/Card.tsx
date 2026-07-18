import { motion } from "framer-motion";
import type { Card as CardType } from "@madrigal/core/dist/models";
import { cardImageUrl } from "../../lib/serverUrl";
import { cardDescriptions } from "../../lib/cardCopy";
import { cn } from "../../lib/cn";

const COLOR_HEX: Record<string, string> = {
  green: "var(--color-card-green)",
  blue: "var(--color-card-blue)",
  red: "var(--color-card-red)",
  gold: "var(--color-card-gold)",
  neutral: "var(--color-card-neutral)",
};

interface Props {
  card: CardType;
  selected?: boolean;
  hidden?: boolean;
  onClick?: () => void;
  /** xs = opponent face-down (small), sm = on-board (scales with --slot-*),
   *  md = your hand, lg = detail panel. */
  size?: "xs" | "sm" | "md" | "lg";
  layoutId?: string;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (info: { x: number; y: number }) => void;
}

/** Numeric (fixed) sizes for hand/lg. The on-board "sm" size now reads
 *  CSS custom properties (--slot-card-w / --slot-card-h) from the closest
 *  .board-frame, so cards scale with the responsive slot grid. */
const SIZE = {
  xs: { w: 50, h: 74 },
  md: { w: 72, h: 108 },
  lg: { w: 96, h: 144 },
};

export function Card({
  card,
  selected,
  hidden,
  onClick,
  size = "md",
  layoutId,
  draggable,
  onDragStart,
  onDragEnd,
}: Props) {
  const dims =
    size === "sm"
      ? { width: "var(--slot-card-w, 56px)", height: "var(--slot-card-h, 80px)" }
      : { width: SIZE[size].w, height: SIZE[size].h };
  const color = COLOR_HEX[card.color] ?? COLOR_HEX.neutral;
  const buffed = card.points > card.basePoints;

  if (hidden) {
    return (
      <motion.div
        layoutId={layoutId}
        whileHover={{ y: -2 }}
        style={dims}
        className="rounded-card border-2 border-gold-dark/70 bg-cover bg-center shadow-card"
      >
        <img
          src="/card-back.svg"
          alt=""
          className="h-full w-full rounded-[3px]"
          draggable={false}
        />
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={onClick}
      title={cardDescriptions[card.name]}
      aria-label={`${card.name}, ${card.color}, ${card.points} points`}
      whileHover={draggable ? undefined : { y: -10, scale: 1.08 }}
      whileTap={draggable ? undefined : { scale: 0.97 }}
      drag={draggable ? true : false}
      dragSnapToOrigin
      dragMomentum={false}
      /* dragElastic=1 means no resistance — the card follows the pointer 1:1 */
      dragElastic={1}
      /* No `scale` in whileDrag — scale and drag-transform on the same element
         compound through Framer Motion's transform pipeline and cause jitter.
         A pure 1:1 follow feels far smoother. */
      whileDrag={{ cursor: "grabbing" }}
      onDragStart={() => onDragStart?.()}
      onDragEnd={(_, info) =>
        onDragEnd?.({ x: info.point.x, y: info.point.y })
      }
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      style={{
        width: dims.width,
        height: dims.height,
        borderColor: color,
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%), url(${cardImageUrl(card.color, card.normalizedName)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        touchAction: draggable ? "none" : undefined,
      }}
      className={cn(
        "relative flex flex-col justify-between rounded-card border-2 text-white shadow-card outline-none transition-shadow",
        "focus-visible:shadow-card-hover",
        selected && "ring-4 ring-candle ring-offset-2 ring-offset-wood-dark",
        card.color === "neutral" && "rotate-90"
      )}
    >
      <span className="font-display rounded-t-card bg-black/40 px-1 py-0.5 text-[0.6rem] uppercase tracking-wider">
        {card.name}
      </span>
      <div className="flex items-center justify-between px-1.5 pb-1">
        <span className="text-[0.55rem] tracking-widest text-parchment-dark/80">
          {Object.keys(card.effects)
            .map((e) => e[0]!.toUpperCase())
            .join(" ")}
        </span>
        <span
          className={cn(
            "font-display flex size-6 items-center justify-center rounded-full border text-xs",
            buffed
              ? "border-candle bg-burgundy text-candle shadow-glow"
              : "border-white/40 bg-black/50 text-white"
          )}
        >
          {card.points}
        </span>
      </div>
    </motion.button>
  );
}
