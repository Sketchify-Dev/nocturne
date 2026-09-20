import type { Metadata } from "next";
import { Brain, Radar, ScrollText, ShieldCheck, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/site/FadeIn";
import { STRATEGIES, WATCHLIST } from "@/lib/config";

export const metadata: Metadata = {
  title: "How it works · Nocturne",
  description:
    "The decision loop, the risk limits and the safety guardrails behind Nocturne.",
};

const LOOP = [
  {
    icon: Radar,
    title: "Sense",
    body: "Each tick gathers prices, recent headlines and a per-ticker sentiment read across the watchlist.",
  },
  {
    icon: Brain,
    title: "Reason",
    body: "Signals, the portfolio and the active strategy go into a prompt. Qwen returns a structured decision per name.",
  },
  {
    icon: Zap,
    title: "Act",
    body: "Risk limits are enforced, then buys and sells apply to the paper ledger. Cash is never allowed to go negative.",
  },
  {
    icon: ScrollText,
    title: "Log",
    body: "The market view, every decision and the resulting equity are appended to the live feed for anyone to audit.",
  },
];

const SCHEMA = `{
  "marketView": "one-line read on the tape",
  "decisions": [
    {
      "ticker": "NVDAx",
      "action": "BUY | SELL | HOLD",
      "sizePct": 12,
      "confidence": 0.72,
      "rationale": "why, in one or two sentences"
    }
  ]
}`;

const GUARDRAILS = [
  {
    title: "Paper-trading by default",
    body: "Nocturne trades simulated capital. It places no real orders and touches no real funds.",
  },
  {
    title: "Validated model output",
    body: "Every response is parsed against a strict schema. Malformed or low-confidence calls are dropped, not executed.",
  },
  {
    title: "Enforced risk limits",
    body: "Per-name exposure and per-trade size are capped by the active strategy before anything reaches the ledger.",
  },
  {
    title: "Always demoable",
    body: "Prices, news, sentiment and the model each have a built-in fallback, so the loop runs with zero API keys.",
  },
];

const STACK = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "lightweight-charts",
  "Qwen (Bitget gateway)",
  "TanStack Query",
  "Zod",
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-16">
      <FadeIn>
        <span className="eyebrow">How it works</span>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
          A small brain that never clocks out.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Nocturne runs one loop, over and over, a few seconds apart. Here is
          what happens on every tick, how it decides, and what keeps it safe.
        </p>
      </FadeIn>

      {/* The loop */}
      <section className="mt-14">
        <FadeIn>
          <h2 className="font-display text-2xl font-bold">The loop</h2>
        </FadeIn>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {LOOP.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.06}>
              <GlassCard className="flex h-full gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-accent">
                      0{i + 1}
                    </span>
                    <h3 className="font-display text-lg font-semibold">
                      {s.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Decision schema */}
      <section className="mt-14">
        <FadeIn>
          <h2 className="font-display text-2xl font-bold">
            The decision, as data
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            The model is asked for one JSON object. It is validated before it can
            touch the ledger, so the shape of a decision is always the same.
          </p>
        </FadeIn>
        <FadeIn delay={0.08}>
          <GlassCard className="mt-5 overflow-x-auto p-5">
            <pre className="font-mono text-xs leading-relaxed text-ink sm:text-sm">
              <code>{SCHEMA}</code>
            </pre>
          </GlassCard>
        </FadeIn>
      </section>

      {/* Strategies */}
      <section className="mt-14">
        <FadeIn>
          <h2 className="font-display text-2xl font-bold">Strategy presets</h2>
          <p className="mt-3 max-w-2xl text-muted">
            One switch changes both the risk limits and the tone of the prompt.
            The numbers below are the live limits enforced by each preset.
          </p>
        </FadeIn>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Object.values(STRATEGIES).map((s, i) => (
            <FadeIn key={s.key} delay={i * 0.06}>
              <GlassCard className="h-full p-5">
                <h3 className="font-display text-lg font-semibold">{s.label}</h3>
                <p className="mt-1 text-sm text-muted">{s.blurb}</p>
                <dl className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Max per name</dt>
                    <dd className="nums">{s.maxPositionPct}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Max per trade</dt>
                    <dd className="nums">{s.maxTradeSizePct}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Min confidence</dt>
                    <dd className="nums">
                      {Math.round(s.minConfidence * 100)}%
                    </dd>
                  </div>
                </dl>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section className="mt-14">
        <FadeIn>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl font-bold">Safety</h2>
          </div>
        </FadeIn>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {GUARDRAILS.map((g, i) => (
            <FadeIn key={g.title} delay={i * 0.06}>
              <GlassCard className="h-full p-5">
                <h3 className="font-display text-base font-semibold">
                  {g.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{g.body}</p>
              </GlassCard>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Watchlist + stack */}
      <section className="mt-14">
        <div className="grid gap-4 md:grid-cols-2">
          <FadeIn>
            <GlassCard className="h-full p-5">
              <div className="eyebrow">Watchlist</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {WATCHLIST.map((inst) => (
                  <span
                    key={inst.ticker}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-muted"
                    title={inst.name}
                  >
                    {inst.ticker}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                Six tokenized US equities, configurable in one file.
              </p>
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.08}>
            <GlassCard className="h-full p-5">
              <div className="eyebrow">Built with</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STACK.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                Original code, open-source libraries, re-skinned as a night
                theme.
              </p>
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
