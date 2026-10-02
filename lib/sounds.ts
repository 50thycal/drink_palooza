"use client";

import { SOUNDS, type SoundKey } from "./constants";

/**
 * The soundboard.
 *
 * Real recordings win: drop `public/sounds/<key>.mp3` (womp, rimshot,
 * applause, airhorn, drumroll, boom) into the repo and that file plays
 * instead of the synth. Each file is tried once and cached; a missing file falls back.
 *
 * The synths are modelled rather than beeped: a brass section with a plunger
 * "wah" for the sad trombone, noise-and-metal cymbals, a few friends
 * clapping, a fluttering rap-intro air horn, and an explosion. Everything runs
 * through one bus with a small room reverb and a limiter, which is most of
 * the difference between "phone beep" and "sound effect".
 */

const MUTE_KEY = "drinkpalooza:muted";

export function isMuted() {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
export function setMuted(muted: boolean) {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {}
}

// ---------------------------------------------------------------------------
// Audio graph: context, master bus, room reverb
// ---------------------------------------------------------------------------

interface Bus {
  c: BaseAudioContext;
  /** Dry input to the master. */
  dry: AudioNode;
  /** Input to the room reverb. */
  wet: AudioNode;
}

let bus: Bus | null = null;

function getBus(): Bus | null {
  if (typeof window === "undefined") return null;
  if (!bus) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    bus = makeBus(new Ctor());
  }
  const c = bus.c as AudioContext;
  if (c.state === "suspended") void c.resume();
  return bus;
}

/** Master bus with limiter and room reverb. Works on an OfflineAudioContext too (for rendering previews). */
export function makeBus(c: BaseAudioContext): Bus {
  const master = c.createGain();
  master.gain.value = 0.9;
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 6;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.15;
  master.connect(limiter).connect(c.destination);

  const verb = c.createConvolver();
  verb.buffer = roomImpulse(c, 1.7);
  const verbOut = c.createGain();
  verbOut.gain.value = 0.55;
  verb.connect(verbOut).connect(master);
  return { c, dry: master, wet: verb };
}

/** Run one synth on a given bus (used by the preview renderer). */
export function synthInto(b: Bus, key: SoundKey) {
  SYNTHS[key](b);
}

/** A small, warm room: stereo decaying noise with a few early reflections. */
function roomImpulse(c: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / c.sampleRate;
      const n = Math.random() * 2 - 1;
      d[i] = n * Math.pow(1 - i / len, 3.2) * (t < 0.004 ? t / 0.004 : 1);
    }
    for (const [ms, g] of [
      [11, 0.5],
      [19, 0.35],
      [31, 0.25],
    ] as const) {
      const at = Math.floor(((ms + ch * 3) / 1000) * c.sampleRate);
      if (at < len) d[at] += g * (ch ? -1 : 1);
    }
    // Gentle low-pass so the tail isn't hissy.
    for (let i = 1; i < len; i++) d[i] = d[i] * 0.55 + d[i - 1] * 0.45;
  }
  return ir;
}

/** A channel strip: gain → pan → (dry + reverb send). */
function strip(b: Bus, { gain = 1, pan = 0, send = 0.2 }: { gain?: number; pan?: number; send?: number } = {}) {
  const g = b.c.createGain();
  g.gain.value = gain;
  let tail: AudioNode = g;
  if (pan && b.c.createStereoPanner) {
    const p = b.c.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    tail = p;
  }
  tail.connect(b.dry);
  if (send > 0) {
    const s = b.c.createGain();
    s.gain.value = send;
    tail.connect(s).connect(b.wet);
  }
  return g;
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: BaseAudioContext) {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  return src;
}

const curves = new Map<number, Float32Array<ArrayBuffer>>();
/** Soft clipping: adds harmonics and grit without harsh digital edges. */
function drive(c: BaseAudioContext, amount: number) {
  if (!curves.has(amount)) {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    curves.set(amount, curve);
  }
  const ws = c.createWaveShaper();
  ws.curve = curves.get(amount)!;
  ws.oversample = "4x";
  return ws;
}

function filter(c: BaseAudioContext, type: BiquadFilterType, freq: number, q = 0.7, gainDb = 0) {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  f.gain.value = gainDb;
  return f;
}

/** Exponential attack/decay envelope on a gain param. */
function adsr(p: AudioParam, t: number, { a = 0.005, peak = 1, hold = 0, d = 0.2, floor = 0.0001 }) {
  p.setValueAtTime(floor, t);
  p.exponentialRampToValueAtTime(peak, t + a);
  if (hold) p.setValueAtTime(peak, t + a + hold);
  p.exponentialRampToValueAtTime(floor, t + a + hold + d);
}

/** Filtered noise burst — claps, snares, wires, breath. */
function burst(c: BaseAudioContext, out: AudioNode, t: number, o: { dur: number; freq: number; q?: number; type?: BiquadFilterType; gain?: number; a?: number }) {
  const src = noise(c);
  const f = filter(c, o.type ?? "bandpass", o.freq, o.q ?? 1);
  const g = c.createGain();
  adsr(g.gain, t, { a: o.a ?? 0.002, peak: o.gain ?? 1, d: o.dur });
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 1.5);
  src.stop(t + (o.a ?? 0.002) + o.dur + 0.05);
}

/**
 * A cymbal is mostly bright noise with a metallic edge, and it decays in two
 * stages: a fast initial "crash" then a long shimmering tail. A dozen
 * detuned square waves, ring-modulated, supply the metal without turning
 * into audible pitches.
 */
function cymbal(c: BaseAudioContext, out: AudioNode, t: number, { dur = 1.6, gain = 0.5, bright = 1 } = {}) {
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.003);
  env.gain.exponentialRampToValueAtTime(gain * 0.32, t + 0.16);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  env.connect(out);

  // the wash
  const src = noise(c);
  const hp = filter(c, "highpass", 3800 * bright, 0.5);
  const sheen = filter(c, "peaking", 8500 * bright, 0.7, 6);
  const air = filter(c, "highshelf", 11000, 0.7, 4);
  const washGain = c.createGain();
  washGain.gain.value = 0.85;
  src.connect(hp).connect(sheen).connect(air).connect(washGain).connect(env);
  src.start(t, Math.random());
  src.stop(t + dur + 0.1);

  // the metal: two banks of detuned squares multiplied together
  const ring = c.createGain();
  ring.gain.value = 0;
  const metalHp = filter(c, "highpass", 6500 * bright, 0.6);
  const metalGain = c.createGain();
  metalGain.gain.value = 0.18;
  ring.connect(metalHp).connect(metalGain).connect(env);
  const carrierMix = c.createGain();
  carrierMix.gain.value = 0.15;
  carrierMix.connect(ring);
  for (let i = 0; i < 12; i++) {
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.value = (310 + i * 47 + Math.random() * 30) * bright;
    // odd oscillators modulate the even ones' amplitude: ring modulation
    if (i % 2) o.connect(ring.gain);
    else o.connect(carrierMix);
    o.start(t);
    o.stop(t + dur + 0.1);
  }
}

function kick(c: BaseAudioContext, out: AudioNode, t: number, gain = 1) {
  const o = c.createOscillator();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  const g = c.createGain();
  adsr(g.gain, t, { a: 0.002, peak: gain, d: 0.55 });
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.65);
  burst(c, out, t, { dur: 0.02, freq: 3000, q: 0.8, gain: gain * 0.3 });
}

function snare(c: BaseAudioContext, out: AudioNode, t: number, v = 1) {
  // body
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(230, t);
  o.frequency.exponentialRampToValueAtTime(175, t + 0.05);
  const g = c.createGain();
  adsr(g.gain, t, { a: 0.001, peak: 0.55 * v, d: 0.07 });
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.1);
  // head + wires (the wires ring on, which is what makes a roll buzz)
  burst(c, out, t, { dur: 0.09 + 0.05 * v, freq: 1900, q: 0.7, gain: 0.7 * v });
  burst(c, out, t, { dur: 0.16 + 0.1 * v, freq: 4800, type: "highpass", q: 0.5, gain: 0.32 * v });
}

function tom(c: BaseAudioContext, out: AudioNode, t: number, freq: number, gain = 1, ring = 0.42) {
  // fundamental plus a slightly inharmonic overtone: a drum head, not a beep
  for (const [mult, level] of [
    [1, 1],
    [1.59, 0.3],
  ] as const) {
    const o = c.createOscillator();
    o.frequency.setValueAtTime(freq * mult * 1.55, t);
    o.frequency.exponentialRampToValueAtTime(freq * mult, t + 0.09);
    const g = c.createGain();
    adsr(g.gain, t, { a: 0.002, peak: gain * level, d: ring * (mult > 1 ? 0.5 : 1) });
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + ring + 0.1);
  }
  burst(c, out, t, { dur: 0.06, freq: 900, q: 0.8, gain: gain * 0.4 });
}

// ---------------------------------------------------------------------------
// The five soundboard sounds
// ---------------------------------------------------------------------------

/** Sad trombone through a plunger mute: each note opens ("wah") and closes. */
function womp(b: Bus) {
  const { c } = b;
  const out = strip(b, { gain: 0.38, send: 0.28 });
  const notes = [
    [233.08, 0.4],
    [220.0, 0.4],
    [207.65, 0.4],
    [196.0, 1.55],
  ] as const;
  let t = c.currentTime + 0.03;
  for (const [i, [f, dur]] of notes.entries()) {
    const last = i === notes.length - 1;
    const voice = c.createGain();
    adsr(voice.gain, t, { a: 0.035, peak: 0.9, hold: dur - 0.12, d: 0.09 });
    // the plunger: a resonant low-pass that opens then closes on every note
    const wah = filter(c, "lowpass", 380, 7);
    wah.frequency.setValueAtTime(320, t);
    wah.frequency.exponentialRampToValueAtTime(1700, t + 0.11);
    wah.frequency.exponentialRampToValueAtTime(last ? 900 : 650, t + Math.min(dur, 0.38));
    if (last) {
      // a second slower "waaah" on the long note
      wah.frequency.exponentialRampToValueAtTime(1500, t + 0.75);
      wah.frequency.exponentialRampToValueAtTime(420, t + dur);
    }
    const sat = drive(c, 2.2);
    voice.connect(wah).connect(sat).connect(out);
    for (const [type, mult, detune, level] of [
      ["sawtooth", 1, -6, 0.5],
      ["sawtooth", 1, 6, 0.5],
      ["triangle", 0.5, 0, 0.35],
    ] as const) {
      const o = c.createOscillator();
      o.type = type;
      o.detune.value = detune;
      // lip "scoop" into each note
      o.frequency.setValueAtTime(f * mult * 0.93, t);
      o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.06);
      if (last) {
        const lfo = c.createOscillator();
        lfo.frequency.setValueAtTime(4.5, t);
        lfo.frequency.linearRampToValueAtTime(6.5, t + dur);
        const depth = c.createGain();
        depth.gain.setValueAtTime(0, t);
        depth.gain.linearRampToValueAtTime(f * mult * 0.035, t + 0.5);
        lfo.connect(depth).connect(o.frequency);
        lfo.start(t);
        lfo.stop(t + dur + 0.1);
        o.frequency.setValueAtTime(f * mult, t + dur - 0.55);
        o.frequency.exponentialRampToValueAtTime(f * mult * 0.9, t + dur);
      }
      const lv = c.createGain();
      lv.gain.value = level;
      o.connect(lv).connect(voice);
      o.start(t);
      o.stop(t + dur + 0.12);
    }
    // a little breath at the start of each note
    burst(c, out, t, { dur: 0.06, freq: 1200, q: 0.6, gain: 0.05 });
    t += dur + 0.035;
  }
}

/** Ba-dum-TSS: a hard snare crack, a big ringing tom, then kick and a long crash. */
function rimshot(b: Bus) {
  const { c } = b;
  const out = strip(b, { gain: 1, send: 0.26 });
  const t = c.currentTime + 0.03;
  snare(c, out, t, 1.5);
  tom(c, out, t + 0.22, 92, 1.1, 0.75);
  kick(c, out, t + 0.52, 1);
  snare(c, out, t + 0.52, 0.6);
  cymbal(c, strip(b, { gain: 0.95, pan: 0.2, send: 0.38 }), t + 0.52, { dur: 2.8, gain: 0.65 });
}

/** One hand clap: palms meet in three quick slaps, then a short ring. */
function clap(c: BaseAudioContext, out: AudioNode, t: number, tone: number, gain: number) {
  for (let k = 0; k < 3; k++) burst(c, out, t + k * 0.0085, { dur: 0.011, freq: tone, q: 1.6, gain: gain * (k === 2 ? 1 : 0.65) });
  burst(c, out, t + 0.018, { dur: 0.1, freq: tone * 1.12, q: 1, gain: gain * 0.5 });
  burst(c, out, t, { dur: 0.018, freq: 3600, type: "highpass", q: 0.5, gain: gain * 0.22 });
}

/**
 * Applause from a handful of friends, not a stadium: four people, each
 * with their own tempo, hands and seat, who start together and drop out one
 * by one.
 */
function applause(b: Bus) {
  const { c } = b;
  const t0 = c.currentTime + 0.03;
  const people = 4;
  for (let p = 0; p < people; p++) {
    const out = strip(b, { gain: 2, pan: -0.55 + (1.1 * p) / (people - 1), send: 0.24 });
    const rate = 4 + Math.random() * 1.2;
    const tone = 950 + p * 160 + Math.random() * 120;
    const stop = 2.1 + Math.random() * 0.9;
    for (let at = Math.random() * 0.12; at < stop; at += (1 / rate) * (0.92 + Math.random() * 0.16)) {
      const swell = Math.min(1, 0.55 + at * 1.5);
      const fade = Math.min(1, (stop - at) / 0.7);
      clap(c, out, t0 + at, tone, swell * fade * (0.8 + Math.random() * 0.2));
    }
  }
}

/**
 * The rap-intro air horn: BWAAAP — BAP BAP — BWAAAAAP, with a DJ echo.
 * A reed horn is a buzzy tone with a fast flutter in its air supply (that
 * "brrr" in the blast), a pitch that scoops up on each hit, and a second
 * horn a minor third above.
 */
function airhorn(b: Bus) {
  const { c } = b;
  const out = strip(b, { gain: 0.42, send: 0.12 });
  const horn = c.createGain();
  const sat = drive(c, 1.8);
  const hp = filter(c, "highpass", 200, 0.7);
  const body = filter(c, "peaking", 1150, 1.2, 6);
  const bite = filter(c, "peaking", 2600, 1.5, 3);
  const lp = filter(c, "lowpass", 5200, 0.6);
  horn.connect(sat).connect(hp).connect(body).connect(bite).connect(lp);
  lp.connect(out);
  const f = 440;
  const t0 = c.currentTime + 0.03;
  // the DJ "echoes out" the last blast only, so the BAP-BAPs stay crisp
  const send = c.createGain();
  send.gain.setValueAtTime(0, t0);
  send.gain.setValueAtTime(1, t0 + 0.95);
  const delay = c.createDelay(1);
  delay.delayTime.value = 0.27;
  const fb = c.createGain();
  fb.gain.value = 0.38;
  const dark = filter(c, "lowpass", 2400, 0.6);
  const echo = c.createGain();
  echo.gain.value = 0.45;
  lp.connect(send).connect(delay).connect(dark).connect(fb).connect(delay);
  dark.connect(echo).connect(out);
  // [start, length]
  const blasts: [number, number][] = [
    [0, 0.42],
    [0.55, 0.13],
    [0.76, 0.13],
    [0.97, 1.0],
  ];
  for (const [at, len] of blasts) {
    const t = t0 + at;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.014);
    g.gain.setValueAtTime(1, t + len - 0.045);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    // air-supply flutter: the "brrr"
    const flutter = c.createOscillator();
    flutter.frequency.value = 31 + Math.random() * 4;
    const depth = c.createGain();
    depth.gain.value = 0.22;
    const amp = c.createGain();
    amp.gain.value = 0.78;
    flutter.connect(depth).connect(amp.gain);
    g.connect(amp).connect(horn);
    flutter.start(t);
    flutter.stop(t + len + 0.02);
    for (const [ratio, level, type] of [
      [1, 0.5, "sawtooth"],
      [1.004, 0.4, "sawtooth"],
      [0.5, 0.2, "square"],
      [1.189, 0.32, "sawtooth"], // the second horn, a minor third up
    ] as const) {
      const o = c.createOscillator();
      o.type = type;
      const base = f * ratio;
      o.frequency.setValueAtTime(base * 0.8, t);
      o.frequency.exponentialRampToValueAtTime(base, t + 0.045);
      if (len > 0.3) o.frequency.exponentialRampToValueAtTime(base * 0.985, t + len);
      const lv = c.createGain();
      lv.gain.value = level;
      o.connect(lv).connect(g);
      o.start(t);
      o.stop(t + len + 0.02);
    }
  }
}

/**
 * An explosion: a sharp crack, a sub-bass thump you feel, a roar that
 * darkens as it rolls away, and debris crackling in the tail.
 */
function boom(b: Bus) {
  const { c } = b;
  const out = strip(b, { gain: 0.72, send: 0.4 });
  const t0 = c.currentTime + 0.03;
  // crack
  burst(c, out, t0, { dur: 0.09, freq: 2200, type: "highpass", q: 0.5, gain: 0.9 });
  // thump
  const sub = c.createOscillator();
  sub.frequency.setValueAtTime(78, t0);
  sub.frequency.exponentialRampToValueAtTime(26, t0 + 0.9);
  const sg = c.createGain();
  adsr(sg.gain, t0, { a: 0.004, peak: 1.3, d: 1.7 });
  sub.connect(drive(c, 2)).connect(sg).connect(out);
  sub.start(t0);
  sub.stop(t0 + 1.9);
  // roar
  const src = noise(c);
  const lp = filter(c, "lowpass", 5000, 0.9);
  lp.frequency.setValueAtTime(5500, t0);
  lp.frequency.exponentialRampToValueAtTime(900, t0 + 0.35);
  lp.frequency.exponentialRampToValueAtTime(90, t0 + 2.8);
  const rg = c.createGain();
  rg.gain.setValueAtTime(0.0001, t0);
  rg.gain.exponentialRampToValueAtTime(1, t0 + 0.01);
  rg.gain.exponentialRampToValueAtTime(0.45, t0 + 0.35);
  rg.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
  src.connect(lp).connect(drive(c, 2.5)).connect(rg).connect(out);
  src.start(t0);
  src.stop(t0 + 3.5);
  // debris
  const debris = strip(b, { gain: 0.5, send: 0.35 });
  for (let i = 0; i < 38; i++) {
    const at = 0.15 + Math.pow(Math.random(), 1.6) * 2.2;
    burst(c, debris, t0 + at, { dur: 0.01 + Math.random() * 0.03, freq: 1200 + Math.random() * 4000, q: 1.2, gain: 0.5 * (1 - at / 2.6) });
  }
}

/** Snare roll that speeds up and swells for two seconds, then kick + crash. */
function drumroll(b: Bus) {
  const { c } = b;
  const t0 = c.currentTime + 0.03;
  const len = 2.3;
  const left = strip(b, { gain: 0.7, pan: -0.18, send: 0.25 });
  const right = strip(b, { gain: 0.7, pan: 0.18, send: 0.25 });
  let t = 0;
  let hand = 0;
  while (t < len) {
    const progress = t / len;
    const v = (0.28 + progress * 0.72) * (hand % 2 ? 0.86 : 1) * (0.92 + Math.random() * 0.08);
    const side = hand % 2 ? right : left;
    snare(c, side, t0 + t, v);
    // each stroke bounces on the head: a press roll, not a machine gun
    snare(c, side, t0 + t + 0.022, v * 0.45);
    snare(c, side, t0 + t + 0.041, v * 0.22);
    hand++;
    t += 1 / (15 + progress * 9) + (Math.random() - 0.5) * 0.004;
  }
  const end = t0 + len + 0.02;
  const hit = strip(b, { gain: 0.5, send: 0.35 });
  kick(c, hit, end, 1);
  snare(c, hit, end, 1.1);
  cymbal(c, strip(b, { gain: 0.65, pan: -0.2, send: 0.4 }), end, { dur: 2.8, gain: 0.55, bright: 0.95 });
  cymbal(c, strip(b, { gain: 0.5, pan: 0.3, send: 0.4 }), end + 0.012, { dur: 2.4, gain: 0.4, bright: 1.08 });
}

const SYNTHS: Record<SoundKey, (b: Bus) => void> = { womp, rimshot, applause, airhorn, drumroll, boom };

// ---------------------------------------------------------------------------
// Recorded samples (optional, preferred)
// ---------------------------------------------------------------------------

const samples = new Map<SoundKey, AudioBuffer | null>();
const loading = new Map<SoundKey, Promise<void>>();

function loadSample(b: Bus, key: SoundKey) {
  if (samples.has(key)) return Promise.resolve();
  if (!loading.has(key)) {
    loading.set(
      key,
      fetch(`/sounds/${key}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then((data) => b.c.decodeAudioData(data))
        .then((buf) => void samples.set(key, buf))
        .catch(() => void samples.set(key, null)),
    );
  }
  return loading.get(key)!;
}

/** Fetch any recorded samples ahead of time (call when the soundboard appears). */
export function preloadSounds() {
  const b = getBus();
  if (b) for (const s of SOUNDS) void loadSample(b, s.key);
}

export function playSound(key: SoundKey) {
  if (isMuted()) return;
  const b = getBus();
  if (!b) return;
  const buf = samples.get(key);
  if (buf) {
    const src = b.c.createBufferSource();
    src.buffer = buf;
    src.connect(strip(b, { gain: 0.9, send: 0.08 }));
    src.start();
    return;
  }
  SYNTHS[key](b);
  void loadSample(b, key); // in case a recording exists for next time
}

// ---------------------------------------------------------------------------
// Small UI sounds
// ---------------------------------------------------------------------------

/** Two glasses touching. Used when a pour is saved and on the champion reveal. */
export function clink() {
  if (isMuted()) return;
  const b = getBus();
  if (!b) return;
  const { c } = b;
  const out = strip(b, { gain: 0.22, send: 0.4 });
  const t = c.currentTime + 0.01;
  for (const [f, d, g] of [
    [2793, 1.1, 0.5],
    [4186 * 1.012, 0.8, 0.3],
    [6271 * 0.993, 0.5, 0.18],
    [8372 * 1.02, 0.3, 0.1],
  ] as const) {
    const o = c.createOscillator();
    o.frequency.value = f;
    const gg = c.createGain();
    adsr(gg.gain, t, { a: 0.001, peak: g, d });
    o.connect(gg).connect(out);
    o.start(t);
    o.stop(t + d + 0.05);
  }
}

/** A napkin sliding across the bar. */
export function paperSlide() {
  if (isMuted()) return;
  const b = getBus();
  if (!b) return;
  const { c } = b;
  const out = strip(b, { gain: 0.35, send: 0.15 });
  const t = c.currentTime + 0.01;
  const src = noise(c);
  const bp = filter(c, "bandpass", 2400, 0.9);
  bp.frequency.setValueAtTime(3200, t);
  bp.frequency.exponentialRampToValueAtTime(1300, t + 0.35);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  src.connect(bp).connect(g).connect(out);
  src.start(t);
  src.stop(t + 0.4);
}

/** A soft continuous pour while the bottle is tipped. Returns a stop function. */
export function startPourSound(): () => void {
  if (isMuted()) return () => {};
  const b = getBus();
  if (!b) return () => {};
  const { c } = b;
  const out = strip(b, { gain: 1, send: 0.15 });
  const g = c.createGain();
  g.gain.value = 0.0001;
  const src = noise(c);
  const bp = filter(c, "bandpass", 900, 2.5);
  const lfo = c.createOscillator();
  lfo.frequency.value = 9;
  const depth = c.createGain();
  depth.gain.value = 350;
  lfo.connect(depth).connect(bp.frequency);
  src.connect(bp).connect(g).connect(out);
  src.start();
  lfo.start();
  g.gain.exponentialRampToValueAtTime(0.16, c.currentTime + 0.12);
  return () => {
    const t = c.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    src.stop(t + 0.2);
    lfo.stop(t + 0.2);
  };
}
