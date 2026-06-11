import Link from "next/link";
import { Search, ChevronRight, FolderKanban } from "lucide-react";
import { getProjects } from "@/lib/queries";
import { FreezeBadge } from "@/components/keel/freeze-badge";
import { AvatarChip } from "@/components/keel/avatar-chip";
import { NewProjectButton } from "@/components/keel/new-project-button";

type LockRow = {
  status: string;
  phase: string | null;
  holder: { full_name: string | null; initials: string | null } | null;
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  const active = projects.filter((p) => p.freeze_status !== "frozen").length;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-end justify-between border-b border-hairline px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">
            Projects
          </h1>
          <p className="text-[13px] text-muted-ink">
            {projects.length} engagements · {active} in discovery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-[9px] border border-hairline bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-faint" strokeWidth={2} />
            <span className="text-[13px] text-faint">Search projects</span>
          </div>
          <NewProjectButton />
        </div>
      </div>

      <div className="px-8 py-7">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-hairline bg-white px-8 py-20 text-center">
            <FolderKanban className="h-8 w-8 text-faint" strokeWidth={1.75} />
            <div className="flex flex-col gap-1">
              <span className="font-display text-[17px] font-semibold text-ink">No projects yet</span>
              <span className="text-[13px] text-muted-ink">Create your first engagement to start discovery.</span>
            </div>
            <div className="pt-2">
              <NewProjectButton />
            </div>
          </div>
        ) : (
        <div className="overflow-hidden rounded-[14px] border border-hairline bg-white">
          <div className="flex items-center gap-4 border-b border-hairline bg-panel px-5 py-3">
            <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Project</span>
            <span className="w-[110px] text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Status</span>
            <span className="w-[170px] text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Progress</span>
            <span className="w-[64px] text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Block</span>
            <span className="w-[64px] text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Open Q</span>
            <span className="w-[190px] text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Activity</span>
            <span className="w-5 shrink-0" />
          </div>

          {projects.map((p, i) => {
            // `locks` is a to-one relation (locks.project_id is its PK), so
            // PostgREST returns it as a single object or null — never an array.
            // Guard both shapes so calling code never does object.find().
            const lockRow = p.locks as unknown as LockRow | LockRow[] | null;
            const lock = Array.isArray(lockRow)
              ? lockRow.find((l) => l.status === "held")
              : lockRow?.status === "held"
                ? lockRow
                : undefined;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-panel"
                style={{ borderBottom: i < projects.length - 1 ? "1px solid var(--hairline-soft)" : undefined }}
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-ink">{p.name}</span>
                  <span className="text-xs text-faint">{p.client}</span>
                </div>

                <div className="w-[110px]">
                  <FreezeBadge status={p.freeze_status} />
                </div>

                {/* Progress = Resolved % (covered + dispositioned, Part B);
                    falls back to coverage_pct for projects not re-pushed yet. */}
                <div className="flex w-[170px] items-center gap-2.5">
                  <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-hairline-soft">
                    <div
                      style={{
                        width: `${p.resolved_pct ?? p.coverage_pct}%`,
                        backgroundColor: (p.resolved_pct ?? p.coverage_pct) === 100 ? "var(--covered)" : "var(--cobalt)",
                      }}
                    />
                  </div>
                  <span className="tnum w-9 text-right font-mono text-xs text-muted-ink">{p.resolved_pct ?? p.coverage_pct}%</span>
                </div>

                <div className="w-[64px] text-right">
                  <span className={`tnum font-mono text-sm font-semibold ${p.block_count > 0 ? "text-gap" : "text-faint"}`}>
                    {p.block_count}
                  </span>
                </div>

                <div className="w-[64px] text-right">
                  <span className="tnum font-mono text-sm font-medium text-muted-ink">{p.open_questions}</span>
                </div>

                <div className="flex w-[190px] items-center gap-2">
                  {lock?.holder ? (
                    <>
                      <AvatarChip initials={lock.holder.initials ?? "?"} color="var(--partial)" size={22} />
                      <div className="flex flex-col gap-px">
                        <span className="whitespace-nowrap text-xs font-medium text-ink">
                          {lock.holder.full_name} working
                        </span>
                        <span className="whitespace-nowrap text-[11px] text-faint">{lock.phase}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-hairline" />
                      <span className="text-xs text-faint">Available</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-faint" strokeWidth={2} />
              </Link>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
