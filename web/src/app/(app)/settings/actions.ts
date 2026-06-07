"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createToken(
  _prev: { token?: string; error?: string } | null,
  formData: FormData,
): Promise<{ token?: string; error?: string }> {
  const name = (formData.get("name") as string)?.trim() || "Agent token";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const raw = "keel_pat_" + randomBytes(24).toString("hex");
  const token_hash = createHash("sha256").update(raw).digest("hex");

  const { error } = await supabase
    .from("personal_access_tokens")
    .insert({ user_id: user.id, name, token_hash });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { token: raw };
}

export async function revokeToken(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("personal_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/settings");
}
