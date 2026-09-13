"use client";

import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/lib/ui/useAgent";
import { useCandles } from "@/lib/ui/useCandles";
import { PriceTicker } from "@/components/PriceTicker";
import { Controls } from "@/components/Controls";
import { EquityChart } from "@/components/EquityChart";
import { CandleChart } from "@/components/CandleChart";
import { PositionsTable } from "@/components/PositionsTable";
import { DecisionFeed } from "@/components/DecisionFeed";
import { SignalsPanel } from "@/components/SignalsPanel";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatTile } from "@/components/ui/StatTile";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { StatusPill } from "@/components/ui/StatusPill";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { FadeIn } from "@/components/site/FadeIn";
import { PerfBar } from "@/components/PerfBar";
import { MarketClock } from "@/components/MarketClock";
import { SessionRecap } from "@/components/SessionRecap";
import { DEFAULT_TIMEFRAME, STARTING_CASH, TIMEFRAMES, WATCHLIST } from "@/lib/config";
import type { Strategy } from "@/lib/types";
import { cn } from "@/lib/ui/cn";
import { fmtPct, fmtUsd } from "@/lib/util";

export default function TerminalPage() {
  const { state, llmConfigured, tick, control } = useAgent();
  const [auto, setAuto] = useState(true);
  const [intervalMs, setIntervalMs] = useState(4000);
  const [ticker, setTicker] = useState(WATCHLIST[0].ticker);
  const [tf, setTf] = useState(DEFAULT_TIMEFRAME);

  // Keep the latest mutate in a ref so the interval effect doesn't re-create.
  const tickRef = useRef(tick.mutate);
  useEffect(() => {
    tickRef.current = tick.mutate;
  });

  const status = state?.status ?? "paused";
  useEffect(() => {
    if (!auto || status !== "running") return;
    const id = setInterval(() => {
      if (!document.hidden) tickRef.current(false);
    }, intervalMs);
    return () => clearInterval(id);
  }, [auto, status, intervalMs]);

  // The candle chart polls on its own so it stays live even while paused.
  const candlesQ = useCandles(
    ticker,
    tf,
    auto && status === "running" ? intervalMs : 8000,
  );

  // Derived values (computed client-side from the latest signals).
  const prices = state?.lastSignals?.prices ?? [];
  const priceMap = Object.fromEntries(prices.map((p) => [p.ticker, p.price]));
  const positions = state?.portfolio.positions ?? [];
  const posValue = positions.reduce(
    (a, p) => a + p.qty * (priceMap[p.ticker] ?? p.avgCost),
    0,
  );
  const cash = state?.portfolio.cash ?? STARTING_CASH;
  const eq = state ? cash + posValue : STARTING_CASH;
  const start = state?.startingEquity ?? STARTING_CASH;
  const pnl = eq - start;
  const pnlPct = start > 0 ? (eq / start - 1) * 100 : 0;
  const realized = state?.portfolio.realizedPnl ?? 0;
  const pricesLive = state?.lastSignals?.source.prices === "live";

  const busy = tick.isPending || control.isPending;
  const onStrategy = (s: Strategy) =>
    control.mutate({ action: "config", strategy: s });

  const selected = prices.find((p) => p.ticker === ticker);
  const selChange = selected?.changePct24h ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-6">
      {/* Sub-header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Live terminal</span>
          <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
            Command deck
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge
            live={llmConfigured}
            label={llmConfigured ? "Qwen · live" : "Demo mode"}
          />
          <StatusPill running={status === "running"} />
        </div>
      </div>

      <SessionRecap
        ready={!!state}
        equity={eq}
        tick={state?.tick ?? 0}
        tradeCount={state?.portfolio.trades.length ?? 0}
        startedAt={state?.startedAt}
        startingEquity={start}
      />

      <MarketClock />

      <PriceTicker prices={prices} />

      <Controls
        status={status}
        strategy={state?.strategy ?? "balanced"}
        busy={busy}
        auto={auto}
        intervalMs={intervalMs}
        onStart={() => control.mutate({ action: "start" })}
        onPause={() => control.mutate({ action: "pause" })}
        onReset={() =>
          control.mutate({ action: "reset", strategy: state?.strategy })
        }
        onAdvance={() => tick.mutate(true)}
        onStrategy={onStrategy}
        onAuto={setAuto}
        onInterval={setIntervalMs}
      />

      {/* Cockpit: primary stats + performance KPIs in one panel */}
      <GlassCard className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile bare label="Equity" sub={`from ${fmtUsd(start)} start`}>
            <NumberTicker value={eq} format={(n) => fmtUsd(n)} className="nums" />
          </StatTile>
          <StatTile
            bare
            label="Total P&L"
            accent={pnl >= 0 ? "up" : "down"}
            sub={fmtPct(pnlPct)}
          >
            <NumberTicker
              value={pnl}
              format={(n) => (n >= 0 ? "+" : "") + fmtUsd(n)}
              className="nums"
            />
          </StatTile>
          <StatTile bare label="Cash" sub={`${positions.length} positions`}>
            <NumberTicker value={cash} format={(n) => fmtUsd(n)} className="nums" />
          </StatTile>
          <StatTile bare label="Ticks" sub="decisions made">
            <span className="nums">{state?.tick ?? 0}</span>
          </StatTile>
        </div>

        <div className="my-4 h-px bg-white/5 sm:my-5" />

        <PerfBar bare portfolio={state?.portfolio} priceMap={priceMap} equity={eq} />
      </GlassCard>

      {/* Market candle chart */}
      <GlassCard className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="eyebrow">Market price</div>
              <SourceBadge
                live={pricesLive}
                label={pricesLive ? "Live · DexScreener" : "Demo prices"}
              />
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              {selected ? (
                <>
                  <span className="font-display text-2xl font-semibold nums">
                    {fmtUsd(selected.price, true)}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium nums",
                      selChange >= 0 ? "text-up" : "text-down",
                    )}
                  >
                    {fmtPct(selChange)}
                  </span>
                </>
              ) : (
                <span className="font-display text-2xl font-semibold text-muted">
                  Awaiting data
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WATCHLIST.map((inst) => {
              const active = inst.ticker === ticker;
              return (
                <button
                  key={inst.ticker}
                  onClick={() => setTicker(inst.ticker)}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition",
                    active
                      ? "bg-accent-grad text-white shadow-glow"
                      : "border border-white/10 bg-white/5 text-muted hover:text-ink",
                  )}
                >
                  {inst.symbol}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="mb-4 flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {TIMEFRAMES.map((t) => {
            const active = t.key === tf;
            return (
              <button
                key={t.key}
                onClick={() => setTf(t.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition",
                  active ? "bg-accent/20 text-accent" : "text-muted hover:text-ink",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <CandleChart
          candles={candlesQ.data?.candles ?? []}
          trades={(state?.portfolio.trades ?? []).filter(
            (t) => t.ticker === ticker,
          )}
        />
      </GlassCard>

      {/* Equity curve + signals */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <GlassCard className="p-4 sm:p-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="eyebrow">Equity curve</div>
                <div className="mt-1 font-display text-2xl font-semibold nums">
                  {fmtUsd(eq)}
                </div>
              </div>
              <span
                className={cn(
                  "font-medium nums",
                  pnlPct >= 0 ? "text-up" : "text-down",
                )}
              >
                {fmtPct(pnlPct)}
              </span>
            </div>
            <EquityChart points={state?.portfolio.equityCurve ?? []} />
          </GlassCard>
        </FadeIn>
        <FadeIn delay={0.08}>
          <GlassCard className="h-full p-4 sm:p-5">
            <SignalsPanel signals={state?.lastSignals ?? null} />
          </GlassCard>
        </FadeIn>
      </div>

      {/* Decision feed + positions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="eyebrow">Decision feed</span>
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
            </div>
            <div className="lg:max-h-[760px] lg:overflow-y-auto lg:pr-1">
              <DecisionFeed log={state?.log ?? []} />
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <GlassCard className="h-full p-4 sm:p-5">
            <div className="eyebrow mb-3">Positions</div>
            <PositionsTable positions={positions} priceMap={priceMap} />
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
              <span className="text-muted">Realized P&amp;L</span>
              <span
                className={cn(
                  "font-medium nums",
                  realized >= 0 ? "text-up" : "text-down",
                )}
              >
                {(realized >= 0 ? "+" : "") + fmtUsd(realized)}
              </span>
            </div>
          </GlassCard>
        </FadeIn>
      </div>
    </div>
  );
}
