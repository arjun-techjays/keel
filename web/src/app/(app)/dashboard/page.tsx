import { TriangleAlert } from "lucide-react";
import { getProjects, getProjectQuality, getCloseMix, getTeamActivity } from "@/lib/queries";
import { AvatarChip } from "@/components/keel/avatar-chip";

const CLOSE_COLORS: Record<string, string> = {
  answered: "var(--covered)",
  assumption: "var(--partial)",
  deferred: "#9aa1ac",
  excluded: "#cbd0d6",
};
const CLOSE_LABELS: Record<string, string> = {
  answered: "Answered", assumption: "Assumption", deferred: "Deferred / T&M", excluded: "Excluded",
};
const CLOSE_ORDER = ["answered", "assumption", "deferred", "excluded"];

export default async function DashboardPage() {
  const [projects, quality, closeMixRaw, team] = await Promise.all([
    getProjects(), getProjectQuality(), getCloseMix(), getTeamActivity(),
  ]);

  const closeMix = CLOSE_ORDER
    .map((k) => ({ key: k, count: Number(closeMixRaw.find((c) => c.disposition === k)?.count ?? 0) }))
    .filter((c) => c.count > 0);
  const closeTotal = closeMix.reduce((s, c) => s + c.count, 0);
  const answered = closeMix.find((c) => c.key === "answered")?.count ?? 0;
  const dispositioned = closeTotal - answered;

  const totalProjects = projects.length;
  const frozen = projects.filter((p) => p.freeze_status === "frozen").length;
  const openBlockers = projects.reduce((s, p) => s + (p.block_count ?? 0), 0);
  const openQ = projects.reduce((s, p) => s + (p.open_questions ?? 0), 0);

  const kpis = [
    { label: "Answer rate", value: closeTotal ? String(Math.round((answered / closeTotal) * 100)) : "—", unit: closeTotal ? "%" : "" },
    { label: "Closed by disposition", value: closeTotal ? String(Math.round((dispositioned / closeTotal) * 100)) : "—", unit: closeTotal ? "%" : "", flag: closeTotal > 0 && dispositioned / closeTotal > 0.3 },
    { label: "Open blockers", value: String(openBlockers), unit: "" },
    { label: "Freeze-ready", value: String(frozen), unit: `/${totalProjects}` },
    { label: "Open questions", value: String(openQ), unit: "" },
  ];

  const teamRows = team.filter((t) => (t.answered ?? 0) + (t.dispositioned ?? 0) > 0);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-end justify-between px-8 py-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Quality dashboard</h1>
          <p className="text-[13px] text-muted-ink">Are teams answering questions — or just clearing blockers? · all engagements</p>
        </div>
      </div>

      <div className="px-8">
        <div className="flex items-stretch overflow-hidden rounded-[14px] border border-hairline bg-white">
          {kpis.map((k, i) => (
            <div key={k.label} className={`flex flex-1 flex-col gap-2.5 px-5 py-[18px] ${i === kpis.length - 1 ? "" : "border-r border-hairline"}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{k.label}</span>
                {k.flag && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--partial)" }} />}
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="tnum font-mono text-[30px] font-semibold text-ink">{k.value}</span>
                {k.unit && <span className="font-mono text-base font-medium text-faint">{k.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-stretch gap-6 px-8 py-6">
        <div className="flex flex-[1.3] flex-col gap-6">
          <section className="flex flex-col rounded-[14px] border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-[22px] py-[18px]">
              <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">How items get closed</h2>
              <span className="font-mono text-xs text-faint">{closeTotal} closed</span>
            </div>
            <div className="flex flex-col gap-4 px-[22px] py-5">
              {closeTotal === 0 ? (
                <p className="text-[13px] text-faint">No items closed yet.</p>
              ) : (
                <>
                  <div className="flex h-3 overflow-hidden rounded-full bg-hairline-soft">
                    {closeMix.map((c) => (
                      <div key={c.key} style={{ width: `${(c.count / closeTotal) * 100}%`, backgroundColor: CLOSE_COLORS[c.key] }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-7 gap-y-2">
                    {closeMix.map((c) => (
                      <div key={c.key} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CLOSE_COLORS[c.key] }} />
                        <span className="text-[13px] font-medium text-ink">{CLOSE_LABELS[c.key]}</span>
                        <span className="tnum font-mono text-xs text-faint">{c.count} · {Math.round((c.count / closeTotal) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="flex flex-col rounded-[14px] border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-[22px] py-[18px]">
              <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Answer quality by project</h2>
              <span className="text-xs text-faint">answered vs. dispositioned</span>
            </div>
            <div className="flex flex-col">
              {quality.map((p, i) => {
                const a = Number(p.answered ?? 0), d = Number(p.dispositioned ?? 0);
                const closed = a + d;
                const aPct = closed ? Math.round((a / closed) * 100) : 0;
                const flag = closed > 0 && a / closed < 0.5;
                return (
                  <div key={p.project_id} className="flex items-center gap-4 px-[22px] py-3.5" style={{ borderBottom: i < quality.length - 1 ? "1px solid var(--hairline-soft)" : undefined }}>
                    <div className="flex w-[160px] shrink-0 items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink">{p.name}</span>
                      {flag && <TriangleAlert className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--partial)" }} strokeWidth={2.25} />}
                    </div>
                    <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-hairline-soft">
                      {closed > 0 && (
                        <>
                          <div style={{ width: `${aPct}%`, backgroundColor: "var(--covered)" }} />
                          <div style={{ width: `${100 - aPct}%`, backgroundColor: "var(--partial)" }} />
                        </>
                      )}
                    </div>
                    <span className="tnum w-[120px] shrink-0 text-right font-mono text-xs text-muted-ink">
                      {closed ? `${aPct}% answered` : "no closures"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="flex flex-1 flex-col rounded-[14px] border border-hairline bg-white">
          <div className="flex items-center justify-between border-b border-hairline px-[22px] py-[18px]">
            <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Team activity</h2>
          </div>
          {teamRows.length === 0 ? (
            <p className="px-[22px] py-6 text-[13px] text-faint">No activity recorded yet — it populates as people answer and disposition.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-hairline bg-panel px-[22px] py-2.5">
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Member</span>
                <span className="w-14 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Ans</span>
                <span className="w-14 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Disp</span>
              </div>
              {teamRows.map((m, i) => {
                const flag = (m.dispositioned ?? 0) > (m.answered ?? 0);
                return (
                  <div key={m.actor_id} className="flex items-center gap-3 px-[22px] py-3" style={{ borderBottom: i < teamRows.length - 1 ? "1px solid var(--hairline-soft)" : undefined }}>
                    <div className="flex flex-1 items-center gap-2.5">
                      <AvatarChip initials={m.initials ?? "?"} color="var(--ink)" size={26} />
                      <span className="text-[13px] font-medium text-ink">{m.full_name}</span>
                      {flag && <TriangleAlert className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--partial)" }} strokeWidth={2.25} />}
                    </div>
                    <span className="tnum w-14 text-right font-mono text-[13px] font-medium text-ink">{m.answered}</span>
                    <span className={`tnum w-14 text-right font-mono text-[13px] font-medium ${flag ? "text-partial" : "text-muted-ink"}`}>{m.dispositioned}</span>
                  </div>
                );
              })}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
