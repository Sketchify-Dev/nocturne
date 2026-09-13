// Small shared helpers, safe on both server and client.

export const now = () => Date.now();

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Short unique-ish id. */
export function uid(prefix = ""): string {
  return (
    prefix +
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  );
}

/**
 * Continuous, smooth signal in ~[-1,1] as a function of time `t` and a
 * per-series `offset`. Layered sines give an organic, non-repeating curve,
 * used to synthesize believable demo prices without any external feed.
 */
export function smoothWave(t: number, offset: number): number {
  return (
    Math.sin(t * 0.11 + offset) * 0.6 +
    Math.sin(t * 0.037 + offset * 2.3) * 0.3 +
    Math.sin(t * 0.0071 + offset * 0.7) * 0.1
  );
}

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtUsd = (n: number, cents = false) =>
  (cents ? usd2 : usd0).format(n);

export const fmtPct = (n: number, digits = 2) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const fmtSignedUsd = (n: number) =>
  `${n >= 0 ? "+" : "-"}${usd0.format(Math.abs(n))}`;
