import { RotateCw, ArrowRight, ShieldAlert, Check } from "lucide-react";
import { getProject, getLatestReview } from "@/lib/queries";
import { ProjectHeader } from "@/components/keel/project-header";

const SEV: Record<string, { label: string; cls: string }> = {
  high: { label: "High", cls: "text-gap bg-gap-tint" },
  med: { label: "Med", cls: "text-partial bg-partial-tint" },
  low: { label: "Low", cls: "text-muted-ink bg-hairline-soft" },
};

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, review] = await Promise.all([getProject(id), getLatestReview(id)]);
  if (!p) return <div className="p-8 text-muted-ink">Project not found.</div>;

  if (!review) {
    return (
      <div className="flex min-h-full flex-col">
        <ProjectHeader id={id} name={p.name} version="const. v4.2" active="review" />
        <div className="px-8 py-16 text-center text-muted-ink">
          No review run yet — run <span className="font-mono">/keel-review</span> and push to populate.
        </div>
      </div>
    );
  }

  const { run, findings } = review;
  const unprobed = Math.max(0, run.total_sections - run.probed);
  const verdictColor = run.verdict.toUpperCase().includes("BLOCK") ? "var(--gap)" : "var(--covered)";

  const gate = [
    { ok: run.high === 0, label: "Zero High findings", detail: `${run.high} open` },
    { ok: unprobed === 0, label: "Every section probed", detail: `${unprobed} un-probed` },
    { ok: true, label: "All Recommended decided", detail: "complete" },
    { ok: p.freeze_status === "frozen", label: "Client sign-off", detail: p.freeze_status === "frozen" ? "signed" : "pending" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <ProjectHeader
        id={id} name={p.name} version="const. v4.2" active="review"
        action={
          <button className="flex items-center gap-2 rounded-[9px] border border-hairline bg-white px-3.5 py-2.5 text-[13px] font-semibold text-muted-ink">
            <RotateCw className="h-[15px] w-[15px]" strokeWidth={2} /> Re-run review
          </button>
        }
      />

      <div className="px-8 pt-6">
        <div className="flex items-center justify-between rounded-[14px] border px-6 py-5" style={{ backgroundColor: "var(--gap-tint)", borderColor: "#e6b0b0" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
              <ShieldAlert className="h-5 w-5" style={{ color: verdictColor }} strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-display text-[22px] font-semibold tracking-[-0.01em]" style={{ color: verdictColor }}>{run.verdict}</span>
              <span className="text-[13px] text-muted-ink">{run.high} High open{unprobed > 0 ? ` + ${unprobed} section un-probed` : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-7 pr-1">
            <Count n={run.high} label="High" color="var(--gap)" />
            <Count n={run.med} label="Med" color="var(--partial)" />
            <Count n={run.low} label="Low" color="var(--muted-ink)" />
            <div className="h-10 w-px bg-[#e6b0b0]" />
            <div className="flex flex-col items-end gap-0.5">
              <span className="tnum font-mono text-[22px] font-semibold text-ink">{run.probed}/{run.total_sections}</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint">Sections probed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-stretch gap-6 px-8 py-6">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Scope risk findings</h2>
            <span className="text-xs text-faint">red-teamed · sorted by severity</span>
          </div>
          {findings.map((f) => (
            <div key={f.id} className="flex flex-col gap-2.5 rounded-[12px] border border-hairline bg-white px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${SEV[f.severity]?.cls ?? ""}`}>{SEV[f.severity]?.label ?? f.severity}</span>
                <span className="font-mono text-[11px] text-faint">{f.finding_id}</span>
                <div className="flex-1" />
                {f.status === "open" ? (
                  <span className="text-[11px] font-semibold text-gap">Un-probed → feeds register</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-covered"><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Probed</span>
                )}
              </div>
              <h3 className="text-[15px] font-semibold leading-snug text-ink">{f.title}</h3>
              {f.detail && <p className="text-[13px] leading-[20px] text-muted-ink">{f.detail}</p>}
              <div className="flex items-center gap-2">
                {(f.refs ?? []).map((r: string) => (
                  <span key={r} className="rounded border border-hairline bg-panel px-1.5 py-0.5 font-mono text-[10px] text-muted-ink">{r}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex w-[320px] shrink-0 flex-col gap-6">
          <div className="flex flex-col rounded-[14px] border border-hairline bg-white">
            <div className="border-b border-hairline px-5 py-3.5">
              <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Freeze gate</h2>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
              {gate.map((g) => (
                <div key={g.label} className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: g.ok ? "var(--covered)" : "var(--gap-tint)" }}>
                    {g.ok ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-gap" />}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-ink">{g.label}</span>
                  <span className={`text-xs ${g.ok ? "text-covered" : "text-muted-ink"}`}>{g.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {unprobed > 0 && (
            <div className="flex flex-col rounded-[14px] border border-hairline bg-white">
              <div className="border-b border-hairline px-5 py-3.5">
                <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Un-probed sections</h2>
              </div>
              <div className="flex flex-col gap-2 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gap" />
                  <span className="text-xs text-muted-ink">{unprobed} section(s) not referenced by the review</span>
                </div>
                <button className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-cobalt">
                  Probe now <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Count({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="tnum font-mono text-[22px] font-semibold" style={{ color }}>{n}</span>
      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint">{label}</span>
    </div>
  );
}
