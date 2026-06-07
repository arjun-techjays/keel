import { AvatarChip } from "./avatar-chip";
import type { Lock } from "@/lib/mock";

// Full-width lock/presence banner shown under the project header.
export function LockBanner({ lock }: { lock: Lock }) {
  return (
    <div
      className="flex items-center gap-2.5 border-b px-8 py-2.5"
      style={{ backgroundColor: "#fbf1de", borderBottomColor: "#efd9a8" }}
    >
      <AvatarChip initials={lock.initials} color="#c2841a" size={24} />
      <div className="flex flex-1 items-center justify-between">
        <span
          className="whitespace-nowrap text-xs font-semibold"
          style={{ color: "#7a5310" }}
        >
          {lock.holder} is working
        </span>
        <span
          className="whitespace-nowrap text-[11px]"
          style={{ color: "#a07a2e" }}
        >
          locked {lock.since} · {lock.phase}
        </span>
      </div>
    </div>
  );
}
