import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

interface Props {
  label: string;
  count: number;
  onClick?: () => void;
  variant?: "deck" | "graveyard";
}

export function Pile({ label, count, onClick, variant = "deck" }: Props) {
  const empty = count === 0;
  return (
    <motion.button
      type="button"
      whileHover={!empty ? { y: -2, scale: 1.05 } : {}}
      whileTap={!empty ? { scale: 0.97 } : {}}
      disabled={empty}
      onClick={onClick}
      title={`${label}: ${count}`}
      aria-label={`${label}: ${count}`}
      className={cn(
        "relative flex flex-col items-center justify-end rounded-md border transition outline-none",
        "w-11 h-16 sm:w-12 sm:h-[68px]",
        empty
          ? "border-gold-dark/20 bg-black/15 text-parchment-dark/30"
          : "border-gold-dark/70 text-parchment shadow-md focus-visible:border-candle",
        variant === "graveyard" && !empty && "grayscale-[35%] opacity-90"
      )}
    >
      {!empty && (
        <img
          src="/card-back.svg"
          alt=""
          className="absolute inset-0 h-full w-full rounded-[3px] object-cover"
          draggable={false}
        />
      )}
      <span className="relative mb-0.5 font-display text-[0.55rem] uppercase tracking-[0.18em] opacity-80">
        {label}
      </span>
      <span className="font-display relative mb-1 rounded-full bg-black/40 px-1.5 text-[0.7rem] tabular-nums">
        {count}
      </span>
    </motion.button>
  );
}
