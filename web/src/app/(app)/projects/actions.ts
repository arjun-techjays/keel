"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProject(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = (formData.get("name") as string)?.trim();
  const client = (formData.get("client") as string)?.trim() || null;
  if (!name) return { error: "Project name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: con } = await supabase
    .from("constitutions")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      client,
      created_by: user.id,
      constitution_id: con?.id ?? null,
      freeze_status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}
