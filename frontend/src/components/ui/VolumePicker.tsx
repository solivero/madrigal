import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { cn } from "../../lib/cn";

interface Props {
  muted: boolean;
  volume: number;
  onMutedChange: (m: boolean) => void;
  onVolumeChange: (v: number) => void;
}

function pickIcon(muted: boolean, volume: number) {
  if (muted || volume === 0) return VolumeX;
  if (volume < 0.34) return Volume;
  if (volume < 0.67) return Volume1;
  return Volume2;
}

export function VolumePicker({
  muted,
  volume,
  onMutedChange,
  onVolumeChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = pickIcon(muted, volume);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={muted ? "Audio (muted)" : `Audio (${Math.round(volume * 100)}%)`}
        aria-expanded={open}
        className="rounded-full border border-gold-dark/50 bg-wood-dark/70 p-1.5 text-parchment-dark hover:border-gold hover:text-parchment"
      >
        <Icon className="size-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="parchment-panel absolute right-0 top-full z-50 mt-2 w-56 rounded-lg p-3 shadow-2xl"
          >
            <p className="font-display mb-2 text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">
              Audio
            </p>
            <button
              type="button"
              onClick={() => onMutedChange(!muted)}
              className={cn(
                "font-display mb-3 flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition",
                muted
                  ? "border-burgundy bg-burgundy text-parchment"
                  : "border-gold-dark/60 bg-parchment-dark/40 text-ink hover:bg-parchment-dark/70"
              )}
            >
              <span className="flex items-center gap-1.5">
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {muted ? "Muted" : "Sound on"}
              </span>
              <span className="text-[0.6rem] uppercase tracking-widest opacity-70">
                toggle
              </span>
            </button>
            <label className="block">
              <div className="font-display mb-1.5 flex items-center justify-between text-[0.65rem] uppercase tracking-widest text-ink-soft">
                <span>Volume</span>
                <span className="tabular-nums">
                  {muted ? "—" : `${Math.round(volume * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                disabled={muted}
                value={Math.round(volume * 100)}
                onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                className={cn(
                  "h-1.5 w-full appearance-none rounded-full bg-gold-dark/40 outline-none transition",
                  "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-burgundy [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gold-dark [&::-webkit-slider-thumb]:shadow-md",
                  "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-burgundy [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gold-dark",
                  muted && "opacity-40"
                )}
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
