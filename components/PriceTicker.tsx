"use client";

import type { PricePoint } from "@/lib/types";
import { cn } from "@/lib/ui/cn";

/** Seamless scrolling marquee of the watchlist (duplicated for a smooth loop). */
export function PriceTicker({ prices }: { prices: PricePoint[] }) {
  if (!prices || prices.length === 0) return null;
  const row = [...prices, ...prices];

  return (
    <div className="relative overflow-hidden border-y border-white/5 py-3">
      <div className="flex w-max animate-marquee gap-8 pr-8">
        {row.map((p, i) => {
          const up = p.changePct24h >= 0;
          return (
            <div key={i} className="flex items-center gap-2 font-mono text-sm">
              <span className="font-semibold text-ink">{p.ticker}</span>
              <span className="text-muted nums">${p.price.toFixed(2)}</span>
              <span className={cn("nums", up ? "text-up" : "text-down")}>
                {up ? "▲" : "▼"} {Math.abs(p.changePct24h).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#080b16] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#080b16] to-transparent" />
    </div>
  );
}
