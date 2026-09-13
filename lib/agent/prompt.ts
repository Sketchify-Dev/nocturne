import type { Portfolio, Signals } from "@/lib/types";
import type { StrategyConfig } from "@/lib/config";
import { WATCHLIST } from "@/lib/config";
import { equity } from "@/lib/portfolio/ledger";
import { fmtUsd } from "@/lib/util";

/** Everything the model needs to decide one tick. */
export interface DecideInput {
  signals: Signals;
  portfolio: Portfolio;
  strategy: StrategyConfig;
}

export type PromptMessage = { role: "system" | "user"; content: string };

const UNIVERSE = WATCHLIST.map((i) => i.ticker).join(", ");

function systemPrompt(strategy: StrategyConfig): string {
  return [
    "You are Nocturne, an autonomous trading agent operating 24/7 on tokenized US equities.",
    "You manage a paper-trading portfolio. Each tick you receive market signals and must return trading decisions as STRICT JSON.",
    "",
    `Tradable universe (use ONLY these tickers): ${UNIVERSE}.`,
    "",
    `Strategy ${strategy.label}: ${strategy.tone}`,
    `Risk limits: at most ${strategy.maxTradeSizePct}% of cash per BUY; keep any single position under ${strategy.maxPositionPct}% of total equity.`,
    "",
    "For each ticker choose BUY, SELL, or HOLD:",
    "- sizePct: BUY = percent of available cash to deploy (0-100); SELL = percent of the held position to sell (0-100); HOLD = 0.",
    "- confidence: 0-1.",
    "- rationale: one or two sentences citing the concrete signals (price move, sentiment, a specific headline).",
    "",
    "Respond with ONLY a JSON object of exactly this shape and nothing else:",
    '{"marketView": string, "decisions": [{"ticker": string, "action": "BUY"|"SELL"|"HOLD", "sizePct": number, "confidence": number, "rationale": string}]}',
  ].join("\n");
}

function userPrompt(input: DecideInput): string {
  const { signals, portfolio } = input;
  const priceMap = Object.fromEntries(
    signals.prices.map((p) => [p.ticker, p.price]),
  );
  const eq = equity(portfolio, priceMap);
  const sentMap = new Map(signals.sentiment.map((s) => [s.ticker, s]));

  const positions =
    portfolio.positions.length > 0
      ? portfolio.positions
          .map((p) => `${p.ticker} ${p.qty.toFixed(4)}@${p.avgCost.toFixed(2)}`)
          .join(", ")
      : "none";

  const signalLines = signals.prices
    .map((p) => {
      const s = sentMap.get(p.ticker);
      const sent = s ? `${s.label}(${s.score.toFixed(2)})` : "n/a";
      const chg = `${p.changePct24h >= 0 ? "+" : ""}${p.changePct24h.toFixed(1)}%`;
      return `${p.ticker.padEnd(6)} $${p.price.toFixed(2).padStart(8)}  24h ${chg.padStart(6)}  sentiment ${sent}`;
    })
    .join("\n");

  const headlines = signals.news
    .slice(0, 6)
    .map((n) => `- ${n.title} [${n.tickers.join(", ")}]`)
    .join("\n");

  return [
    `Tick timestamp: ${new Date(signals.ts).toISOString()}`,
    `Cash: ${fmtUsd(portfolio.cash, true)} | Equity: ${fmtUsd(eq, true)} | Realized P&L: ${fmtUsd(portfolio.realizedPnl, true)}`,
    `Positions: ${positions}`,
    "",
    "Signals:",
    signalLines,
    "",
    "Recent headlines:",
    headlines,
    "",
    "Return your decisions as JSON now.",
  ].join("\n");
}

export function buildMessages(input: DecideInput): PromptMessage[] {
  return [
    { role: "system", content: systemPrompt(input.strategy) },
    { role: "user", content: userPrompt(input) },
  ];
}
