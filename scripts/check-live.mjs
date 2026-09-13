// Verifies the exact live-price path the app uses: hits DexScreener's tokens
// endpoint with the real xStock mints and prints what the provider would return.
//
//   node scripts/check-live.mjs
//
// If every ticker prints a sane price, the terminal will show "Live · DexScreener".

const MINTS = {
  AAPLx: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  TSLAx: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
  NVDAx: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
  MSFTx: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
  SPYx: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
  COINx: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
};

const byMint = new Map(
  Object.entries(MINTS).map(([t, m]) => [m.toLowerCase(), t]),
);

const url =
  "https://api.dexscreener.com/latest/dex/tokens/" +
  Object.values(MINTS).join(",");

const res = await fetch(url, { headers: { accept: "application/json" } });
console.log("HTTP", res.status);
const data = await res.json();
const pairs = Array.isArray(data.pairs) ? data.pairs : [];
console.log("pairs returned:", pairs.length, "\n");

const best = new Map();
for (const p of pairs) {
  if (p.chainId !== "solana") continue;
  const t = byMint.get((p.baseToken?.address || "").toLowerCase());
  if (!t) continue;
  const price = Number(p.priceUsd);
  if (!(price > 0)) continue;
  const liq = Number(p.liquidity?.usd) || 0;
  const prev = best.get(t);
  if (!prev || liq > prev.liq) best.set(t, { price, h24: p.priceChange?.h24, liq });
}

let live = 0;
for (const t of Object.keys(MINTS)) {
  const b = best.get(t);
  if (b) {
    live++;
    console.log(`${t}\t$${b.price}\t${b.h24}%\tliq $${Math.round(b.liq).toLocaleString()}`);
  } else {
    console.log(`${t}\tNO LIVE PAIR`);
  }
}
console.log(`\n${live}/${Object.keys(MINTS).length} tickers live`);
