import { NextResponse } from "next/server";
import { getOnchainProof } from "@/lib/data/onchain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { tokens, source } = await getOnchainProof();
  return NextResponse.json({ tokens, source });
}
