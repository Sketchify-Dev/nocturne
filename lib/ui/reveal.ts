"use client";

/**
 * Global scroll-reveal controller (original implementation). Marks the document
 * as motion-ready, then fades in any `[data-reveal]` element when it scrolls
 * into view. A MutationObserver picks up nodes added later (e.g. new panels).
 * Respects prefers-reduced-motion by disabling the hidden state entirely.
 *
 * Returns a cleanup function.
 */
export function initReveal(): () => void {
  const root = document.documentElement;
  root.dataset.nocturneMotionReady = "1";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    root.classList.remove("nocturne-motion");
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  const observeAll = () => {
    document
      .querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)")
      .forEach((el) => io.observe(el));
  };

  observeAll();

  const mo = new MutationObserver(() => observeAll());
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
  };
}
