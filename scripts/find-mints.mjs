// One-off helper: find the real Solana mint address for each xStock symbol via
// DexScreener, so we can paste the verified mints into lib/config.ts.
//
//   node scripts/find-mints.mjs
//
// For each symbol it prints the top 3 Solana pairs by liquidity:
//   symbol   mint   priceUSD   24h%   liquidity
// Pick the row whose symbol matches the xStock and copy its mint.

const SYMBOLS = ["AAPLx", "TSLAx", "NVDAx", "MSFTx", "SPYx", "COINx"];

for (const s of SYMBOLS) {
  console.log(`== ${s} ==`);
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(s)}`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) {
      console.log(`  http ${res.status}`);
      continue;
    }
    const data = await res.json();
    const pairs = (data.pairs || [])
      .filter((p) => p.chainId === "solana")
      .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    if (!pairs.length) {
      console.log("  (no Solana pairs found)");
      continue;
    }
    for (const p of pairs.slice(0, 3)) {
      const sym = p.baseToken?.symbol ?? "?";
      const mint = p.baseToken?.address ?? "?";
      const price = p.priceUsd ?? "?";
      const h24 = p.priceChange?.h24 ?? "?";
      const liq = Math.round(p.liquidity?.usd || 0).toLocaleString();
      console.log(`  ${sym}\t${mint}\t$${price}\t${h24}%\tliq $${liq}`);
    }
  } catch (e) {
    console.log(`  error: ${e.message}`);
  }
}
