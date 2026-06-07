import {
  Users, Presentation, FileText, MessagesSquare, Gauge,
  Upload, ChevronDown, Plus, Check,
} from "lucide-react";
import { getProject, getMethods } from "@/lib/queries";
import { ProjectHeader } from "@/components/keel/project-header";
import { AvatarChip } from "@/components/keel/avatar-chip";

const ICONS: Record<string, typeof Users> = {
  interview: Users, workshop: Presentation, document: FileText,
  session: MessagesSquare, estimate: Gauge,
};
const tagStyle: Record<string, string> = {
  BLOCK: "text-gap bg-gap-tint",
  PARTIAL: "text-partial bg-partial-tint",
};
const isClosed = (k: string) => ["answered", "assumption", "deferred", "excluded"].includes(k);

type Q = {
  id: string; q_id: string; text: string; tag: string | null;
  disposition: string; disposition_label: string | null;
};
type Method = {
  id: string; icon: string; name: string; focus: string; gathers: string;
  assignee: { full_name: string; initials: string; color: string } | null;
  questions: Q[];
};

export default async function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, methodsRaw] = await Promise.all([getProject(id), getMethods(id)]);
  if (!p) return <div className="p-8 text-muted-ink">Project not found.</div>;

  const methods = (methodsRaw as unknown as Method[]).map((m) => ({
    ...m,
    questions: [...(m.questions ?? [])].sort((a, b) => a.q_id.localeCompare(b.q_id)),
  }));
  const selMethod = methods.find((m) => m.questions.length > 0) ?? methods[0];
  const selected = selMethod?.questions.find((q) => !isClosed(q.disposition)) ?? selMethod?.questions[0];

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

      <div className="flex flex-1 items-stretch gap-6 px-8 py-6">
        <div className="flex w-[470px] shrink-0 flex-col rounded-[14px] border border-hairline bg-white">
          <div className="flex items-center justify-between border-b border-hairline px-[18px] py-[14px]">
            <h2 className="font-display text-base font-semibold tracking-[-0.01em] text-ink">Research plan</h2>
            <span className="text-[11px] font-medium text-faint">{methods.length} methods · auto-grouped by Keel</span>
          </div>
          <div className="flex flex-col">
            {methods.map((m, i) => (
              <MethodGroup key={m.id} method={m} selectedId={selected?.id} last={i === methods.length - 1} />
            ))}
          </div>
        </div>

        {selected && (
          <div className="flex flex-1 flex-col rounded-[14px] border border-hairline bg-white">
            <div className="flex items-center justify-between border-b border-hairline px-7 py-3.5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-ink" strokeWidth={2} />
                <span className="text-[13px] font-medium text-muted-ink">{selMethod.name} · {selMethod.focus}</span>
              </div>
              {selMethod.assignee ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-faint">assigned to</span>
                  <AvatarChip initials={selMethod.assignee.initials} color={selMethod.assignee.color} size={20} />
                  <span className="text-[13px] font-semibold text-ink">{selMethod.assignee.full_name}</span>
                </div>
              ) : (
                <span className="text-xs text-faint">unassigned</span>
              )}
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
              </div>

              <div className="flex flex-col gap-2 rounded-[10px] border border-hairline bg-panel px-4 py-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Covered means</span>
                <p className="text-[13px] leading-[19px] text-muted-ink">
                  A specific, testable answer — named values, sources, and constraints. A vague reply leaves
                  the dimension Partial, which blocks like a Gap.
                </p>
              </div>

              <div className="rounded-[10px] border border-dashed border-hairline bg-panel px-4 py-3.5 text-[13px] leading-[19px] text-muted-ink">
                Answers are recorded by your agent during <span className="font-semibold text-ink">Clarify</span>, or
                by pushing updated discovery files from the <span className="font-semibold text-ink">Overview</span> tab.
                See the <span className="font-semibold text-ink">Guide</span> for the full flow.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MethodGroup({ method, selectedId, last }: { method: Method; selectedId?: string; last: boolean }) {
  const Icon = ICONS[method.icon] ?? Users;
  const closed = method.questions.filter((q) => isClosed(q.disposition)).length;
  return (
    <div style={{ borderBottom: last ? undefined : "1px solid var(--hairline)" }}>
      <div className="flex items-start gap-3 px-[18px] pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-panel">
          <Icon className="h-[18px] w-[18px] text-ink" strokeWidth={2} />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-ink">{method.name}</span>
            <span className="text-xs text-faint">·</span>
            <span className="text-xs font-medium text-muted-ink">{method.focus}</span>
            <div className="flex-1" />
            <span className="tnum font-mono text-[11px] font-medium text-faint">{closed}/{method.questions.length}</span>
            <ChevronDown className="h-4 w-4 text-faint" strokeWidth={2} />
          </div>
          <span className="text-[11px] text-faint">{method.gathers}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-[18px] py-2.5 pl-[66px]">
        {method.assignee ? (
          <button className="flex items-center gap-1.5 rounded-full border border-hairline bg-white py-1 pl-1 pr-2 hover:bg-panel">
            <AvatarChip initials={method.assignee.initials} color={method.assignee.color} size={20} />
            <span className="text-xs font-semibold text-ink">{method.assignee.full_name}</span>
            <ChevronDown className="h-3 w-3 text-faint" strokeWidth={2} />
          </button>
        ) : (
          <button className="flex items-center gap-1.5 rounded-full border border-dashed border-hairline bg-white px-2.5 py-1.5 text-xs font-semibold text-muted-ink hover:bg-panel">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Assign
          </button>
        )}
        <button className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-cobalt hover:bg-cobalt-tint">
          <Upload className="h-3.5 w-3.5" strokeWidth={2} /> Upload answers
        </button>
      </div>

      <div className="flex flex-col pb-2">
        {method.questions.map((q) => {
          const isSel = q.id === selectedId;
          const done = isClosed(q.disposition);
          return (
            <div key={q.id} className={`flex items-center gap-3 border-l-2 py-2 pl-[18px] pr-4 ${isSel ? "border-cobalt bg-cobalt-tint/40" : "border-transparent hover:bg-panel"}`}>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
