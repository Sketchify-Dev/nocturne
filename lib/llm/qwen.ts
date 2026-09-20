import "server-only";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";
import type {
  Action,
  AgentDecision,
  Decision,
  NewsItem,
  SentimentScore,
  Source,
} from "@/lib/types";
import { WATCHLIST, type StrategyConfig } from "@/lib/config";
import { buildMessages, type DecideInput } from "@/lib/agent/prompt";
import { clamp, round2 } from "@/lib/util";

export function llmConfigured(): boolean {
  return !!process.env.QWEN_API_KEY;
}

// ── Validation ──────────────────────────────────────────────────────────────

const ResponseSchema = z.object({
  marketView: z.string().default(""),
  decisions: z
    .array(
      z.object({
        ticker: z.string(),
        action: z.enum(["BUY", "SELL", "HOLD"]),
        sizePct: z.number(),
        confidence: z.number(),
        rationale: z.string().default(""),
      }),
    )
    .default([]),
});

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    /* try to salvage a JSON object embedded in prose */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  return null;
}

/** Tolerant parse: validate, clamp, drop unknown tickers, mock as last resort. */
function parseDecision(text: string, input: DecideInput): AgentDecision {
  const parsed = ResponseSchema.safeParse(extractJson(text));
  if (!parsed.success) return decideMock(input);

  const valid = new Set(WATCHLIST.map((i) => i.ticker));
  const decisions: Decision[] = parsed.data.decisions
    .filter((d) => valid.has(d.ticker))
    .map((d) => ({
      ticker: d.ticker,
      action: d.action as Action,
      sizePct: clamp(d.sizePct, 0, 100),
      confidence: clamp(d.confidence, 0, 1),
      rationale: (d.rationale || "").slice(0, 400),
    }));

  if (decisions.length === 0) return decideMock(input);
  return { marketView: (parsed.data.marketView || "").slice(0, 600), decisions };
}

// ── Live provider (Qwen via the Bitget hackathon gateway, OpenAI-compatible) ────────────────────

let cached: OpenAI | null = null;
function client(): OpenAI {
  if (!cached) {
    cached = new OpenAI({
      apiKey: process.env.QWEN_API_KEY,
      baseURL:
        process.env.QWEN_BASE_URL ||
        "https://hackathon.bitgetops.com/v1",
      // Bound every call so a slow gateway can never hang a tick: give up after
      // 45s and do not retry, so decide() falls back to the rule-based decision
      // instead of leaving the request open until the platform kills it.
      timeout: 45_000,
      maxRetries: 0,
    });
  }
  return cached;
}

async function decideLive(input: DecideInput): Promise<AgentDecision> {
  const res = await client().chat.completions.create({
    model: process.env.QWEN_MODEL || "qwen3.8-max",
    messages: buildMessages(input) as unknown as ChatCompletionMessageParam[],
    temperature: 0.7,
    // A market view plus six short rationales fits comfortably; capping output
    // keeps generation fast and bounds cost.
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });
  const text = res.choices[0]?.message?.content ?? "";
  return parseDecision(text, input);
}

// ── Mock provider (rule-based, cites real signals) ───────────────────────────

function mockRationale(
  action: Action,
  symbol: string,
  chg: number,
  sent: SentimentScore | undefined,
  headline: string | undefined,
): string {
  const move = `${chg >= 0 ? "up" : "down"} ${Math.abs(chg).toFixed(1)}% on the day`;
  const tone = sent ? `${sent.label} sentiment (${sent.score.toFixed(2)})` : "mixed sentiment";
  const quote = headline ? ` Headlines note: “${headline}.”` : "";
  const alt = Math.abs(Math.round(chg)) % 2 === 0;

  if (action === "BUY") {
    return (
      (alt
        ? `${symbol} is ${move} with ${tone}; momentum and tone align, so adding to the position.`
        : `Building ${symbol} exposure: ${move}, ${tone}, and the setup favors follow-through.`) + quote
    );
  }
  if (action === "SELL") {
    return (
      (alt
        ? `${symbol} is ${move} with ${tone}; trimming as the signals turn defensive.`
        : `Reducing ${symbol}: ${move} against ${tone}; locking in and cutting risk.`) + quote
    );
  }
  return (
    (alt
      ? `${symbol} is ${move} with ${tone}; no clear edge, holding for now.`
      : `Standing pat on ${symbol}: ${move}, ${tone}, waiting for a cleaner signal.`) + quote
  );
}

function mockMarketView(buys: number, sells: number, avgSent: number): string {
  const tone = avgSent > 0.15 ? "risk-on" : avgSent < -0.15 ? "risk-off" : "mixed";
  return `Tape reads ${tone} (avg sentiment ${avgSent.toFixed(2)}). This tick: ${buys} buy${
    buys === 1 ? "" : "s"
  } and ${sells} sell${sells === 1 ? "" : "s"} across the tokenized-equity book.`;
}

export function decideMock(input: DecideInput): AgentDecision {
  const { signals, portfolio, strategy } = input;
  const priceMap = new Map(signals.prices.map((p) => [p.ticker, p]));
  const sentMap = new Map(signals.sentiment.map((s) => [s.ticker, s]));
  const held = new Set(portfolio.positions.map((p) => p.ticker));
  const newsFor = (t: string): NewsItem | undefined =>
    signals.news.find((n) => n.tickers.includes(t));

  let buys = 0;
  let sells = 0;
  const decisions: Decision[] = [];

  for (const inst of WATCHLIST) {
    const p = priceMap.get(inst.ticker);
    if (!p) continue;
    const s = sentMap.get(inst.ticker);
    const momentum = clamp(p.changePct24h / 4.5, -1, 1);
    const sentiment = s?.score ?? 0;
    const signal = 0.5 * momentum + 0.5 * sentiment;

    let action: Action = "HOLD";
    let sizePct = 0;
    let confidence = clamp(0.4 + Math.abs(signal) * 0.5, 0.3, 0.95);

    if (signal > 0.22) {
      action = "BUY";
      sizePct = Math.round(clamp(6 + signal * 22, 4, strategy.maxTradeSizePct));
      buys++;
    } else if (signal < -0.22 && held.has(inst.ticker)) {
      action = "SELL";
      sizePct = Math.round(clamp(40 + Math.abs(signal) * 55, 25, 100));
      sells++;
    } else {
      confidence = clamp(0.5 + Math.abs(signal) * 0.2, 0.3, 0.7);
    }

    decisions.push({
      ticker: inst.ticker,
      action,
      sizePct,
      confidence: round2(confidence),
      rationale: mockRationale(action, inst.symbol, p.changePct24h, s, newsFor(inst.ticker)?.title),
    });
  }

  const avgSent =
    signals.sentiment.reduce((a, s) => a + s.score, 0) /
    (signals.sentiment.length || 1);

  return { marketView: mockMarketView(buys, sells, avgSent), decisions };
}

// ── Public entrypoint ────────────────────────────────────────────────────────

export async function decide(
  input: DecideInput,
): Promise<{ decision: AgentDecision; source: Source }> {
  if (llmConfigured()) {
    try {
      return { decision: await decideLive(input), source: "live" };
    } catch (e) {
      console.warn("[qwen] live call failed, falling back to demo:", (e as Error).message);
    }
  }
  return { decision: decideMock(input), source: "demo" };
}

// re-export for callers that build the input type
export type { StrategyConfig };
