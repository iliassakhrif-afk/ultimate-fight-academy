import type { MemberStatus, InstallmentStatus } from "../types";
import { STATUS_META, INSTALLMENT_META } from "../constants";

export function StatusBadge({ status }: { status: MemberStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: m.color, background: m.bg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

export function InstallmentBadge({ status }: { status: InstallmentStatus }) {
  const m = INSTALLMENT_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color, background: color + "22" }}>
      {label}
    </span>
  );
}
