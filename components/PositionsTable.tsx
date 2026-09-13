"use client";

import type { Position } from "@/lib/types";
import { cn } from "@/lib/ui/cn";
import { fmtPct, fmtUsd } from "@/lib/util";

export function PositionsTable({
  positions,
  priceMap,
}: {
  positions: Position[];
  priceMap: Record<string, number>;
}) {
  if (!positions.length) {
    return (
      <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm text-muted">
        No open positions yet. The agent is holding cash, waiting for an edge.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted">
            <th className="pb-2 font-normal">Asset</th>
            <th className="pb-2 text-right font-normal">Qty</th>
            <th className="pb-2 text-right font-normal">Avg</th>
            <th className="pb-2 text-right font-normal">Last</th>
            <th className="pb-2 text-right font-normal">Value</th>
            <th className="pb-2 text-right font-normal">P&amp;L</th>
          </tr>
        </thead>
        <tbody className="nums">
          {positions.map((p) => {
            const last = priceMap[p.ticker] ?? p.avgCost;
            const value = p.qty * last;
            const pnlPct = p.avgCost > 0 ? (last / p.avgCost - 1) * 100 : 0;
            const up = pnlPct >= 0;
            return (
              <tr key={p.ticker} className="border-t border-white/5">
                <td className="py-2.5 font-semibold text-ink">{p.ticker}</td>
                <td className="py-2.5 text-right text-muted">{p.qty.toFixed(3)}</td>
                <td className="py-2.5 text-right text-muted">${p.avgCost.toFixed(2)}</td>
                <td className="py-2.5 text-right">${last.toFixed(2)}</td>
                <td className="py-2.5 text-right">{fmtUsd(value)}</td>
                <td
                  className={cn(
                    "py-2.5 text-right font-medium",
                    up ? "text-up" : "text-down",
                  )}
                >
                  {fmtPct(pnlPct)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
