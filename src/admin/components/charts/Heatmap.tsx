import type { Heatmap as HeatmapData } from "../../store/selectors";

// Heatmap fréquentation jour × créneau (dégradé ink → ember)
export default function Heatmap({ data }: { data: HeatmapData }) {
  const color = (v: number) => {
    if (v === 0) return "rgba(255,255,255,0.04)";
    const t = v / data.max;
    return `rgba(255,61,46,${0.15 + t * 0.75})`;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className="w-12" />
            {data.days.map((d) => (
              <th key={d} className="pb-1 text-center text-[11px] font-semibold text-ash">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slots.map((slot, si) => (
            <tr key={slot}>
              <td className="pr-2 text-right text-[11px] font-medium text-ash">{slot}</td>
              {data.days.map((d, di) => {
                const v = data.cells[si][di];
                return (
                  <td key={d}>
                    <div className="grid h-7 place-items-center rounded-md text-[10px] font-semibold text-white/80" style={{ background: color(v) }} title={`${d} ${slot} — ${v} présences`}>
                      {v > 0 ? v : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
