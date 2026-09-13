"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, X } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { fmtPct, fmtSignedUsd } from "@/lib/util";

const KEY = "nocturne:snapshot";

interface Snap {
  ts: number;
  equity: number;
  tick: number;
  trades: number;
}

interface Recap {
  mode: "away" | "launch";
  sinceMs: number;
  decisions: number;
  trades: number;
  equityDelta: number;
  equityPct: number;
}

function humanize(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) return remM ? `${h}h ${remM}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

interface Props {
  ready: boolean;
  equity: number;
  tick: number;
  tradeCount: number;
  startedAt?: number;
  startingEquity: number;
}

/**
 * "While you were away" banner. On load it diffs the current portfolio against a
 * snapshot saved the last time the user left the tab, so it can show, honestly,
 * exactly what the agent did overnight. First-ever visit falls back to a
 * "since launch" summary.
 */
export function SessionRecap({
  ready,
  equity,
  tick,
  tradeCount,
  startedAt,
  startingEquity,
}: Props) {
  const [recap, setRecap] = useState<Recap | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const doneRef = useRef(false);

  // Mirror the latest values so the unload listener always saves fresh numbers.
  const snapRef = useRef<Snap>({ ts: 0, equity, tick, trades: tradeCount });
  snapRef.current = { ts: Date.now(), equity, tick, trades: tradeCount };

  // Compute the recap exactly once, the moment real state has loaded.
  useEffect(() => {
    if (!ready || doneRef.current) return;
    doneRef.current = true;

    let prev: Snap | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) prev = JSON.parse(raw) as Snap;
    } catch {
      prev = null;
    }

    const nowTs = Date.now();
    if (prev && nowTs - prev.ts > 60_000) {
      setRecap({
        mode: "away",
        sinceMs: nowTs - prev.ts,
        decisions: Math.max(0, tick - prev.tick),
        trades: Math.max(0, tradeCount - prev.trades),
        equityDelta: equity - prev.equity,
        equityPct: prev.equity > 0 ? (equity / prev.equity - 1) * 100 : 0,
      });
    } else if (!prev && startedAt && tick > 0) {
      setRecap({
        mode: "launch",
        sinceMs: nowTs - startedAt,
        decisions: tick,
        trades: tradeCount,
        equityDelta: equity - startingEquity,
        equityPct: startingEquity > 0 ? (equity / startingEquity - 1) * 100 : 0,
      });
    }
  }, [ready, equity, tick, tradeCount, startedAt, startingEquity]);

  // Persist a fresh snapshot when the user leaves or hides the tab.
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(snapRef.current));
      } catch {
        // ignore (private mode, quota, etc.)
      }
    };
    const onVisibility = () => {
      if (document.hidden) save();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", save);
    return () => {
      save();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  const show =
    !!recap &&
    !dismissed &&
    (recap.decisions > 0 || recap.trades > 0 || recap.equityDelta !== 0);

  return (
    <AnimatePresence>
      {show && recap && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-glass flex flex-wrap items-center gap-x-5 gap-y-2 border border-accent/20 p-3 pl-4 shadow-glow sm:pl-5"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Moon className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-sm font-semibold">
              {recap.mode === "away" ? "While you were away" : "Since launch"}
            </span>
            <span className="font-mono text-xs text-muted">
              · {humanize(recap.sinceMs)}
            </span>
          </span>

          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
            <span>
              <span className="text-ink nums">{recap.decisions}</span> decisions
            </span>
            <span>
              <span className="text-ink nums">{recap.trades}</span> trades
            </span>
            <span>
              equity{" "}
              <span
                className={cn(
                  "nums",
                  recap.equityDelta >= 0 ? "text-up" : "text-down",
                )}
              >
                {fmtPct(recap.equityPct)} ({fmtSignedUsd(recap.equityDelta)})
              </span>
            </span>
          </span>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="ml-auto rounded-full p-1 text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
