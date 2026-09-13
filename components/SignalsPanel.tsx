"use client";

import type { Signals, SentimentScore } from "@/lib/types";
import { cn } from "@/lib/ui/cn";

function sentColor(label?: SentimentScore["label"]): string {
  if (label === "bullish") return "text-up";
  if (label === "bearish") return "text-down";
  return "text-muted";
}

export function SignalsPanel({ signals }: { signals: Signals | null }) {
  if (!signals) {
    return <div className="p-4 text-sm text-muted">No signals yet.</div>;
  }
  const sentMap = new Map(signals.sentiment.map((s) => [s.ticker, s]));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="eyebrow mb-2">Live signals</div>
        <div className="flex flex-col gap-1.5">
          {signals.prices.map((p) => {
            const s = sentMap.get(p.ticker);
            const up = p.changePct24h >= 0;
            return (
              <div
                key={p.ticker}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="w-16 font-semibold text-ink">{p.ticker}</span>
                <span className="w-20 text-right text-muted nums">
                  ${p.price.toFixed(2)}
                </span>
                <span
                  className={cn(
                    "w-16 text-right nums",
                    up ? "text-up" : "text-down",
                  )}
                >
                  {up ? "+" : ""}
                  {p.changePct24h.toFixed(2)}%
                </span>
                <span
                  className={cn(
                    "w-16 text-right font-mono text-xs uppercase",
                    sentColor(s?.label),
                  )}
                >
                  {s?.label ?? "n/a"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="eyebrow mb-2">Headlines</div>
        <ul className="flex flex-col gap-2">
          {signals.news.slice(0, 5).map((n) => (
            <li key={n.id} className="text-sm leading-snug text-ink/80">
              <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-accent">
                {n.tickers[0]}
              </span>
              {n.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
