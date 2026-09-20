import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/store/state";
import { tick } from "@/lib/agent/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Give the tick room to gather signals and get a model decision before Vercel
// times out the function. The model call itself is bounded to 45s in qwen.ts,
// so a tick returns well inside this limit.
export const maxDuration = 60;

/**
 * External-cron entrypoint for genuine 24/7 ticking. The included GitHub Actions
 * workflow (.github/workflows/tick.yml) pings this on a schedule; any external
 * scheduler pointed at this URL works too. If CRON_SECRET is set, require ?secret=...
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const state = await getState();
  if (state.status !== "running") {
    return NextResponse.json({ ok: true, skipped: true, tick: state.tick });
  }

  const next = await tick(state);
  await setState(next);
  return NextResponse.json({
    ok: true,
    tick: next.tick,
    equity: next.portfolio.equityCurve.at(-1)?.equity,
    executed: next.log[0]?.executed.length ?? 0,
  });
}
