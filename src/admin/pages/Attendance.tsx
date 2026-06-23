import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, CheckCircle2, UserX, Flame, Search, ChevronRight,
  ClipboardCheck, AlertTriangle, Wallet, ShieldAlert, CalendarX, Zap, Dumbbell, Plus, Check,
  CalendarOff, Undo2,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDateLong, daysBetween } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT, WEEK_DAYS } from "../constants";
import { GI_META } from "../techniques";
import type { Member, ClassSession, WeekDay } from "../types";
import StatCard from "../components/StatCard";
import Avatar from "../components/Avatar";
import Heatmap from "../components/charts/Heatmap";
import WhatsAppReminder from "../components/WhatsAppReminder";
import EmptyState, { SectionCard } from "../components/EmptyState";
import { Modal } from "../components/Overlay";

const DOW_LABELS: Record<WeekDay, string> = {
  LUN: "Lundi", MAR: "Mardi", MER: "Mercredi", JEU: "Jeudi", VEN: "Vendredi", SAM: "Samedi",
};

type AttendanceStatus = "present" | "no_show" | "excuse";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Présent", color: "#3ddc84" },
  { value: "no_show", label: "No-show", color: "#ff3d2e" },
  { value: "excuse", label: "Excusé", color: "#f5b730" },
];

export default function Attendance() {
  const { db, now, checkIn, markAttendance, removeAttendance } = useStore();
  const navigate = useNavigate();

  const todayClasses = useMemo(() => S.todayClasses(db), [db]);
  const todayDow = (WEEK_DAYS[(new Date(now + "T00:00:00").getDay() + 6) % 7] ?? WEEK_DAYS[0]) as WeekDay;

  // Jour & cours sélectionnés (par défaut: 1er cours du jour, sinon 1er du jour courant)
  const [selectedDay, setSelectedDay] = useState<WeekDay>(todayDow);
  const dayClasses = useMemo(
    () => db.classSessions
      .filter((c) => c.dayOfWeek === selectedDay && c.isActive)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [db.classSessions, selectedDay],
  );
  const [selectedId, setSelectedId] = useState<string>(todayClasses[0]?.id ?? db.classSessions[0]?.id ?? "");
  const selected: ClassSession | undefined =
    dayClasses.find((c) => c.id === selectedId) ?? dayClasses[0];

  // KPIs
  const presentsToday = S.presentsAujourdhui(db);
  const decroches = useMemo(() => S.membresDecroches(db, 21), [db]);
  const presenceMoyenne = useMemo(() => {
    const today = now;
    const sessionsToday = todayClasses.length;
    const total = db.attendance.filter((a) => a.date === today && a.status === "present").length;
    return sessionsToday ? Math.round(total / sessionsToday) : 0;
  }, [db.attendance, now, todayClasses.length]);
  const noShows = useMemo(
    () => db.attendance.filter((a) => a.date === now && a.status === "no_show").length,
    [db.attendance, now],
  );

  // Pointages du jour pour le cours sélectionné (tous statuts), indexés par membre
  const todaysRecords = useMemo(() => {
    if (!selected) return new Map<string, { id: string; status: AttendanceStatus }>();
    const map = new Map<string, { id: string; status: AttendanceStatus }>();
    db.attendance
      .filter((a) => a.date === now && a.classSessionId === selected.id)
      .forEach((a) => map.set(a.memberId, { id: a.id, status: a.status }));
    return map;
  }, [db.attendance, now, selected]);

  // Membres éligibles au cours sélectionné
  const presentSet = useMemo(() => {
    const set = new Set<string>();
    todaysRecords.forEach((rec, memberId) => { if (rec.status === "present") set.add(memberId); });
    return set;
  }, [todaysRecords]);

  const eligible = useMemo(() => {
    if (!selected) return [] as Member[];
    return db.members
      .filter((m) => (m.status === "actif" || m.status === "gele") && m.disciplineIds.includes(selected.disciplineId))
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [db.members, selected]);

  // Recherche rapide (pointer un membre absent de la liste)
  const [query, setQuery] = useState("");
  const searchResults = useMemo(() => (query.trim() ? S.searchMembers(db, query) : []), [db, query]);

  const coachName = (id: string) => {
    const c = db.coaches.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "—";
  };

  // Alerte membre: solde dû / abo expiré / certificat médical périmé
  const memberFlags = (m: Member) => {
    const balance = S.memberBalanceDH(db, m.id) > 0;
    const sub = S.memberSubscription(db, m.id);
    const subExpired = sub ? daysBetween(sub.endDate, now) < 0 : false;
    const medExpired = m.medicalCertExpiry ? daysBetween(m.medicalCertExpiry, now) < 0 : false;
    return { balance, subExpired, medExpired, any: balance || subExpired || medExpired };
  };

  const present = selected ? presentSet.size : 0;
  const capacity = selected?.capacity ?? 0;
  const fillPct = capacity ? Math.min(100, Math.round((present / capacity) * 100)) : 0;

  const doCheckIn = (memberId: string) => {
    if (!selected || presentSet.has(memberId)) return;
    checkIn(memberId, selected.id, "kiosque");
  };

  // Changer le statut d'un membre déjà pointé (présent / no-show / excusé)
  const setStatus = (memberId: string, status: AttendanceStatus) => {
    if (!selected) return;
    markAttendance(memberId, selected.id, status);
  };

  // Annuler le pointage (supprime l'enregistrement de présence)
  const cancelRecord = (recordId: string | undefined) => {
    if (recordId) removeAttendance(recordId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide">PRÉSENCES & CHECK-IN</h1>
          <p className="text-ash">{formatDateLong(now)} — pointage kiosque tactile</p>
        </div>
        <div className="rounded-full border border-white/10 bg-coal px-4 py-2 text-sm">
          <span className="text-ash">Présents aujourd'hui : </span>
          <span className="font-display text-lg text-[#3ddc84]">{presentsToday}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Présents aujourd'hui" value={presentsToday} accent="#3ddc84" icon={<Users className="h-4 w-4" />} />
        <StatCard index={1} label="Présence moy. / cours" value={presenceMoyenne} accent="#f5b730" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard index={2} label="No-shows du jour" value={noShows} accent="#ff3d2e" icon={<UserX className="h-4 w-4" />} />
        <StatCard index={3} label="Membres décrochés" value={decroches.length} accent="#9b5cff" icon={<Flame className="h-4 w-4" />} onClick={() => document.getElementById("bloc-decroches")?.scrollIntoView({ behavior: "smooth" })} />
      </div>

      {/* Sélecteur jour + cours */}
      <SectionCard
        title="Choisir un cours"
        action={
          <div className="flex flex-wrap gap-1.5">
            {(WEEK_DAYS as readonly WeekDay[]).map((d) => (
              <button
                key={d}
                onClick={() => { setSelectedDay(d); const first = db.classSessions.filter((c) => c.dayOfWeek === d && c.isActive).sort((a, b) => a.startTime.localeCompare(b.startTime))[0]; if (first) setSelectedId(first.id); }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${selectedDay === d ? "bg-ember text-white" : "bg-white/5 text-ash hover:text-bone"} ${d === todayDow ? "ring-1 ring-gold/60" : ""}`}
                title={d === todayDow ? "Aujourd'hui" : DOW_LABELS[d]}
              >
                {d}
              </button>
            ))}
          </div>
        }
      >
        {dayClasses.length === 0 ? (
          <EmptyState icon={<CalendarX className="h-5 w-5" />} title="Aucun cours ce jour" hint={`Pas de séance programmée le ${DOW_LABELS[selectedDay].toLowerCase()}.`} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {dayClasses.map((c) => {
              const active = selected?.id === c.id;
              const col = DISCIPLINE_COLORS[c.disciplineId];
              const cPresent = db.attendance.filter((a) => a.classSessionId === c.id && a.date === now && a.status === "present").length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${active ? "border-white/25 bg-steel" : "border-white/10 bg-ink hover:border-white/20"}`}
                  style={active ? { boxShadow: `inset 0 0 0 1px ${col}55` } : undefined}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg font-display text-[11px]" style={{ background: `${col}22`, color: col }}>
                    {DISCIPLINE_SHORT[c.disciplineId]}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-bone">{c.startTime} · {c.label}</span>
                    <span className="block text-[11px] text-ash">{c.room} — {coachName(c.coachId)}</span>
                  </span>
                  <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ash">
                    {cPresent}/{c.capacity}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Grille check-in */}
      {selected && (
        <div className="rounded-2xl border border-white/10 bg-coal p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl font-display text-sm" style={{ background: `${DISCIPLINE_COLORS[selected.disciplineId]}22`, color: DISCIPLINE_COLORS[selected.disciplineId] }}>
                {DISCIPLINE_SHORT[selected.disciplineId]}
              </span>
              <div>
                <h3 className="font-display text-xl tracking-wide text-bone">{selected.label}</h3>
                <p className="text-xs text-ash">
                  {DOW_LABELS[selected.dayOfWeek]} {selected.startTime}–{selected.endTime} · {DISCIPLINE_LABELS[selected.disciplineId]} · {selected.room}
                </p>
              </div>
            </div>
            {/* Compteur live + jauge capacité */}
            <div className="min-w-[180px]">
              <div className="mb-1 flex items-end justify-between text-sm">
                <span className="text-ash">Présents</span>
                <span className="font-display text-lg tabular-nums">
                  <span className="text-[#3ddc84]">{present}</span>
                  <span className="text-ash">/{capacity}</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: fillPct >= 100 ? "#ff3d2e" : "#3ddc84" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          </div>

          {eligible.length === 0 ? (
            <EmptyState icon={<Users className="h-5 w-5" />} title="Aucun membre éligible" hint="Aucun membre actif ou gelé n'est inscrit à cette discipline." />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {eligible.map((m, i) => {
                const record = todaysRecords.get(m.id);
                const status = record?.status;
                const isPointed = record != null;
                const flags = memberFlags(m);
                const cardClass = isPointed
                  ? status === "present"
                    ? "border-[#3ddc84]/40 bg-[#3ddc84]/12"
                    : status === "no_show"
                      ? "border-ember/40 bg-ember/12"
                      : "border-gold/40 bg-gold/12"
                  : "border-white/10 bg-ink hover:border-white/25 active:bg-steel";
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.012, 0.4) }}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-colors ${cardClass}`}
                  >
                    {flags.any && !isPointed && (
                      <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-ember text-white" title="Solde dû / abo expiré / certificat médical">
                        <AlertTriangle className="h-3 w-3" />
                      </span>
                    )}
                    {isPointed && (
                      <button
                        type="button"
                        onClick={() => cancelRecord(record?.id)}
                        className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white/10 text-ash transition-colors hover:bg-white/20 hover:text-bone"
                        title="Annuler le pointage"
                      >
                        <Undo2 className="h-3 w-3" />
                      </button>
                    )}
                    {isPointed ? (
                      <Avatar first={m.firstName} last={m.lastName} size={48} />
                    ) : (
                      <motion.button
                        type="button"
                        onClick={() => doCheckIn(m.id)}
                        whileTap={{ scale: 0.96 }}
                        className="contents"
                        aria-label={`Pointer ${m.firstName} ${m.lastName}`}
                      >
                        <Avatar first={m.firstName} last={m.lastName} size={48} />
                      </motion.button>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-bone">{m.firstName}</span>
                      <span className="block truncate text-[11px] text-ash">{m.lastName}</span>
                    </span>
                    {flags.any && !isPointed && (
                      <span className="flex flex-wrap items-center justify-center gap-1">
                        {flags.balance && <span className="inline-flex items-center gap-0.5 rounded-full bg-ember/15 px-1.5 py-0.5 text-[9px] font-semibold text-ember"><Wallet className="h-2.5 w-2.5" />Solde</span>}
                        {flags.subExpired && <span className="inline-flex items-center gap-0.5 rounded-full bg-ember/15 px-1.5 py-0.5 text-[9px] font-semibold text-ember"><ShieldAlert className="h-2.5 w-2.5" />Expiré</span>}
                        {flags.medExpired && <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold"><AlertTriangle className="h-2.5 w-2.5" />Médical</span>}
                      </span>
                    )}
                    {isPointed ? (
                      /* Sélecteur de statut (Présent / No-show / Excusé) pour un membre déjà pointé */
                      <div className="mt-0.5 flex w-full overflow-hidden rounded-full border border-white/10 bg-ink/60">
                        {STATUS_OPTIONS.map((opt) => {
                          const on = status === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStatus(m.id, opt.value)}
                              className="flex-1 px-1 py-1 text-[9px] font-bold leading-tight transition-colors"
                              style={on
                                ? { background: opt.color, color: "#16110f" }
                                : { color: "#9a9088" }}
                              title={opt.label}
                            >
                              {opt.value === "present" ? "Prés." : opt.value === "no_show" ? "No-show" : "Excusé"}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => doCheckIn(m.id)}
                        className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-ash transition-colors hover:bg-white/12 hover:text-bone"
                      >
                        <Zap className="h-3 w-3" /> Pointer
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Recherche rapide pour pointer un membre absent de la liste */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
              <Search className="h-3.5 w-3.5" /> Pointer un membre absent de la liste
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, téléphone ou n° de membre…"
              className="field w-full"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {searchResults.map((m) => {
                  const isPresent = presentSet.has(m.id);
                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink px-3 py-2">
                      <Avatar first={m.firstName} last={m.lastName} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-bone">{m.firstName} {m.lastName}</p>
                        <p className="truncate text-[11px] text-ash">{m.memberNo} · {m.phone}</p>
                      </div>
                      <button
                        onClick={() => doCheckIn(m.id)}
                        disabled={isPresent}
                        className={isPresent ? "rounded-lg bg-[#3ddc84]/15 px-3 py-1.5 text-xs font-bold text-[#3ddc84]" : "btn-primary px-3 py-1.5 text-xs"}
                      >
                        {isPresent ? "Présent ✓" : "Pointer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pointés du jour — correction rapide (no-show / excuse / annulation) */}
          {todaysRecords.size > 0 && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
                <ClipboardCheck className="h-3.5 w-3.5" /> Pointés du jour ({todaysRecords.size}) — corriger un statut
              </label>
              <div className="space-y-1.5">
                {eligible
                  .filter((m) => todaysRecords.has(m.id))
                  .map((m) => {
                    const record = todaysRecords.get(m.id)!;
                    return (
                      <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-ink px-3 py-2">
                        <Avatar first={m.firstName} last={m.lastName} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-bone">{m.firstName} {m.lastName}</p>
                          <p className="truncate text-[11px] text-ash">{m.memberNo}</p>
                        </div>
                        <div className="flex overflow-hidden rounded-full border border-white/10">
                          {STATUS_OPTIONS.map((opt) => {
                            const on = record.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStatus(m.id, opt.value)}
                                className="px-2.5 py-1 text-[11px] font-bold transition-colors"
                                style={on ? { background: opt.color, color: "#16110f" } : { color: "#9a9088" }}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => cancelRecord(record.id)}
                          className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-ash transition-colors hover:border-ember/40 hover:text-ember"
                          title="Annuler le pointage"
                        >
                          <CalendarOff className="h-3 w-3" /> Annuler
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Techniques de la séance */}
      {selected && <SessionTechniques classSession={selected} date={now} />}

      {/* Affluence de la semaine */}
      <SectionCard title="Affluence de la semaine">
        <Heatmap data={S.attendanceHeatmap(db)} />
      </SectionCard>

      {/* Membres décrochés */}
      <div id="bloc-decroches">
        <SectionCard
          title="Membres décrochés (> 21 jours)"
          action={<span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-ash">{decroches.length}</span>}
        >
          {decroches.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="Personne de décroché 🔥" hint="Tous les membres actifs se sont entraînés récemment." />
          ) : (
            <div className="divide-y divide-white/5">
              {decroches.map((m) => {
                const last = m.lastAttendanceAt ? daysBetween(now, m.lastAttendanceAt) : null;
                return (
                  <div key={m.id} className="flex items-center gap-3 py-2.5">
                    <Avatar first={m.firstName} last={m.lastName} size={36} />
                    <Link to={`/admin/membres/${m.id}`} className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                      <p className="truncate text-sm font-semibold text-bone hover:text-gold">{m.firstName} {m.lastName}</p>
                      <p className="text-[11px] text-ash">
                        {last != null ? `Dernière présence il y a ${last} j` : "Jamais venu"}
                        {" · "}{m.disciplineIds.map((d) => DISCIPLINE_SHORT[d]).join(" · ")}
                      </p>
                    </Link>
                    <WhatsAppReminder member={m} type="decrochage" compact />
                    <button onClick={() => navigate(`/admin/membres/${m.id}`)} className="text-ash hover:text-bone" title="Ouvrir la fiche">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ---------------- Techniques travaillées durant la séance ---------------- */
function SessionTechniques({ classSession, date }: { classSession: ClassSession; date: string }) {
  const { db, setSessionTechniques } = useStore();
  const [open, setOpen] = useState(false);
  const inst = S.sessionInstance(db, classSession.id, date);
  const current = inst?.techniqueIds ?? [];
  const techById = useMemo(() => new Map(db.techniques.map((t) => [t.id, t])), [db.techniques]);

  const catalog = useMemo(
    () => db.techniques
      .filter((t) => t.discipline === classSession.disciplineId)
      .filter((t) => !(classSession.disciplineId === "bjj" && classSession.variant === "Gi" && t.gi === "nogi"))
      .filter((t) => !(classSession.disciplineId === "bjj" && classSession.variant === "No-Gi" && t.gi === "gi")),
    [db.techniques, classSession],
  );
  const [draft, setDraft] = useState<string[]>(current);
  const [q, setQ] = useState("");

  const openEditor = () => { setDraft(current); setQ(""); setOpen(true); };
  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const save = () => { setSessionTechniques(classSession.id, date, draft); setOpen(false); };

  const grouped = useMemo(() => {
    const t = q.trim().toLowerCase();
    const filtered = catalog.filter((x) => !t || x.name.toLowerCase().includes(t) || x.position.toLowerCase().includes(t));
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((x) => { (map[x.category] ||= []).push(x); });
    return Object.entries(map);
  }, [catalog, q]);

  return (
    <SectionCard
      title="Techniques de la séance"
      action={
        <button onClick={openEditor} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ash hover:text-bone">
          <Plus className="h-3.5 w-3.5" /> {current.length ? "Modifier" : "Renseigner"}
        </button>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-sm text-ash">
        <Dumbbell className="h-4 w-4 text-ember" />
        {classSession.label} · {classSession.startTime}
        {classSession.variant && <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs">{classSession.variant}</span>}
      </div>
      {current.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-ash">
          Aucune technique renseignée pour cette séance. Cliquez sur « Renseigner » pour enregistrer ce qui a été travaillé.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {current.map((id) => {
            const t = techById.get(id);
            if (!t) return null;
            return (
              <span key={id} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink px-3 py-1.5 text-sm text-bone">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: GI_META[t.gi].color }} />
                {t.name}
              </span>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Techniques travaillées" width="max-w-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une technique…" className="field pl-9" />
            </div>
            <span className="shrink-0 rounded-full bg-ember/15 px-3 py-1.5 text-sm font-bold text-ember">{draft.length} sélectionnée{draft.length > 1 ? "s" : ""}</span>
          </div>
          <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            {grouped.map(([cat, items]) => (
              <div key={cat}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ash">{cat}</div>
                <div className="flex flex-wrap gap-2">
                  {items.map((t) => {
                    const on = draft.includes(t.id);
                    return (
                      <button key={t.id} onClick={() => toggle(t.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? "border-ember bg-ember/15 text-ember" : "border-white/10 text-ash hover:text-bone"}`}>
                        {on && <Check className="h-3.5 w-3.5" />}
                        {t.name}
                        <span className="text-[10px] font-bold" style={{ color: GI_META[t.gi].color }}>{GI_META[t.gi].short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={save} className="btn-primary w-full">Enregistrer ({draft.length})</button>
        </div>
      </Modal>
    </SectionCard>
  );
}
