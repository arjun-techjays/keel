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

export async function getLatestRender(projectId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("renders")
    .select("id,version,gate_result,created_at")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getLock(projectId: string) {
  const sb = await createClient();
  const { data } = await sb
    .from("locks")
    .select("*, holder:profiles(full_name,initials)")
    .eq("project_id", projectId)
    .maybeSingle();
  return data;
}

export async function getSessionUserId() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.id ?? null;
}

export async function getProjectMembers(projectId: string) {
  const sb = await createClient();
  const { data: mem } = await sb
    .from("project_members")
    .select("user_id, added_by")
    .eq("project_id", projectId);
  const ids = (mem ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const { data: profs } = await sb
    .from("profiles")
    .select("id,full_name,email,initials")
    .in("id", ids);
  const byId = new Map((profs ?? []).map((p) => [p.id, p]));
  return (mem ?? []).map((m) => ({ user_id: m.user_id, ...byId.get(m.user_id) }));
}

export async function getAllProfiles() {
  const sb = await createClient();
  const { data } = await sb
    .from("profiles")
    .select("id,full_name,email,initials")
    .order("full_name");
  return data ?? [];
}

export async function getMyRole() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role ?? null;
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

export async function getTokens() {
  const sb = await createClient();
  const { data } = await sb
    .from("personal_access_tokens")
    .select("id,name,created_at,last_used_at,revoked_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getActivity() {
  const sb = await createClient();
  const { data } = await sb
    .from("activity")
    .select("id,action,target,meta,created_at, actor:profiles(full_name,initials), project:projects(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}
