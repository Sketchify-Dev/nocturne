"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Candle, Trade } from "@/lib/types";

export function CandleChart({
  candles,
  trades = [],
}: {
  candles: Candle[];
  trades?: Trade[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

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
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: "rgba(91,124,255,0.4)", labelBackgroundColor: "#5B7CFF" },
        horzLine: { color: "rgba(91,124,255,0.4)", labelBackgroundColor: "#5B7CFF" },
      },
      height: el.clientHeight || 320,
      width: el.clientWidth,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34D399",
      downColor: "#FB7185",
      wickUpColor: "#34D399",
      wickDownColor: "#FB7185",
      borderVisible: false,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Push data whenever the series changes.
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || candles.length === 0) return;

    series.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    chart.timeScale().fitContent();
  }, [candles]);

  // Overlay the agent's executed trades as BUY/SELL arrows, snapped to the
  // candle they landed in. Trades older than the visible window are dropped.
  useEffect(() => {
    const plugin = markersRef.current;
    if (!plugin || candles.length === 0) return;

    const first = candles[0].time;
    const last = candles[candles.length - 1].time;
    const interval =
      candles.length > 1 ? candles[1].time - candles[0].time : 60;

    const markers: SeriesMarker<Time>[] = [];
    for (const t of trades) {
      const bucket = Math.floor(t.ts / 1000 / interval) * interval;
      if (bucket < first || bucket > last) continue;
      const isBuy = t.action === "BUY";
      markers.push({
        time: bucket as UTCTimestamp,
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#34D399" : "#FB7185",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: isBuy ? "B" : "S",
        size: 1,
      });
    }
    markers.sort((a, b) => Number(a.time) - Number(b.time));
    plugin.setMarkers(markers);
  }, [candles, trades]);

  return <div ref={containerRef} className="h-[300px] w-full sm:h-[360px]" />;
}
