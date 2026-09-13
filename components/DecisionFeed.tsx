"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import type { Action, LogEntry } from "@/lib/types";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { cn } from "@/lib/ui/cn";
import { fmtUsd } from "@/lib/util";

function ago(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

const ACTION_STYLE: Record<Action, string> = {
  BUY: "border-up/30 bg-up/15 text-up",
  SELL: "border-down/30 bg-down/15 text-down",
  HOLD: "border-white/10 bg-white/5 text-muted",
};

function ActionBadge({ action }: { action: Action }) {
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
        ACTION_STYLE[action],
      )}
    >
      {action}
    </span>
  );
}

/**
 * Reveals text one chunk at a time. Runs only when `play` is true (the newest,
 * top-of-feed entry); everything else shows in full immediately. Keyed by entry
 * id upstream, so it types exactly once as each fresh decision lands.
 */
function Typewriter({ text, play }: { text: string; play: boolean }) {
  const [n, setN] = useState(() => (play ? 0 : text.length));

  useEffect(() => {
    if (!play) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(text.length, i + 2);
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [text, play]);

  const done = n >= text.length;
  return (
    <>
      {text.slice(0, n)}
      {!done && (
        <span className="ml-0.5 inline-block h-3 w-1.5 -translate-y-px animate-pulse rounded-sm bg-accent align-middle" />
      )}
    </>
  );
}

export function DecisionFeed({ log }: { log: LogEntry[] }) {
  const reduce = useReducedMotion();

  if (!log.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted">
        Waiting for the first decision…
      </div>
    );
  }

  const items = log.slice(0, 14);

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {items.map((e, idx) => {
          const executed = new Set(e.executed.map((t) => t.ticker));
          const actionable = e.decisions.filter((d) => d.action !== "HOLD");
          const holds = e.decisions.filter((d) => d.action === "HOLD");
          const primary = actionable.length ? actionable : holds.slice(0, 2);
          const holdNames = (actionable.length ? holds : holds.slice(2)).map(
            (h) => h.ticker,
          );
          const isTop = idx === 0;

          return (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "feed-item glass rounded-2xl p-4",
                isTop && "border border-accent/30 shadow-glow",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isTop && (
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
                  )}
                  <span className="font-mono text-xs uppercase tracking-wider text-accent">
                    Tick {e.tick}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {ago(e.ts)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SourceBadge
                    live={e.llmSource === "live"}
                    label={e.llmSource === "live" ? "Qwen" : "demo"}
                  />
                  <span className="font-mono text-xs text-muted nums">
                    {fmtUsd(e.equity)}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-muted">
                <Typewriter text={e.marketView} play={isTop && !reduce} />
              </p>

              <div className="mt-3 flex flex-col gap-2">
                {primary.map((d, i) => {
                  const filled = executed.has(d.ticker) && d.action !== "HOLD";
                  return (
                    <div
                      key={`${d.ticker}-${i}`}
                      className={cn(
                        "rounded-xl border p-2.5",
                        filled
                          ? "border-accent/25 bg-accent/[0.06]"
                          : "border-white/5 bg-white/[0.02]",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ActionBadge action={d.action} />
                        <span className="text-sm font-semibold text-ink">
                          {d.ticker}
                        </span>
                        <span className="font-mono text-[11px] text-muted nums">
                          conf {Math.round(d.confidence * 100)}%
                        </span>
                        {filled && (
                          <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent">
                            <Check className="h-3 w-3" /> Filled
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/80">
                        {d.rationale}
                      </p>
                    </div>
                  );
                })}
                {holdNames.length > 0 && (
                  <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                    Holding · {holdNames.join(" · ")}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
