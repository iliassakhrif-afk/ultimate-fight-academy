import type { BeltRank } from "../types";
import { BELT_COLORS } from "../constants";

export default function BeltPill({ rank, stripes = 0, showLabel = true }: { rank: BeltRank; stripes?: number; showLabel?: boolean }) {
  const c = BELT_COLORS[rank];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="relative inline-flex h-4 w-12 items-center justify-end overflow-hidden rounded-sm border border-white/20"
        style={{ background: c.bar }}
        title={`${c.label}${stripes ? ` · ${stripes} barre${stripes > 1 ? "s" : ""}` : ""}`}
      >
        {/* zone noire des stripes */}
        <span className="flex h-full items-center gap-0.5 bg-black/80 px-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="h-2.5 w-0.5 rounded-sm" style={{ background: i < stripes ? "#fff" : "transparent" }} />
          ))}
        </span>
      </span>
      {showLabel && <span className="text-xs font-medium text-ash">{c.label}</span>}
    </span>
  );
}
