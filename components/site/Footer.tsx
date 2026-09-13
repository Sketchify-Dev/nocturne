import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GITHUB_URL } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mx-auto mt-20 max-w-7xl px-4 pb-12 sm:px-6">
      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <Logo iconClassName="h-6 w-6" wordClassName="text-lg" />
            <p className="mt-3 text-sm text-muted">
              A demonstration agent. It paper-trades with simulated capital and{" "}
              <span className="text-ink">does not place real orders</span> or
              touch real funds. Live prices, news and sentiment fall back to
              built-in demo data when no keys are set.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="eyebrow mb-1">Explore</span>
            <Link href="/terminal" className="text-muted transition hover:text-ink">
              Live terminal
            </Link>
            <Link href="/how-it-works" className="text-muted transition hover:text-ink">
              How it works
            </Link>
            <Link href="/build-log" className="text-muted transition hover:text-ink">
              Build log
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted transition hover:text-ink"
            >
              Source on GitHub
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-5">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            Built for Bitget AI Base Camp · Hackathon S2 · the 7×24 era
          </p>
        </div>
      </div>
    </footer>
  );
}
