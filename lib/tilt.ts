"use client";

import { useEffect, useState } from "react";

const KEY = "drinkpalooza:tilt";

type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

export function tiltNeedsPermission() {
  return typeof window !== "undefined" && typeof (window.DeviceOrientationEvent as OrientationCtor | undefined)?.requestPermission === "function";
}

/** iOS only grants motion access from a tap, so this must be called from a click handler. */
export async function enableTilt(): Promise<boolean> {
  const ctor = window.DeviceOrientationEvent as OrientationCtor | undefined;
  let granted = true;
  if (ctor?.requestPermission) granted = (await ctor.requestPermission().catch(() => "denied")) === "granted";
  try {
    window.localStorage.setItem(KEY, granted ? "on" : "off");
  } catch {}
  window.dispatchEvent(new Event("palooza:tilt"));
  return granted;
}

export function tiltEnabled() {
  try {
    return window.localStorage.getItem(KEY) === "on" || (!tiltNeedsPermission() && window.localStorage.getItem(KEY) !== "off");
  } catch {
    return false;
  }
}

/**
 * Left/right tilt in degrees, smoothed and clamped, so liquid can stay level
 * while the phone rocks. Purely decorative: 0 when unavailable.
 */
export function useTilt(): number {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let current = 0;
    let target = 0;
    let raf = 0;
    let listening = false;
    const onOrient = (e: DeviceOrientationEvent) => {
      const g = e.gamma ?? 0;
      target = Math.max(-28, Math.min(28, g));
    };
    const tick = () => {
      current += (target - current) * 0.12;
      setAngle((prev) => (Math.abs(prev - current) > 0.2 ? current : prev));
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (listening || !tiltEnabled()) return;
      listening = true;
      window.addEventListener("deviceorientation", onOrient);
      raf = requestAnimationFrame(tick);
    };
    start();
    window.addEventListener("palooza:tilt", start);
    return () => {
      window.removeEventListener("palooza:tilt", start);
      window.removeEventListener("deviceorientation", onOrient);
      cancelAnimationFrame(raf);
    };
  }, []);
  return angle;
}

/** Calls `onShake` when the phone is shaken like a cocktail shaker (needs motion permission on iOS). */
export function useShake(onShake: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let last = 0;
    let hits = 0;
    let lastHit = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
      const now = Date.now();
      if (mag > 24) {
        hits = now - lastHit < 400 ? hits + 1 : 1;
        lastHit = now;
        if (hits >= 3 && now - last > 2500) {
          last = now;
          hits = 0;
          onShake();
        }
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [onShake, enabled]);
}
