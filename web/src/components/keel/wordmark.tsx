import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  size = 30,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className="flex items-baseline leading-none"
        style={{ fontFamily: "var(--font-salsa), system-ui, sans-serif" }}
      >
        <span
          className="tracking-[-0.02em] text-ink"
          style={{ fontSize: size }}
        >
          keel
        </span>
        <span className="text-cobalt" style={{ fontSize: size }}>
          .
        </span>
      </div>
      <div className="h-0.5 rounded-sm bg-cobalt" style={{ width: 34 }} />
    </div>
  );
}
