import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Users, Dumbbell, MapPin, UserCog, Filter, Plus, Pencil, Trash2, Moon } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT, WEEK_DAYS } from "../constants";
import * as S from "../store/selectors";
import { formatNum } from "../store/format";
import StatCard from "../components/StatCard";
import { Pill } from "../components/StatusBadge";
import { Modal } from "../components/Overlay";
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

const ALL_DISCIPLINES: DisciplineId[] = ["bjj", "mma", "kickboxing", "boxe", "kids", "women"];
const LEVEL_OPTIONS: ClassSession["level"][] = ["enfants", "ado", "adultes", "debutants", "avance"];
const VARIANT_OPTIONS: NonNullable<ClassSession["variant"]>[] = ["Gi", "No-Gi", "Kickboxing", "Boxe"];

type SessionForm = {
  disciplineId: DisciplineId;
  label: string;
  level: ClassSession["level"];
  variant: ClassSession["variant"];
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  coachId: string;
  room: string;
  capacity: number;
  isActive: boolean;
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
  const { db, addClassSession, updateClassSession, removeClassSession } = useStore();
  const ramadan = db.settings.ramadanMode;
  const [discFilter, setDiscFilter] = useState<DisciplineId | "all">("all");
  const [coachFilter, setCoachFilter] = useState<string | "all">("all");
  // null = fermé ; "new" = création ; sinon = id du créneau édité
  const [editing, setEditing] = useState<ClassSession | "new" | null>(null);

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

  const remove = (s: ClassSession) => {
    if (window.confirm(`Supprimer le cours « ${s.label} » (${DAY_LABELS[s.dayOfWeek]} ${s.startTime}) ?`)) {
      removeClassSession(s.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">PLANNING</h1>
          <p className="text-ash">
            Grille hebdomadaire des cours — du lundi au samedi.
            {ramadan && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-gold">
                <Moon size={11} /> Horaires Ramadan actifs
              </span>
            )}
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> Ajouter un cours
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
                    const start = S.ramadanTime(s.startTime, ramadan);
                    const end = S.ramadanTime(s.endTime, ramadan);
                    const shifted = ramadan && (start !== s.startTime || end !== s.endTime);
                    return (
                      <div
                        key={s.id}
                        className="group/cs rounded-xl border bg-ink/70 p-2.5"
                        style={{ borderColor: `${color}40`, boxShadow: `inset 3px 0 0 ${color}` }}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider" style={{ background: `${color}22`, color }}>
                            {DISCIPLINE_SHORT[s.disciplineId]}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-ash">
                            {shifted && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-gold/15 px-1 py-px text-[9px] font-bold not-italic text-gold">
                                <Moon size={9} /> RAM
                              </span>
                            )}
                            {start}–{end}
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
                        <div className="mt-2 flex items-center gap-1.5 border-t border-white/5 pt-2 opacity-0 transition-opacity group-hover/cs:opacity-100">
                          <button
                            type="button"
                            onClick={() => setEditing(s)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-ink px-2 py-1 text-[10px] font-semibold text-ash transition-colors hover:border-gold/50 hover:text-gold"
                          >
                            <Pencil size={11} /> Éditer
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(s)}
                            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-ink px-2 py-1 text-ash transition-colors hover:border-ember/50 hover:text-ember"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={11} />
                          </button>
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

      {/* Modal création / édition */}
      {editing !== null && (
        <SessionModal
          session={editing === "new" ? null : editing}
          coaches={db.coaches}
          defaultCoachId={db.coaches[0]?.id ?? ""}
          ramadan={ramadan}
          onClose={() => setEditing(null)}
          onCreate={(form) => {
            addClassSession(form);
            setEditing(null);
          }}
          onUpdate={(id, form) => {
            updateClassSession(id, form);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function SessionModal({
  session,
  coaches,
  defaultCoachId,
  ramadan,
  onClose,
  onCreate,
  onUpdate,
}: {
  session: ClassSession | null;
  coaches: Coach[];
  defaultCoachId: string;
  ramadan: boolean;
  onClose: () => void;
  onCreate: (form: SessionForm) => void;
  onUpdate: (id: string, form: SessionForm) => void;
}) {
  const isEdit = session !== null;
  const [form, setForm] = useState<SessionForm>(() => ({
    disciplineId: session?.disciplineId ?? "bjj",
    label: session?.label ?? "",
    level: session?.level ?? "adultes",
    variant: session?.variant ?? null,
    dayOfWeek: session?.dayOfWeek ?? "LUN",
    startTime: session?.startTime ?? "18:00",
    endTime: session?.endTime ?? "19:00",
    coachId: session?.coachId ?? defaultCoachId,
    room: session?.room ?? "Tatami 1",
    capacity: session?.capacity ?? 20,
    isActive: session?.isActive ?? true,
  }));

  const set = <K extends keyof SessionForm>(key: K, value: SessionForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const ramStart = S.ramadanTime(form.startTime, ramadan);
  const ramEnd = S.ramadanTime(form.endTime, ramadan);
  const ramShift = ramadan && (ramStart !== form.startTime || ramEnd !== form.endTime);

  const submit = () => {
    const payload: SessionForm = { ...form, label: form.label.trim() || "Nouveau cours", room: form.room.trim() || "Tatami 1" };
    if (isEdit && session) onUpdate(session.id, payload);
    else onCreate(payload);
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Modifier le cours" : "Ajouter un cours"} width="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Intitulé du cours</label>
          <input
            type="text"
            className="field"
            value={form.label}
            placeholder="Ex. BJJ Fondamentaux"
            onChange={(e) => set("label", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Discipline</label>
            <select className="field" value={form.disciplineId} onChange={(e) => set("disciplineId", e.target.value as DisciplineId)}>
              {ALL_DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {DISCIPLINE_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Niveau</label>
            <select className="field" value={form.level} onChange={(e) => set("level", e.target.value as ClassSession["level"])}>
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Variante</label>
            <select
              className="field"
              value={form.variant ?? ""}
              onChange={(e) => set("variant", (e.target.value || null) as ClassSession["variant"])}
            >
              <option value="">Aucune</option>
              {VARIANT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Jour</label>
            <select className="field" value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", e.target.value as WeekDay)}>
              {WEEK_DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Début</label>
            <input type="time" className="field" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Fin</label>
            <input type="time" className="field" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Coach</label>
            <select className="field" value={form.coachId} onChange={(e) => set("coachId", e.target.value)}>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Salle</label>
            <input type="text" className="field" value={form.room} placeholder="Tatami 1" onChange={(e) => set("room", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Capacité</label>
            <input
              type="number"
              min={1}
              className="field"
              value={form.capacity}
              onChange={(e) => set("capacity", Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        {ramShift && (
          <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2.5 text-xs text-gold">
            <Moon size={14} className="shrink-0" />
            <span>
              Mode Ramadan actif : ce créneau du soir sera affiché à{" "}
              <span className="font-mono font-bold">
                {ramStart}–{ramEnd}
              </span>{" "}
              sur le planning et la vitrine.
            </span>
          </div>
        )}

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink px-4 py-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 accent-ember"
          />
          <span className="text-sm text-bone">Cours actif</span>
          <span className="text-xs text-ash">— visible sur le planning et la vitrine</span>
        </label>

        <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
          <button type="button" onClick={onClose} className="btn-ghost text-xs">
            Annuler
          </button>
          <button type="button" onClick={submit} className="btn-primary text-xs">
            {isEdit ? "Enregistrer" : "Ajouter le cours"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
