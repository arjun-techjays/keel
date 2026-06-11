import Link from "next/link";
import { Upload, Check } from "lucide-react";
import { getProject, getQuestions } from "@/lib/queries";
import { disciplineName, DISCIPLINE_ORDER } from "@/lib/disciplines";
import { ProjectHeader } from "@/components/keel/project-header";
import { DispositionPill } from "@/components/keel/disposition-pill";
import type { Disposition } from "@/lib/mock";

const tagStyle: Record<string, string> = {
  BLOCK: "text-gap bg-gap-tint",
  PARTIAL: "text-partial bg-partial-tint",
};
const isClosed = (k: string) => ["answered", "assumption", "deferred", "excluded"].includes(k);

type Q = {
  id: string; q_id: string; text: string; tag: string | null;
  disposition: string; disposition_label: string | null; answer_text: string | null;
  dims: string[] | null;
};

// Discipline routing: questions carry their own Q-ids (OQ-01, RV1-02, …), so
// the q_id prefix is only trusted when it IS a constitution discipline;
// otherwise route by the first dimension the question concerns (dims column,
// from the questions ledger).
const prefixOf = (id: string) => (id.startsWith("RAID") ? "RAID" : id.split("-")[0]);
const disciplineOf = (q: Q) => {
  const pre = prefixOf(q.q_id);
  if (DISCIPLINE_ORDER.includes(pre)) return pre;
  const dim = q.dims?.[0];
  return dim ? prefixOf(dim) : pre;
};

export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q: qParam } = await searchParams;
  const [p, questions] = await Promise.all([getProject(id), getQuestions(id)]);
  if (!p) return <div className="p-8 text-muted-ink">Project not found.</div>;

  const all = questions as unknown as Q[];

  // Group by discipline (derived from the constitution ID prefix), constitution order
  // first, then any unknown prefixes alphabetically — so nothing is silently dropped.
  const known = DISCIPLINE_ORDER.filter((d) => all.some((q) => disciplineOf(q) === d));
  const extra = [...new Set(all.map((q) => disciplineOf(q)))]
    .filter((d) => !DISCIPLINE_ORDER.includes(d))
    .sort();
  const groups = [...known, ...extra].map((dId) => ({
    id: dId,
    name: disciplineName(dId),
    questions: all
      .filter((q) => disciplineOf(q) === dId)
      .sort((a, b) => Number(isClosed(a.disposition)) - Number(isClosed(b.disposition)) || a.q_id.localeCompare(b.q_id)),
  }));

  const openCount = all.filter((q) => !isClosed(q.disposition)).length;
  const selected =
    all.find((q) => q.q_id === qParam) ??
    all.find((q) => !isClosed(q.disposition)) ??
    all[0];

  return (
    <div className="flex min-h-full flex-col">
      <ProjectHeader
        id={id} name={p.name} version="const. v4.2" active="questions"
        action={
          <div className="flex items-center gap-2 rounded-[9px] border border-hairline bg-white px-3.5 py-2.5">
            <Upload className="h-[15px] w-[15px] text-muted-ink" strokeWidth={2} />
            <span className="text-[13px] font-semibold text-ink">Upload discovery pack</span>
          </div>
        }
      />

      {all.length === 0 ? (
        <div className="px-8 py-16 text-center text-muted-ink">
          No questions yet — run <span className="font-mono">/keel-map</span> and push to populate the open-questions register.
        </div>
      ) : (
        <div className="flex flex-1 items-stretch gap-6 px-8 py-6">
          <div className="flex w-[470px] shrink-0 flex-col rounded-[14px] border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-[18px] py-[14px]">
              <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Open questions</h2>
              <span className="text-[11px] font-medium text-faint">{openCount} open · grouped by discipline</span>
            </div>
            <div className="flex flex-col">
              {groups.map((g, i) => (
                <DisciplineGroup key={g.id} group={g} projectId={id} selectedQId={selected?.q_id} last={i === groups.length - 1} />
              ))}
            </div>
          </div>

          {selected && (
            <div className="flex flex-1 flex-col rounded-[14px] border border-hairline bg-white">
              <div className="flex items-center justify-between border-b border-hairline px-7 py-3.5">
                <span className="text-[13px] font-medium text-muted-ink">
                  {disciplineName(disciplineOf(selected))} · {disciplineOf(selected)}
                </span>
                <DispositionPill kind={selected.disposition as Disposition} label={selected.disposition_label ?? "Open"} />
              </div>

              <div className="flex flex-col gap-5 px-7 py-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-semibold text-ink">{selected.q_id}</span>
                    {selected.tag && (
                      <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${tagStyle[selected.tag]}`}>
                        {selected.tag === "BLOCK" ? "[BLOCK]" : selected.tag}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-semibold leading-snug tracking-[-0.01em] text-ink">{selected.text}</h2>
                  {selected.dims && selected.dims.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Dimensions</span>
                      {selected.dims.map((d) => (
                        <Link
                          key={d}
                          href={`/projects/${id}/coverage?dim=${d}`}
                          className="rounded bg-panel px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-ink hover:text-ink"
                        >
                          {d}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {selected.answer_text ? (
                  <div className="flex flex-col gap-2 rounded-[10px] border border-hairline bg-panel px-4 py-3.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Recorded answer</span>
                    <p className="text-[13px] leading-[19px] text-muted-ink">{selected.answer_text}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 rounded-[10px] border border-hairline bg-panel px-4 py-3.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Covered means</span>
                    <p className="text-[13px] leading-[19px] text-muted-ink">
                      A specific, testable answer — named values, sources, and constraints. A vague reply leaves
                      the dimension Partial, which blocks like a Gap.
                    </p>
                  </div>
                )}

                <div className="rounded-[10px] border border-dashed border-hairline bg-panel px-4 py-3.5 text-[13px] leading-[19px] text-muted-ink">
                  Answers are recorded by your agent during <span className="font-semibold text-ink">Clarify</span>, or
                  by pushing updated discovery files from the <span className="font-semibold text-ink">Overview</span> tab.
                  See the <span className="font-semibold text-ink">Guide</span> for the full flow.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DisciplineGroup({
  group,
  projectId,
  selectedQId,
  last,
}: {
  group: { id: string; name: string; questions: Q[] };
  projectId: string;
  selectedQId?: string;
  last: boolean;
}) {
  const closed = group.questions.filter((q) => isClosed(q.disposition)).length;
  return (
    <div style={{ borderBottom: last ? undefined : "1px solid var(--hairline)" }}>
      <div className="flex items-center gap-2 bg-panel px-[18px] py-2.5">
        <span className="text-[13px] font-semibold text-ink">{group.name}</span>
        <span className="font-mono text-[11px] text-faint">{group.id}</span>
        <div className="flex-1" />
        <span className="tnum font-mono text-[11px] font-medium text-faint">{closed}/{group.questions.length}</span>
      </div>

      <div className="flex flex-col py-1">
        {group.questions.map((q) => {
          const isSel = q.q_id === selectedQId;
          const done = isClosed(q.disposition);
          return (
            <Link
              key={q.id}
              href={`/projects/${projectId}/questions?q=${q.q_id}`}
              scroll={false}
              className={`flex items-center gap-3 border-l-2 py-2 pl-[18px] pr-4 ${isSel ? "border-cobalt bg-cobalt-tint/40" : "border-transparent hover:bg-panel"}`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {done ? <Check className="h-4 w-4 text-covered" strokeWidth={2.5} /> : <span className="h-[7px] w-[7px] rounded-full border-[1.5px] border-faint" />}
              </span>
              <span className="w-[58px] shrink-0 font-mono text-xs font-semibold text-ink">{q.q_id}</span>
              <span className="flex-1 truncate text-[13px] text-muted-ink">{q.text}</span>
              {q.tag && (
                <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${tagStyle[q.tag]}`}>
                  {q.tag === "BLOCK" ? "[BLOCK]" : q.tag}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
