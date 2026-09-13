import type { Instrument, Strategy } from "./types";

/** Starting paper-trading capital (USD). */
export const STARTING_CASH = 100_000;

/** How many log entries we keep in the decision feed. */
export const MAX_LOG = 60;

/** How many points we keep on the equity curve. */
export const MAX_EQUITY_POINTS = 240;

/**
 * Public repository URL, used by the GitHub links in the nav, header and
 * footer. Defaults to the live repo so the links always work; override with
 * NEXT_PUBLIC_GITHUB_URL (e.g. in a fork).
 */
export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ||
  "https://github.com/Sketchify-Dev/nocturne";

/**
 * The watchlist: tokenized US equities (xStocks on Solana). The `mint` on each
 * entry is the real xStock token address (Backed Finance, "Xs…" prefix), which
 * turns on the live DexScreener price provider; demo mode still covers any
 * ticker whose live call fails.
 */
export const WATCHLIST: Instrument[] = [
  { ticker: "AAPLx", symbol: "AAPL", name: "Apple", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp" },
  { ticker: "TSLAx", symbol: "TSLA", name: "Tesla", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB" },
  { ticker: "NVDAx", symbol: "NVDA", name: "NVIDIA", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh" },
  { ticker: "MSFTx", symbol: "MSFT", name: "Microsoft", mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX" },
  { ticker: "SPYx", symbol: "SPY", name: "S&P 500 ETF", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W" },
  { ticker: "COINx", symbol: "COIN", name: "Coinbase", mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu" },
];

export function instrument(ticker: string): Instrument | undefined {
  return WATCHLIST.find((i) => i.ticker === ticker);
}

export interface StrategyConfig {
  key: Strategy;
  label: string;
  maxPositionPct: number; // max % of equity allowed in a single name
  maxTradeSizePct: number; // max % of cash deployable in one BUY
  minConfidence: number; // decisions below this confidence are skipped
  tone: string; // injected into the LLM prompt
  blurb: string; // shown in the UI
}

export const STRATEGIES: Record<Strategy, StrategyConfig> = {
  conservative: {
    key: "conservative",
    label: "Conservative",
    maxPositionPct: 20,
    maxTradeSizePct: 10,
    minConfidence: 0.6,
    tone: "You are cautious and capital-preservation focused. Prefer HOLD unless conviction is high. Keep positions small and diversified, and never chase volatile moves.",
    blurb: "Capital preservation first. Small, diversified positions.",
  },
  balanced: {
    key: "balanced",
    label: "Balanced",
    maxPositionPct: 35,
    maxTradeSizePct: 20,
    minConfidence: 0.5,
    tone: "You balance growth and risk. Take measured positions when signals align, trim into strength, and add on constructive pullbacks.",
    blurb: "Measured growth. Acts when signals align.",
  },
  aggressive: {
    key: "aggressive",
    label: "Aggressive",
    maxPositionPct: 60,
    maxTradeSizePct: 35,
    minConfidence: 0.4,
    tone: "You are growth-seeking and momentum-friendly. Act decisively on strong signals and let winners run, while still respecting the stated risk limits.",
    blurb: "Momentum-friendly. Decisive on strong signals.",
  },
};

export const DEFAULT_STRATEGY: Strategy = "balanced";

/** Candle timeframes offered on the market chart, like an exchange. */
export interface Timeframe {
  key: string;
  label: string;
  seconds: number; // bucket size
}

export const TIMEFRAMES: Timeframe[] = [
  { key: "1m", label: "1m", seconds: 60 },
  { key: "5m", label: "5m", seconds: 300 },
  { key: "15m", label: "15m", seconds: 900 },
  { key: "30m", label: "30m", seconds: 1800 },
  { key: "1h", label: "1H", seconds: 3600 },
  { key: "4h", label: "4H", seconds: 14400 },
];

export const DEFAULT_TIMEFRAME = "5m";

export function timeframe(key: string): Timeframe {
  return TIMEFRAMES.find((t) => t.key === key) ?? TIMEFRAMES[1];
}
