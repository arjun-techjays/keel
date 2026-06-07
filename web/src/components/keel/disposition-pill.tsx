import { cn } from "@/lib/utils";
import type { Disposition } from "@/lib/mock";

const STYLES: Record<Disposition, string> = {
  answered: "text-covered bg-covered-tint",
  unanswered: "text-gap bg-gap-tint",
  partial: "text-partial bg-partial-tint",
  assumption: "text-cobalt bg-cobalt-tint",
  deferred: "text-muted-ink bg-hairline-soft",
  excluded: "text-muted-ink bg-hairline-soft",
};

export function DispositionPill({
  kind,
  label,
  className,
}: {
  kind: Disposition;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        STYLES[kind],
        className,
      )}
    >
      {label}
    </span>
  );
}
