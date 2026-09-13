"use client";

import { motion } from "motion/react";

/**
 * Slow-drifting aurora behind all content. Sits above the static night-sky
 * glow (body::before at -2) and below the UI (0+). With reduced-motion the
 * blobs simply rest in place.
 */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden"
    >
      <motion.div
        className="absolute -left-[10%] top-[-15%] h-[45vmax] w-[45vmax] rounded-full opacity-40 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(91,124,255,0.5), transparent 60%)",
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, 60, 30, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10%] top-[8%] h-[40vmax] w-[40vmax] rounded-full opacity-30 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.5), transparent 60%)",
        }}
        animate={{ x: [0, -70, 30, 0], y: [0, 50, -30, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[28%] h-[38vmax] w-[38vmax] rounded-full opacity-25 blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.35), transparent 60%)",
        }}
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.12, 0.9, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
