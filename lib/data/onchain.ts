import "server-only";
import type { OnchainTx, Source, TokenProof } from "@/lib/types";
import { WATCHLIST } from "@/lib/config";

/**
 * On-chain proof provider. Strictly read-only: Nocturne never signs, sends, or
 * settles a Solana transaction. This module only reads public chain data to
 * prove the watchlist tokens are genuine xStock mints with real, recent
 * activity that anyone can verify on Solscan.
 *
 * The live source is a public Solana JSON-RPC node. A single batched
 * getSignaturesForAddress call returns the most recent confirmed signatures
 * touching each mint. On any failure (network, rate limit, empty result) we
 * fall back to a clearly labelled demo set, so the panel always renders and the
 * terminal never breaks.
 */

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

/** How many recent signatures to show per token. */
const SIG_LIMIT = 4;

interface RpcSig {
  signature?: string;
  slot?: number;
  blockTime?: number | null;
  err?: unknown;
}
interface RpcResponse {
  id?: number;
  result?: RpcSig[];
  error?: { message?: string };
}

/** Watchlist entries that carry a real mint, narrowed so `mint` is a string. */
function mintedInstruments(): (Instrument & { mint: string })[] {
  return WATCHLIST.filter(
    (i): i is Instrument & { mint: string } => !!i.mint,
  );
}
type Instrument = (typeof WATCHLIST)[number];

/**
 * Live proof: one batched JSON-RPC request asks for the latest signatures on
 * every configured mint. Batch responses can arrive out of order, so we key
 * each result back to its request id. Throws (so the caller falls back to demo)
 * when the endpoint errors or returns nothing usable.
 */
async function liveProof(): Promise<TokenProof[]> {
  const minted = mintedInstruments();
  if (minted.length === 0) throw new Error("no mints configured");

  const body = minted.map((inst, i) => ({
    jsonrpc: "2.0",
    id: i,
    method: "getSignaturesForAddress",
    params: [inst.mint, { limit: SIG_LIMIT }],
  }));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  let json: RpcResponse[];
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`rpc ${res.status}`);
    json = (await res.json()) as RpcResponse[];
  } finally {
    clearTimeout(timer);
  }

  if (!Array.isArray(json)) throw new Error("bad rpc batch response");

  const byId = new Map<number, RpcSig[]>();
  json.forEach((r, i) => {
    const id = typeof r?.id === "number" ? r.id : i;
    if (Array.isArray(r?.result)) byId.set(id, r.result);
  });

  let matched = 0;
  const tokens: TokenProof[] = minted.map((inst, i) => {
    const sigs = byId.get(i) ?? [];
    const txs: OnchainTx[] = sigs
      .filter((s) => typeof s.signature === "string")
      .map((s) => ({
        signature: s.signature as string,
        slot: Number(s.slot) || 0,
        blockTime: typeof s.blockTime === "number" ? s.blockTime : null,
        err: s.err != null,
      }));
    if (txs.length > 0) matched++;
    return {
      ticker: inst.ticker,
      symbol: inst.symbol,
      name: inst.name,
      mint: inst.mint,
      txs,
    };
  });

  if (matched === 0) throw new Error("no on-chain signatures returned");
  return tokens;
}

// --- Demo fallback ---------------------------------------------------------

// A base58-style alphabet (no 0, O, I, l) so demo signatures look like the real
// thing while staying obviously synthetic (the panel labels the source "demo").
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Deterministic 64-char base58-style string from a seed. */
function demoSig(seed: number): string {
  let x = (seed * 2654435761) >>> 0;
  let out = "";
  for (let i = 0; i < 64; i++) {
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 7)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    out += B58[x % B58.length];
  }
  return out;
}

/**
 * Demo proof. The mint addresses are still the real xStock mints (those are
 * public facts), but the signatures are synthetic and clearly labelled demo, so
 * nothing here ever pretends a fake transaction is real.
 */
function demoProof(): TokenProof[] {
  const nowSec = Math.floor(Date.now() / 1000);
  return WATCHLIST.map((inst, i) => ({
    ticker: inst.ticker,
    symbol: inst.symbol,
    name: inst.name,
    mint: inst.mint ?? "",
    txs: Array.from({ length: SIG_LIMIT }, (_, k) => ({
      signature: demoSig(i * 97 + k * 13 + 1),
      slot: 290_000_000 + i * 1_000 + (SIG_LIMIT - k),
      blockTime: nowSec - k * 45 - i * 7,
      err: false,
    })),
  }));
}

// --- Public API ------------------------------------------------------------

// On-chain history changes slowly relative to the tick loop, and the public RPC
// is rate limited, so we cache live results briefly and share them across polls.
const TTL_MS = 30_000;
let cache: { at: number; result: { tokens: TokenProof[]; source: Source } } | null =
  null;

export async function getOnchainProof(): Promise<{
  tokens: TokenProof[];
  source: Source;
}> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.result;
  try {
    const tokens = await liveProof();
    const result = { tokens, source: "live" as const };
    cache = { at: Date.now(), result };
    return result;
  } catch {
    return { tokens: demoProof(), source: "demo" };
  }
}
