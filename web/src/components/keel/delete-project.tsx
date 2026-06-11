"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { deleteProject } from "@/app/(app)/projects/[id]/actions";

// Type-to-confirm hard delete. Rendered only for the project owner or an
// admin (the server action re-verifies both the role and the typed name).
export function DeleteProject({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pending && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

  const matches = typed.trim() === projectName;

  const onDelete = async () => {
    if (!matches || pending) return;
    setPending(true);
    setError(null);
    const r = await deleteProject(projectId, typed.trim());
    if (r.ok) {
      router.replace("/projects");
      return;
    }
    setPending(false);
    const detail = r.body?.detail;
    setError(
      typeof detail === "string"
        ? detail
        : (detail as { error?: string } | undefined)?.error ?? "Deletion failed — try again.",
    );
  };

  return (
    <>
      {/* Deliberately quiet — visible only to the owner/admin, faint until
          hovered. Deletion is a rare act; it shouldn't advertise itself. */}
      <div className="flex justify-end pt-1">
        <button
          onClick={() => { setTyped(""); setError(null); setOpen(true); }}
          className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-medium text-faint transition-colors hover:text-gap"
        >
          <Trash2 className="h-3 w-3" strokeWidth={2} />
          Delete project…
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(20,22,26,0.4)" }}>
          <div className="w-full max-w-[460px] rounded-[16px] border border-hairline bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">Delete project</h2>
                <p className="text-[13px] leading-[19px] text-muted-ink">
                  This permanently deletes <span className="font-semibold text-ink">{projectName}</span> — coverage,
                  questions, decision history, snapshots, and rendered packs — for every member. There is no undo.
                </p>
              </div>
              <button onClick={() => !pending && setOpen(false)} className="rounded-md p-1 text-faint hover:bg-panel">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col gap-4 pt-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-ink">
                  Type <span className="font-mono font-semibold">{projectName}</span> to confirm
                </span>
                <input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onDelete()}
                  placeholder={projectName}
                  className="rounded-[9px] border border-hairline px-3 py-2.5 font-mono text-[14px] text-ink outline-none focus:border-gap"
                />
              </label>

              {error && <p className="text-[13px] font-medium text-gap">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-[9px] border border-hairline bg-white px-4 py-2.5 text-[13px] font-semibold text-muted-ink hover:bg-panel disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={!matches || pending}
                  className="rounded-[9px] bg-gap px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "Deleting…" : "Delete project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
