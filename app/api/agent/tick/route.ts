import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/store/state";
import { tick } from "@/lib/agent/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Minimum spacing between *auto* ticks, enforced globally via the shared
 * state's lastTickAt. There is one global agent, and every open dashboard tab
 * polls this route; without a floor, a crowd of concurrent viewers (e.g. during
 * public voting) would each advance the same portfolio every few seconds,
 * inflating the tick count and burning LLM tokens. This caps the shared agent
 * to ~one auto-tick per interval no matter how many tabs are watching. It sits
 * safely below the client's 4s poll so a lone viewer still ticks every poll,
 * and a manual "Advance" ({ force: true }) always bypasses it.
 */
const MIN_AUTO_TICK_MS = 2500;

/**
 * Advance the agent one tick. The dashboard polls this while open. Auto-polls
 * are skipped when paused or when they arrive inside the throttle window; a
 * manual "Advance" sends { force: true } and always runs.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as { force?: boolean });
  const force = !!body?.force;

  const state = await getState();
  if (state.status !== "running" && !force) {
    return NextResponse.json({ state, skipped: true });
  }
  if (
    !force &&
    state.lastTickAt !== null &&
    Date.now() - state.lastTickAt < MIN_AUTO_TICK_MS
  ) {
    return NextResponse.json({ state, skipped: true, throttled: true });
  }

  const next = await tick(state);
  await setState(next);
  return NextResponse.json({ state: next });
}
