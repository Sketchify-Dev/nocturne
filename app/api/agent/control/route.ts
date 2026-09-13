import { NextResponse } from "next/server";
import { z } from "zod";
import { getState, setState, resetState } from "@/lib/store/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  action: z.enum(["start", "pause", "reset", "config"]),
  strategy: z.enum(["conservative", "balanced", "aggressive"]).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { action, strategy } = parsed.data;

  if (action === "reset") {
    const state = await resetState(strategy);
    return NextResponse.json({ state });
  }

  const current = await getState();
  const next = { ...current };
  if (action === "start") next.status = "running";
  if (action === "pause") next.status = "paused";
  if (strategy) next.strategy = strategy;

  const saved = await setState(next);
  return NextResponse.json({ state: saved });
}
