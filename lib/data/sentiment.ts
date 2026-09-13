import "server-only";
import type { NewsItem, PricePoint, SentimentScore, Source } from "@/lib/types";
import { WATCHLIST } from "@/lib/config";
import { clamp, round2 } from "@/lib/util";

/**
 * Sentiment provider. In demo mode we derive a per-ticker score from two
 * genuine signals: (1) the polarity of matching headlines (keyword scan) and
 * (2) recent price momentum. Day 4 swaps in Qwen-scored headline sentiment,
 * with this as the fallback.
 */

const POSITIVE = [
  "beats", "surge", "surges", "rally", "upgrade", "upgraded", "record",
  "strong", "demand", "raise", "raises", "tops", "optimism", "gains",
  "outperform", "expands", "accelerates", "boosts",
];
const NEGATIVE = [
  "miss", "falls", "fall", "cut", "cuts", "downgrade", "probe", "lawsuit",
  "warns", "slump", "weak", "recall", "recalls", "delay", "delays",
  "layoffs", "selloff", "concerns", "halts", "pressure",
];

function headlinePolarity(title: string): number {
  const t = title.toLowerCase();
  let score = 0;
  for (const w of POSITIVE) if (t.includes(w)) score += 1;
  for (const w of NEGATIVE) if (t.includes(w)) score -= 1;
  return score;
}

function labelFor(score: number): SentimentScore["label"] {
  if (score > 0.15) return "bullish";
  if (score < -0.15) return "bearish";
  return "neutral";
}

export async function getSentiment(
  prices: PricePoint[],
  news: NewsItem[],
): Promise<{ scores: SentimentScore[]; source: Source }> {
  const priceMap = new Map(prices.map((p) => [p.ticker, p]));

  const scores: SentimentScore[] = WATCHLIST.map((inst) => {
    // News component: average polarity of headlines mentioning this ticker.
    const related = news.filter((n) => n.tickers.includes(inst.ticker));
    let newsComponent = 0;
    if (related.length > 0) {
      const sum = related.reduce((a, n) => a + headlinePolarity(n.title), 0);
      newsComponent = clamp(sum / related.length, -1, 1);
    }
    // Momentum component: normalized 24h change (~±4.5% maps to ~±1).
    const change = priceMap.get(inst.ticker)?.changePct24h ?? 0;
    const momentum = clamp(change / 4.5, -1, 1);

    const score = clamp(0.55 * newsComponent + 0.45 * momentum, -1, 1);
    return {
      ticker: inst.ticker,
      score: round2(score),
      label: labelFor(score),
    };
  });

  return { scores, source: "demo" };
}
