import { cn } from "@/lib/ui/cn";

export function GlassCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-glass shadow-panel", className)} {...rest}>
      {children}
    </div>
  );
}
