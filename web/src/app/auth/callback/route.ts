import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DOMAIN = "techjays.com";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const email = data.user.email ?? "";
      if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=domain`);
      }
      return NextResponse.redirect(`${origin}/projects`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
