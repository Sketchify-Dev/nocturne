"use client";

import Link from "next/link";
import { Activity, ArrowRight, Brain, Clock } from "lucide-react";
import { useAgent } from "@/lib/ui/useAgent";
import { Hero } from "@/components/Hero";
import { PriceTicker } from "@/components/PriceTicker";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/site/FadeIn";
import { MarketClock } from "@/components/MarketClock";
import { Logo } from "@/components/Logo";
import { STARTING_CASH } from "@/lib/config";
import { fmtUsd } from "@/lib/util";

const FEATURES = [
  {
    icon: Activity,
    title: "Senses the tape",
    body: "Every tick it pulls prices, news and sentiment across six tokenized US equities.",
  },
  {
    icon: Brain,
    title: "Reasons with Qwen",
    body: "The model returns a structured buy, sell or hold call, each with a written rationale.",
  },
  {
    icon: Clock,
    title: "Acts 24/7",
    body: "Risk-checked trades hit a live paper portfolio on a schedule, even while you sleep.",
  },
];

const STEPS = [
  {
    title: "Sense the tape",
    body: "Pulls prices, headlines and a sentiment read across the watchlist on every tick.",
  },
  {
    title: "Reason with Qwen",
    body: "The model returns a buy, sell or hold call per name, with confidence and a written why.",
  },
  {
    title: "Act within limits",
    body: "Risk checks run, the trade hits the paper ledger, and the equity curve updates live.",
  },
];

export default function LandingPage() {
  const { state } = useAgent();

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
  const pnlPct = start > 0 ? (eq / start - 1) * 100 : 0;
  const running = (state?.status ?? "paused") === "running";

  return (
    <>
      <Hero running={running} equity={eq} pnlPct={pnlPct} />

      <PriceTicker prices={prices} />

      {/* What it does */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <GlassCard className="h-full p-5">
                <f.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{f.body}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* The 7x24 narrative */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <FadeIn>
          <span className="eyebrow">The 7×24 era</span>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            Tokenized equities trade around the clock. Human attention does not.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Nocturne closes that gap with an autonomous loop that runs every few
            seconds: gather signals, reason, risk-check, act. While you sleep, it
            is still working the tape.
          </p>
        </FadeIn>

        <FadeIn>
          <MarketClock variant="panel" className="mt-10" />
        </FadeIn>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.08}>
              <GlassCard className="h-full p-6">
                <div className="font-mono text-xs text-accent">0{i + 1}</div>
                <h3 className="mt-2 font-display text-lg font-semibold">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{s.body}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Live CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <GlassCard className="relative overflow-hidden p-8 sm:p-12">
            <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  See it trading right now
                </h2>
                <p className="mt-2 max-w-lg text-muted">
                  The terminal streams every decision with its written rationale,
                  a live candlestick chart, and the paper portfolio&apos;s P&amp;L.
                </p>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-2 font-mono uppercase tracking-wider text-muted">
                    <Activity
                      className={running ? "h-4 w-4 text-up" : "h-4 w-4 text-muted"}
                    />
                    {running ? "Live now" : "Paused"}
                  </span>
                  <span className="font-display text-lg font-semibold nums">
                    {fmtUsd(eq)}
                  </span>
                </div>
              </div>
              <Link
                href="/terminal"
                className="inline-flex items-center gap-2 rounded-full bg-accent-grad px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[.98]"
              >
                Open the terminal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </GlassCard>
        </FadeIn>
      </section>

      {/* Brand sign-off */}
      <section className="mx-auto flex max-w-7xl justify-center px-4 pb-6 pt-20 sm:px-6">
        <FadeIn>
          <Logo
            variant="wordmark"
            crescentO
            animated
            wordClassName="text-3xl tracking-[0.32em] text-muted sm:text-4xl"
          />
        </FadeIn>
      </section>
    </>
  );
}
