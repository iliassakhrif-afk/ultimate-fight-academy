import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Smartphone, Info, Search, ChevronDown, Wallet, CalendarClock, BadgeCheck,
  Award, Flame, Activity, Clock, Dumbbell, Target, CheckCircle2, Signal,
  Wifi, BatteryFull, ArrowRight, UserRound,
} from "lucide-react";

import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH, formatDateFR, daysBetween } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, STATUS_META } from "../constants";
import type { DisciplineId } from "../types";

import { Pill } from "../components/StatusBadge";
import BeltPill from "../components/BeltPill";
import Avatar from "../components/Avatar";
import EmptyState, { SectionCard } from "../components/EmptyState";
import ProgressRing from "../components/charts/ProgressRing";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
});

// Petit bloc statistique compact (style appli)
function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink/70 p-3 text-center">
      <span className="inline-flex" style={{ color }}>{icon}</span>
      <p className="mt-1 font-display text-xl leading-none tracking-wide text-bone">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-ash">{label}</p>
    </div>
  );
}

export default function Portal() {
  const { db, now } = useStore();

  // membres "réels" (on exclut les churn pour la démo du portail)
  const portalMembers = useMemo(
    () =>
      db.members
        .filter((m) => m.status !== "churn")
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [db.members],
  );

  const [query, setQuery] = useState("");
  const [memberId, setMemberId] = useState<string>(() => portalMembers[0]?.id ?? "");

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return portalMembers;
    return portalMembers.filter(
      (m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(t) ||
        m.memberNo.toLowerCase().includes(t),
    );
  }, [portalMembers, query]);

  const member = db.members.find((m) => m.id === memberId) ?? null;

  // Discipline graduable pour la progression (BJJ ou kids)
  const gradedDiscipline: DisciplineId | null = member
    ? (member.disciplineIds.find((d) => d === "bjj" || d === "kids") ?? null)
    : null;

  // Données du membre choisi
  const data = useMemo(() => {
    if (!member) return null;
    const belt = S.memberCurrentBelt(db, member.id);
    const sub = S.memberSubscription(db, member.id);
    const plan = sub ? db.plans.find((p) => p.id === sub.planId) ?? null : null;
    const balance = S.memberBalanceDH(db, member.id);
    const openInst = S.openInstallments(db).filter((i) => i.memberId === member.id);
    const nextDue = openInst.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;
    const attendance = S.memberAttendance(db, member.id).filter((a) => a.status === "present");
    const techniques = S.memberTechniques(db, member.id);
    const progress = gradedDiscipline ? S.curriculumProgress(db, member.id, gradedDiscipline) : null;
    return { belt, sub, plan, balance, nextDue, attendance, techniques, progress };
  }, [db, member, gradedDiscipline]);

  const subDaysLeft = data?.sub ? daysBetween(data.sub.endDate, now) : null;
  const statusMeta = member ? STATUS_META[member.status] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide">Portail membre <span className="text-ash">(aperçu)</span></h1>
          <p className="mt-1 text-sm text-ash">Ce que chaque adhérent verra dans son application mobile.</p>
        </div>
        <Link to="/admin/membres" className="btn-ghost inline-flex items-center gap-2 text-sm">
          <UserRound className="h-4 w-4" /> Gérer les membres
        </Link>
      </div>

      {/* Bandeau "phase backend" */}
      <motion.div
        {...fade(0)}
        className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-3.5"
      >
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold">
          <Info className="h-4 w-4" />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-gold">Aperçu — démo visuelle</p>
          <p className="text-ash">
            Le portail membre nécessitera un <span className="text-bone">backend</span> (comptes membres, authentification).
            Ici, on prévisualise l'écran avec les données réelles de la démo, en lecture seule.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* ----- SÉLECTEUR DE MEMBRE ----- */}
        <motion.div {...fade(1)} className="space-y-3">
          <SectionCard title="Choisir un membre">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom ou n° membre…"
                className="field pl-9"
              />
            </div>

            {/* liste déroulante native (compacte) */}
            <div className="relative mt-3">
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="field appearance-none pr-9"
              >
                {filtered.length === 0 && <option value="">Aucun résultat</option>}
                {filtered.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} · {m.memberNo}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            </div>

            {/* raccourcis cliquables */}
            <div className="mt-3 max-h-[320px] space-y-1 overflow-y-auto pr-1">
              {filtered.slice(0, 24).map((m) => {
                const active = m.id === memberId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMemberId(m.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                      active ? "bg-ember/15 text-bone shadow-[inset_2px_0_0_0_#ff3d2e]" : "text-ash hover:bg-white/5 hover:text-bone"
                    }`}
                  >
                    <Avatar first={m.firstName} last={m.lastName} size={30} />
                    <span className="min-w-0 flex-1 truncate">{m.firstName} {m.lastName}</span>
                    {active && <ArrowRight className="h-3.5 w-3.5 text-ember" />}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* ----- APERÇU "APPLI MOBILE" ----- */}
        <motion.div {...fade(2)} className="flex justify-center">
          {!member || !data ? (
            <div className="w-full max-w-md">
              <EmptyState
                icon={<Smartphone className="h-6 w-6" />}
                title="Aucun membre sélectionné"
                hint="Choisissez un membre à gauche pour prévisualiser son portail."
              />
            </div>
          ) : (
            <div className="w-full max-w-md">
              {/* Cadre type téléphone */}
              <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-coal shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
                {/* barre d'état */}
                <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-bone/80">
                  <span className="tabular-nums">{formatDateFR(now).slice(0, 5)}</span>
                  <span className="flex items-center gap-1.5">
                    <Signal className="h-3 w-3" /> <Wifi className="h-3 w-3" /> <BatteryFull className="h-3.5 w-3.5" />
                  </span>
                </div>

                {/* en-tête héro */}
                <div className="relative overflow-hidden px-6 pb-5 pt-4">
                  <div
                    className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
                    style={{ background: "radial-gradient(circle, rgba(255,61,46,0.22), transparent 70%)" }}
                  />
                  <div className="relative flex items-center gap-4">
                    <Avatar first={member.firstName} last={member.lastName} size={56} />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-ember">Bonjour</p>
                      <h2 className="truncate font-display text-2xl tracking-wide leading-none">{member.firstName}</h2>
                      <p className="mt-1 text-xs text-ash">{member.memberNo}</p>
                    </div>
                  </div>
                  <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
                    {statusMeta && (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: statusMeta.color, background: statusMeta.bg }}
                      >
                        {statusMeta.label}
                      </span>
                    )}
                    {data.belt && <BeltPill rank={data.belt.beltRank} stripes={data.belt.stripes} />}
                  </div>
                  <div className="relative mt-2 flex flex-wrap gap-1.5">
                    {member.disciplineIds.map((d) => (
                      <Pill key={d} label={DISCIPLINE_LABELS[d]} color={DISCIPLINE_COLORS[d]} />
                    ))}
                  </div>
                </div>

                {/* corps scrollable */}
                <div className="space-y-4 bg-ink/40 px-5 py-5">
                  {/* PROGRESSION DE GRADE */}
                  {data.progress && gradedDiscipline && (
                    <div className="rounded-2xl border border-white/10 bg-coal p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
                        <Award className="h-3.5 w-3.5 text-gold" /> Ma progression · {DISCIPLINE_LABELS[gradedDiscipline]}
                      </div>
                      <div className="flex items-center gap-4">
                        <ProgressRing
                          pct={data.progress.pct}
                          size={104}
                          color="#f5b730"
                          value={`${data.progress.pct}%`}
                          label="prochain grade"
                        />
                        <div className="min-w-0 flex-1">
                          {data.progress.nextRank ? (
                            <>
                              <p className="text-xs text-ash">Objectif</p>
                              <div className="mt-1"><BeltPill rank={data.progress.nextRank} /></div>
                              <p className="mt-2 text-xs text-ash">
                                <span className="font-display text-base text-bone">{data.progress.practiced}</span>
                                <span className="text-ash"> / {data.progress.target} techniques</span>
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-bone">Grade maximum atteint 🥋</p>
                          )}
                        </div>
                      </div>
                      {data.progress.focus.length > 0 && (
                        <div className="mt-3 border-t border-white/10 pt-3">
                          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ash">
                            <Target className="h-3 w-3 text-ember" /> À travailler vers le prochain grade
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.progress.focus.map((f) => (
                              <span key={f} className="rounded-full border border-white/10 bg-ink px-2.5 py-1 text-[11px] text-bone">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ABONNEMENT */}
                  <div className="rounded-2xl border border-white/10 bg-coal p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
                      <BadgeCheck className="h-3.5 w-3.5 text-[#3ddc84]" /> Mon abonnement
                    </div>
                    {!data.sub ? (
                      <p className="text-sm text-ash">Aucun abonnement actif.</p>
                    ) : (
                      <>
                        <div className="flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-display text-lg tracking-wide text-bone">{data.plan?.name ?? data.sub.planId}</p>
                            <p className="text-xs text-ash">
                              {data.sub.duration} · {data.sub.paymentMode === "echelonne" ? `${data.sub.installmentsCount} échéances` : "Comptant"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-ash">Fin</p>
                            <p className="text-sm font-semibold text-bone">{formatDateFR(data.sub.endDate)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-ink px-3 py-2.5">
                          <span className="flex items-center gap-2 text-xs text-ash">
                            <CalendarClock className="h-3.5 w-3.5" /> Jours restants
                          </span>
                          <span className={`font-display text-lg tracking-wide tabular-nums ${subDaysLeft != null && subDaysLeft <= 21 ? "text-gold" : "text-[#3ddc84]"}`}>
                            {subDaysLeft != null && subDaysLeft >= 0 ? `${subDaysLeft} j` : "Expiré"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* SOLDE & PROCHAINE ÉCHÉANCE */}
                  <div className="rounded-2xl border border-white/10 bg-coal p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
                      <Wallet className="h-3.5 w-3.5 text-ember" /> Mon solde
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11px] text-ash">Solde dû</p>
                        <p className={`font-display text-3xl tracking-wide ${data.balance > 0 ? "text-ember" : "text-[#3ddc84]"}`}>
                          {data.balance > 0 ? formatDH(data.balance) : "À jour"}
                        </p>
                      </div>
                      {data.balance <= 0 && <CheckCircle2 className="h-7 w-7 text-[#3ddc84]" />}
                    </div>
                    {data.nextDue && (
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-ember/25 bg-ember/[0.06] px-3 py-2.5">
                        <div>
                          <p className="text-xs font-semibold text-bone">{data.nextDue.label}</p>
                          <p className="text-[11px] text-ash">
                            Échéance {formatDateFR(data.nextDue.dueDate)}
                            {data.nextDue.daysLate > 0 && <span className="text-ember"> · en retard de {data.nextDue.daysLate} j</span>}
                          </p>
                        </div>
                        <span className="font-display text-base tracking-wide tabular-nums text-ember">{formatDH(data.nextDue.remaining)}</span>
                      </div>
                    )}
                  </div>

                  {/* PRÉSENCES */}
                  <div className="rounded-2xl border border-white/10 bg-coal p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
                      <Activity className="h-3.5 w-3.5 text-[#3aa0ff]" /> Mes présences
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat icon={<Activity className="h-4 w-4" />} label="Total" value={String(data.attendance.length)} color="#3aa0ff" />
                      <MiniStat icon={<Flame className="h-4 w-4" />} label="Série" value={String(member.attendanceStreak)} color="#ff3d2e" />
                      <MiniStat
                        icon={<Clock className="h-4 w-4" />}
                        label="Dernière"
                        value={member.lastAttendanceAt ? formatDateFR(member.lastAttendanceAt).slice(0, 5) : "—"}
                        color="#f5b730"
                      />
                    </div>
                    {data.attendance.length > 0 ? (
                      <div className="mt-3 space-y-1.5">
                        {data.attendance.slice(0, 4).map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-lg bg-ink/70 px-3 py-1.5 text-xs">
                            <span className="inline-flex items-center gap-2 text-bone">
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#3ddc84]" />
                              {formatDateFR(a.date)} · {a.checkInTime}
                            </span>
                            <Pill label={DISCIPLINE_LABELS[a.disciplineId]} color={DISCIPLINE_COLORS[a.disciplineId]} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-ash">Aucune présence enregistrée pour l'instant.</p>
                    )}
                  </div>

                  {/* DERNIÈRES TECHNIQUES */}
                  <div className="rounded-2xl border border-white/10 bg-coal p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
                        <Dumbbell className="h-3.5 w-3.5 text-ember" /> Mes dernières techniques
                      </div>
                      <span className="text-[11px] text-ash">{data.techniques.length}</span>
                    </div>
                    {data.techniques.length === 0 ? (
                      <p className="text-xs text-ash">Pas encore de technique travaillée en cours.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {data.techniques.slice(0, 10).map((t) => (
                          <span
                            key={t.technique.id}
                            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink px-2.5 py-1.5 text-[11px] text-bone"
                            title={`${t.count}× · dernière fois ${formatDateFR(t.lastDate)}`}
                          >
                            <Dumbbell className="h-3 w-3 text-ember" />
                            {t.technique.name}
                            <span className="font-bold text-ember">{t.count}×</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* barre de navigation factice (style appli) */}
                <div className="flex items-center justify-around border-t border-white/10 bg-coal px-6 py-3 text-[10px] text-ash">
                  {[
                    { icon: <Award className="h-4 w-4" />, label: "Grade" },
                    { icon: <Activity className="h-4 w-4" />, label: "Présences" },
                    { icon: <Wallet className="h-4 w-4" />, label: "Paiements" },
                    { icon: <Dumbbell className="h-4 w-4" />, label: "Techniques" },
                  ].map((n, i) => (
                    <span key={n.label} className={`flex flex-col items-center gap-1 ${i === 0 ? "text-ember" : ""}`}>
                      {n.icon}
                      {n.label}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-ash">
                Maquette indicative · données réelles de la démo, non modifiables ici.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
