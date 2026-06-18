import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, LogOut, UserPlus, ClipboardCheck, Wallet } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { searchMembers, encaisseAujourdhui } from "../store/selectors";
import { auth } from "../store/db";
import { formatDH } from "../store/format";
import Avatar from "./Avatar";

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { db } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const results = q ? searchMembers(db, q) : [];

  const logout = () => { auth.logout(); nav("/admin/login"); };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-ink/85 px-4 py-3 backdrop-blur-xl md:px-6">
      <button onClick={onOpenMenu} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 lg:hidden">
        <Menu className="h-4 w-4" />
      </button>

      {/* Recherche globale */}
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un membre, téléphone, n°…"
          className="w-full rounded-xl border border-white/10 bg-coal py-2.5 pl-9 pr-3 text-sm text-bone placeholder:text-ash/60 outline-none focus:border-ember"
        />
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-white/10 bg-coal shadow-2xl">
            {results.map((m) => (
              <button
                key={m.id}
                onClick={() => { setQ(""); nav(`/admin/membres/${m.id}`); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
              >
                <Avatar first={m.firstName} last={m.lastName} size={30} />
                <div className="leading-tight">
                  <div className="text-sm font-medium text-bone">{m.firstName} {m.lastName}</div>
                  <div className="text-xs text-ash">{m.memberNo} · {m.phone}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Caisse du jour */}
      <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-coal px-3 py-2 md:flex">
        <Wallet className="h-4 w-4 text-gold" />
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-wider text-ash">Caisse du jour</div>
          <div className="text-sm font-bold text-bone">{formatDH(encaisseAujourdhui(db))}</div>
        </div>
      </div>

      {/* Actions rapides */}
      <button onClick={() => nav("/admin/membres/nouveau")} className="hidden h-9 items-center gap-1.5 rounded-xl bg-ember px-3 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:scale-105 sm:flex">
        <UserPlus className="h-4 w-4" /> Membre
      </button>
      <button onClick={() => nav("/admin/presences")} title="Check-in" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-ash hover:text-bone">
        <ClipboardCheck className="h-4 w-4" />
      </button>

      <span className="hidden rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold lg:inline">Mode démo</span>

      <button onClick={logout} title="Déconnexion" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-ash hover:border-ember hover:text-ember">
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  );
}
