import { cn } from "@/lib/ui/cn";

export function StatTile({
  label,
  children,
  sub,
  accent,
  className,
  bare = false,
}: {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "up" | "down" | "neutral";
  className?: string;
  /** Drop the glass card chrome (for use inside a larger panel). */
  bare?: boolean;
}) {
  const tone =
    accent === "up" ? "text-up" : accent === "down" ? "text-down" : "text-ink";
  return (
    <div className={cn(bare ? "" : "glass rounded-glass p-4 sm:p-5", className)}>
      <div className="eyebrow">{label}</div>
      <div className={cn("mt-2 font-display text-2xl font-semibold sm:text-3xl nums", tone)}>
        {children}
      </div>
      {sub != null && <div className="mt-1 text-sm text-muted nums">{sub}</div>}
    </div>
  );
}
