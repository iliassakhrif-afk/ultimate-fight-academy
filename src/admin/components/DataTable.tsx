import { useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  sortValue?: (row: T) => number | string;
  render: (row: T) => ReactNode;
}

export default function DataTable<T extends { id: string }>({
  columns, data, onRowClick, initialSort,
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [sort, setSort] = useState(initialSort || null);

  const sorted = [...data];
  if (sort) {
    const col = columns.find((c) => c.key === sort.key);
    if (col?.sortValue) {
      sorted.sort((a, b) => {
        const va = col.sortValue!(a);
        const vb = col.sortValue!(b);
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
  }

  const toggleSort = (key: string) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-steel/60">
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => c.sortValue && toggleSort(c.key)}
                className={`sticky top-0 px-4 py-3 text-${c.align || "left"} text-xs font-semibold uppercase tracking-wider text-ash ${c.sortValue ? "cursor-pointer select-none hover:text-bone" : ""}`}
                style={{ width: c.width }}
              >
                {c.header}
                {sort?.key === c.key && <span className="ml-1 text-ember">{sort.dir === "asc" ? "↑" : "↓"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-white/5 transition-colors ${onRowClick ? "cursor-pointer hover:bg-white/[0.03]" : ""} ${i % 2 ? "bg-white/[0.012]" : ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 text-${c.align || "left"} align-middle`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <div className="px-4 py-10 text-center text-sm text-ash">Aucun résultat.</div>}
    </div>
  );
}
