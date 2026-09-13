"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useOnchain } from "@/lib/ui/useOnchain";
import { GlassCard } from "@/components/ui/GlassCard";
import { SourceBadge } from "@/components/ui/SourceBadge";
import type { OnchainTx, TokenProof } from "@/lib/types";
import { cn } from "@/lib/ui/cn";

/** Shorten a base58 address for display, keeping the head and tail. */
function shortAddr(a: string): string {
  if (!a) return "unknown";
  return a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;
}

/** Compact relative time, e.g. "45s ago", "12m ago". */
function ago(sec: number | null): string {
  if (!sec) return "";
  const d = Math.max(0, Math.floor(Date.now() / 1000 - sec));
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy mint address"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard unavailable; ignore */
        }
      }}
      className="shrink-0 text-muted transition hover:text-ink"
    >
      {done ? (
        <Check className="h-3.5 w-3.5 text-up" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function TxRow({ tx }: { tx: OnchainTx }) {
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <a
        href={`https://solscan.io/tx/${tx.signature}`}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-1.5 font-mono text-ink/70 transition hover:text-accent"
      >
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            tx.err ? "bg-down" : "bg-up",
          )}
          title={tx.err ? "failed on-chain" : "confirmed"}
        />
        <span className="truncate">{shortAddr(tx.signature)}</span>
        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
      </a>
      <span className="shrink-0 text-muted nums">{ago(tx.blockTime)}</span>
    </li>
  );
}

function TokenCard({ t }: { t: TokenProof }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-base font-semibold">{t.symbol}</div>
          <div className="text-xs text-muted">{t.name}</div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          {t.ticker}
        </span>
      </div>

      {t.mint ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-2.5 py-1.5">
          <a
            href={`https://solscan.io/token/${t.mint}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-ink/80 transition hover:text-accent"
          >
            <span className="truncate">{shortAddr(t.mint)}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <CopyButton text={t.mint} />
        </div>
      ) : null}

      <div className="mt-3">
        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          Recent transactions
        </div>
        {t.txs.length === 0 ? (
          <div className="text-xs text-muted">No recent activity.</div>
        ) : (
          <ul className="flex flex-col gap-1">
            {t.txs.map((tx) => (
              <TxRow key={tx.signature} tx={tx} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function OnchainProof() {
  const { data } = useOnchain();
  const tokens = data?.tokens ?? [];
  const live = data?.source === "live";

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="eyebrow">On-chain proof</div>
          <SourceBadge live={live} label={live ? "Live · Solana" : "Demo proof"} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Read-only
        </span>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-muted">
        {live ? (
          <>
            Every token below is a real xStock on Solana mainnet. The mint
            addresses and recent transactions are live and verifiable on Solscan.
            Nocturne only reads the chain; it never signs, sends, or settles an
            order.
          </>
        ) : (
          <>
            These are the real xStock mint addresses on Solana mainnet. Live
            transaction data is momentarily unavailable, so the activity shown is
            demo. Nocturne only reads the chain; it never signs, sends, or
            settles an order.
          </>
        )}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]"
              />
            ))
          : tokens.map((t) => <TokenCard key={t.ticker} t={t} />)}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/5 pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-up" />
          Real: tokens, prices, and on-chain transactions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Simulated: the portfolio and every order (paper only)
        </span>
      </div>
    </GlassCard>
  );
}
