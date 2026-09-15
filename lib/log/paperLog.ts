import "server-only";
import type { AgentState } from "@/lib/types";
import { STARTING_CASH, WATCHLIST } from "@/lib/config";
import { round2 } from "@/lib/util";

/**
 * One row of the paper-trading log, in the exact shape the Agentic Trading
 * track asks for: timestamp, instrument, direction, price, quantity, and the
 * resulting change in account balance. Everything is derived from the durable
 * trade history, so the log is a faithful record of what the agent actually did.
 */
export interface PaperLogRow {
  id: string;
  ts: number; // epoch ms
  iso: string; // ISO-8601 timestamp (UTC)
  ticker: string; // tokenized instrument, e.g. "AAPLx"
  symbol: string; // underlying, e.g. "AAPL"
  name: string; // "Apple"
  action: "BUY" | "SELL"; // direction
  price: number; // fill price (USD)
  qty: number; // quantity filled
  value: number; // notional = qty * price (USD)
  cashChange: number; // signed effect on cash: SELL +value, BUY -value
  balanceAfter: number; // running cash balance after this trade (USD)
  realized: number | null; // realized P&L booked by this trade (SELL only)
}

const BY_TICKER = Object.fromEntries(WATCHLIST.map((i) => [i.ticker, i]));

/**
 * Rebuild the paper-trading log from the durable trade history. Cash is
 * reconstructed from the known starting capital by applying each trade's signed
 * effect in order, so the running balance is internally consistent and auditable
 * without trusting any other stored field.
 *
 * Trades are stored oldest-first (most recent last), which is the order we walk.
 */
export function buildPaperLog(state: AgentState): PaperLogRow[] {
  let cash = STARTING_CASH;
  const rows: PaperLogRow[] = [];

  for (const t of state.portfolio.trades) {
    const cashChange = t.action === "SELL" ? t.value : -t.value;
    cash = round2(cash + cashChange);
    const inst = BY_TICKER[t.ticker];
    rows.push({
      id: t.id,
      ts: t.ts,
      iso: new Date(t.ts).toISOString(),
      ticker: t.ticker,
      symbol: inst?.symbol ?? t.ticker,
      name: inst?.name ?? t.ticker,
      action: t.action,
      price: t.price,
      qty: t.qty,
      value: t.value,
      cashChange,
      balanceAfter: cash,
      realized: t.realized ?? null,
    });
  }

  return rows;
}

/** A compact summary of the account, for the header and the JSON export. */
export function paperLogSummary(state: AgentState, rows: PaperLogRow[]) {
  return {
    startingCash: STARTING_CASH,
    cash: state.portfolio.cash,
    realizedPnl: state.portfolio.realizedPnl,
    openPositions: state.portfolio.positions.length,
    trades: rows.length,
    ticks: state.tick,
    startedAt: state.startedAt,
    firstTradeAt: rows.length ? rows[0].ts : null,
    lastTradeAt: rows.length ? rows[rows.length - 1].ts : null,
  };
}
