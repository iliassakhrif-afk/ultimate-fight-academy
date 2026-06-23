import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Users, ClipboardCheck, Award, Wallet, AlarmClock,
  CreditCard, CalendarDays, Settings, Flame, Dumbbell,
} from "lucide-react";
import { NAV_GROUPS } from "../constants";
import { useStore } from "../store/StoreProvider";
import { asset } from "../../asset";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, TrendingUp, Users, ClipboardCheck, Award, Wallet, AlarmClock, CreditCard, CalendarDays, Settings, Dumbbell,
};

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { db } = useStore();
  const head = db.coaches.find((c) => c.role === "Head Coach");

  return (
    <aside className="flex h-full w-60 flex-col border-r border-white/10 bg-coal">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
        <img src={asset("/images/logo.png")} alt="UFA" className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <div className="font-display text-sm tracking-wide">ULTIMATE</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-ember">Admin</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((g) => (
          <div key={g.group} className="mb-5">
            <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ash/60">{g.group}</div>
            {g.items.map((it) => {
              const Icon = ICONS[it.icon] || Flame;
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-steel text-bone shadow-[inset_2px_0_0_0_#ff3d2e]" : "text-ash hover:bg-white/5 hover:text-bone"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {head && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-steel/60 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ember font-display text-sm text-white">RZ</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-bone">{head.firstName} {head.lastName}</div>
              <div className="text-[10px] text-ash">{head.role}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
