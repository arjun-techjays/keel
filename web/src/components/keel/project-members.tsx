"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, X, Plus, Trash2 } from "lucide-react";
import { AvatarChip } from "./avatar-chip";
import { addEditor, removeEditor } from "@/app/(app)/projects/[id]/actions";

type Member = { user_id: string; full_name?: string | null; email?: string | null; initials?: string | null };
type Profile = { id: string; full_name: string | null; email: string | null; initials: string | null };

export function ProjectMembers({
  projectId,
  members,
  candidates,
  canAdd,
  canManage,
}: {
  projectId: string;
  members: Member[];
  candidates: Profile[];
  canAdd: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    if (!sel) return;
    start(async () => {
      const r = await addEditor(projectId, sel);
      setError(r.error ?? null);
      if (!r.error) setSel("");
      router.refresh();
    });
  }
  function remove(uid: string) {
    start(async () => {
      const r = await removeEditor(projectId, uid);
      setError(r.error ?? null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[9px] border border-hairline bg-white px-3 py-2 text-xs font-semibold text-muted-ink hover:bg-panel"
      >
        <Users className="h-[15px] w-[15px]" strokeWidth={2} />
        Members
        <span className="font-mono text-faint">{members.length}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(20,22,26,0.4)" }}>
          <div className="flex w-full max-w-[480px] flex-col gap-5 rounded-[16px] border border-hairline bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">Editors</h2>
                <p className="text-[13px] text-muted-ink">
                  Everyone at techjays can view this project. These people can edit it.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-faint hover:bg-panel">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col rounded-[10px] border border-hairline">
              {members.map((m, i) => (
                <div key={m.user_id} className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderBottom: i < members.length - 1 ? "1px solid var(--hairline-soft)" : undefined }}>
                  <AvatarChip initials={m.initials ?? "?"} color="var(--ink)" size={26} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-semibold text-ink">{m.full_name ?? m.email}</span>
                    <span className="truncate text-[11px] text-faint">{m.email}</span>
                  </div>
                  {canManage && members.length > 1 && (
                    <button onClick={() => remove(m.user_id)} disabled={pending} className="rounded-md p-1.5 text-faint hover:bg-panel hover:text-gap">
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canAdd && (
              <div className="flex items-center gap-2">
                <select
                  value={sel}
                  onChange={(e) => setSel(e.target.value)}
                  className="flex-1 rounded-[9px] border border-hairline px-3 py-2.5 text-[13px] text-ink outline-none focus:border-cobalt"
                >
                  <option value="">Add an editor…</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name ?? c.email} {c.email ? `· ${c.email}` : ""}
                    </option>
                  ))}
                </select>
                <button onClick={add} disabled={!sel || pending} className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-cobalt px-3.5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
                  <Plus className="h-4 w-4" strokeWidth={2.5} /> Add
                </button>
              </div>
            )}
            {error && <p className="text-[12px] font-medium text-gap">{error}</p>}
            {!canManage && (
              <p className="text-[12px] text-faint">Only the project creator or an admin can remove editors.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
