import { TriangleAlert } from "lucide-react";
import { getProject } from "@/lib/queries";
import { packDocs } from "@/lib/mock";
import { ProjectHeader } from "@/components/keel/project-header";
import { PrintButton } from "@/components/keel/print-button";

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProject(id);
  if (!p) return <div className="p-8 text-muted-ink">Project not found.</div>;
  const doc = packDocs[1]; // Scope
  const isDraft = p.freeze_status !== "frozen";

  return (
    <div className="flex min-h-full flex-col">
      <ProjectHeader
        id={id} name={p.name} version="const. v4.2" active="pack"
        action={<PrintButton />}
      />

      <div className="flex flex-1 items-stretch gap-6 px-8 py-6">
        <div data-print-hide className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-hairline bg-white">
          <div className="border-b border-hairline px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Deliverable pack</span>
          </div>
          {packDocs.map((d) => {
            const isSel = d.n === doc.n;
            return (
              <div key={d.code} style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                <div className={`flex items-center gap-2.5 px-4 py-2.5 ${isSel ? "bg-cobalt-tint/40" : "hover:bg-panel"}`}>
                  <span className="font-mono text-[11px] font-semibold text-faint">{d.n}</span>
                  <span className={`flex-1 text-[13px] font-semibold ${isSel ? "text-cobalt" : "text-ink"}`}>{d.title}</span>
                  {d.sections.some((s) => s.blocked) && <span className="h-1.5 w-1.5 rounded-full bg-gap" />}
                </div>
                {isSel && (
                  <div className="flex flex-col pb-1.5">
                    {d.sections.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 py-1.5 pl-[42px] pr-4">
                        <span className="font-mono text-[11px] text-muted-ink">{s.id}</span>
                        <span className="flex-1 truncate text-xs text-muted-ink">{s.title}</span>
                        {s.blocked && <span className="h-1.5 w-1.5 rounded-full bg-gap" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col rounded-[14px] border border-hairline bg-white">
          {isDraft && (
            <div className="flex items-center gap-2.5 rounded-t-[14px] border-b px-7 py-3" style={{ backgroundColor: "var(--partial-tint)", borderBottomColor: "#efd9a8" }}>
              <TriangleAlert className="h-4 w-4 shrink-0" style={{ color: "var(--partial)" }} strokeWidth={2.25} />
              <span className="text-[13px] font-semibold" style={{ color: "#7a5310" }}>DRAFT — not signable.</span>
              <span className="text-[13px]" style={{ color: "#a07a2e" }}>{p.block_count} blocker(s) open · this render regenerates on next push — don&apos;t edit here.</span>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-10 py-10">
            <div className="flex flex-col gap-2 border-b border-hairline pb-6">
              <span className="font-mono text-xs text-faint">{doc.code} · Section 2 of 6</span>
              <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-ink">{doc.title}</h1>
              <span className="text-[13px] text-muted-ink">{p.name} · generated against const. v4.2</span>
            </div>

            <Section id="F2.1" title="In-scope capabilities" dims={["SCO-05", "SCO-01"]}>
              The engagement delivers a field-sales CRM covering account and contact management, visit
              logging with offline capture, opportunity pipeline tracking, and manager dashboards.
            </Section>
            <Section id="F2.2" title="Out-of-scope" dims={["SCO-12"]}>
              Marketing automation, customer-facing portals, and native telephony are explicitly excluded.
              Anything not listed in F2.1 is out of scope and handled by change request.
            </Section>
            <Section id="F2.3" title="Data handling & residency" dims={["DAT-07", "DAT-09"]} blocked>
              <span className="italic text-faint">
                This section cannot be rendered — DAT-07 and DAT-09 are open blockers. Resolve them in
                Clarify and re-push to populate.
              </span>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, dims, blocked, children }: {
  id: string; title: string; dims: string[]; blocked?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-xs font-semibold text-muted-ink">{id}</span>
        <h2 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {blocked && (
          <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gap bg-gap-tint">
            <TriangleAlert className="h-3 w-3" strokeWidth={2.5} /> BLOCKED
          </span>
        )}
      </div>
      <p className={`text-[14px] leading-[23px] ${blocked ? "rounded-[10px] border border-dashed border-hairline px-4 py-3" : "text-ink"}`}>{children}</p>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-faint">Renders from</span>
        {dims.map((d) => (
          <span key={d} className="rounded border border-hairline bg-panel px-1.5 py-0.5 font-mono text-[10px] text-muted-ink">{d}</span>
        ))}
      </div>
    </div>
  );
}
