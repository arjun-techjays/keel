import { AppSidebar } from "@/components/keel/app-sidebar";
import { createClient } from "@/lib/supabase/server";

function deriveInitials(name: string, email: string): string {
  const base = name && name !== email ? name : email.split("@")[0] || "?";
  const parts = base.replace(/[._-]/g, " ").trim().split(/\s+/);
  const initials = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return initials.toUpperCase() || "?";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = user?.email ?? "—";
  let email = user?.email ?? "";
  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name,email,role")
      .eq("id", user.id)
      .maybeSingle();
    if (data?.full_name) name = data.full_name;
    if (data?.email) email = data.email;
    isAdmin = data?.role === "admin";
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar user={{ name, email, initials: deriveInitials(name, email) }} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  );
}
