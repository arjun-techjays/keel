"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Upload, Unlock, Loader2 } from "lucide-react";
import { AvatarChip } from "./avatar-chip";
import {
  pullProject,
  releaseProject,
  pushProject,
  heartbeatProject,
} from "@/app/(app)/projects/[id]/actions";

type Lock = {
  status: string;
  holder_id: string | null;
  phase: string | null;
  holder: { full_name: string | null; initials: string | null } | null;
} | null;

export function CheckoutBar({
  projectId,
  lock,
  currentUserId,
}: {
  projectId: string;
  lock: Lock;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<"generate" | "review">("generate");
  const fileRef = useRef<HTMLInputElement>(null);

  const held = lock?.status === "held";
  const heldByMe = held && lock?.holder_id === currentUserId;
  const heldByOther = held && lock?.holder_id !== currentUserId;

  useEffect(() => {
    if (!heldByMe) return;
    const t = setInterval(() => heartbeatProject(projectId), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [heldByMe, projectId]);

  function doPull() {
    start(async () => {
      const r = await pullProject(projectId);
      if (r.ok) setSnapshotUrl((r.body?.snapshot_url as string) ?? null);
      const detail = r.body?.detail as { reason?: string } | string | undefined;
      setMsg(
        r.ok
          ? { text: "Locked — you're working on this project.", ok: true }
          : {
              text:
                typeof detail === "object" && detail?.reason === "locked"
                  ? "Locked by someone else."
                  : `Pull failed: ${typeof detail === "string" ? detail : r.status}`,
              ok: false,
            },
      );
      router.refresh();
    });
  }

  function doRelease() {
    start(async () => {
      await releaseProject(projectId);
      setMsg({ text: "Released.", ok: true });
      router.refresh();
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("phase", phase);
    start(async () => {
      const r = await pushProject(projectId, fd);
      const gate = r.body?.gate as { ok?: boolean } | undefined;
      setMsg(
        r.ok
          ? { text: `Pushed v${r.body?.version} · ${phase} gate ${gate?.ok ? "green ✓" : "red ✗"}`, ok: !!gate?.ok }
          : { text: `Push failed: ${String(r.body?.detail ?? r.status)}`, ok: false },
      );
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2.5">
        {heldByOther && lock?.holder && (
          <div
            className="flex items-center gap-2 rounded-[9px] border px-3 py-2"
            style={{ backgroundColor: "var(--partial-tint)", borderColor: "#efd9a8" }}
          >
            <AvatarChip initials={lock.holder.initials ?? "?"} color="#c2841a" size={22} />
            <span className="whitespace-nowrap text-xs font-semibold" style={{ color: "#7a5310" }}>
              {lock.holder.full_name} is working
            </span>
          </div>
        )}

        {!held && (
          <button
            onClick={doPull}
            disabled={pending}
            className="flex shrink-0 items-center gap-2 rounded-[9px] bg-cobalt px-4 py-[11px] text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <ArrowDownToLine className="h-[15px] w-[15px]" strokeWidth={2} />}
            Pull &amp; lock
          </button>
        )}

        {heldByMe && (
          <>
            {snapshotUrl && (
              <a
                href={snapshotUrl}
                className="flex shrink-0 items-center gap-2 rounded-[9px] border border-hairline bg-white px-3.5 py-[11px] text-[13px] font-semibold text-muted-ink hover:bg-panel"
              >
                <ArrowDownToLine className="h-[15px] w-[15px]" strokeWidth={2} />
                Snapshot
              </a>
            )}
            <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-white p-0.5">
              {(["generate", "review"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize ${phase === p ? "bg-cobalt-tint text-cobalt" : "text-muted-ink"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              className="flex shrink-0 items-center gap-2 rounded-[9px] bg-cobalt px-4 py-[11px] text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <Upload className="h-[15px] w-[15px]" strokeWidth={2} />}
              Upload &amp; push
            </button>
            <input ref={fileRef} type="file" accept=".zip" hidden onChange={onFile} />
            <button
              onClick={doRelease}
              disabled={pending}
              className="flex shrink-0 items-center gap-2 rounded-[9px] border border-hairline bg-white px-3.5 py-[11px] text-[13px] font-semibold text-muted-ink hover:bg-panel disabled:opacity-60"
            >
              <Unlock className="h-[15px] w-[15px]" strokeWidth={2} />
              Release
            </button>
          </>
        )}
      </div>

      {msg && (
        <span className={`text-[12px] font-medium ${msg.ok ? "text-covered" : "text-gap"}`}>{msg.text}</span>
      )}
    </div>
  );
}
