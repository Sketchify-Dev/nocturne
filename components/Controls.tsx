"use client";

import { Pause, Play, RotateCcw, StepForward, Zap } from "lucide-react";
import type { AgentStatus, Strategy } from "@/lib/types";
import { STRATEGIES } from "@/lib/config";
import { cn } from "@/lib/ui/cn";

const STRATEGY_KEYS: Strategy[] = ["conservative", "balanced", "aggressive"];
const INTERVALS = [
  { ms: 2000, label: "2s" },
  { ms: 4000, label: "4s" },
  { ms: 8000, label: "8s" },
];

export function Controls({
  status,
  strategy,
  busy,
  auto,
  intervalMs,
  onStart,
  onPause,
  onReset,
  onAdvance,
  onStrategy,
  onAuto,
  onInterval,
}: {
  status: AgentStatus;
  strategy: Strategy;
  busy: boolean;
  auto: boolean;
  intervalMs: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdvance: () => void;
  onStrategy: (s: Strategy) => void;
  onAuto: (v: boolean) => void;
  onInterval: (ms: number) => void;
}) {
  const running = status === "running";

  return (
    <div className="glass rounded-glass p-4 shadow-panel sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Strategy segmented control */}
        <div>
          <div className="eyebrow mb-2">Strategy</div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            {STRATEGY_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => onStrategy(k)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  strategy === k
                    ? "bg-accent-grad text-white shadow-glow"
                    : "text-muted hover:text-ink",
                )}
              >
                {STRATEGIES[k].label}
              </button>
            ))}
          </div>
          <p className="mt-2 max-w-xs text-xs text-muted">
            {STRATEGIES[strategy].blurb}
          </p>
        </div>

        {/* Transport controls */}
        <div className="flex flex-wrap items-center gap-2">
          {running ? (
            <button
              onClick={onPause}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-ink transition hover:bg-white/10 disabled:opacity-50"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-accent-grad px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
            >
              <Play className="h-4 w-4" /> Start
            </button>
          )}

          <button
            onClick={onAdvance}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-ink transition hover:bg-white/10 disabled:opacity-50"
          >
            <StepForward className="h-4 w-4" /> Advance
          </button>

          <button
            onClick={onReset}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition hover:text-ink disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>

          {/* Auto-tick */}
          <div className="ml-1 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1.5">
            <button
              onClick={() => onAuto(!auto)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition",
                auto ? "text-accent" : "text-muted hover:text-ink",
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Auto
            </button>
            {INTERVALS.map((iv) => (
              <button
                key={iv.ms}
                onClick={() => onInterval(iv.ms)}
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-mono transition",
                  intervalMs === iv.ms
                    ? "bg-white/10 text-ink"
                    : "text-muted hover:text-ink",
                )}
              >
                {iv.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
