import "server-only";
import type { NewsItem, Source } from "@/lib/types";
import { uid } from "@/lib/util";

/**
 * News provider. Live RSS/Foresight wiring lands on Day 4; for now a rotating
 * pool of realistic headlines keeps the signals panel and prompts populated in
 * demo mode. Headlines deliberately contain sentiment-bearing words so the
 * sentiment provider can derive a coherent score from them.
 */

const POOL: Record<string, string[]> = {
  AAPLx: [
    "Apple suppliers raise build orders as iPhone demand beats expectations",
    "Analysts upgrade Apple on strong services growth",
    "Apple faces antitrust probe in Europe, shares slump",
    "Apple warns of weak quarter amid soft China sales",
    "Apple unveils new developer tools at fall event",
  ],
  TSLAx: [
    "Tesla deliveries surge, topping street estimates",
    "Tesla rally continues as energy storage demand expands",
    "Tesla recalls vehicles over software concerns",
    "Tesla downgrade cites margin pressure from price cuts",
    "Tesla schedules robotaxi update for next month",
  ],
  NVDAx: [
    "NVIDIA suppliers raise output as AI demand hits record",
    "Analysts raise NVIDIA targets on strong data-center orders",
    "NVIDIA slump deepens on fresh export-curb concerns",
    "NVIDIA warns of supply delays for next-gen chips",
    "NVIDIA to detail new architecture at conference",
  ],
  MSFTx: [
    "Microsoft cloud revenue beats as AI adoption accelerates",
    "Microsoft upgraded on strong enterprise demand",
    "Microsoft faces regulatory probe over software bundling",
    "Microsoft falls as cloud growth concerns weigh on shares",
    "Microsoft expands Copilot to more enterprise tiers",
  ],
  COINx: [
    "Coinbase surges as trading volume tops estimates",
    "Coinbase upgraded on rising crypto optimism",
    "Coinbase falls amid regulatory lawsuit concerns",
    "Coinbase warns of softer transaction revenue",
    "Coinbase lists new tokens and staking options",
  ],
};

// Broad-market headlines, tagged to the index proxy (SPYx).
const MACRO: string[] = [
  "Stocks rally as cooler inflation data lifts optimism",
  "S&P 500 gains as a strong jobs report boosts sentiment",
  "Markets slump as rate-hike concerns resurface",
  "S&P 500 falls amid a selloff in megacap tech",
  "Investors await Fed minutes for policy signals",
];

interface Seed {
  title: string;
  tickers: string[];
}

function allSeeds(): Seed[] {
  const seeds: Seed[] = [];
  for (const [ticker, titles] of Object.entries(POOL)) {
    for (const title of titles) seeds.push({ title, tickers: [ticker] });
  }
  for (const title of MACRO) seeds.push({ title, tickers: ["SPYx"] });
  return seeds;
}

function demoNews(count = 6): NewsItem[] {
  const seeds = allSeeds();
  // Rotate the window every ~15s so the feed visibly refreshes over time.
  const start = Math.floor(Date.now() / 15000) % seeds.length;
  const ts = Date.now();
  const out: NewsItem[] = [];
  for (let k = 0; k < count; k++) {
    const seed = seeds[(start + k * 3 + 1) % seeds.length];
    out.push({
      id: uid("news_"),
      title: seed.title,
      source: seed.tickers[0] === "SPYx" ? "Market Wire" : "Foresight",
      ts: ts - k * 90_000,
      tickers: seed.tickers,
    });
  }
  return out;
}

export async function getNews(): Promise<{ items: NewsItem[]; source: Source }> {
  // TODO(Day 4): fetch a real finance RSS/Foresight feed; fall back on error.
  return { items: demoNews(), source: "demo" };
}
