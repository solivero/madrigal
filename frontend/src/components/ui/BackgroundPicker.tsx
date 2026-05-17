import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Palette } from "lucide-react";
import { useBackground, type BackgroundTheme } from "../../hooks/useBackground";
import { cn } from "../../lib/cn";

const OPTIONS: Array<{
  id: BackgroundTheme;
  label: string;
  description: string;
  swatch: string;
}> = [
  {
    id: "parchment",
    label: "Parchment",
    description: "Warm vellum. Calm.",
    swatch:
      "radial-gradient(ellipse at top, #4a2818 0%, #1a0e08 70%), #e6d5a8",
  },
  {
    id: "hearth",
    label: "Hearth",
    description: "Embers drift upward.",
    swatch:
      "radial-gradient(ellipse at 50% 100%, #ffa040 0%, transparent 60%), #2a1208",
  },
  {
    id: "lava",
    label: "Lava river",
    description: "Molten flow through a forest.",
    swatch:
      "linear-gradient(110deg, transparent 35%, #ff5a14 45%, #c41200 55%, transparent 65%), radial-gradient(ellipse at top, #1a2a18 0%, #03070a 100%)",
  },
  {
    id: "river",
    label: "Forest river",
    description: "Cool water winding through pines.",
    swatch:
      "linear-gradient(110deg, transparent 35%, #5ca0c0 45%, #285a78 55%, transparent 65%), radial-gradient(ellipse at top, #182a20 0%, #04100a 100%)",
  },
];

export function BackgroundPicker({
  variant = "subtle",
}: {
  variant?: "subtle" | "prominent";
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useBackground();
  const ref = useRef<HTMLDivElement>(null);

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
        aria-label="Change background"
        aria-expanded={open}
        className={cn(
          variant === "subtle"
            ? "rounded-full border border-gold-dark/50 bg-wood-dark/70 p-1.5 text-parchment-dark hover:border-gold hover:text-parchment"
            : "rounded-md border border-gold-dark/60 bg-parchment-dark/40 p-2 text-ink hover:bg-parchment-dark/70"
        )}
      >
        <Palette className={variant === "subtle" ? "size-3.5" : "size-4"} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="parchment-panel absolute right-0 top-full z-50 mt-2 w-56 rounded-lg p-2 shadow-2xl"
            role="menu"
          >
            <p className="font-display px-2 pb-1 pt-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft">
              Atmosphere
            </p>
            {OPTIONS.map((opt) => {
              const active = opt.id === theme;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition hover:bg-burgundy/15",
                    active && "bg-burgundy/10"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-md border",
                      active ? "border-burgundy" : "border-gold-dark/50"
                    )}
                    style={{ background: opt.swatch, backgroundSize: "cover" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "font-display block text-sm leading-tight",
                        active ? "text-burgundy" : "text-ink"
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="font-serif block text-[0.65rem] italic leading-tight text-ink-soft">
                      {opt.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
