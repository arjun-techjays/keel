import { cn } from "@/lib/utils";

export function AvatarChip({
  initials,
  color = "var(--ink)",
  size = 24,
  className,
}: {
  initials: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
