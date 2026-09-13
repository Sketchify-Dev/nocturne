import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/store/state";
import { tick } from "@/lib/agent/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * External-cron entrypoint for genuine 24/7 ticking. Point a scheduler
 * (e.g. cron-job.org) at this URL. If CRON_SECRET is set, require ?secret=...
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
