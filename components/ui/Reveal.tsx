import type { CSSProperties, ReactNode } from "react";

/**
 * Marks children for the global scroll-reveal controller. `i` staggers the
 * fade-in (multiplied by 80ms via the --i CSS variable).
 */
export function Reveal({
  i = 0,
  className,
  children,
  style,
}: {
  i?: number;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      data-reveal
      className={className}
      style={{ ...style, "--i": i } as CSSProperties}
    >
      {children}
    </div>
  );
}
