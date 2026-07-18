import { useEffect, useState } from "react";

export type BackgroundTheme = "parchment" | "hearth" | "lava" | "river";

const KEY = "madrigal:bg";
const DEFAULT: BackgroundTheme = "parchment";

function read(): BackgroundTheme {
  if (typeof window === "undefined") return DEFAULT;
  const stored = localStorage.getItem(KEY) as BackgroundTheme | null;
  if (
    stored === "parchment" ||
    stored === "hearth" ||
    stored === "lava" ||
    stored === "river"
  ) {
    return stored;
  }
  return DEFAULT;
}

export function useBackground(): [BackgroundTheme, (t: BackgroundTheme) => void] {
  const [theme, setTheme] = useState<BackgroundTheme>(read);
  useEffect(() => {
    document.body.dataset.bg = theme;
    localStorage.setItem(KEY, theme);
  }, [theme]);
  return [theme, setTheme];
}
