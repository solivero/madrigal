// Procedural audio for Madrigal — synthesised at runtime.
// All sounds are tuned for a medieval / fantasy feel:
//   • placement → wooden card-thump (noise burst + bass body)
//   • pass      → soft parchment rustle (filtered noise sweep)
//   • round     → church bell (inharmonic overtones)
//   • victory   → brass fanfare (detuned sawtooth ensemble)
//   • defeat    → low horn (minor descending)
//   • pick      → page-flip whisper

let sharedCtx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  const C = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!C) return null;
  sharedCtx = new C();
  return sharedCtx;
}

function ensureRunning() {
  const c = ctx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", ensureRunning, { once: true });
  window.addEventListener("keydown", ensureRunning, { once: true });
}

interface BaseOpts {
  volume?: number;
}

function makeGain(c: AudioContext, peak: number, t0: number, dur: number, attack = 0.005) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

/** Short burst of bandpassed brown-ish noise — used for wooden / rustle textures. */
function noiseBuffer(c: AudioContext, durationSec = 0.3): AudioBuffer {
  const sampleRate = c.sampleRate;
  const len = Math.floor(sampleRate * durationSec);
  const buf = c.createBuffer(1, len, sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5; // brown noise
  }
  return buf;
}

/* ----------------------------- thwack ----------------------------- */
/** Wooden card-thump: a low body resonance with a brief textured burst on top. */
export function playThwack({ volume = 0.5 }: BaseOpts = {}) {
  const c = ctx();
  if (!c) return;
  ensureRunning();
  const t0 = c.currentTime;

  // Body: low sine with quick downward sweep
  const body = c.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(180, t0);
  body.frequency.exponentialRampToValueAtTime(70, t0 + 0.14);
  const bodyGain = makeGain(c, 0.55 * volume, t0, 0.2, 0.003);
  body.connect(bodyGain).connect(c.destination);
  body.start(t0);
  body.stop(t0 + 0.22);

  // Wooden tap (resonant high-freq burst, bandpass-shaped)
  const tap = c.createBufferSource();
  tap.buffer = noiseBuffer(c, 0.06);
  const tapFilter = c.createBiquadFilter();
  tapFilter.type = "bandpass";
  tapFilter.frequency.setValueAtTime(1800, t0);
  tapFilter.Q.setValueAtTime(6, t0);
  const tapGain = makeGain(c, 0.4 * volume, t0, 0.06, 0.001);
  tap.connect(tapFilter).connect(tapGain).connect(c.destination);
  tap.start(t0);

  // Faint echo (sense of stone hall)
  const echo = c.createOscillator();
  echo.type = "sine";
  echo.frequency.setValueAtTime(140, t0 + 0.09);
  const echoGain = makeGain(c, 0.12 * volume, t0 + 0.09, 0.2, 0.02);
  echo.connect(echoGain).connect(c.destination);
  echo.start(t0 + 0.09);
  echo.stop(t0 + 0.32);
}

/* ----------------------------- pass ------------------------------ */
/** Parchment rustle + soft descending horn. */
export function playPass({ volume = 0.45 }: BaseOpts = {}) {
  const c = ctx();
  if (!c) return;
  ensureRunning();
  const t0 = c.currentTime;

  // Filtered noise — rustle
  const rustle = c.createBufferSource();
  rustle.buffer = noiseBuffer(c, 0.35);
  const rustleHP = c.createBiquadFilter();
  rustleHP.type = "highpass";
  rustleHP.frequency.setValueAtTime(900, t0);
  const rustleGain = makeGain(c, 0.18 * volume, t0, 0.34, 0.01);
  rustle.connect(rustleHP).connect(rustleGain).connect(c.destination);
  rustle.start(t0);

  // Descending tone (G4 → E♭4)
  for (const [delay, freq] of [
    [0, 392],
    [0.08, 311.13],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t0 + delay);
    const g = makeGain(c, 0.32 * volume, t0 + delay, 0.28, 0.012);
    osc.connect(g).connect(c.destination);
    osc.start(t0 + delay);
    osc.stop(t0 + delay + 0.3);
  }
}

/* ----------------------------- pick ------------------------------ */
/** Quick page-flip whisper. */
export function playPick({ volume = 0.35 }: BaseOpts = {}) {
  const c = ctx();
  if (!c) return;
  ensureRunning();
  const t0 = c.currentTime;

  const flip = c.createBufferSource();
  flip.buffer = noiseBuffer(c, 0.1);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(2400, t0);
  bp.frequency.exponentialRampToValueAtTime(900, t0 + 0.08);
  bp.Q.setValueAtTime(3, t0);
  const g = makeGain(c, 0.32 * volume, t0, 0.09, 0.001);
  flip.connect(bp).connect(g).connect(c.destination);
  flip.start(t0);
}

/* --------------------------- round chime -------------------------- */
/** Church bell — fundamental + inharmonic overtones for the "bell" timbre. */
export function playRoundChime({ volume = 0.6 }: BaseOpts = {}) {
  const c = ctx();
  if (!c) return;
  ensureRunning();
  const t0 = c.currentTime;

  // A real bell has partials at ratios like 1, 2, 2.4 (minor 3rd hum), 3, 4.2...
  const fundamental = 392; // G4
  const partials = [
    { ratio: 0.5, weight: 0.4, dur: 2.2 }, // hum
    { ratio: 1, weight: 1.0, dur: 1.8 },
    { ratio: 2.0, weight: 0.6, dur: 1.3 },
    { ratio: 2.4, weight: 0.5, dur: 1.0 }, // minor third overtone
    { ratio: 3.0, weight: 0.35, dur: 0.7 },
    { ratio: 4.2, weight: 0.18, dur: 0.5 }, // inharmonic
  ];
  for (const p of partials) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(fundamental * p.ratio, t0);
    const g = makeGain(c, 0.32 * p.weight * volume, t0, p.dur, 0.003);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + p.dur + 0.1);
  }

  // Faint strike noise burst at the very start
  const strike = c.createBufferSource();
  strike.buffer = noiseBuffer(c, 0.03);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(3200, t0);
  bp.Q.setValueAtTime(8, t0);
  const sg = makeGain(c, 0.4 * volume, t0, 0.04, 0.001);
  strike.connect(bp).connect(sg).connect(c.destination);
  strike.start(t0);
}

/* ----------------------------- fanfare ---------------------------- */
/** Brass-like ensemble — three slightly detuned sawtooth voices per note. */
function brassNote(c: AudioContext, freq: number, t0: number, dur: number, vol: number) {
  // Three sawtooth oscillators detuned to ±10 cents for chorus
  for (const detune of [-10, 0, 10]) {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.setValueAtTime(detune, t0);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1600, t0);
    lp.frequency.linearRampToValueAtTime(3200, t0 + 0.05);
    lp.Q.setValueAtTime(1.2, t0);
    const g = makeGain(c, 0.18 * vol, t0, dur, 0.025);
    osc.connect(lp).connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
}

/** Victory or defeat fanfare. */
export function playFanfare({
  volume = 0.55,
  win = true,
}: BaseOpts & { win?: boolean } = {}) {
  const c = ctx();
  if (!c) return;
  ensureRunning();
  const t0 = c.currentTime;

  // Trumpet-like rising arpeggio for victory, lower minor for defeat.
  const arp = win
    ? [261.63, 329.63, 392.0, 523.25] // C major C E G C
    : [349.23, 311.13, 277.18, 261.63]; // F → E♭ → C# → C (descending darkness)

  arp.forEach((freq, i) => {
    brassNote(c, freq, t0 + i * 0.16, 0.5, volume);
  });

  // Sustained final chord (root + fifth + octave) for victory
  if (win) {
    const finalT = t0 + arp.length * 0.16;
    const root = arp[arp.length - 1];
    brassNote(c, root, finalT, 1.6, volume * 0.9);
    brassNote(c, root * 1.5, finalT, 1.6, volume * 0.55);
    brassNote(c, root * 2, finalT, 1.6, volume * 0.4);
    // A timpani-like roll under the chord
    const roll = c.createBufferSource();
    roll.buffer = noiseBuffer(c, 0.8);
    const rollLP = c.createBiquadFilter();
    rollLP.type = "lowpass";
    rollLP.frequency.setValueAtTime(220, finalT);
    const rollGain = makeGain(c, 0.2 * volume, finalT, 0.8, 0.05);
    roll.connect(rollLP).connect(rollGain).connect(c.destination);
    roll.start(finalT);
  } else {
    // Defeat: low sustained horn drop
    const finalT = t0 + arp.length * 0.16;
    brassNote(c, arp[arp.length - 1] * 0.5, finalT, 2.2, volume * 0.9);
  }
}
