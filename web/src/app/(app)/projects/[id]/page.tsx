import {
  getProject, getDimensions, getQuestions, getLatestReview, getLock, getSessionUserId, getMyRole,
  getProjectMembers, getAllProfiles, getTokens,
} from "@/lib/queries";
import { CheckoutBar } from "@/components/keel/checkout-bar";
import { ProjectMembers } from "@/components/keel/project-members";
import { ConnectAgent } from "@/components/keel/connect-agent";
import { ProjectHeader } from "@/components/keel/project-header";
import { disciplineName, DISCIPLINE_ORDER } from "@/lib/disciplines";
import { StatSurface } from "@/components/keel/stat-surface";
import { PhasePipeline } from "@/components/keel/phase-pipeline";
import { CoverageBar } from "@/components/keel/coverage-bar";
import { DispositionPill } from "@/components/keel/disposition-pill";
import type { Phase } from "@/lib/mock";

const tagStyle: Record<string, string> = {
  BLOCK: "text-gap bg-gap-tint",
  PARTIAL: "text-partial bg-partial-tint",
};

const freezeLabel: Record<string, { label: string; color: string }> = {
  draft: { label: "DRAFT", color: "var(--partial)" },
  frozen: { label: "FROZEN", color: "var(--covered)" },
  frozen_blocked: { label: "BLOCKED", color: "var(--gap)" },
};

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, dims, questions, review, lock, userId, role, members, profiles, tokens] = await Promise.all([
    getProject(id),
    getDimensions(id),
    getQuestions(id),
    getLatestReview(id),
    getLock(id),
    getSessionUserId(),
    getMyRole(),
    getProjectMembers(id),
    getAllProfiles(),
    getTokens(),
  ]);

  if (!p) {
    return <div className="p-8 text-muted-ink">Project not found.</div>;
  }

  const isEditor =
    role === "admin" || p.created_by === userId || members.some((m) => m.user_id === userId);
  const canManage = role === "admin" || p.created_by === userId;
  const candidates = profiles.filter((pr) => !members.some((m) => m.user_id === pr.id));
  // Trailing slash required — server serves at "/mcp/"; "/mcp" 307-redirects and
  // the streamable client won't re-POST a body across it (large pushes hang).
  const mcpUrl = `${process.env.KEEL_SERVICE_URL ?? ""}/mcp/`;
  const activeTokenCount = tokens.filter((t) => !t.revoked_at).length;

  // Coverage by discipline, computed from the dimensions table.
  const byDisc = DISCIPLINE_ORDER.map((dId) => {
    const ds = dims.filter((d) => d.discipline_id === dId);
    if (ds.length === 0) return null;
    return {
      id: dId,
      name: disciplineName(dId),
      total: ds.length,
      covered: ds.filter((d) => d.score === "covered").length,
      partial: ds.filter((d) => d.score === "partial").length,
      gap: ds.filter((d) => d.score === "gap").length,
    };
  }).filter(Boolean) as {
    id: string; name: string; total: number; covered: number; partial: number; gap: number;
  }[];

  const totCovered = dims.filter((d) => d.score === "covered").length;
  const totPartial = dims.filter((d) => d.score === "partial").length;
  const totGap = dims.filter((d) => d.score === "gap").length;
  const needAttention = totPartial + totGap;

  const openQ = questions.filter((q) => ["unanswered", "partial"].includes(q.disposition)).length;
  const fl = freezeLabel[p.freeze_status] ?? freezeLabel.draft;

  // Phase states derived from real signals: a dimension means it's been mapped,
  // open questions mean clarify is in progress, a review run means review ran.
  const hasMapped = dims.length > 0 || p.total_dims > 0;
  const hasReview = !!review;
  const block = p.block_count;

  const phases: Phase[] = [
    {
      key: "map", name: "Map",
      state: hasMapped ? "done" : "active",
      meta: hasMapped ? `Scored · ${p.total_dims || dims.length} dims` : "Run keel-map",
    },
    {
      key: "clarify", name: "Clarify",
      state: !hasMapped ? "pending" : openQ > 0 ? "active" : "done",
      meta: !hasMapped ? "Not started" : openQ > 0 ? `${openQ} open` : "Done",
    },
    {
      key: "generate", name: "Generate",
      state: block > 0 ? "blocked" : hasReview ? "done" : hasMapped && openQ === 0 ? "active" : "pending",
      meta: block > 0 ? "Blocked · [BLOCK]>0" : hasReview ? "Generated" : hasMapped && openQ === 0 ? "Ready" : "Not started",
    },
    {
      key: "review", name: "Review",
      state: hasReview ? "done" : "pending",
      meta: hasReview ? review.run.verdict : "Not started",
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <ProjectHeader
        id={id}
        name={p.name}
        version="const. v4.2"
        active="overview"
        action={
          <div className="flex items-center gap-2.5">
            <ProjectMembers
              projectId={id}
              members={members}
              candidates={candidates}
              canAdd={isEditor}
              canManage={canManage}
            />
            {isEditor ? (
              <ConnectAgent mcpUrl={mcpUrl} existingTokenCount={activeTokenCount} />
            ) : (
              <span className="rounded-[9px] border border-hairline bg-panel px-3 py-2 text-xs font-medium text-muted-ink">
                View only
              </span>
            )}
            <CheckoutBar projectId={id} lock={lock} currentUserId={userId} isAdmin={role === "admin"} />
          </div>
        }
      />

      <div className="flex flex-col gap-[26px] px-8 py-7">
        {/* Status row */}
        <div className="flex items-stretch overflow-hidden rounded-[14px] border border-hairline bg-white">
          <StatSurface label="Freeze status" sub={p.block_count > 0 ? `Not signable — ${p.block_count} blockers open` : "Gate clear"}>
            <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: fl.color }} />
            <span className="font-display text-[30px] font-semibold tracking-[-0.01em] text-ink">{fl.label}</span>
          </StatSurface>
          <StatSurface label="[BLOCK] count" sub={p.block_count > 0 ? "Generate gate blocked" : "Generate gate clear"}>
            <span className={`tnum font-mono text-[34px] font-semibold ${p.block_count > 0 ? "text-gap" : "text-ink"}`}>{p.block_count}</span>
          </StatSurface>
          {/* Headline = Resolved % (covered + dispositioned, constitution Part B);
              Covered % stays visible as the evidence-only statistic. */}
          <StatSurface
            label="Progress"
            sub={`${p.resolved_count ?? p.covered_count} of ${p.total_dims} resolved · ${p.coverage_pct}% covered (evidenced)`}
          >
            <span className="tnum font-mono text-[34px] font-semibold text-ink">{p.resolved_pct ?? p.coverage_pct}</span>
            <span className="font-mono text-[18px] font-medium text-faint">%</span>
          </StatSurface>
          <StatSurface label="Open questions" sub={`Across ${byDisc.length} disciplines`} last>
            <span className="tnum font-mono text-[34px] font-semibold text-ink">{openQ}</span>
          </StatSurface>
        </div>

        <PhasePipeline phases={phases} />

        <div className="flex items-stretch gap-6">
          {/* Coverage */}
          <div className="flex flex-[1.25] flex-col rounded-[14px] border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-[22px] py-[18px]">
              <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Coverage by discipline</h2>
              <div className="flex items-center gap-3.5">
                <Legend color="var(--covered)" label="Covered" />
                <Legend color="var(--partial)" label="Partial" />
                <Legend color="var(--gap)" label="Gap" />
              </div>
            </div>
            <div className="flex flex-col gap-[19px] px-[22px] py-5">
              {byDisc.map((row) => (
                <CoverageBar key={row.id} row={row} />
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center justify-between border-t border-hairline px-[22px] py-4" style={{ backgroundColor: "#fafbfc" }}>
              <div className="flex flex-col gap-[3px]">
                <span className="whitespace-nowrap text-[13px] font-semibold text-ink">{needAttention} dimensions need attention</span>
                <span className="whitespace-nowrap text-xs text-muted-ink">{totGap} gaps + {totPartial} partials before freeze</span>
              </div>
              <div className="flex items-center gap-[18px]">
                <Tally value={String(totCovered)} label="Covered" color="var(--covered)" />
                <Tally value={String(totPartial)} label="Partial" color="var(--partial)" />
                <Tally value={String(totGap)} label="Gap" color="var(--gap)" />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="flex flex-1 flex-col rounded-[14px] border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-[22px] py-[18px]">
              <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Open questions</h2>
              <span className="rounded-full border border-hairline bg-panel px-2.5 py-[3px] font-mono text-xs font-medium text-muted-ink">{openQ} open</span>
            </div>
            <div className="flex flex-col">
              {questions
                .filter((q) => ["unanswered", "partial"].includes(q.disposition))
                .slice(0, 4)
                .map((q, i, arr) => (
                  <div key={q.id} className="flex flex-col gap-[9px] px-[22px] py-4" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--hairline-soft)" : undefined }}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-ink">{q.q_id}</span>
                      {q.tag && (
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${tagStyle[q.tag]}`}>
                          {q.tag === "BLOCK" ? "[BLOCK]" : q.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] leading-[19px]" style={{ color: "#404652" }}>{q.text}</p>
                    <DispositionPill kind={q.disposition} label={q.disposition_label ?? "Open"} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
      <span className="whitespace-nowrap text-[11px] font-medium text-muted-ink">{label}</span>
    </div>
  );
}

function Tally({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-end gap-px">
      <span className="tnum font-mono text-base font-semibold" style={{ color }}>{value}</span>
      <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.04em] text-faint">{label}</span>
    </div>
  );
}
