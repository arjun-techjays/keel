"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { createProject } from "@/app/(app)/projects/actions";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createProject, null);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[9px] bg-cobalt px-4 py-2.5 text-[13px] font-semibold text-white"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(20,22,26,0.4)" }}>
          <div className="w-full max-w-[440px] rounded-[16px] border border-hairline bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">New project</h2>
                <p className="text-[13px] text-muted-ink">Pinned to the active constitution. You can run discovery next.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-faint hover:bg-panel">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <form action={formAction} className="flex flex-col gap-4 pt-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-ink">Project name</span>
                <input
                  name="name"
                  autoFocus
                  required
                  placeholder="e.g. Northwind Field CRM"
                  className="rounded-[9px] border border-hairline px-3 py-2.5 text-[14px] text-ink outline-none focus:border-cobalt"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-ink">Client <span className="font-normal text-faint">(optional)</span></span>
                <input
                  name="client"
                  placeholder="e.g. Northwind Traders"
                  className="rounded-[9px] border border-hairline px-3 py-2.5 text-[14px] text-ink outline-none focus:border-cobalt"
                />
              </label>

              {state?.error && <p className="text-[13px] font-medium text-gap">{state.error}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-[9px] border border-hairline bg-white px-4 py-2.5 text-[13px] font-semibold text-muted-ink hover:bg-panel">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="rounded-[9px] bg-cobalt px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
                  {pending ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
