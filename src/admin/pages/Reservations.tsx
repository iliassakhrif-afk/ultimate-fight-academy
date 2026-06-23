import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, Users, Clock3, ChevronRight, X, Search, UserPlus, ListChecks } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDateFR } from "../store/format";
import { DISCIPLINE_COLORS, DISCIPLINE_LABELS } from "../constants";
import type { ClassSession, Member } from "../types";
import StatCard from "../components/StatCard";
import { Drawer } from "../components/Overlay";
import { SectionCard } from "../components/EmptyState";
import Avatar from "../components/Avatar";

const DOW_LABELS: Record<string, string> = { LUN: "Lundi", MAR: "Mardi", MER: "Mercredi", JEU: "Jeudi", VEN: "Vendredi", SAM: "Samedi" };

export default function Reservations() {
  const { db, reserveClass, cancelBooking } = useStore();
  const nav = useNavigate();
  const [sel, setSel] = useState<{ cs: ClassSession; date: string } | null>(null);
  const [q, setQ] = useState("");

  const occurrences = useMemo(() => S.upcomingOccurrences(db, 7), [db]);

  // Regroupe par date
  const byDate = useMemo(() => {
    const map: Record<string, typeof occurrences> = {};
    occurrences.forEach((o) => { (map[o.date] ||= []).push(o); });
    return Object.entries(map);
  }, [occurrences]);

  const totals = useMemo(() => {
    let reserved = 0, waitlist = 0, capacity = 0;
    occurrences.forEach((o) => {
      const st = S.reservationState(db, o.classSession.id, o.date);
      reserved += st.reserved; waitlist += st.waitlist; capacity += st.capacity;
    });
    return { reserved, waitlist, capacity, fill: capacity ? Math.round((reserved / capacity) * 100) : 0 };
  }, [db, occurrences]);

  const state = sel ? S.reservationState(db, sel.cs.id, sel.date) : null;
  const list = sel ? S.bookingsForOccurrence(db, sel.cs.id, sel.date) : [];
  const reservedList = list.filter((b) => b.status === "reserve" || b.status === "present");
  const waitList = list.filter((b) => b.status === "liste_attente");

  const eligible = useMemo(() => {
    if (!sel) return [] as Member[];
    const booked = new Set(list.map((b) => b.memberId));
    const t = q.trim().toLowerCase();
    return db.members
      .filter((m) => (m.status === "actif" || m.status === "gele") && m.disciplineIds.includes(sel.cs.disciplineId) && !booked.has(m.id))
      .filter((m) => !t || `${m.firstName} ${m.lastName}`.toLowerCase().includes(t))
      .slice(0, 8);
  }, [db, sel, list, q]);

  const coachName = (id: string) => { const c = db.coaches.find((x) => x.id === id); return c ? `${c.firstName} ${c.lastName}` : "—"; };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide md:text-5xl">RÉSERVATIONS</h1>
        <p className="mt-1 text-sm text-ash">Cours à venir, capacité et liste d'attente — 7 prochains jours.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Cours à venir" value={occurrences.length} accent="#3aa0ff" icon={<CalendarDays className="h-4 w-4" />} index={0} />
        <StatCard label="Places réservées" value={totals.reserved} accent="#3ddc84" icon={<Users className="h-4 w-4" />} index={1} />
        <StatCard label="Liste d'attente" value={totals.waitlist} accent="#f5b730" icon={<ListChecks className="h-4 w-4" />} index={2} />
        <StatCard label="Remplissage moyen" value={totals.fill} format={(n) => `${Math.round(n)} %`} accent="#ff3d2e" icon={<Clock3 className="h-4 w-4" />} index={3} />
      </div>

      {byDate.map(([date, occs]) => (
        <SectionCard key={date} title={`${DOW_LABELS[occs[0].classSession.dayOfWeek] || ""} ${formatDateFR(date)}`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {occs.map((o, i) => {
              const st = S.reservationState(db, o.classSession.id, o.date);
              const pct = st.capacity ? Math.min(100, Math.round((st.reserved / st.capacity) * 100)) : 0;
              const full = st.spotsLeft === 0;
              return (
                <motion.button
                  key={o.classSession.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.03 }}
                  onClick={() => { setSel({ cs: o.classSession, date: o.date }); setQ(""); }}
                  className="group rounded-xl border border-white/10 bg-ink p-4 text-left transition-colors hover:border-ember/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-ember">{o.classSession.startTime}</span>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: DISCIPLINE_COLORS[o.classSession.disciplineId] }} />
                  </div>
                  <div className="mt-1 font-display text-base leading-tight tracking-wide text-bone">{o.classSession.label}</div>
                  <div className="text-xs text-ash">{coachName(o.classSession.coachId)} · {o.classSession.room}</div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={full ? "font-semibold text-ember" : "text-ash"}>{st.reserved}/{st.capacity} {full ? "· complet" : ""}</span>
                    {st.waitlist > 0 && <span className="text-gold">+{st.waitlist} attente</span>}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: full ? "#ff3d2e" : "#3ddc84" }} />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-ember opacity-0 transition-opacity group-hover:opacity-100">Gérer <ChevronRight className="h-3 w-3" /></div>
                </motion.button>
              );
            })}
          </div>
        </SectionCard>
      ))}

      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel ? sel.cs.label : ""} width="max-w-lg">
        {sel && state && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-sm text-ash">
              <span className="font-mono text-ember">{sel.cs.startTime}–{sel.cs.endTime}</span>
              <span>· {formatDateFR(sel.date)}</span>
              <span className="ml-auto rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: DISCIPLINE_COLORS[sel.cs.disciplineId], background: DISCIPLINE_COLORS[sel.cs.disciplineId] + "22" }}>{DISCIPLINE_LABELS[sel.cs.disciplineId]}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-ink p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ash">Places</span>
                <span className="font-display text-lg text-bone">{state.reserved}/{state.capacity}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: `${state.capacity ? (state.reserved / state.capacity) * 100 : 0}%`, background: state.spotsLeft === 0 ? "#ff3d2e" : "#3ddc84" }} />
              </div>
              <div className="mt-2 text-xs text-ash">{state.spotsLeft > 0 ? `${state.spotsLeft} place(s) restante(s)` : `Complet · ${state.waitlist} en liste d'attente`}</div>
            </div>

            {/* Réserver un membre */}
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-bone"><UserPlus className="h-4 w-4 text-ember" /> Réserver un membre</div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un membre éligible…" className="field pl-9" />
              </div>
              {q && (
                <div className="mt-2 space-y-1">
                  {eligible.map((m) => (
                    <button key={m.id} onClick={() => { reserveClass(m.id, sel.cs.id, sel.date); setQ(""); }}
                      className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-ink px-3 py-2 text-left hover:border-white/15">
                      <Avatar first={m.firstName} last={m.lastName} size={28} />
                      <span className="flex-1 text-sm text-bone">{m.firstName} {m.lastName}</span>
                      <span className="text-xs font-semibold text-ember">{state.spotsLeft > 0 ? "Réserver" : "Liste d'attente"}</span>
                    </button>
                  ))}
                  {eligible.length === 0 && <p className="px-1 py-2 text-xs text-ash">Aucun membre éligible trouvé.</p>}
                </div>
              )}
            </div>

            {/* Réservés */}
            <div>
              <div className="mb-2 text-sm font-semibold text-bone">Réservés ({reservedList.length})</div>
              <div className="space-y-1.5">
                {reservedList.map((b) => {
                  const m = db.members.find((x) => x.id === b.memberId);
                  if (!m) return null;
                  return (
                    <div key={b.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-ink px-3 py-2">
                      <Avatar first={m.firstName} last={m.lastName} size={28} />
                      <button onClick={() => { setSel(null); nav(`/admin/membres/${m.id}`); }} className="flex-1 text-left text-sm text-bone hover:text-ember">{m.firstName} {m.lastName}</button>
                      <button onClick={() => cancelBooking(b.id)} className="grid h-7 w-7 place-items-center rounded-lg text-ash hover:text-ember" title="Annuler"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  );
                })}
                {reservedList.length === 0 && <p className="text-xs text-ash">Aucune réservation pour l'instant.</p>}
              </div>
            </div>

            {/* Liste d'attente */}
            {waitList.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold text-gold">Liste d'attente ({waitList.length})</div>
                <div className="space-y-1.5">
                  {waitList.map((b, idx) => {
                    const m = db.members.find((x) => x.id === b.memberId);
                    if (!m) return null;
                    return (
                      <div key={b.id} className="flex items-center gap-3 rounded-lg border border-gold/20 bg-gold/[0.05] px-3 py-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-gold/20 text-xs font-bold text-gold">{idx + 1}</span>
                        <span className="flex-1 text-sm text-bone">{m.firstName} {m.lastName}</span>
                        <button onClick={() => cancelBooking(b.id)} className="grid h-7 w-7 place-items-center rounded-lg text-ash hover:text-ember" title="Retirer"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-ash">En annulant une réservation, le 1er de la liste d'attente est promu automatiquement.</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
