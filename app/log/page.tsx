import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileJson } from "lucide-react";
import { getState } from "@/lib/store/state";
import { buildPaperLog, paperLogSummary } from "@/lib/log/paperLog";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/ui/cn";
import { fmtUsd } from "@/lib/util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paper-trading log · Nocturne",
  description:
    "Nocturne's live, read-only paper-trading log: every executed order with timestamp, instrument, direction, price, quantity, and account balance change.",
};

/** How many rows to render in the table; the CSV export always has the full history. */
const MAX_ROWS = 500;

function fmtUTC(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(
    d.getUTCDate(),
  )} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
}

const fmtQty = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 4 });

const signed = (n: number) => (n >= 0 ? "+" : "-") + fmtUsd(Math.abs(n), true);

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down";
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-lg font-semibold nums",
          accent === "up" && "text-up",
          accent === "down" && "text-down",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default async function LogPage() {
  const state = await getState();
  const rows = buildPaperLog(state);
  const summary = paperLogSummary(state, rows);
  const shown = rows.slice(-MAX_ROWS).reverse(); // newest first
  const truncated = rows.length > MAX_ROWS;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-16">
      <span className="eyebrow">Run records</span>
      <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
        Paper-trading log
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-muted">
        Nocturne's live, read-only record of every order the agent has executed
        on live tokenized-equity prices. Each row shows the timestamp,
        instrument, direction, price, quantity, and the change to the cash
        balance. Simulated capital only: no real orders, no custody. Times are
        UTC.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/api/log?format=csv"
          className="inline-flex items-center gap-2 rounded-full bg-accent-grad px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </a>
        <a
          href="/api/log"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
        >
          <FileJson className="h-4 w-4" />
          Raw JSON
        </a>
      </div>

      {/* Account summary */}
      <GlassCard className="mt-8 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Starting capital" value={fmtUsd(summary.startingCash)} />
          <Stat label="Cash balance" value={fmtUsd(summary.cash, true)} />
          <Stat
            label="Realized P&L"
            value={signed(summary.realizedPnl)}
            accent={summary.realizedPnl >= 0 ? "up" : "down"}
          />
          <Stat label="Open positions" value={String(summary.openPositions)} />
          <Stat label="Executed trades" value={String(summary.trades)} />
          <Stat label="Ticks" value={String(summary.ticks)} />
        </div>
        {summary.firstTradeAt && summary.lastTradeAt ? (
          <div className="mt-5 border-t border-white/5 pt-4 font-mono text-xs text-muted">
            Log period: {fmtUTC(summary.firstTradeAt)} to{" "}
            {fmtUTC(summary.lastTradeAt)}
          </div>
        ) : null}
      </GlassCard>

      {/* Ledger */}
      <GlassCard className="mt-6 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="eyebrow">Ledger</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
            {truncated
              ? `Showing latest ${MAX_ROWS} of ${summary.trades}, full history in CSV`
              : "Newest first"}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-muted">
            No paper trades recorded yet. Every BUY and SELL the agent executes
            will appear here as it runs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left font-mono text-[10px] uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3 font-medium">Time (UTC)</th>
                  <th className="py-2 pr-3 font-medium">Instrument</th>
                  <th className="py-2 pr-3 font-medium">Direction</th>
                  <th className="py-2 pr-3 text-right font-medium">Price</th>
                  <th className="py-2 pr-3 text-right font-medium">Quantity</th>
                  <th className="py-2 pr-3 text-right font-medium">Notional</th>
                  <th className="py-2 pr-3 text-right font-medium">
                    Cash change
                  </th>
                  <th className="py-2 pr-3 text-right font-medium">
                    Balance after
                  </th>
                  <th className="py-2 text-right font-medium">Realized P&L</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-xs text-muted">
                      {fmtUTC(r.ts)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="font-semibold">{r.ticker}</span>{" "}
                      <span className="text-xs text-muted">{r.symbol}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                          r.action === "BUY"
                            ? "bg-up/15 text-up"
                            : "bg-down/15 text-down",
                        )}
                      >
                        {r.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right nums">
                      {fmtUsd(r.price, true)}
                    </td>
                    <td className="py-2.5 pr-3 text-right nums">
                      {fmtQty(r.qty)}
                    </td>
                    <td className="py-2.5 pr-3 text-right nums">
                      {fmtUsd(r.value, true)}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 pr-3 text-right nums",
                        r.cashChange >= 0 ? "text-up" : "text-down",
                      )}
                    >
                      {signed(r.cashChange)}
                    </td>
                    <td className="py-2.5 pr-3 text-right nums">
                      {fmtUsd(r.balanceAfter, true)}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 text-right nums",
                        r.realized === null
                          ? "text-muted"
                          : r.realized >= 0
                            ? "text-up"
                            : "text-down",
                      )}
                    >
                      {r.realized === null ? "·" : signed(r.realized)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <p className="mt-6 max-w-3xl text-xs text-muted">
        Fills are simulated on the live quote at decision time. Cash change is
        the order's effect on the cash balance (a SELL adds proceeds, a BUY
        deducts the amount deployed); balance after is the running cash balance.
        The full machine-readable history is available in the{" "}
        <a href="/api/log?format=csv" className="text-accent hover:underline">
          CSV
        </a>{" "}
        and{" "}
        <a href="/api/log" className="text-accent hover:underline">
          JSON
        </a>{" "}
        exports above. See{" "}
        <Link href="/how-it-works" className="text-accent hover:underline">
          how it works
        </Link>{" "}
        for the decision and risk model.
      </p>
    </div>
  );
}
