"use client";

import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { EquityPoint } from "@/lib/types";

export function EquityChart({ points }: { points: EquityPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  // Create the chart once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8B93AB",
        fontFamily: "var(--font-mono), monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: "rgba(91,124,255,0.4)", labelBackgroundColor: "#5B7CFF" },
        horzLine: { color: "rgba(91,124,255,0.4)", labelBackgroundColor: "#5B7CFF" },
      },
      handleScale: false,
      handleScroll: false,
      height: el.clientHeight || 320,
      width: el.clientWidth,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#5B7CFF",
      lineWidth: 2,
      topColor: "rgba(91,124,255,0.35)",
      bottomColor: "rgba(91,124,255,0.02)",
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Push data whenever the equity curve changes.
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || points.length === 0) return;

    // Map to strictly-increasing integer timestamps (1s apart) so the series is
    // always valid regardless of how fast ticks arrive.
    const base = Math.floor((points[0]?.ts ?? Date.now()) / 1000);
    const data = points.map((p, i) => ({
      time: (base + i) as UTCTimestamp,
      value: p.equity,
    }));
    series.setData(data);
    chart.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className="h-[280px] w-full sm:h-[340px]" />;
}
