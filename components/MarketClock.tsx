"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * A live world clock for the major equity sessions. Tokenized equities trade
 * 24/7, so this is really a mood piece: it shows which of the world's markets
 * are awake right now, reinforcing that Nocturne keeps working while they close.
 */

interface City {
  code: string;
  name: string;
  tz: string;
  open: number; // minutes since local midnight
  close: number;
}

// Regular cash-session hours (local), roughly. Used only for the open/closed dot.
const CITIES: City[] = [
  { code: "NY", name: "New York", tz: "America/New_York", open: 570, close: 960 },
  { code: "LON", name: "London", tz: "Europe/London", open: 480, close: 990 },
  { code: "TYO", name: "Tokyo", tz: "Asia/Tokyo", open: 540, close: 900 },
  { code: "HK", name: "Hong Kong", tz: "Asia/Hong_Kong", open: 570, close: 960 },
];

function zoneParts(now: Date, tz: string): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) out[part.type] = part.value;
  return out;
}

function cityState(now: Date, c: City): { time: string; open: boolean } {
  const p = zoneParts(now, c.tz);
  const hour = parseInt(p.hour ?? "0", 10);
  const minute = parseInt(p.minute ?? "0", 10);
  const mins = hour * 60 + minute;
  const weekend = p.weekday === "Sat" || p.weekday === "Sun";
  const open = !weekend && mins >= c.open && mins < c.close;
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { time, open };
}

export function MarketClock({
  variant = "strip",
  className,
}: {
  variant?: "strip" | "panel";
  className?: string;
}) {
  // Render neutral until mounted so server and client HTML agree.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (variant === "panel") {
    return (
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
        {CITIES.map((c) => {
          const st = now ? cityState(now, c) : null;
          return (
            <div key={c.code} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  {c.code}
                </span>
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    st?.open ? "animate-pulse-dot bg-up" : "bg-muted/40",
                  )}
                />
              </div>
              <div className="mt-2 font-display text-2xl font-semibold nums">
                {st ? st.time : "--:--"}
              </div>
              <div className="mt-0.5 text-xs text-muted">{c.name}</div>
              <div
                className={cn(
                  "mt-1 font-mono text-[10px] uppercase tracking-wider",
                  st?.open ? "text-up" : "text-muted",
                )}
              >
                {st ? (st.open ? "Open" : "Closed") : "·····"}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2",
        className,
      )}
    >
      <span className="eyebrow text-[10px]">Global markets</span>
      {CITIES.map((c) => {
        const st = now ? cityState(now, c) : null;
        return (
          <div key={c.code} className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                st?.open ? "animate-pulse-dot bg-up" : "bg-muted/40",
              )}
            />
            <span className="font-mono text-xs text-muted">{c.code}</span>
            <span className="font-mono text-xs text-ink nums">
              {st ? st.time : "--:--"}
            </span>
          </div>
        );
      })}
      <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-wider text-accent sm:inline">
        Tokens trade 24/7
      </span>
    </div>
  );
}
