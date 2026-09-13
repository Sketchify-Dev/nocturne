import type { Portfolio } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/ui/cn";
import { fmtPct } from "@/lib/util";

interface Props {
  portfolio?: Portfolio;
  priceMap: Record<string, number>;
  equity: number;
  /** When true, render just the inner content (no GlassCard wrapper). */
  bare?: boolean;
}

function Stat({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="eyebrow text-[10px]">{label}</span>
      <span className="font-display text-lg font-semibold nums">{children}</span>
      {hint && <span className="font-mono text-[10px] text-muted">{hint}</span>}
    </div>
  );
}

/**
 * A slim, fintech-style stat strip: realized win rate, trade count, capital
 * exposure (with a gauge), and the current best / worst open position.
 */
export function PerfBar({ portfolio, priceMap, equity, bare = false }: Props) {
  const trades = portfolio?.trades ?? [];
  const positions = portfolio?.positions ?? [];

  const sells = trades.filter((t) => t.action === "SELL");
  const wins = sells.filter((t) => (t.realized ?? 0) > 0).length;
  const winRate = sells.length ? (wins / sells.length) * 100 : null;

  const posValue = positions.reduce(
    (a, p) => a + p.qty * (priceMap[p.ticker] ?? p.avgCost),
    0,
  );
  const exposure = equity > 0 ? (posValue / equity) * 100 : 0;
  const clampedExposure = Math.min(100, Math.max(0, exposure));

  const perf = positions
    .map((p) => ({
      ticker: p.ticker,
      pct: priceMap[p.ticker] ? (priceMap[p.ticker] / p.avgCost - 1) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct);
  const best = perf[0];
  const worst = perf.length > 1 ? perf[perf.length - 1] : undefined;

  const inner = (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label="Win rate"
          hint={sells.length ? `${wins}/${sells.length} closed` : "no closes yet"}
        >
          <span
            className={cn(
              winRate === null
                ? "text-muted"
                : winRate >= 50
                  ? "text-up"
                  : "text-down",
            )}
          >
            {winRate === null ? "n/a" : `${Math.round(winRate)}%`}
          </span>
        </Stat>

        <Stat label="Trades" hint="executed">
          {trades.length}
        </Stat>

        <Stat label="Exposure" hint={`${positions.length} positions`}>
          {Math.round(exposure)}%
        </Stat>

        <Stat label="Top mover" hint={best ? best.ticker : "flat"}>
          {best ? (
            <span className={best.pct >= 0 ? "text-up" : "text-down"}>
              {fmtPct(best.pct)}
            </span>
          ) : (
            <span className="text-muted">n/a</span>
          )}
        </Stat>

        <Stat label="Laggard" hint={worst ? worst.ticker : "flat"}>
          {worst ? (
            <span className={worst.pct >= 0 ? "text-up" : "text-down"}>
              {fmtPct(worst.pct)}
            </span>
          ) : (
            <span className="text-muted">n/a</span>
          )}
        </Stat>
      </div>

      {/* Capital-deployed gauge */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
          <span>Capital deployed</span>
          <span className="nums">{Math.round(exposure)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-accent-grad transition-all duration-700"
            style={{ width: `${clampedExposure}%` }}
          />
        </div>
      </div>
    </>
  );

  return bare ? inner : <GlassCard className="p-4 sm:p-5">{inner}</GlassCard>;
}
