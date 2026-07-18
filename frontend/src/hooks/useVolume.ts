import { useEffect, useState } from "react";
import { Howler } from "howler";

const KEY_MUTED = "madrigal:muted";
const KEY_VOLUME = "madrigal:volume";

export function useVolume() {
  const [muted, setMuted] = useState<boolean>(
    () => localStorage.getItem(KEY_MUTED) === "1"
  );
  const [volume, setVolume] = useState<number>(() => {
    const raw = localStorage.getItem(KEY_VOLUME);
    const v = raw === null ? 0.6 : Number(raw);
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.6;
  });

  useEffect(() => {
    localStorage.setItem(KEY_MUTED, muted ? "1" : "0");
    Howler.mute(muted);
  }, [muted]);

  useEffect(() => {
    localStorage.setItem(KEY_VOLUME, String(volume));
    Howler.volume(volume);
  }, [volume]);

  return { muted, setMuted, volume, setVolume };
}
