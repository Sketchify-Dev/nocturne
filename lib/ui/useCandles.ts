"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Candle, Source } from "@/lib/types";

interface CandlesResp {
  ticker: string;
  tf: string;
  candles: Candle[];
  source: Source;
}

/** Polls the OHLC series for one ticker + timeframe so the chart stays live. */
export function useCandles(ticker: string, tf: string, intervalMs = 4000) {
  return useQuery<CandlesResp>({
    queryKey: ["candles", ticker, tf],
    queryFn: async () => {
      const res = await fetch(
        `/api/market/candles?ticker=${encodeURIComponent(ticker)}&tf=${encodeURIComponent(tf)}`,
      );
      if (!res.ok) throw new Error(`candles ${res.status}`);
      return res.json() as Promise<CandlesResp>;
    },
    refetchInterval: intervalMs,
    refetchOnWindowFocus: false,
    // Keep showing the old series while a ticker/timeframe switch loads.
    placeholderData: keepPreviousData,
  });
}
