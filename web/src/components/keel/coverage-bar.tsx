import type { CoverageRow } from "@/lib/mock";

export function CoverageBar({ row }: { row: CoverageRow }) {
  const pct = (n: number) => `${(n / row.total) * 100}%`;
  return (
    <div className="flex items-center gap-4">
      <div className="flex w-[150px] shrink-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-ink">{row.name}</span>
        <span className="font-mono text-[11px] font-medium text-faint">
          {row.id} · {row.total}
        </span>
      </div>
      <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-hairline-soft">
        {row.covered > 0 && (
          <div style={{ width: pct(row.covered), backgroundColor: "var(--covered)" }} />
        )}
        {row.partial > 0 && (
          <div style={{ width: pct(row.partial), backgroundColor: "var(--partial)" }} />
        )}
        {row.gap > 0 && (
          <div style={{ width: pct(row.gap), backgroundColor: "var(--gap)" }} />
        )}
      </div>
      <div className="w-[58px] shrink-0 text-right">
        <span className="tnum font-mono text-xs font-medium text-muted-ink">
          {row.covered}/{row.total}
        </span>
      </div>
    </div>
  );
}
