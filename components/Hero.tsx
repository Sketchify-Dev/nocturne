"use client";

import Link from "next/link";
import { Activity, ArrowRight, Github } from "lucide-react";
import { motion } from "motion/react";
import { Globe } from "@/components/Globe";
import { FadeIn } from "@/components/site/FadeIn";
import { fmtPct, fmtUsd } from "@/lib/util";
import { GITHUB_URL } from "@/lib/config";

export function Hero({
  running,
  equity,
  pnlPct,
}: {
  running: boolean;
  equity?: number;
  pnlPct?: number;
}) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pt-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <FadeIn>
            <span className="eyebrow">
              24/7 Autonomous Agent · Tokenized US Equities
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
              Markets never sleep.{" "}
              <span className="text-gradient">Now neither does your edge.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Nocturne reads the tape around the clock, reasons over every move
              with Qwen, and trades a live paper portfolio while you sleep.
            </p>
          </FadeIn>
          <FadeIn delay={0.24}>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/terminal"
                className="inline-flex items-center gap-2 rounded-full bg-accent-grad px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 active:scale-[.98]"
              >
                Open the terminal <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/5 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white/10"
              >
                <Github className="h-4 w-4" /> View source
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={0.32}>
            <p className="mt-5 font-mono text-xs uppercase tracking-wider text-muted">
              Paper-trading · no real funds · runs keyless in demo mode
            </p>
          </FadeIn>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="relative">
            <Globe className="mx-auto w-full max-w-md" />
            <div className="glass absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-2xl px-5 py-3">
              <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
                <Activity
                  className={`h-3.5 w-3.5 ${running ? "text-up" : "text-muted"}`}
                />
                {running ? "Trading now" : "Paused"}
              </span>
              {typeof equity === "number" && (
                <span className="font-display text-lg font-semibold nums">
                  {fmtUsd(equity)}
                </span>
              )}
              {typeof pnlPct === "number" && (
                <span
                  className={`text-sm font-medium nums ${pnlPct >= 0 ? "text-up" : "text-down"}`}
                >
                  {fmtPct(pnlPct)}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
