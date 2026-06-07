import { createClient } from "./supabase/server";

export async function getProjects() {
  const sb = await createClient();
  const { data } = await sb
    .from("projects")
    .select(
      "*, locks(status,phase,heartbeat_at,holder:profiles(full_name,initials))",
    )
    .order("created_at");
  return data ?? [];
}

export async function getProject(id: string) {
  const sb = await createClient();
  const { data } = await sb.from("projects").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getDimensions(projectId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("dimensions")
    .select("*")
    .eq("project_id", projectId)
    .order("dim_id");
  return data ?? [];
}

export async function getQuestions(projectId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("questions")
    .select("*")
    .eq("project_id", projectId)
    .order("q_id");
  return data ?? [];
}

export async function getMethods(projectId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("research_methods")
    .select(
      "*, assignee:profiles(full_name,initials,color), questions(*)",
    )
    .eq("project_id", projectId)
    .order("created_at");
  return data ?? [];
}

export async function getLatestReview(projectId: string) {
  const sb = await createClient();
  const { data: runs } = await sb
    .from("review_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);
  const run = runs?.[0];
  if (!run) return null;
  const { data: findings } = await sb
    .from("review_findings")
    .select("*")
    .eq("run_id", run.id);
  const order = { high: 0, med: 1, low: 2 } as Record<string, number>;
  (findings ?? []).sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  return { run, findings: findings ?? [] };
}

export async function getProjectQuality() {
  const sb = await createClient();
  const { data } = await sb.from("v_project_quality").select("*");
  return data ?? [];
}

export async function getCloseMix() {
  const sb = await createClient();
  const { data } = await sb.from("v_close_mix").select("*");
  return data ?? [];
}

export async function getTeamActivity() {
  const sb = await createClient();
  const { data } = await sb.from("v_team_activity").select("*");
  return data ?? [];
}
