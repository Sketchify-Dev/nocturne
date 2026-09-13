import { Github, Moon } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { GITHUB_URL } from "@/lib/config";

export function Header({ running, live }: { running: boolean; live: boolean }) {
  return (
    <header className="sticky top-0 z-40 pt-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="glass flex items-center gap-2 rounded-full px-3.5 py-2">
          <Moon className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-semibold tracking-wide">
            NOCTURNE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <SourceBadge live={live} label={live ? "Qwen · live" : "Demo mode"} />
          </span>
          <StatusPill running={running} />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="glass flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:text-ink"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
