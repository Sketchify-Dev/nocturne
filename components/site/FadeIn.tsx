"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Reusable scroll reveal. Fades and lifts its children into view once, the
 * first time they enter the viewport. Honors reduced-motion via the app-wide
 * <MotionConfig reducedMotion="user"> in providers.
 */
export function FadeIn({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
