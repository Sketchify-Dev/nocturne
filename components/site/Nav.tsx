"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/ui/cn";
import { Logo } from "@/components/Logo";
import { GITHUB_URL } from "@/lib/config";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/terminal", label: "Terminal" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/build-log", label: "Build log" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 pt-3"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Nocturne home"
          className="glass flex items-center rounded-full px-3.5 py-2 transition hover:brightness-110"
        >
          <Logo iconClassName="h-[18px] w-[18px]" wordClassName="text-sm" />
        </Link>

        <div className="glass hidden items-center gap-1 rounded-full p-1 md:flex">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="relative rounded-full px-3.5 py-1.5 text-sm"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 transition",
                    active ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {l.label}
                </span>
              </Link>
            );
          })}
        </div>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:text-ink"
        >
          <Github className="h-4 w-4" />
        </a>
      </nav>

      {/* Compact link row for narrow screens. */}
      <div className="mx-auto mt-2 flex max-w-7xl justify-center px-4 md:hidden">
        <div className="glass flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition",
                  active ? "bg-white/10 text-ink" : "text-muted",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}
