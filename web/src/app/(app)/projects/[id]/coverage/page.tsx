import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProject, getDimensions } from "@/lib/queries";
import { disciplineName, DISCIPLINE_ORDER } from "@/lib/disciplines";
import { ProjectHeader } from "@/components/keel/project-header";

type Score = "covered" | "partial" | "gap" | "na";

const SCORE: Record<Score, { label: string; color: string; tint: string; text: string }> = {
  covered: { label: "Covered", color: "var(--covered)", tint: "var(--covered-tint)", text: "text-covered" },
  partial: { label: "Partial", color: "var(--partial)", tint: "var(--partial-tint)", text: "text-partial" },
  gap: { label: "Gap", color: "var(--gap)", tint: "var(--gap-tint)", text: "text-gap" },
  na: { label: "N/A", color: "#9aa1ac", tint: "var(--hairline-soft)", text: "text-faint" },
};

export default async function CoveragePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dim?: string }>;
}) {
  const { id } = await params;
  const { dim: dimParam } = await searchParams;
  const [p, dims] = await Promise.all([getProject(id), getDimensions(id)]);
  if (!p) return <div className="p-8 text-muted-ink">Project not found.</div>;

  const selected =
    dims.find((d) => d.dim_id === dimParam) ??
    dims.find((d) => d.score === "gap") ??
    dims[0];
  const s = selected ? SCORE[selected.score as Score] : SCORE.gap;

  const groups = DISCIPLINE_ORDER.map((dId) => ({
    id: dId,
    name: disciplineName(dId),
    dims: dims.filter((d) => d.discipline_id === dId),
  })).filter((g) => g.dims.length > 0);

  const cov = dims.filter((d) => d.score === "covered").length;
  const par = dims.filter((d) => d.score === "partial").length;
  const gap = dims.filter((d) => d.score === "gap").length;
  const total = dims.length || 1;

  return (
    <div className="flex min-h-full flex-col">
      <ProjectHeader id={id} name={p.name} version="const. v4.2" active="coverage" />

      <div className="px-8 pt-6">
        <div className="flex items-center gap-6 rounded-[14px] border border-hairline bg-white px-6 py-4">
          <div className="flex items-baseline gap-1.5">
            <span className="tnum font-mono text-2xl font-semibold text-ink">{dims.length}</span>
            <span className="text-[13px] font-medium text-muted-ink">dimensions</span>
          </div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-hairline-soft">
            <div className="flex h-full">
              <div style={{ width: `${(cov / total) * 100}%`, backgroundColor: "var(--covered)" }} />
              <div style={{ width: `${(par / total) * 100}%`, backgroundColor: "var(--partial)" }} />
              <div style={{ width: `${(gap / total) * 100}%`, backgroundColor: "var(--gap)" }} />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Tally n={String(cov)} label="Covered" color="var(--covered)" />
            <Tally n={String(par)} label="Partial" color="var(--partial)" />
            <Tally n={String(gap)} label="Gap" color="var(--gap)" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-stretch gap-6 px-8 py-6">
        <div className="flex w-[440px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-hairline bg-white">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="flex items-center gap-2 border-y border-hairline bg-[#f4f6f8] px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-ink">{g.name}</span>
                <span className="font-mono text-[10px] text-faint">{g.id}</span>
                <div className="flex-1" />
                <span className="tnum font-mono text-[11px] text-faint">
                  {g.dims.filter((d) => d.score === "covered").length}/{g.dims.length}
                </span>
              </div>
              {g.dims.map((d) => {
                const ds = SCORE[d.score as Score];
                const isSel = selected && d.id === selected.id;
                return (
                  <Link
                    key={d.id}
                    href={`/projects/${id}/coverage?dim=${d.dim_id}`}
                    scroll={false}
                    className={`flex items-center gap-3 border-l-2 px-4 py-2.5 ${isSel ? "border-cobalt bg-cobalt-tint/60" : "border-transparent hover:bg-panel"}`}
                    style={{ borderBottom: "1px solid var(--hairline-soft)" }}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: ds.color }} />
                    <span className="w-[58px] shrink-0 font-mono text-xs font-semibold text-ink">{d.dim_id}</span>
                    <span className={`flex-1 truncate text-[13px] ${isSel ? "font-semibold text-ink" : "text-muted-ink"}`}>{d.name}</span>
                    <span className={`shrink-0 text-[11px] font-semibold ${ds.text}`}>{ds.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {selected && (
          <div className="flex flex-1 flex-col rounded-[14px] border border-hairline bg-white">
            <div className="flex items-start justify-between border-b border-hairline px-7 py-6">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-sm font-semibold text-ink">{selected.dim_id}</span>
                <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">{selected.name}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${s.text}`} style={{ backgroundColor: s.tint }}>
                {s.label}
              </span>
            </div>
            <div className="flex flex-col gap-5 px-7 py-6">
              <Field label="Discipline">{disciplineName(selected.discipline_id)} · {selected.discipline_id}</Field>
              <Field label="Current state">
                {selected.evidence
                  ? selected.evidence
                  : `Scored ${SCORE[selected.score as Score].label}. ${selected.score === "gap" ? "No artifact provided yet — resolve the linked blocker in Clarify." : "Evidence on file."}`}
              </Field>
              {selected.score === "gap" && (
                <div className="flex items-center justify-between rounded-[10px] border px-4 py-3.5" style={{ backgroundColor: "var(--gap-tint)", borderColor: "#e6b0b0" }}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-ink">Open blocker on this dimension</span>
                    <span className="text-xs text-muted-ink">{selected.dim_id} · resolve in the Clarify tab</span>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-[9px] bg-cobalt px-3.5 py-2 text-[13px] font-semibold text-white">
                    Resolve in Clarify
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tally({ n, label, color }: { n: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="tnum font-mono text-[15px] font-semibold text-ink">{n}</span>
      <span className="text-xs text-muted-ink">{label}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</span>
      <p className="text-[13px] leading-[20px] text-muted-ink">{children}</p>
    </div>
  );
}
