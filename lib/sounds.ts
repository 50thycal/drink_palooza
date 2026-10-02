"use client";

import type { SoundKey } from "./constants";

/**
 * Every sound is synthesised with Web Audio: no files to load, no licensing,
 * works offline. The context is created on first use, which is always a tap,
 * so iOS lets it make noise.
 */

const MUTE_KEY = "drinkpalooza:muted";
let ctx: AudioContext | null = null;

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

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function master(c: AudioContext, volume = 0.8) {
  const g = c.createGain();
  g.gain.value = volume;
  const comp = c.createDynamicsCompressor();
  g.connect(comp).connect(c.destination);
  return g;
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
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

/** A filtered noise burst — the building block of claps, snares and cymbals. */
function burst(c: AudioContext, out: AudioNode, t: number, { dur, freq, q = 1, type = "bandpass" as BiquadFilterType, gain = 1 }: { dur: number; freq: number; q?: number; type?: BiquadFilterType; gain?: number }) {
  const src = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
}

/** Sad trombone: four sliding notes, the last one long with a wobble. */
function womp(c: AudioContext) {
  const out = master(c, 0.55);
  const t0 = c.currentTime + 0.02;
  const notes = [
    [293.66, 0.38],
    [277.18, 0.38],
    [261.63, 0.38],
    [246.94, 1.3],
  ] as const;
  let t = t0;
  for (const [i, [freq, dur]] of notes.entries()) {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 1.03, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    lp.Q.value = 4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.05);
    g.gain.setValueAtTime(0.9, t + dur - 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (i === notes.length - 1) {
      const lfo = c.createOscillator();
      lfo.frequency.value = 6;
      const depth = c.createGain();
      depth.gain.value = 7;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t + 0.25);
      lfo.stop(t + dur);
      osc.frequency.linearRampToValueAtTime(freq * 0.94, t + dur);
    }
    osc.connect(lp).connect(g).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    t += dur + 0.04;
  }
}

function tom(c: AudioContext, out: AudioNode, t: number, freq: number) {
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.6, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
  const g = c.createGain();
  g.gain.setValueAtTime(1, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.4);
  burst(c, out, t, { dur: 0.08, freq: 2500, q: 0.7, gain: 0.35 });
}

/** Ba-dum-tss. */
function rimshot(c: AudioContext) {
  const out = master(c, 0.8);
  const t = c.currentTime + 0.02;
  tom(c, out, t, 180);
  tom(c, out, t + 0.16, 120);
  burst(c, out, t + 0.42, { dur: 1.1, freq: 7000, type: "highpass", q: 0.5, gain: 0.5 });
}

/** A room clapping: hundreds of tiny, slightly different claps that swell and fade. */
function applause(c: AudioContext) {
  const out = master(c, 0.7);
  const t0 = c.currentTime + 0.02;
  const total = 3.2;
  for (let i = 0; i < 260; i++) {
    const at = Math.random() * total;
    const env = Math.min(1, at / 0.5) * Math.min(1, (total - at) / 1.4);
    burst(c, out, t0 + at, { dur: 0.05 + Math.random() * 0.04, freq: 900 + Math.random() * 1800, q: 1.5, gain: 0.25 + env * 0.5 });
  }
}

/** Three blasts of a detuned brass chord. */
function airhorn(c: AudioContext) {
  const out = master(c, 0.32);
  const t0 = c.currentTime + 0.02;
  const blasts = [
    [0, 0.18],
    [0.26, 0.18],
    [0.52, 0.9],
  ] as const;
  for (const [at, dur] of blasts) {
    const t = t0 + at;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.02);
    g.gain.setValueAtTime(1, t + dur - 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const bp = c.createBiquadFilter();
    bp.type = "peaking";
    bp.frequency.value = 1400;
    bp.gain.value = 10;
    g.connect(bp).connect(out);
    for (const f of [466, 470, 588, 699]) {
      const osc = c.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f * 0.92, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
  }
}

/** Snare roll that builds for two seconds, then a crash. */
function drumroll(c: AudioContext) {
  const out = master(c, 0.75);
  const t0 = c.currentTime + 0.02;
  const len = 2.2;
  for (let t = 0; t < len; t += 0.045) {
    burst(c, out, t0 + t, { dur: 0.06, freq: 1800, q: 0.8, gain: 0.12 + (t / len) * 0.55 });
  }
  tom(c, out, t0 + len, 90);
  burst(c, out, t0 + len, { dur: 2.2, freq: 5000, type: "highpass", q: 0.4, gain: 0.8 });
}

const PLAYERS: Record<SoundKey, (c: AudioContext) => void> = { womp, rimshot, applause, airhorn, drumroll };

export function playSound(key: SoundKey) {
  if (isMuted()) return;
  const c = audio();
  if (c) PLAYERS[key](c);
}

/** Two glasses touching. Used when a pour is saved and on the champion reveal. */
export function clink() {
  if (isMuted()) return;
  const c = audio();
  if (!c) return;
  const out = master(c, 0.25);
  const t = c.currentTime + 0.01;
  for (const [f, d] of [
    [2637, 0.9],
    [3951, 0.6],
    [5274, 0.4],
  ] as const) {
    const osc = c.createOscillator();
    osc.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + d);
  }
}

/** A soft continuous pour while the bottle is tipped. Returns a stop function. */
export function startPourSound(): () => void {
  if (isMuted()) return () => {};
  const c = audio();
  if (!c) return () => {};
  const out = master(c, 0.0001);
  const src = noise(c);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 900;
  bp.Q.value = 2.5;
  const lfo = c.createOscillator();
  lfo.frequency.value = 9;
  const depth = c.createGain();
  depth.gain.value = 350;
  lfo.connect(depth).connect(bp.frequency);
  src.connect(bp).connect(out);
  src.start();
  lfo.start();
  out.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.12);
  return () => {
    const t = c.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(out.gain.value, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    src.stop(t + 0.2);
    lfo.stop(t + 0.2);
  };
}
