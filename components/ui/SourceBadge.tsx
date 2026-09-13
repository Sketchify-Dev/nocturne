import { cn } from "@/lib/ui/cn";

export function SourceBadge({ live, label }: { live: boolean; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        live
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-white/10 bg-white/5 text-muted",
      )}
    >
      {label}
    </span>
  );
}
