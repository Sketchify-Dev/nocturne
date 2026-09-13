import "server-only";
import type { Candle, PricePoint, Source } from "@/lib/types";
import { WATCHLIST } from "@/lib/config";
import { round2 } from "@/lib/util";

/**
 * Price provider. The primary source is live Solana DEX market data via
 * DexScreener (real USD price + real 24h change for each xStock mint). It turns
 * on automatically once WATCHLIST entries carry `mint` values; until then, and
 * whenever a live call fails, we fall back to a deterministic demo generator so
 * the agent always has believable prices.
 */

// Rough, realistic-ish anchor prices (USD), seeded from the real xStock levels
// so the demo fallback also looks current. Only used when a live call fails.
const BASE: Record<string, number> = {
  AAPLx: 333,
  TSLAx: 365,
  NVDAx: 219,
  MSFTx: 497,
  SPYx: 769,
  COINx: 176,
};

/** Per-series phase offset so each ticker moves on its own rhythm. */
function offsetFor(i: number): number {
  return i * 1.7 + 0.4;
}

const TWO_PI = Math.PI * 2;

/**
 * Octaves of the price path, from multi-day down to ~20s. Summing scales gives
 * a series that reads like a real chart at ANY timeframe: the slow octaves
 * carry the trend, the fast ones add intraday texture and wicks. Amplitudes are
 * fractions of the base price, so the total swing stays within a believable band.
 */
const OCTAVES: { periodSec: number; amp: number }[] = [
  { periodSec: 518400, amp: 0.03 }, // ~6 days
  { periodSec: 172800, amp: 0.03 }, // ~2 days
  { periodSec: 28800, amp: 0.022 }, // ~8 hours
  { periodSec: 7200, amp: 0.014 }, // ~2 hours
  { periodSec: 1800, amp: 0.008 }, // 30 min
  { periodSec: 420, amp: 0.004 }, // 7 min
  { periodSec: 90, amp: 0.0018 }, // 90 sec
  { periodSec: 20, amp: 0.0008 }, // 20 sec
];

/**
 * Deterministic price of one instrument at time `tSec` (epoch seconds). Shared
 * by the live quote and the candle generator, so the newest candle's close
 * always agrees with the quoted price, at every timeframe.
 */
function priceAt(base: number, offset: number, tSec: number): number {
  let frac = 0;
  for (let k = 0; k < OCTAVES.length; k++) {
    const { periodSec, amp } = OCTAVES[k];
    const phase = offset * (k + 1) * 1.37 + offset * 0.7;
    frac += amp * Math.sin((TWO_PI * tSec) / periodSec + phase);
  }
  return base * (1 + frac);
}

function demoPrices(): PricePoint[] {
  const tSec = Date.now() / 1000;
  return WATCHLIST.map((inst, i) => {
    const offset = offsetFor(i);
    const base = BASE[inst.ticker] ?? 100;
    const price = priceAt(base, offset, tSec);
    // A real 24h change: compare against the price one day ago on the same path.
    const dayAgo = priceAt(base, offset, tSec - 86400);
    const changePct24h = round2((price / dayAgo - 1) * 100);
    return { ticker: inst.ticker, price: round2(price), changePct24h, ts: Date.now() };
  });
}

// How many candles of rolling history to return per request.
const CANDLE_COUNT = 120;
// Interior samples per bucket, used to shape realistic highs/lows and wicks.
const SAMPLES = 6;

/**
 * A rolling OHLC series for one ticker at a given bucket size (seconds). The
 * last candle is the "live" one and updates on every poll as wall-clock time
 * advances inside its bucket. Each candle opens at the prior close (continuous
 * line), and high/low come from sampling the path across the bucket.
 *
 * When `anchorPrice` is supplied (the real live quote), the whole series is
 * scaled so the newest close lands exactly on it. The shape stays synthetic and
 * is labelled demo, but the price level tracks reality, so the chart and the
 * live quote above it never disagree.
 */
function demoCandles(
  ticker: string,
  intervalSec: number,
  anchorPrice?: number,
): Candle[] {
  const idx = WATCHLIST.findIndex((inst) => inst.ticker === ticker);
  const base = BASE[ticker] ?? 100;
  const offset = offsetFor(idx < 0 ? 0 : idx);

  const nowSec = Math.floor(Date.now() / 1000);
  const lastBucket = Math.floor(nowSec / intervalSec);
  const firstBucket = lastBucket - (CANDLE_COUNT - 1);

  const candles: Candle[] = [];
  let prevClose = priceAt(base, offset, firstBucket * intervalSec);

  for (let bucket = firstBucket; bucket <= lastBucket; bucket++) {
    const start = bucket * intervalSec;
    const isLast = bucket === lastBucket;
    // The live candle closes at "now"; historical candles close at bucket end.
    const end = isLast ? Math.max(nowSec, start + 1) : start + intervalSec;

    const open = prevClose;
    const close = priceAt(base, offset, end);

    let hi = Math.max(open, close);
    let lo = Math.min(open, close);
    for (let s = 1; s < SAMPLES; s++) {
      const p = priceAt(base, offset, start + ((end - start) * s) / SAMPLES);
      if (p > hi) hi = p;
      if (p < lo) lo = p;
    }
    const wick = base * 0.0006;

    candles.push({
      time: start,
      open: round2(open),
      high: round2(hi + wick),
      low: round2(lo - wick),
      close: round2(close),
    });
    prevClose = close;
  }

  // Pin the latest close to the real quote, preserving the generated shape.
  if (anchorPrice && anchorPrice > 0 && candles.length) {
    const lastClose = candles[candles.length - 1].close;
    if (lastClose > 0) {
      const k = anchorPrice / lastClose;
      for (const c of candles) {
        c.open = round2(c.open * k);
        c.high = round2(c.high * k);
        c.low = round2(c.low * k);
        c.close = round2(c.close * k);
      }
    }
  }
  return candles;
}

// --- Live prices (DexScreener) --------------------------------------------

/** DexScreener token endpoint: real Solana DEX market data, no API key. */
const DEXSCREENER_TOKENS = "https://api.dexscreener.com/latest/dex/tokens/";

/** Minimal, tolerant view of the fields we read from a DexScreener pair. */
interface DexPair {
  chainId?: string;
  baseToken?: { address?: string; symbol?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
}
interface DexResponse {
  pairs?: DexPair[];
}

/** Map configured mint addresses back to our tickers (lower-cased keys). */
function mintToTicker(): Map<string, string> {
  const m = new Map<string, string>();
  for (const inst of WATCHLIST) {
    if (inst.mint) m.set(inst.mint.toLowerCase(), inst.ticker);
  }
  return m;
}

/**
 * Live prices for the tokenized equities from DexScreener: for each configured
 * mint we take the deepest-liquidity Solana pair and read its USD price and 24h
 * change. Enabled once WATCHLIST entries carry `mint` values; throws otherwise
 * (and on any network / parse failure) so the caller falls back to demo.
 */
async function livePrices(): Promise<PricePoint[]> {
  const mints = WATCHLIST.map((i) => i.mint).filter(
    (m): m is string => !!m,
  );
  if (mints.length === 0) throw new Error("no mints configured");

  const byMint = mintToTicker();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  let json: DexResponse;
  try {
    const res = await fetch(DEXSCREENER_TOKENS + mints.join(","), {
      headers: { accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`dexscreener ${res.status}`);
    json = (await res.json()) as DexResponse;
  } finally {
    clearTimeout(timer);
  }

  const pairs = Array.isArray(json.pairs) ? json.pairs : [];
  // Per ticker, keep the Solana pair with the deepest liquidity.
  const best = new Map<string, { price: number; change: number; liq: number }>();
  for (const p of pairs) {
    if (p.chainId !== "solana") continue;
    const addr = (p.baseToken?.address ?? "").toLowerCase();
    const ticker = byMint.get(addr);
    if (!ticker) continue;
    const price = Number(p.priceUsd);
    if (!Number.isFinite(price) || price <= 0) continue;
    const liq = Number(p.liquidity?.usd) || 0;
    const change = Number(p.priceChange?.h24);
    const prev = best.get(ticker);
    if (!prev || liq > prev.liq) {
      best.set(ticker, {
        price,
        change: Number.isFinite(change) ? change : 0,
        liq,
      });
    }
  }

  const ts = Date.now();
  const points: PricePoint[] = [];
  for (const inst of WATCHLIST) {
    const b = best.get(inst.ticker);
    if (b) {
      points.push({
        ticker: inst.ticker,
        price: round2(b.price),
        changePct24h: round2(b.change),
        ts,
      });
    }
  }
  if (points.length === 0) throw new Error("no live pairs matched");
  return points;
}

// Short TTL cache for live results only, so the agent tick and the candle
// route share one upstream call (and therefore quote exactly the same price).
// Demo prices are never cached, so their animation stays smooth.
const PRICE_TTL_MS = 3000;
let liveCache: { at: number; result: { points: PricePoint[]; source: Source } } | null =
  null;

export async function getPrices(): Promise<{
  points: PricePoint[];
  source: Source;
}> {
  if (liveCache && Date.now() - liveCache.at < PRICE_TTL_MS) {
    return liveCache.result;
  }
  try {
    const live = await livePrices();
    // Guarantee a complete watchlist: fill any gap (a mint with no live pair)
    // from the demo generator, so the UI never drops a ticker.
    const map = new Map(demoPrices().map((d) => [d.ticker, d]));
    for (const p of live) map.set(p.ticker, p);
    const points = WATCHLIST.map((i) => map.get(i.ticker)).filter(
      (p): p is PricePoint => !!p,
    );
    const result = { points, source: "live" as const };
    liveCache = { at: Date.now(), result };
    return result;
  } catch {
    return { points: demoPrices(), source: "demo" };
  }
}

/**
 * OHLC series for the market chart. The candles themselves are still generated
 * (labelled demo), but when live prices are on we anchor them to the real quote
 * so the chart level matches the tape. Live OHLC history lands later.
 */
export async function getCandles(
  ticker: string,
  intervalSec: number,
): Promise<{ candles: Candle[]; source: Source }> {
  let anchor: number | undefined;
  try {
    const pr = await getPrices();
    if (pr.source === "live") {
      anchor = pr.points.find((p) => p.ticker === ticker)?.price;
    }
  } catch {
    // fall through to a pure demo series
  }
  return { candles: demoCandles(ticker, intervalSec, anchor), source: "demo" };
}
