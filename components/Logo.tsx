"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/ui/cn";

interface LogoProps {
  /** "full" = icon + wordmark, "mark" = icon only, "wordmark" = text only. */
  variant?: "full" | "mark" | "wordmark";
  className?: string;
  iconClassName?: string;
  wordClassName?: string;
  /** Render the "O" in NOCTURNE as a crescent moon (wordmark treatment). */
  crescentO?: boolean;
  /** Softly pulse the crescent-O, like a heartbeat (ignored under reduced-motion). */
  animated?: boolean;
}

/**
 * Nocturne brand mark: a crescent moon whose curve lifts into a rising market
 * line ending in a glowing node. The gradient lives only in the icon; the
 * wordmark stays a calm moonlight white. One source of truth for nav, footer,
 * and anywhere else the brand appears.
 */
export function Logo({
  variant = "full",
  className,
  iconClassName = "h-5 w-5",
  wordClassName,
  crescentO = false,
  animated = false,
}: LogoProps) {
  // Unique per instance so multiple logos on one page don't share gradient ids.
  const raw = useId();
  const id = raw.replace(/[:]/g, "");
  const gid = `noc-grad-${id}`;
  const mid = `noc-mask-${id}`;
  const gidO = `noc-o-grad-${id}`;
  const midO = `noc-o-mask-${id}`;
  const reduce = useReducedMotion();

  const icon = (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", iconClassName)}
    >
      <defs>
        <linearGradient
          id={gid}
          x1="0"
          y1="32"
          x2="32"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5B7CFF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <mask id={mid}>
          <rect width="32" height="32" fill="black" />
          <circle cx="14.5" cy="17" r="10.5" fill="white" />
          <circle cx="20.5" cy="12" r="9.6" fill="black" />
        </mask>
      </defs>

      {/* crescent moon */}
      <rect width="32" height="32" fill={`url(#${gid})`} mask={`url(#${mid})`} />

      {/* rising market line, knocked out from the moon by a midnight halo */}
      <line
        x1="10.5"
        y1="22"
        x2="25.5"
        y2="7.5"
        stroke="#080B16"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <line
        x1="10.5"
        y1="22"
        x2="25.5"
        y2="7.5"
        stroke={`url(#${gid})`}
        strokeWidth="2.3"
        strokeLinecap="round"
      />

      {/* node at the top of the climb */}
      <circle cx="25.5" cy="7.5" r="3.8" fill="#080B16" />
      <circle cx="25.5" cy="7.5" r="2.5" fill={`url(#${gid})`} />
    </svg>
  );

  const wordCls = cn(
    "font-display font-semibold uppercase leading-none tracking-[0.12em]",
    wordClassName,
  );

  // Crescent glyph that stands in for the "O".
  const crescent = (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="inline-block h-[0.7em] w-[0.7em] align-[-0.05em]"
    >
      <defs>
        <linearGradient
          id={gidO}
          x1="0"
          y1="32"
          x2="32"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5B7CFF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <mask id={midO}>
          <rect width="32" height="32" fill="black" />
          <circle cx="16" cy="16" r="12" fill="white" />
          <circle cx="21.5" cy="11.5" r="10.5" fill="black" />
        </mask>
      </defs>
      <rect width="32" height="32" fill={`url(#${gidO})`} mask={`url(#${midO})`} />
    </svg>
  );

  const oGlyph =
    animated && !reduce ? (
      <motion.span
        className="inline-block"
        style={{ transformOrigin: "center" }}
        animate={{ opacity: [1, 0.55, 1], scale: [1, 1.06, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {crescent}
      </motion.span>
    ) : (
      crescent
    );

  const word = crescentO ? (
    <span className={wordCls}>N{oGlyph}CTURNE</span>
  ) : (
    <span className={wordCls}>Nocturne</span>
  );

  if (variant === "mark") {
    return <span className={cn("inline-flex", className)}>{icon}</span>;
  }

  if (variant === "wordmark") {
    return <span className={cn("inline-flex", className)}>{word}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {icon}
      {word}
    </span>
  );
}
