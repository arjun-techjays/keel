import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview", path: "" },
  { key: "questions", label: "Questions", path: "/questions" },
  { key: "coverage", label: "Coverage", path: "/coverage" },
  { key: "pack", label: "Pack", path: "/pack" },
  { key: "review", label: "Review", path: "/review" },
];

export function ProjectHeader({
  id,
  name,
  version,
  active,
  action,
}: {
  id: string;
  name: string;
  version: string;
  active: string;
  action?: React.ReactNode;
}) {
  return (
    <div data-print-hide className="flex flex-col gap-4 px-8 pt-[22px]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center gap-[7px]">
            <Link href="/projects" className="whitespace-nowrap text-xs font-medium text-faint hover:text-muted-ink">
              Projects
            </Link>
            <ChevronRight className="h-[13px] w-[13px]" style={{ color: "#c7ccd3" }} strokeWidth={2.5} />
            <span className="whitespace-nowrap text-xs font-medium text-muted-ink">{name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">{name}</h1>
            <span className="rounded-md border border-hairline bg-panel px-[7px] py-[3px] font-mono text-[11px] font-medium text-muted-ink">
              {version}
            </span>
          </div>
        </div>
        {action}
      </div>

      <nav className="flex items-center gap-1 border-b border-hairline">
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={`/projects/${id}${t.path}`}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-[13px] font-semibold",
                isActive
                  ? "border-cobalt text-cobalt"
                  : "border-transparent text-muted-ink hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
