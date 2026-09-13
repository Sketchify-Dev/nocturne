import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { AgentState, Strategy } from "@/lib/types";
import { initState } from "@/lib/agent/engine";

/**
 * State store with three tiers, chosen automatically at runtime:
 *
 *   1. Upstash Redis (durable, cross-instance) - used in production when
 *      UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set. Serverless
 *      functions are stateless and short-lived, so this is what actually lets
 *      the agent keep its portfolio between ticks and run 24/7 on a schedule.
 *   2. data/state.json (durable on a real disk) - the default for local dev.
 *   3. In-memory - always present as a warm-instance cache / last-ditch
 *      fallback if the network layer is unreachable.
 *
 * getState/setState/resetState keep identical signatures across all tiers, so
 * the engine, the API routes, and the external-cron route never need to know
 * which backend is live. No API keys => file + memory, and everything works.
 *
 * We talk to Upstash over its plain REST API (a POST with the command as a JSON
 * array) rather than a client library, so there is zero extra dependency to
 * install and nothing to resolve when the vars are absent.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "state.json");
const REDIS_KEY = "nocturne:state";

let mem: AgentState | null = null;

// --- Upstash Redis (REST) --------------------------------------------------

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** True when durable cross-instance storage is configured. */
function redisEnabled(): boolean {
  return !!REDIS_URL && !!REDIS_TOKEN;
}

/**
 * Run one Redis command through the Upstash REST API. The command is sent as a
 * JSON array in the body (so a large SET payload never hits a URL-length
 * limit). Returns the `result` field, or throws so callers can fall back to
 * file / memory instead of crashing the tick.
 */
async function redisCmd(cmd: (string | number)[]): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(REDIS_URL as string, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(cmd),
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    const json = (await res.json()) as { result?: unknown; error?: string };
    if (json.error) throw new Error(json.error);
    return json.result ?? null;
  } finally {
    clearTimeout(timer);
  }
}

async function redisGet(): Promise<AgentState | null> {
  const raw = await redisCmd(["GET", REDIS_KEY]);
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as AgentState;
  } catch {
    return null;
  }
}

async function redisSet(state: AgentState): Promise<void> {
  await redisCmd(["SET", REDIS_KEY, JSON.stringify(state)]);
}

// --- Local file ------------------------------------------------------------

async function readFileState(): Promise<AgentState | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as AgentState;
  } catch {
    return null;
  }
}

async function writeFileState(state: AgentState): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(state), "utf8");
  } catch {
    // Read-only filesystem (e.g. serverless without Redis): memory only.
  }
}

// --- Public API (backend-agnostic) -----------------------------------------

/**
 * Load the current state. With Redis on, we read the durable copy every time so
 * that progress stays monotonic across instances: the external cron and any
 * open dashboard tab always advance from the true latest tick rather than a
 * stale warm-instance copy (which could otherwise make equity jump backwards).
 */
export async function getState(): Promise<AgentState> {
  if (redisEnabled()) {
    try {
      const stored = await redisGet();
      if (stored) {
        mem = stored;
        return stored;
      }
      // First boot: seed the key so it exists for every later reader.
      const fresh = initState();
      mem = fresh;
      await redisSet(fresh).catch(() => {});
      return fresh;
    } catch {
      // Upstash unreachable: degrade to warm memory, else a fresh state.
      if (mem) return mem;
      mem = initState();
      return mem;
    }
  }

  // Local dev: memory first, then the JSON file on disk.
  if (mem) return mem;
  mem = (await readFileState()) ?? initState();
  return mem;
}

export async function setState(state: AgentState): Promise<AgentState> {
  mem = state;
  if (redisEnabled()) {
    try {
      await redisSet(state);
      return state;
    } catch {
      // Fall through so we at least keep a local copy on failure.
    }
  }
  await writeFileState(state);
  return state;
}

export async function resetState(strategy?: Strategy): Promise<AgentState> {
  return setState(initState(strategy));
}
