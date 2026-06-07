import { Check, MessageSquare, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/mock";

function PhaseNode({ phase, index }: { phase: Phase; index: number }) {
  const metaColor: Record<Phase["state"], string> = {
    done: "text-muted-ink",
    active: "text-cobalt font-semibold",
    blocked: "text-gap",
    pending: "text-faint",
  };
  return (
    <div className="flex flex-1 items-center gap-3">
      <PhaseDot phase={phase} index={index} />
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "font-display text-[15px] font-semibold",
            phase.state === "pending" ? "text-faint" : "text-ink",
          )}
        >
          {phase.name}
        </span>
        <span className={cn("whitespace-nowrap text-[11px] font-medium", metaColor[phase.state])}>
          {phase.meta}
        </span>
      </div>
    </div>
  );
}

function PhaseDot({ phase, index }: { phase: Phase; index: number }) {
  const base = "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full";
  switch (phase.state) {
    case "done":
      // Complete = solid ink (neutral), white check.
      return (
        <div className={cn(base, "bg-ink")}>
          <Check className="h-[17px] w-[17px] text-white" strokeWidth={3} />
        </div>
      );
    case "active":
      // The single accent: cobalt ring, no solid fill.
      return (
        <div className={cn(base, "border-2 border-cobalt bg-white")}>
          <MessageSquare className="h-4 w-4 text-cobalt" strokeWidth={2.25} />
        </div>
      );
    case "blocked":
      // Neutral circle; red lives only in the meta text.
      return (
        <div className={cn(base, "border-[1.5px] border-hairline bg-white")}>
          <CircleAlert className="h-4 w-4 text-ink" strokeWidth={2} />
        </div>
      );
    default:
      return (
        <div className={cn(base, "border-[1.5px] border-hairline bg-white")}>
          <span className="font-mono text-[13px] font-semibold text-faint">{index + 1}</span>
        </div>
      );
  }
}

export function PhasePipeline({ phases }: { phases: Phase[] }) {
  return (
    <div className="flex items-center rounded-xl border border-hairline bg-panel px-6 py-[18px]">
      {phases.map((phase, i) => (
        <div key={phase.key} className="flex flex-1 items-center">
          <PhaseNode phase={phase} index={i} />
          {i < phases.length - 1 && <div className="h-px w-12 shrink-0 bg-hairline" />}
        </div>
      ))}
    </div>
  );
}
