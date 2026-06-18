import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Users, Dumbbell, MapPin, UserCog, Send, Filter } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT, WEEK_DAYS } from "../constants";
import { formatNum } from "../store/format";
import StatCard from "../components/StatCard";
import { Pill } from "../components/StatusBadge";
import EmptyState, { SectionCard } from "../components/EmptyState";
import type { ClassSession, Coach, DisciplineId, WeekDay } from "../types";

const LEVEL_LABELS: Record<ClassSession["level"], string> = {
  enfants: "Enfants",
  ado: "Ados",
  adultes: "Adultes",
  debutants: "Débutants",
  avance: "Avancé",
};

const DAY_LABELS: Record<WeekDay, string> = {
  LUN: "Lundi",
  MAR: "Mardi",
  MER: "Mercredi",
  JEU: "Jeudi",
  VEN: "Vendredi",
  SAM: "Samedi",
};

// Durée d'un créneau en heures (HH:MM)
function sessionHours(s: ClassSession): number {
  const [sh, sm] = s.startTime.split(":").map(Number);
  const [eh, em] = s.endTime.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmtH = (n: number) => `${formatNum(round1(n))} h`;

export default function Schedule() {
  const { db } = useStore();
  const [discFilter, setDiscFilter] = useState<DisciplineId | "all">("all");
  const [coachFilter, setCoachFilter] = useState<string | "all">("all");

  const coachById = useMemo(() => new Map(db.coaches.map((c) => [c.id, c])), [db.coaches]);
  const coachName = (id: string): string => {
    const c = coachById.get(id);
    return c ? `${c.firstName} ${c.lastName}` : "—";
  };

  const activeSessions = useMemo(() => db.classSessions.filter((s) => s.isActive), [db.classSessions]);

  // Coachs effectivement programmés sur des cours actifs
  const scheduledCoaches = useMemo(() => {
    const ids = new Set(activeSessions.map((s) => s.coachId));
    return db.coaches.filter((c) => ids.has(c.id));
  }, [db.coaches, activeSessions]);

  // Disciplines présentes dans le planning (pastilles de filtre)
  const planningDisciplines = useMemo(() => {
    const set = new Set<DisciplineId>();
    activeSessions.forEach((s) => set.add(s.disciplineId));
    return [...set];
  }, [activeSessions]);

  // Sessions visibles après filtres
  const visible = useMemo(
    () =>
      activeSessions.filter(
        (s) => (discFilter === "all" || s.disciplineId === discFilter) && (coachFilter === "all" || s.coachId === coachFilter)
      ),
    [activeSessions, discFilter, coachFilter]
  );

  // --- KPIs ---
  const coursParSemaine = activeSessions.length;
  const heuresTatami = useMemo(() => activeSessions.reduce((sum, s) => sum + sessionHours(s), 0), [activeSessions]);
  const disciplinesActives = planningDisciplines.length;
  const tauxRemplissage = useMemo(() => {
    if (activeSessions.length === 0) return 0;
    const sessById = new Map(activeSessions.map((s) => [s.id, s]));
    const counts = new Map<string, number>();
    db.attendance.forEach((a) => {
      if (a.status === "present" && sessById.has(a.classSessionId)) {
        counts.set(a.classSessionId, (counts.get(a.classSessionId) || 0) + 1);
      }
    });
    const nbDates = new Set(db.attendance.map((a) => a.date)).size || 1;
    let acc = 0;
    activeSessions.forEach((s) => {
      const avg = (counts.get(s.id) || 0) / nbDates;
      acc += Math.min(1, avg / Math.max(1, s.capacity));
    });
    return Math.round((acc / activeSessions.length) * 100);
  }, [activeSessions, db.attendance]);

  // Grille: par jour, sessions triées par heure de début
  const grid = useMemo(
    () =>
      WEEK_DAYS.map((day) => ({
        day,
        sessions: visible.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)),
      })),
    [visible]
  );

  // Charge des coachs: heures/semaine sur cours actifs (non filtré)
  const coachLoad = useMemo(() => {
    return scheduledCoaches
      .map((c: Coach) => {
        const mine = activeSessions.filter((s) => s.coachId === c.id);
        return { coach: c, hours: mine.reduce((sum, s) => sum + sessionHours(s), 0), count: mine.length };
      })
      .sort((a, b) => b.hours - a.hours);
  }, [scheduledCoaches, activeSessions]);
  const maxCoachHours = Math.max(1, ...coachLoad.map((r) => r.hours));

  const publish = () => {
    window.alert("Planning synchronisé avec la vitrine ✓\nLes créneaux publics seront mis à jour au prochain rafraîchissement du site.");
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">PLANNING</h1>
          <p className="text-ash">Grille hebdomadaire des cours — du lundi au samedi.</p>
        </div>
        <button type="button" onClick={publish} className="btn-primary inline-flex items-center gap-2">
          <Send size={16} /> Publier vers le site
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cours / semaine" value={coursParSemaine} accent="#ff3d2e" icon={<CalendarDays size={18} />} index={0} />
        <StatCard label="Heures de tatami / sem" value={heuresTatami} format={fmtH} accent="#f5b730" icon={<Clock size={18} />} index={1} />
        <StatCard label="Taux de remplissage moyen" value={tauxRemplissage} format={(n) => `${n}%`} accent="#3ddc84" icon={<Users size={18} />} index={2} />
        <StatCard label="Disciplines actives" value={disciplinesActives} accent="#3aa0ff" icon={<Dumbbell size={18} />} index={3} />
      </div>

      {/* Filtres */}
      <SectionCard
        title="Filtres"
        action={
          <span className="inline-flex items-center gap-1 text-xs text-ash">
            <Filter size={14} /> {visible.length} / {activeSessions.length} cours
          </span>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ash">Discipline</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDiscFilter("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${discFilter === "all" ? "border-white/25 bg-white/10 text-bone" : "border-white/10 bg-ink text-ash hover:text-bone"}`}
              >
                Toutes
              </button>
              {planningDisciplines.map((d) => {
                const active = discFilter === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscFilter(active ? "all" : d)}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      borderColor: active ? DISCIPLINE_COLORS[d] : "rgba(255,255,255,0.1)",
                      background: active ? `${DISCIPLINE_COLORS[d]}22` : "transparent",
                      color: active ? DISCIPLINE_COLORS[d] : undefined,
                    }}
                  >
                    {DISCIPLINE_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ash">Coach</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCoachFilter("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${coachFilter === "all" ? "border-white/25 bg-white/10 text-bone" : "border-white/10 bg-ink text-ash hover:text-bone"}`}
              >
                Tous
              </button>
              {scheduledCoaches.map((c) => {
                const active = coachFilter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCoachFilter(active ? "all" : c.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-gold/60 bg-gold/15 text-gold" : "border-white/10 bg-ink text-ash hover:text-bone"}`}
                  >
                    <UserCog size={13} /> {c.firstName} {c.lastName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Grille hebdomadaire */}
      {visible.length === 0 ? (
        <EmptyState icon={<CalendarDays size={22} />} title="Aucun cours" hint="Aucun cours ne correspond aux filtres sélectionnés." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {grid.map((col, ci) => {
            const dayHours = col.sessions.reduce((sum, s) => sum + sessionHours(s), 0);
            return (
              <motion.div
                key={col.day}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.04 }}
                className="rounded-2xl border border-white/10 bg-coal p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="font-display text-base tracking-wide text-bone">{DAY_LABELS[col.day]}</span>
                  <span className="text-[11px] tabular-nums text-ash">
                    {col.sessions.length} · {round1(dayHours)}h
                  </span>
                </div>
                <div className="space-y-2.5">
                  {col.sessions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-ash/70">Repos</div>
                  )}
                  {col.sessions.map((s) => {
                    const color = DISCIPLINE_COLORS[s.disciplineId];
                    return (
                      <div
                        key={s.id}
                        className="rounded-xl border bg-ink/70 p-2.5"
                        style={{ borderColor: `${color}40`, boxShadow: `inset 3px 0 0 ${color}` }}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider" style={{ background: `${color}22`, color }}>
                            {DISCIPLINE_SHORT[s.disciplineId]}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-ash">
                            {s.startTime}–{s.endTime}
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-tight text-bone">{s.label}</p>
                        <p className="mt-0.5 text-[11px] text-ash">
                          {LEVEL_LABELS[s.level]}
                          {s.variant ? ` · ${s.variant}` : ""}
                        </p>
                        <div className="mt-2 space-y-1 border-t border-white/5 pt-2 text-[11px] text-ash">
                          <div className="flex items-center gap-1.5">
                            <UserCog size={12} className="shrink-0 text-ash/70" />
                            <span className="truncate">{coachName(s.coachId)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={12} className="shrink-0 text-ash/70" /> {s.room}
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Users size={12} className="text-ash/70" /> {s.capacity}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Charge des coachs */}
      <SectionCard title="Charge des coachs" action={<span className="text-xs text-ash">Heures programmées / semaine</span>}>
        {coachLoad.length === 0 ? (
          <EmptyState title="Aucun coach programmé" />
        ) : (
          <div className="space-y-3">
            {coachLoad.map((r, i) => {
              const accent = DISCIPLINE_COLORS[r.coach.disciplineIds[0] ?? "mma"];
              return (
                <motion.div
                  key={r.coach.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-semibold text-bone">
                      {r.coach.firstName} {r.coach.lastName}
                    </p>
                    <p className="text-[11px] text-ash">{r.coach.role}</p>
                  </div>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-ink">
                    <motion.div
                      className="h-full rounded-lg"
                      style={{ background: `linear-gradient(90deg, ${accent}cc, ${accent}66)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.hours / maxCoachHours) * 100}%` }}
                      transition={{ delay: i * 0.04 + 0.1, duration: 0.5 }}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-[11px] font-semibold text-bone/90">{r.count} cours</span>
                  </div>
                  <div className="w-20 shrink-0 text-right">
                    <span className="font-display text-lg tabular-nums text-bone">{fmtH(r.hours)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          {planningDisciplines.map((d) => (
            <Pill key={d} label={DISCIPLINE_LABELS[d]} color={DISCIPLINE_COLORS[d]} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
