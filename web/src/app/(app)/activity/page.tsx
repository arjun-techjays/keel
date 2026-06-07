import { redirect } from "next/navigation";
import { getActivity, getMyRole } from "@/lib/queries";
import { AvatarChip } from "@/components/keel/avatar-chip";

const ACTION_LABEL: Record<string, string> = {
  pull: "pulled & locked",
  push: "pushed to",
  release: "released",
  answer: "answered a question in",
  assumption: "marked an assumption in",
  exclusion: "excluded an item in",
  defer: "deferred an item in",
};

function rel(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Row = {
  id: string;
  action: string;
  target: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor: { full_name: string | null; initials: string | null } | null;
  project: { name: string | null } | null;
};

export default async function ActivityPage() {
  if ((await getMyRole()) !== "admin") redirect("/projects");
  const rows = (await getActivity()) as unknown as Row[];

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-end justify-between border-b border-hairline px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Activity</h1>
          <p className="text-[13px] text-muted-ink">Who did what, across every engagement.</p>
        </div>
      </div>

      <div className="px-8 py-7">
        {rows.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-hairline bg-white px-8 py-16 text-center text-[13px] text-muted-ink">
            No activity yet — it records as people pull, answer, and push.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-hairline bg-white">
            {rows.map((r, i) => {
              const phase = r.meta?.phase as string | undefined;
              const version = r.meta?.version as number | undefined;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--hairline-soft)" : undefined }}
                >
                  <AvatarChip initials={r.actor?.initials ?? "?"} color="var(--ink)" size={28} />
                  <div className="flex flex-1 flex-wrap items-center gap-x-1.5 text-[13px]">
                    <span className="font-semibold text-ink">{r.actor?.full_name ?? "Someone"}</span>
                    <span className="text-muted-ink">{ACTION_LABEL[r.action] ?? r.action}</span>
                    {r.project?.name && <span className="font-semibold text-ink">{r.project.name}</span>}
                    {r.target && <span className="font-mono text-[12px] text-muted-ink">{r.target}</span>}
                    {(version || phase) && (
                      <span className="font-mono text-[11px] text-faint">
                        {version ? `v${version}` : ""}{phase ? ` · ${phase}` : ""}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-faint">{rel(r.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
