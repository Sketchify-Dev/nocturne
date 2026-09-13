import { cn } from "@/lib/ui/cn";

export function StatusPill({ running }: { running: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider",
        running
          ? "border-up/30 bg-up/10 text-up"
          : "border-muted/30 bg-white/5 text-muted",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          running ? "animate-pulse-dot bg-up" : "bg-muted",
        )}
      />
      {running ? "Live" : "Paused"}
    </span>
  );
}
