# Nocturne

Autonomous, 24/7 AI trading agent for tokenized US equities. Nocturne reads live market data around the clock, asks Qwen for a buy, sell, or hold decision with written reasoning on every tick, and applies risk-checked trades to a simulated paper-trading portfolio. The decision feed streams the model's actual reasoning, so you can watch it think.

[![Live demo](https://img.shields.io/badge/demo-live-5B7CFF)](https://nocturne-coral-phi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-3DA639)](./LICENSE)

> Markets never sleep. Now neither does your edge.

**Live demo:** https://nocturne-coral-phi.vercel.app

Built for the Bitget AI Base Camp Hackathon S2 (theme: AI x tokenized US equities, the 7x24 era).

## Overview

Nocturne is a demonstration of an always-on trading agent. Markets and news do not stop, so the agent does not either: an external scheduler advances it on a fixed cadence, and the dashboard advances it faster while a browser is open. Every tick follows the same loop: gather signals, reason with the language model, apply confident and risk-checked decisions to the ledger, and persist the result.

The project is built to run with zero API keys. Every external dependency (language model, prices, news, sentiment) sits behind a small interface with a built-in demo implementation, so the live demo never breaks and real providers switch on automatically when their keys are present.

## Features

- Streaming, explainable decisions. Each tick records the model's market view and a per-ticker rationale, not just an action.
- Runs keyless. Prices, news, sentiment, and the language model all have demo fallbacks. Add a Qwen key to enable real decisions.
- Genuinely 24/7. A GitHub Actions workflow in the repo pings the tick endpoint on a schedule from GitHub's own infrastructure, so the agent keeps trading with every browser closed. Any external scheduler pointed at the same endpoint works too.
- Public, verifiable run log. A read-only `/log` page and `/api/log` endpoint list every executed paper trade, with a one-click CSV export and no login required.
- Risk-checked paper trading. Position and trade-size limits, confidence thresholds, and a ledger that never lets cash go negative. No real orders, no custody of funds.
- Read-only on-chain proof. Every token links to its real xStock mint and recent Solana transactions on Solscan, so anyone can verify the assets are genuine. Nocturne only reads the chain; it never signs or sends an order.
- Strategy presets. Conservative, balanced, and aggressive profiles adjust risk limits and the prompt's tone.
- Production dashboard. A live terminal with an equity curve, positions, signals, a price ticker, and the decision feed.

## Architecture

A single tick:

```
gather signals (prices, news, sentiment)
  -> build a strategy-aware prompt
  -> Qwen returns structured JSON { marketView, decisions[] }
  -> validate with Zod (tolerant parsing)
  -> apply confident, risk-checked calls to the ledger
  -> append to the decision log
  -> persist state
```

Each concern has a live provider and a demo fallback:

| Concern | Live provider | Fallback |
| --- | --- | --- |
| Decisions | Qwen (DashScope, OpenAI-compatible) | rule-based mock |
| Prices | DexScreener (xStock token mints on Solana) | recorded demo series |
| On-chain proof | Solana JSON-RPC (read-only signatures) | labelled demo set |
| News | finance headlines | recorded demo headlines |
| Sentiment | derived from headlines | demo scores |
| Persistence | Upstash Redis (REST) | in-memory or local file |

## Getting started

### Prerequisites

- Node.js 18.18 or newer
- npm

### Install and run (demo mode, no keys)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The agent begins ticking on demo data immediately: the equity curve, positions, and decision feed all come alive with no configuration.

### Enable live Qwen decisions

```bash
cp .env.example .env.local
```

Set your key in `.env.local`:

```env
QWEN_API_KEY=sk-...
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
```

Restart the dev server. Decisions in the feed are then tagged as live rather than demo. If a live call fails, Nocturne falls back to demo mode so the interface keeps running.

### 24/7 background ticking

The dashboard advances the agent while it is open. For around-the-clock operation, this repo includes a GitHub Actions workflow at `.github/workflows/tick.yml` that pings the tick endpoint on a schedule from GitHub's own infrastructure. Add your `CRON_SECRET` as a repository secret (Settings, then Secrets and variables, then Actions) and it runs on its own; you can also trigger it by hand from the Actions tab.

Any external scheduler works too. Point it at:

```
GET https://<your-deployment>/api/cron/tick?secret=<CRON_SECRET>
```

## Configuration

Every variable is optional. Without them, the app runs in demo mode.

| Variable | Purpose |
| --- | --- |
| `QWEN_API_KEY` | Enables live decisions through Qwen. |
| `QWEN_BASE_URL` | OpenAI-compatible endpoint. Defaults to DashScope International. |
| `QWEN_MODEL` | Model name. Defaults to `qwen-plus`. |
| `SOLANA_RPC_URL` | Solana JSON-RPC endpoint for the read-only on-chain proof. Defaults to the public mainnet node. |
| `CRON_SECRET` | Shared secret required by the cron endpoint. |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL for production persistence. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token. |
| `NEXT_PUBLIC_GITHUB_URL` | Overrides the repository link shown in the UI (useful for forks). |

## Deployment

The app deploys to Vercel, with persistence on Upstash Redis and 24/7 ticking driven by the GitHub Actions workflow included in the repo (any external scheduler works too). A complete, step-by-step walkthrough is in [DEPLOY.md](./DEPLOY.md).

## Project structure

```
.github/workflows/tick.yml scheduled 24/7 tick (GitHub Actions)
app/
  page.tsx                 landing page
  terminal/page.tsx        live trading terminal
  how-it-works/page.tsx    agent design and safety
  build-log/page.tsx       build-in-public log
  log/page.tsx             public read-only paper-trading log
  api/agent/state          GET current state
  api/agent/tick           POST advance one tick
  api/agent/control        POST start / pause / reset / configure
  api/market/candles       GET OHLC candles for a ticker
  api/cron/tick            GET external-cron entrypoint
  api/log                  GET public paper-trading log (JSON or CSV)
components/                UI: Hero, Globe, EquityChart, DecisionFeed, and more
lib/
  agent/engine.ts          the tick loop
  agent/prompt.ts          strategy-aware prompt builder
  llm/qwen.ts              Qwen provider and rule-based mock
  data/                    prices, news, and sentiment providers
  log/paperLog.ts          builds the public trade log from state
  portfolio/ledger.ts      trades, positions, P&L, risk limits
  store/state.ts           persistence (Redis, file, or memory)
```

## Safety and scope

Nocturne is a demonstration. It paper-trades with simulated capital and does not submit real orders or custody funds. Tokenized-equity prices, news, and sentiment use built-in demo data unless live sources are configured.

## Tech stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zod, TanStack Query, lightweight-charts, cobe, lucide-react, and Qwen through its OpenAI-compatible API.

## License

Released under the MIT License. See [LICENSE](./LICENSE).
