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

export async function pullProject(projectId: string): Promise<SvcResult> {
  const r = await callService(`/projects/${projectId}/pull`, { method: "POST" });
  revalidatePath(`/projects/${projectId}`);
  return r;
}

export async function releaseProject(projectId: string): Promise<SvcResult> {
  const r = await callService(`/projects/${projectId}/release`, { method: "POST" });
  revalidatePath(`/projects/${projectId}`);
  return r;
}

export async function heartbeatProject(projectId: string): Promise<SvcResult> {
  return callService(`/projects/${projectId}/heartbeat`, { method: "POST" });
}

export async function pushProject(projectId: string, formData: FormData): Promise<SvcResult> {
  const file = formData.get("file");
  const phase = (formData.get("phase") as string) || "generate";
  if (!(file instanceof File)) {
    return { ok: false, status: 400, body: { detail: "No file provided" } };
  }
  const forward = new FormData();
  forward.append("file", file, file.name);
  const r = await callService(`/projects/${projectId}/push?phase=${phase}`, {
    method: "POST",
    body: forward,
  });
  revalidatePath(`/projects/${projectId}`);
  return r;
}
