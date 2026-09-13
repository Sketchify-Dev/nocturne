import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/site/FadeIn";

export const metadata: Metadata = {
  title: "Build log · Nocturne",
  description: "Daily build-in-public notes on how Nocturne came together.",
};

interface Entry {
  day: string;
  date: string;
  title: string;
  points: string[];
}

const ENTRIES: Entry[] = [
  {
    day: "Day 6",
    date: "Sep 15, 2026",
    title: "Proof it is real, on-chain",
    points: [
      "Added a read-only on-chain proof panel to the terminal: every watchlist token shows its real xStock mint address with a direct link to its Solscan token page.",
      "Pulled recent transaction signatures for each mint straight from a Solana RPC node, each one linking to the transaction on Solscan, so anyone can confirm the token is genuinely trading on-chain.",
      "Kept the safety line bright: Nocturne only reads the chain. It never signs, sends, or settles a transaction, and the portfolio stays paper-traded.",
      "Held to the provider pattern, so a slow or rate-limited RPC falls back to a clearly labelled demo set and the panel never breaks the terminal.",
    ],
  },
  {
    day: "Day 5",
    date: "Sep 14, 2026",
    title: "Open-sourced and hardened for launch",
    points: [
      "Opened the source to the public with a professional README, an MIT license, and a one-file deploy guide, so anyone can stand up their own Nocturne in minutes.",
      "Added a global tick throttle so the shared agent stays stable and its token use stays bounded when many people open the dashboard at once.",
      "Pointed the language model at the hackathon's Qwen gateway and kept the transparent demo fallback, so a failed call never breaks the feed.",
      "Wired every in-app source link, the nav, header, footer and the hero's View source button, to the public repo through one shared config value.",
    ],
  },
  {
    day: "Day 4",
    date: "Sep 13, 2026",
    title: "Live signals, real decisions, always on",
    points: [
      "Turned on live tokenized-equity prices from on-chain xStock markets, with the recorded demo series as an instant fallback so the terminal never goes blank.",
      "Wired real Qwen decisions into the loop: each tick returns a market view and a per-ticker rationale as structured JSON, validated before it can touch the ledger.",
      "Fed news headlines and a derived sentiment score into the prompt, so the reasoning reflects the tape and the mood, not just the price.",
      "Made it genuinely 24/7: state now persists in Redis and an external cron advances the agent every minute, so the portfolio keeps moving with no browser open.",
      "Shipped the first public deploy on Vercel.",
    ],
  },
  {
    day: "Day 3",
    date: "Sep 12, 2026",
    title: "A cockpit and a brand",
    points: [
      "Overlaid the agent's own buy and sell trades as arrows on the candle chart, and gave the decision feed a spotlight: the newest call types itself out and pulses.",
      "Merged the numbers into one cockpit panel with a realized win rate, a capital-deployed gauge, and a live world clock across New York, London, Tokyo and Hong Kong.",
      "Added a 'while you were away' recap that greets you on return with what the agent did since you last looked, which is the whole point of an agent that never sleeps.",
      "Designed an original brand: a crescent-moon-into-rising-line mark, a matching favicon and social card, and a wordmark whose O is a glowing crescent.",
    ],
  },
  {
    day: "Day 2",
    date: "Sep 11, 2026",
    title: "Candlesticks, motion and a real site",
    points: [
      "Added a green and red candlestick market chart with a ticker selector, driven by a shared price engine so the live quote and the newest candle always agree.",
      "Layered in motion: a drifting aurora background, scroll reveals, and a nav with a sliding active indicator, all of it honoring reduced-motion.",
      "Split the single page into four routes: Home, Terminal, How it works, and this Build log.",
    ],
  },
  {
    day: "Day 1",
    date: "Sep 10, 2026",
    title: "The scaffold and the night shell",
    points: [
      "Stood up the Next.js app with the dark Nocturne design system: glass panels, a WebGL globe, and tabular numerals throughout.",
      "Built the autonomous agent loop end to end on demo data: gather signals, decide, apply to a paper ledger, log.",
      "Wrapped every external dependency behind a provider with a demo fallback, so the whole thing runs with zero API keys.",
      "Hardened the dependency tree to zero known vulnerabilities.",
    ],
  },
];

const NEXT_UP = [
  "Backtest and replay mode, to see how a strategy would have played a past session.",
  "A side-by-side comparison of the conservative, balanced and aggressive presets.",
];

export default function BuildLogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-16">
      <FadeIn>
        <span className="eyebrow">Build log</span>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
          Built in public, one night at a time.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          A running record of how Nocturne comes together for the Bitget AI Base
          Camp hackathon. Newest first.
        </p>
      </FadeIn>

      <div className="mt-12 space-y-5">
        {ENTRIES.map((e, i) => (
          <FadeIn key={e.day} delay={i * 0.06}>
            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent-grad px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-white">
                  {e.day}
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  {e.date}
                </span>
              </div>
              <h2 className="mt-3 font-display text-xl font-semibold">
                {e.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {e.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.1}>
        <GlassCard className="mt-10 p-6">
          <div className="eyebrow">Next up</div>
          <ul className="mt-3 space-y-2">
            {NEXT_UP.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
