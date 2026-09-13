"use client";

import { useQuery } from "@tanstack/react-query";
import type { Source, TokenProof } from "@/lib/types";

interface OnchainResp {
  tokens: TokenProof[];
  source: Source;
}

/**
 * Polls the read-only on-chain proof: real xStock mints and their most recent
 * Solana transactions. Slow cadence, since chain history moves slowly and the
 * public RPC is rate limited.
 */
export function useOnchain(intervalMs = 30000) {
  return useQuery<OnchainResp>({
    queryKey: ["onchain"],
    queryFn: async () => {
      const res = await fetch("/api/onchain");
      if (!res.ok) throw new Error(`onchain ${res.status}`);
      return res.json() as Promise<OnchainResp>;
    },
    refetchInterval: intervalMs,
    refetchOnWindowFocus: false,
  });
}
