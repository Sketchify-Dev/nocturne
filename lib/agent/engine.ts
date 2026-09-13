import "server-only";
import type { AgentState, LogEntry, Signals, Strategy } from "@/lib/types";
import {
  DEFAULT_STRATEGY,
  MAX_EQUITY_POINTS,
  MAX_LOG,
  STARTING_CASH,
  STRATEGIES,
} from "@/lib/config";
import { getPrices } from "@/lib/data/prices";
import { getNews } from "@/lib/data/news";
import { getSentiment } from "@/lib/data/sentiment";
import { decide } from "@/lib/llm/qwen";
import { applyDecisions, equity } from "@/lib/portfolio/ledger";
import { round2, uid } from "@/lib/util";

/** A fresh portfolio + agent state. */
export function initState(strategy: Strategy = DEFAULT_STRATEGY): AgentState {
  const ts = Date.now();
  return {
    status: "running",
    strategy,
    tick: 0,
    startedAt: ts,
    lastTickAt: null,
    startingEquity: STARTING_CASH,
    portfolio: {
      cash: STARTING_CASH,
      positions: [],
      trades: [],
      equityCurve: [{ ts, equity: STARTING_CASH }],
      realizedPnl: 0,
    },
    log: [],
    lastSignals: null,
  };
}

/** Pull every signal the agent sees on a tick (each provider self-falls-back). */
async function gatherSignals(): Promise<Signals> {
  const [prices, news] = await Promise.all([getPrices(), getNews()]);
  const sentiment = await getSentiment(prices.points, news.items);
  return {
    prices: prices.points,
    news: news.items,
    sentiment: sentiment.scores,
    ts: Date.now(),
    source: {
      prices: prices.source,
      news: news.source,
      sentiment: sentiment.source,
    },
  };
}

/**
 * Advance the agent one step: gather signals → ask the model → apply confident
 * decisions to the ledger → append to the decision log. Pure w.r.t. its input
 * (returns a new state); persistence is the caller's job.
 */
export async function tick(state: AgentState): Promise<AgentState> {
  const strategy = STRATEGIES[state.strategy];
  const signals = await gatherSignals();
  const priceMap = Object.fromEntries(
    signals.prices.map((p) => [p.ticker, p.price]),
  );

  const { decision, source } = await decide({
    signals,
    portfolio: state.portfolio,
    strategy,
  });

  // Execute only confident, non-HOLD calls; log everything for transparency.
  const toExecute = decision.decisions.filter(
    (d) => d.action !== "HOLD" && d.confidence >= strategy.minConfidence,
  );
  const { portfolio, executed } = applyDecisions(
    state.portfolio,
    toExecute,
    priceMap,
    strategy,
  );

  const ts = Date.now();
  const eq = round2(equity(portfolio, priceMap));
  portfolio.equityCurve = [...portfolio.equityCurve, { ts, equity: eq }].slice(
    -MAX_EQUITY_POINTS,
  );

  const tickNo = state.tick + 1;
  const entry: LogEntry = {
    id: uid("log_"),
    ts,
    tick: tickNo,
    marketView: decision.marketView,
    decisions: decision.decisions,
    executed,
    equity: eq,
    llmSource: source,
  };

  return {
    ...state,
    tick: tickNo,
    lastTickAt: ts,
    portfolio,
    log: [entry, ...state.log].slice(0, MAX_LOG),
    lastSignals: signals,
  };
}
