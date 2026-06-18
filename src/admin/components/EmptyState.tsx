import type { ReactNode } from "react";

export default function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      {icon && <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-ash">{icon}</span>}
      <p className="font-display text-xl tracking-wide text-bone">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ash">{hint}</p>}
    </div>
  );
}

export function SectionCard({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-coal p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-display text-lg tracking-wide text-bone">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
