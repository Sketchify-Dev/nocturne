"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentState, Strategy } from "@/lib/types";

interface StateResp {
  state: AgentState;
  llmConfigured?: boolean;
}

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

const post = (url: string, body: unknown) =>
  getJSON<{ state: AgentState }>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

/** Central client hook: current agent state + tick/control mutations. */
export function useAgent() {
  const qc = useQueryClient();

  const { data } = useQuery<StateResp>({
    queryKey: ["agent"],
    queryFn: () => getJSON<StateResp>("/api/agent/state"),
  });

  const write = (resp: { state: AgentState }) =>
    qc.setQueryData<StateResp>(["agent"], (old) => ({
      llmConfigured: old?.llmConfigured,
      state: resp.state,
    }));

  const tick = useMutation({
    mutationFn: (force: boolean) => post("/api/agent/tick", { force }),
    onSuccess: (resp) => resp?.state && write(resp),
  });

  const control = useMutation({
    mutationFn: (body: {
      action: "start" | "pause" | "reset" | "config";
      strategy?: Strategy;
    }) => post("/api/agent/control", body),
    onSuccess: (resp) => resp?.state && write(resp),
  });

  return {
    state: data?.state,
    llmConfigured: data?.llmConfigured ?? false,
    tick,
    control,
  };
}
