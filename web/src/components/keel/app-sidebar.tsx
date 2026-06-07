"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  ScrollText,
  Activity,
  BookOpen,
  LogOut,
} from "lucide-react";
import { Wordmark } from "./wordmark";
import { AvatarChip } from "./avatar-chip";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/projects", label: "Projects", icon: FolderKanban, adminOnly: false },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/constitution", label: "Constitution", icon: ScrollText, adminOnly: false },
  { href: "/activity", label: "Activity", icon: Activity, adminOnly: false },
  { href: "/guide", label: "Guide", icon: BookOpen, adminOnly: false },
];

export function AppSidebar({
  user,
  isAdmin,
}: {
  user: { name: string; email: string; initials: string };
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = NAV.filter((item) => !item.adminOnly || isAdmin);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-hairline bg-white px-5 py-7">
      <Link href="/projects" className="px-2 pt-1">
        <Wordmark />
      </Link>

      <nav className="flex flex-col gap-0.5 pt-9">
        <span className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
          Workspace
        </span>
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-[11px] rounded-lg px-2 py-[9px]",
                active ? "bg-cobalt-tint" : "hover:bg-panel",
              )}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                <Icon className={cn("h-[17px] w-[17px]", active ? "text-cobalt" : "text-muted-ink")} strokeWidth={2} />
              </span>
              <span className={cn("text-sm", active ? "font-semibold text-cobalt" : "font-medium text-ink")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 rounded-[10px] border border-hairline p-2.5">
        <AvatarChip initials={user.initials} color="var(--ink)" size={30} />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-[13px] font-semibold text-ink">{user.name}</span>
          <span className="truncate text-[11px] text-faint">{user.email}</span>
        </div>
        <button onClick={signOut} title="Sign out" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-panel">
          <LogOut className="h-[15px] w-[15px] text-faint" strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
