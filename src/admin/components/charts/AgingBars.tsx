import { formatDH } from "../../store/format";

export default function AgingBars({ buckets }: { buckets: { b0_7: number; b8_30: number; b30plus: number } }) {
  const rows = [
    { label: "1 – 7 jours", value: buckets.b0_7, color: "#f5b730" },
    { label: "8 – 30 jours", value: buckets.b8_30, color: "#ff8c2e" },
    { label: "+ 30 jours", value: buckets.b30plus, color: "#ff3d2e" },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-ash">{r.label}</span>
            <span className="font-semibold text-bone">{formatDH(r.value)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
