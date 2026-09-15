import { NextResponse } from "next/server";
import { getState } from "@/lib/store/state";
import { buildPaperLog, paperLogSummary } from "@/lib/log/paperLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Quote a CSV field only when it contains a comma, quote, or newline. */
function csvCell(v: string | number | null): string {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CSV_HEADER = [
  "timestamp_utc",
  "instrument",
  "underlying",
  "name",
  "direction",
  "price_usd",
  "quantity",
  "notional_usd",
  "cash_change_usd",
  "balance_after_usd",
  "realized_pnl_usd",
];

/**
 * Public, read-only export of the paper-trading log.
 *   GET /api/log             -> JSON { summary, rows }
 *   GET /api/log?format=csv  -> text/csv download (chronological, oldest first)
 *
 * No authentication and no access request: anyone can verify the record.
 */
export async function GET(req: Request) {
  const state = await getState();
  const rows = buildPaperLog(state);
  const format = new URL(req.url).searchParams.get("format");

  if (format === "csv") {
    const lines = [CSV_HEADER.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.iso,
          r.ticker,
          r.symbol,
          r.name,
          r.action,
          r.price,
          r.qty,
          r.value,
          r.cashChange,
          r.balanceAfter,
          r.realized ?? "",
        ]
          .map(csvCell)
          .join(","),
      );
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          'attachment; filename="nocturne-paper-trading-log.csv"',
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.json({
    summary: paperLogSummary(state, rows),
    rows,
  });
}
