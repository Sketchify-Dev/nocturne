// Core domain types for Nocturne: the 24/7 tokenized-equity trading agent.

export type Action = "BUY" | "SELL" | "HOLD";
export type Strategy = "conservative" | "balanced" | "aggressive";
export type AgentStatus = "running" | "paused";

/** A source tag lets the UI show whether data came from a live API or the demo fallback. */
export type Source = "live" | "demo";

/** A tokenized US equity on the watchlist (xStocks-style). */
export interface Instrument {
  ticker: string; // tokenized symbol, e.g. "AAPLx"
  symbol: string; // underlying, e.g. "AAPL"
  name: string; // "Apple"
  mint?: string; // Solana mint address for the xStock token (optional)
}

export interface PricePoint {
  ticker: string;
  price: number;
  changePct24h: number; // percent, e.g. +2.3
  ts: number; // epoch ms
}

/** One OHLC candle for the market price chart. */
export interface Candle {
  time: number; // epoch SECONDS at the bucket start (strictly increasing)
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url?: string;
  ts: number; // epoch ms
  tickers: string[]; // related watchlist tickers
}

export interface SentimentScore {
  ticker: string;
  score: number; // -1 (bearish) .. +1 (bullish)
  label: "bearish" | "neutral" | "bullish";
}

/** Everything the agent "sees" on a single tick. */
export interface Signals {
  prices: PricePoint[];
  news: NewsItem[];
  sentiment: SentimentScore[];
  ts: number;
  source: { prices: Source; news: Source; sentiment: Source };
}

/** One instruction from the model for one instrument. */
export interface Decision {
  ticker: string;
  action: Action;
  sizePct: number; // BUY: % of cash to deploy; SELL: % of held qty to sell
  confidence: number; // 0..1
  rationale: string; // human-readable reasoning (the "money shot")
}

/** The full structured response the LLM returns each tick. */
export interface AgentDecision {
  marketView: string; // one-paragraph overall read of the tape
  decisions: Decision[];
}

export interface Position {
  ticker: string;
  qty: number;
  avgCost: number;
}

export interface Trade {
  id: string;
  ts: number;
  ticker: string;
  action: Exclude<Action, "HOLD">;
  qty: number;
  price: number;
  value: number; // qty * price
  realized?: number; // realized P&L booked by this trade (SELL only)
}

export interface EquityPoint {
  ts: number;
  equity: number; // cash + market value of positions
}

export interface Portfolio {
  cash: number;
  positions: Position[];
  trades: Trade[]; // most recent last
  equityCurve: EquityPoint[];
  realizedPnl: number;
}

/** One entry in the decision feed: a snapshot of a single tick. */
export interface LogEntry {
  id: string;
  ts: number;
  tick: number;
  marketView: string;
  decisions: Decision[];
  executed: Trade[]; // trades actually applied after risk checks
  equity: number;
  llmSource: Source;
}

export interface AgentState {
  status: AgentStatus;
  strategy: Strategy;
  tick: number;
  startedAt: number;
  lastTickAt: number | null;
  startingEquity: number;
  portfolio: Portfolio;
  log: LogEntry[]; // most recent first, capped
  lastSignals: Signals | null;
}
