"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useEffect, useRef } from "react";

// Major financial centers, as [latitude, longitude].
const MARKERS: { location: [number, number]; size: number }[] = [
  { location: [40.71, -74.0], size: 0.1 }, // New York
  { location: [51.5, -0.12], size: 0.08 }, // London
  { location: [35.68, 139.69], size: 0.08 }, // Tokyo
  { location: [22.32, 114.17], size: 0.06 }, // Hong Kong
  { location: [1.35, 103.82], size: 0.05 }, // Singapore
  { location: [50.11, 8.68], size: 0.05 }, // Frankfurt
  { location: [37.77, -122.41], size: 0.06 }, // San Francisco
  { location: [31.23, 121.47], size: 0.06 }, // Shanghai
];

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let phi = 0;
    let width = 0;

    const onResize = () => {
      width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    // cobe drives rotation via onRender (called each frame), but this version's
    // COBEOptions type omits it, so we extend the type locally.
    const opts: COBEOptions & {
      onRender?: (state: Record<string, number>) => void;
    } = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.28,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.14, 0.17, 0.28],
      markerColor: [0.36, 0.49, 1], // electric indigo
      glowColor: [0.35, 0.32, 0.85],
      markers: MARKERS,
      onRender: (state) => {
        state.phi = phi;
        phi += 0.0045;
        state.width = width * 2;
        state.height = width * 2;
      },
    };

    const globe = createGlobe(canvas, opts);

    // Fade the canvas in once the first frame paints.
    const t = setTimeout(() => {
      canvas.style.opacity = "1";
    }, 120);

    return () => {
      clearTimeout(t);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          aspectRatio: "1",
          opacity: 0,
          transition: "opacity 1s ease",
          contain: "layout paint size",
        }}
      />
    </div>
  );
}
