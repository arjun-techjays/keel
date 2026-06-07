import { cn } from "@/lib/utils";

export function StatSurface({
  label,
  children,
  sub,
  last,
}: {
  label: string;
  children: React.ReactNode;
  sub: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-3.5 px-6 py-5",
        !last && "border-r border-hairline",
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-faint">
        {label}
      </span>
      <div className="flex items-baseline gap-2">{children}</div>
      <span className="text-xs text-muted-ink">{sub}</span>
    </div>
  );
}
