import { NextResponse } from "next/server";
import { DEFAULT_TIMEFRAME, WATCHLIST, timeframe } from "@/lib/config";
import { getCandles } from "@/lib/data/prices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const requested = searchParams.get("ticker");
  const ticker =
    requested && WATCHLIST.some((i) => i.ticker === requested)
      ? requested
      : WATCHLIST[0].ticker;

  const tf = timeframe(searchParams.get("tf") ?? DEFAULT_TIMEFRAME);

  const { candles, source } = await getCandles(ticker, tf.seconds);
  return NextResponse.json({ ticker, tf: tf.key, candles, source });
}
