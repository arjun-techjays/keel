"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SvcResult = { ok: boolean; status: number; body: Record<string, unknown> };

async function callService(path: string, init?: RequestInit): Promise<SvcResult> {
  const base = process.env.KEEL_SERVICE_URL;
  if (!base) return { ok: false, status: 0, body: { detail: "KEEL_SERVICE_URL not set" } };

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, status: 401, body: { detail: "Not signed in" } };

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, status: 0, body: { detail: `Service unreachable: ${String(e)}` } };
  }

  const text = await res.text();
  let body: Record<string, unknown>;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body };
}

// Pull / push / release are driven by the agent over MCP. The web only offers an
// admin override to break a genuinely stuck lock.
export async function forceReleaseProject(projectId: string): Promise<SvcResult> {
  const r = await callService(`/projects/${projectId}/force-release`, { method: "POST" });
  revalidatePath(`/projects/${projectId}`);
  return r;
}
