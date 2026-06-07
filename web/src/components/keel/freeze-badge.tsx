import { Check } from "lucide-react";

// Accepts the DB enum: 'draft' | 'frozen' | 'frozen_blocked' (or legacy uppercase).
export function FreezeBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "frozen") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-covered">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        Frozen
      </span>
    );
  }
  if (s === "frozen_blocked" || s === "frozen-blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gap">
        <span className="h-[7px] w-[7px] rounded-full bg-gap" />
        Blocked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-ink">
      <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: "var(--partial)" }} />
      Draft
    </span>
  );
}
