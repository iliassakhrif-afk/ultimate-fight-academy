export default function ProgressRing({ pct, size = 132, label, value, color = "#ff3d2e" }: { pct: number; size?: number; label?: string; value?: string; color?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl leading-none">{value ?? `${Math.round(clamped)}%`}</div>
        {label && <div className="mt-1 text-[10px] uppercase tracking-wider text-ash">{label}</div>}
      </div>
    </div>
  );
}
