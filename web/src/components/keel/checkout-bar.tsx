"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Loader2 } from "lucide-react";
import { AvatarChip } from "./avatar-chip";
import { forceReleaseProject } from "@/app/(app)/projects/[id]/actions";

type Lock = {
  status: string;
  holder_id: string | null;
  holder: { full_name: string | null; initials: string | null } | null;
} | null;

export function CheckoutBar({
  projectId,
  lock,
  currentUserId,
  isAdmin,
}: {
  projectId: string;
  lock: Lock;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const held = lock?.status === "held";
  const heldByMe = held && lock?.holder_id === currentUserId;

  function forceRelease() {
    start(async () => {
      await forceReleaseProject(projectId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      {held ? (
        <div
          className="flex items-center gap-2 rounded-[9px] border px-3 py-2"
          style={{ backgroundColor: "var(--partial-tint)", borderColor: "#efd9a8" }}
        >
          <AvatarChip initials={lock?.holder?.initials ?? "?"} color="#c2841a" size={22} />
          <span className="whitespace-nowrap text-xs font-semibold" style={{ color: "#7a5310" }}>
            {heldByMe ? "You hold this lock" : `${lock?.holder?.full_name ?? "Someone"} is working`}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-[9px] border border-hairline bg-white px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-hairline" />
          <span className="whitespace-nowrap text-xs font-medium text-muted-ink">Available</span>
        </div>
      )}

      {/* checkout happens in your agent over MCP */}
      <div className="hidden items-center gap-1.5 text-xs text-faint lg:flex">
        <Lock className="h-3.5 w-3.5" strokeWidth={2} />
        Pull / push from your agent
      </div>

      {isAdmin && held && (
        <button
          onClick={forceRelease}
          disabled={pending}
          className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-hairline bg-white px-3 py-2 text-xs font-semibold text-muted-ink hover:bg-panel disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" strokeWidth={2} />}
          Force release
        </button>
      )}
    </div>
  );
}
