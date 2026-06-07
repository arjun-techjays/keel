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

// Editor management (RLS enforces: any editor adds, creator/admin removes).
export async function addEditor(projectId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role: "editor", added_by: user?.id });
  revalidatePath(`/projects/${projectId}`);
  return { error: error?.message };
}

export async function removeEditor(projectId: string, userId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("project_members")
    .select("user_id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) <= 1) return { error: "A project needs at least one editor." };

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  revalidatePath(`/projects/${projectId}`);
  return { error: error?.message };
}
