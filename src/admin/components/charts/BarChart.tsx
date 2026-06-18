import { useState } from "react";
import { formatDH } from "../../store/format";

interface Series { label: string; a: number; b: number; }

// Barres groupées: a = facturé (ember), b = encaissé (gold)
export default function BarChart({ data, height = 220 }: { data: Series[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.flatMap((d) => [d.a, d.b]), 1);
  const W = 760;
  const padB = 28;
  const innerH = height - padB;
  const groupW = W / data.length;
  const barW = Math.min(16, groupW / 3.2);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={0} x2={W} y1={innerH - innerH * g} y2={innerH - innerH * g} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {data.map((d, i) => {
          const cx = i * groupW + groupW / 2;
          const ha = (d.a / max) * innerH;
          const hb = (d.b / max) * innerH;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={cx - barW - 2} y={innerH - ha} width={barW} height={ha} rx={3} fill="#ff3d2e" opacity={hover === null || hover === i ? 0.9 : 0.4} />
              <rect x={cx + 2} y={innerH - hb} width={barW} height={hb} rx={3} fill="#f5b730" opacity={hover === null || hover === i ? 0.95 : 0.4} />
              <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill="#8a8a93">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-ink/95 px-3 py-2 text-xs shadow-xl">
          <div className="mb-1 font-semibold text-bone">{data[hover].label}</div>
          <div className="flex items-center gap-2 text-ash"><span className="h-2 w-2 rounded-sm bg-ember" /> Facturé {formatDH(data[hover].a)}</div>
          <div className="flex items-center gap-2 text-ash"><span className="h-2 w-2 rounded-sm bg-gold" /> Encaissé {formatDH(data[hover].b)}</div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-ash">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ember" /> Facturé</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Encaissé</span>
      </div>
    </div>
  );
}
