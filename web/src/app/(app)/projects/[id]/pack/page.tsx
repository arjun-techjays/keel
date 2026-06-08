import Link from "next/link";
import { TriangleAlert, FileText, Check } from "lucide-react";
import { getProject, getLatestRender } from "@/lib/queries";
import { ProjectHeader } from "@/components/keel/project-header";
import { PrintButton } from "@/components/keel/print-button";

// The six-document pack is fixed by the constitution (Part F). These are the
// document identities only — the rendered content lives in the pushed snapshot
// (deliverables/), it is not streamed into the dashboard.
const PACK = [
  { n: 1, code: "F1", title: "Executive Summary", file: "1-executive-summary.md" },
  { n: 2, code: "F2", title: "Scope", file: "2-scope.md" },
  { n: 3, code: "F3", title: "Technical Architecture", file: "3-technical-architecture.md" },
  { n: 4, code: "F4", title: "RAID Register", file: "4-raid.md" },
  { n: 5, code: "F5", title: "Implementation Plan", file: "5-implementation-plan.md" },
  { n: 6, code: "F6", title: "Approval & Sign-off", file: "6-approval-and-signoff.md" },
];

export default async function PackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { id } = await params;
  const { doc: docParam } = await searchParams;
  const [p, render] = await Promise.all([getProject(id), getLatestRender(id)]);
  if (!p) return <div className="p-8 text-muted-ink">Project not found.</div>;

  // No pack until /keel-generate has been pushed (recorded as a render row).
  if (!render) {
    return (
      <div className="flex min-h-full flex-col">
        <ProjectHeader id={id} name={p.name} version="const. v4.2" active="pack" />
        <div className="px-8 py-16 text-center text-muted-ink">
          No pack generated yet — run <span className="font-mono">/keel-generate</span> and push to populate the deliverable pack.
        </div>
      </div>
    );
  }

  const selected = PACK.find((d) => d.code === docParam) ?? PACK[0];
  const isDraft = p.freeze_status !== "frozen";
  const gateOk = (render.gate_result as { ok?: boolean } | null)?.ok === true;

  return (
    <div className="flex min-h-full flex-col">
      <ProjectHeader
        id={id} name={p.name} version="const. v4.2" active="pack"
        action={<PrintButton />}
      />

      <div className="flex flex-1 items-stretch gap-6 px-8 py-6">
        <div data-print-hide className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-hairline bg-white">
          <div className="border-b border-hairline px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Deliverable pack · v{render.version}</span>
          </div>
          {PACK.map((d) => {
            const isSel = d.code === selected.code;
            return (
              <Link
                key={d.code}
                href={`/projects/${id}/pack?doc=${d.code}`}
                scroll={false}
                className={`flex items-center gap-2.5 border-l-2 px-4 py-2.5 ${isSel ? "border-cobalt bg-cobalt-tint/60" : "border-transparent hover:bg-panel"}`}
                style={{ borderBottom: "1px solid var(--hairline-soft)" }}
              >
                <span className="font-mono text-[11px] font-semibold text-faint">{d.n}</span>
                <span className={`flex-1 text-[13px] font-semibold ${isSel ? "text-cobalt" : "text-ink"}`}>{d.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col rounded-[14px] border border-hairline bg-white">
          {isDraft ? (
            <div className="flex items-center gap-2.5 rounded-t-[14px] border-b px-7 py-3" style={{ backgroundColor: "var(--partial-tint)", borderBottomColor: "#efd9a8" }}>
              <TriangleAlert className="h-4 w-4 shrink-0" style={{ color: "var(--partial)" }} strokeWidth={2.25} />
              <span className="text-[13px] font-semibold" style={{ color: "#7a5310" }}>DRAFT — not signable.</span>
              <span className="text-[13px]" style={{ color: "#a07a2e" }}>
                {p.block_count} blocker(s) open · this render regenerates on next push — don&apos;t edit here.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-t-[14px] border-b px-7 py-3" style={{ backgroundColor: "var(--covered-tint)", borderBottomColor: "#bfe0c8" }}>
              <Check className="h-4 w-4 shrink-0 text-covered" strokeWidth={2.5} />
              <span className="text-[13px] font-semibold text-covered">FROZEN — signed and locked.</span>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-10 py-10">
            <div className="flex flex-col gap-2 border-b border-hairline pb-6">
              <span className="font-mono text-xs text-faint">{selected.code} · Document {selected.n} of 6</span>
              <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-ink">{selected.title}</h1>
              <span className="text-[13px] text-muted-ink">{p.name} · generated against const. v4.2</span>
            </div>

            <div className="flex items-center gap-2.5 rounded-[10px] border border-hairline bg-panel px-4 py-3">
              <span className={`h-2 w-2 rounded-full ${gateOk ? "bg-covered" : "bg-gap"}`} />
              <span className="text-[13px] font-semibold text-ink">
                Generate gate {gateOk ? "passed" : "red"}
              </span>
              <span className="text-[13px] text-muted-ink">· pack render v{render.version}</span>
            </div>

            <div className="flex flex-col gap-3 rounded-[10px] border border-dashed border-hairline px-5 py-5">
              <div className="flex items-center gap-2 text-muted-ink">
                <FileText className="h-4 w-4" strokeWidth={2} />
                <span className="text-[13px] font-semibold text-ink">Full content lives in the snapshot</span>
              </div>
              <p className="text-[13px] leading-[21px] text-muted-ink">
                The rendered document <span className="font-mono text-xs">deliverables/{selected.file}</span> is part of the
                pushed snapshot, not mirrored into the dashboard. Run <span className="font-mono text-xs">/keel-pull</span> to
                lay the latest pack into your working folder and read or print it there. The dashboard tracks the pack&apos;s
                gate state and freeze status; the prose is the agent&apos;s derived output and is regenerated on every push.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
