import type { Decision, Portfolio, Position, Trade } from "@/lib/types";
import type { StrategyConfig } from "@/lib/config";
import { round2, uid } from "@/lib/util";

const EPS = 1e-6;
const MIN_TRADE_USD = 1; // ignore dust trades

/** Market value of all positions given a price map. */
export function positionsValue(
  positions: Position[],
  priceMap: Record<string, number>,
): number {
  return positions.reduce(
    (sum, p) => sum + p.qty * (priceMap[p.ticker] ?? p.avgCost),
    0,
  );
}

/** Total equity = cash + market value of positions. */
export function equity(
  portfolio: Portfolio,
  priceMap: Record<string, number>,
): number {
  return portfolio.cash + positionsValue(portfolio.positions, priceMap);
}

function clonePortfolio(p: Portfolio): Portfolio {
  return {
    cash: p.cash,
    positions: p.positions.map((x) => ({ ...x })),
    trades: [...p.trades],
    equityCurve: [...p.equityCurve],
    realizedPnl: p.realizedPnl,
  };
}

/**
 * Apply the model's (already confidence-filtered) BUY/SELL decisions to a copy
 * of the portfolio, enforcing the strategy's risk limits. Returns the new
 * portfolio and the trades that were actually executed.
 *
 * Invariants: cash never goes negative; we never sell more than we hold; no
 * single position exceeds maxPositionPct of equity at entry.
 */
export function applyDecisions(
  portfolio: Portfolio,
  decisions: Decision[],
  priceMap: Record<string, number>,
  strategy: StrategyConfig,
): { portfolio: Portfolio; executed: Trade[] } {
  const next = clonePortfolio(portfolio);
  const executed: Trade[] = [];
  const equityAtEntry = equity(next, priceMap);
  const ts = Date.now();

  for (const d of decisions) {
    const price = priceMap[d.ticker];
    if (!price || price <= 0) continue;
    const posIdx = next.positions.findIndex((p) => p.ticker === d.ticker);
    const pos = posIdx >= 0 ? next.positions[posIdx] : undefined;

    if (d.action === "BUY") {
      const byTrade = (next.cash * Math.min(d.sizePct, strategy.maxTradeSizePct)) / 100;
      const desired = (next.cash * d.sizePct) / 100;
      const maxPosVal = (equityAtEntry * strategy.maxPositionPct) / 100;
      const currentVal = (pos?.qty ?? 0) * price;
      const room = Math.max(0, maxPosVal - currentVal);
      const spend = Math.min(desired, byTrade, room, next.cash);
      if (spend < MIN_TRADE_USD) continue;

      const qty = spend / price;
      if (pos) {
        const totalCost = pos.avgCost * pos.qty + spend;
        pos.qty += qty;
        pos.avgCost = totalCost / pos.qty;
      } else {
        next.positions.push({ ticker: d.ticker, qty, avgCost: price });
      }
      next.cash = round2(next.cash - spend);
      executed.push({
        id: uid("trade_"),
        ts,
        ticker: d.ticker,
        action: "BUY",
        qty,
        price,
        value: round2(spend),
      });
    } else if (d.action === "SELL") {
      if (!pos || pos.qty <= EPS) continue;
      const fraction = Math.min(100, d.sizePct) / 100;
      const qtySell = d.sizePct >= 100 ? pos.qty : pos.qty * fraction;
      if (qtySell <= EPS) continue;
      const proceeds = qtySell * price;
      const realized = round2((price - pos.avgCost) * qtySell);

      next.cash = round2(next.cash + proceeds);
      next.realizedPnl = round2(next.realizedPnl + realized);
      pos.qty -= qtySell;
      if (pos.qty <= EPS) next.positions.splice(posIdx, 1);

      executed.push({
        id: uid("trade_"),
        ts,
        ticker: d.ticker,
        action: "SELL",
        qty: qtySell,
        price,
        value: round2(proceeds),
        realized,
      });
    }
    // HOLD: no-op.
  }

  next.trades = [...next.trades, ...executed];
  return { portfolio: next, executed };
}
