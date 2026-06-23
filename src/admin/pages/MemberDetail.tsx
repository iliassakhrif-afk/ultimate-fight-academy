import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Wallet, CalendarClock, Receipt, BadgeCheck, Award, Activity,
  Phone, MessageCircle, Mail, MapPin, Snowflake, Play, ShieldAlert, UserCog,
  TrendingUp, Plus, AlertTriangle, CalendarDays, Hash, Flame, Clock, Tag, Dumbbell,
} from "lucide-react";

import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH, formatDateFR, formatDateLong, daysBetween, ageFrom } from "../store/format";
import {
  DISCIPLINE_LABELS, DISCIPLINE_COLORS, INSTALLMENT_META,
  ADULT_BELTS, KIDS_BELTS,
} from "../constants";
import type { BeltRank, DisciplineId } from "../types";

import { StatusBadge, Pill } from "../components/StatusBadge";
import BeltPill from "../components/BeltPill";
import Avatar from "../components/Avatar";
import CountUp from "../components/CountUp";
import { Modal } from "../components/Overlay";
import EmptyState, { SectionCard } from "../components/EmptyState";
import CollectPaymentModal from "../components/CollectPaymentModal";
import WhatsAppReminder from "../components/WhatsAppReminder";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
});

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

export default function MemberDetail() {
  const { db, now, freezeMember, promote, addPriceException, removePriceException } = useStore();
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const member = db.members.find((m) => m.id === id) ?? null;

  const [collectInst, setCollectInst] = useState<string | null>(null);
  const [collectOpen, setCollectOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [excOpen, setExcOpen] = useState(false);

  const installments = useMemo(
    () => (member ? db.installments.filter((i) => i.memberId === id).sort((a, b) => a.sequence - b.sequence) : []),
    [db.installments, id, member],
  );
  const payments = useMemo(
    () => (member ? db.payments.filter((p) => p.memberId === id).sort((a, b) => b.paidAt.localeCompare(a.paidAt)) : []),
    [db.payments, id, member],
  );

  if (!member) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-4xl tracking-wide">Fiche membre</h1>
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="Membre introuvable"
          hint="Ce membre n'existe pas ou a été supprimé de la démo."
        />
        <Link to="/admin/membres" className="btn-ghost inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour aux membres
        </Link>
      </div>
    );
  }

  const balance = S.memberBalanceDH(db, member.id);
  const ltv = S.memberLTV(db, member.id);
  const sub = S.memberSubscription(db, member.id);
  const currentBelt = S.memberCurrentBelt(db, member.id);
  const attendance = S.memberAttendance(db, member.id);
  const attCount30 = S.memberAttendanceCount(db, member.id, 30);
  const age = ageFrom(member.birthDate, now);

  const nextOpen = installments.find((i) => i.status !== "paye") ?? null;
  const nextDaysLeft = nextOpen ? daysBetween(nextOpen.dueDate, now) : null;

  const belts = db.belts
    .filter((b) => b.memberId === member.id)
    .sort((a, b) => b.promotedAt.localeCompare(a.promotedAt));
  const isGraded = member.disciplineIds.includes("bjj") || member.disciplineIds.includes("kids");

  const plan = sub ? db.plans.find((p) => p.id === sub.planId) ?? null : null;
  const subDaysLeft = sub ? daysBetween(sub.endDate, now) : null;

  const medExpiry = member.medicalCertExpiry;
  const medExpired = medExpiry ? daysBetween(medExpiry, now) < 0 : false;
  const medSoon = medExpiry && !medExpired ? daysBetween(medExpiry, now) <= 30 : false;

  const openCollect = (installmentId: string | null) => {
    setCollectInst(installmentId);
    setCollectOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ============ EN-TÊTE ============ */}
      <motion.div {...fade(0)} className="relative overflow-hidden rounded-2xl border border-white/10 bg-coal p-6">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,61,46,0.20), transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar first={member.firstName} last={member.lastName} size={64} />
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-coal bg-ink text-[10px] font-bold text-gold">
                {member.gender}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl tracking-wide leading-none">
                  {member.firstName} {member.lastName}
                </h1>
                <StatusBadge status={member.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ash">
                <span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> {member.memberNo}</span>
                <span>{age} ans · {member.ageCategory}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {member.city}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {member.disciplineIds.map((d) => (
                  <Pill key={d} label={DISCIPLINE_LABELS[d]} color={DISCIPLINE_COLORS[d]} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-bone/80">
                <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1.5 hover:text-bone">
                  <Phone className="h-3.5 w-3.5 text-ash" /> {member.phone}
                </a>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> {member.whatsapp}
                </span>
                {member.email && (
                  <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1.5 hover:text-bone">
                    <Mail className="h-3.5 w-3.5 text-ash" /> {member.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button onClick={() => navigate("/admin/membres")} className="btn-ghost inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Membres
            </button>
            <button onClick={() => freezeMember(member.id)} className="btn-ghost inline-flex items-center gap-2">
              {member.status === "gele" ? (
                <><Play className="h-4 w-4 text-[#3ddc84]" /> Réactiver</>
              ) : (
                <><Snowflake className="h-4 w-4 text-gold" /> Geler</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ============ GRILLE 2 COLONNES ============ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* -------- COLONNE GAUCHE -------- */}
        <div className="space-y-6">
          {/* SOLDE */}
          <motion.div
            {...fade(1)}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-coal p-5"
          >
            {balance > 0 && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(120% 80% at 0% 0%, rgba(255,61,46,0.12), transparent 60%)" }}
              />
            )}
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-ash">Solde dû</p>
                <p className={`mt-1 font-display text-4xl tracking-wide ${balance > 0 ? "text-ember" : "text-[#3ddc84]"}`}>
                  <CountUp value={balance} format={formatDH} />
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ember/15 text-ember">
                <Wallet className="h-5 w-5" />
              </span>
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-xs text-ash">Total versé (LTV)</p>
                <p className="font-display text-xl tracking-wide text-bone">{formatDH(ltv)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ash">Prochaine échéance</p>
                {nextOpen ? (
                  <p className="font-semibold text-bone">
                    {formatDateFR(nextOpen.dueDate)}
                    <span className={`ml-2 text-xs ${nextDaysLeft != null && nextDaysLeft < 0 ? "text-ember" : "text-ash"}`}>
                      {nextDaysLeft != null && nextDaysLeft < 0
                        ? `EN RETARD de ${Math.abs(nextDaysLeft)} j`
                        : `dans ${nextDaysLeft} j`}
                    </span>
                  </p>
                ) : (
                  <p className="font-semibold text-[#3ddc84]">À jour</p>
                )}
              </div>
            </div>

            <button
              onClick={() => openCollect(nextOpen?.id ?? null)}
              disabled={balance <= 0}
              className="btn-primary relative mt-4 flex w-full items-center justify-center gap-2 disabled:opacity-40"
            >
              <Wallet className="h-4 w-4" /> Encaisser{balance > 0 ? ` ${formatDH(balance)}` : ""}
            </button>
          </motion.div>

          {/* ÉCHÉANCIER */}
          <motion.div {...fade(2)}>
            <SectionCard title="Échéancier">
              {installments.length === 0 ? (
                <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="Aucune échéance" hint="Paiement comptant ou pas d'abonnement actif." />
              ) : (
                <div className="space-y-3">
                  {installments.map((inst) => {
                    const pct = inst.amountDueDH > 0 ? (inst.amountPaidDH / inst.amountDueDH) * 100 : 100;
                    const c = INSTALLMENT_META[inst.status].color;
                    return (
                      <div key={inst.id} className="rounded-xl border border-white/10 bg-ink p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-bone">{inst.label}</p>
                            <p className="text-xs text-ash">Échéance {formatDateFR(inst.dueDate)}</p>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <span className="font-display text-base tracking-wide tabular-nums text-bone">{formatDH(inst.amountDueDH)}</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{ color: c, background: INSTALLMENT_META[inst.status].bg }}>
                              {INSTALLMENT_META[inst.status].label}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <Bar pct={pct} color={c} />
                          <span className="shrink-0 text-[11px] tabular-nums text-ash">
                            {formatDH(inst.amountPaidDH)} / {formatDH(inst.amountDueDH)}
                          </span>
                          {inst.status !== "paye" && (
                            <button
                              onClick={() => openCollect(inst.id)}
                              className="shrink-0 rounded-lg bg-ember/15 px-2.5 py-1 text-xs font-semibold text-ember hover:bg-ember/25"
                            >
                              Encaisser
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* HISTORIQUE PAIEMENTS */}
          <motion.div {...fade(3)}>
            <SectionCard title="Historique des paiements">
              {payments.length === 0 ? (
                <EmptyState icon={<Receipt className="h-6 w-6" />} title="Aucun paiement" hint="Les reçus émis apparaîtront ici." />
              ) : (
                <div className="divide-y divide-white/5">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#3ddc84]/12 text-[#3ddc84]">
                          <Receipt className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-bone">
                            {p.receiptNo} · <span className="capitalize text-ash">{p.type}</span>
                          </p>
                          <p className="text-xs text-ash">{formatDateFR(p.paidAt)} · {p.method}</p>
                        </div>
                      </div>
                      <span className="font-display text-base tracking-wide tabular-nums text-[#3ddc84]">+{formatDH(p.amountDH)}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        {/* -------- COLONNE DROITE -------- */}
        <div className="space-y-6">
          {/* ABONNEMENT */}
          <motion.div {...fade(1)}>
            <SectionCard title="Abonnement">
              {!sub ? (
                <EmptyState icon={<BadgeCheck className="h-6 w-6" />} title="Pas d'abonnement actif" hint="Ce membre n'a pas de formule en cours." />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl tracking-wide text-bone">{plan?.name ?? sub.planId}</p>
                      <p className="text-sm text-ash">{sub.duration} · {sub.paymentMode === "echelonne" ? `${sub.installmentsCount} échéances` : "Comptant"}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        color: sub.status === "actif" ? "#3ddc84" : sub.status === "expire" ? "#ff3d2e" : "#f5b730",
                        background: sub.status === "actif" ? "rgba(61,220,132,0.14)" : sub.status === "expire" ? "rgba(255,61,46,0.14)" : "rgba(245,183,48,0.14)",
                      }}>
                      {sub.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-ink p-3 text-center">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ash">Début</p>
                      <p className="mt-0.5 text-sm font-semibold text-bone">{formatDateFR(sub.startDate)}</p>
                    </div>
                    <div className="border-x border-white/10">
                      <p className="text-[11px] uppercase tracking-wider text-ash">Fin</p>
                      <p className="mt-0.5 text-sm font-semibold text-bone">{formatDateFR(sub.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ash">Restant</p>
                      <p className={`mt-0.5 text-sm font-semibold ${subDaysLeft != null && subDaysLeft <= 21 ? "text-gold" : "text-bone"}`}>
                        {subDaysLeft != null && subDaysLeft >= 0 ? `${subDaysLeft} j` : "Expiré"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {sub.disciplineIds.map((d: DisciplineId) => (
                      <Pill key={d} label={DISCIPLINE_LABELS[d]} color={DISCIPLINE_COLORS[d]} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                    <span className="text-ash">Montant total{sub.discountLabel ? ` · ${sub.discountLabel}` : ""}</span>
                    <span className="font-display text-lg tracking-wide tabular-nums text-gold">{formatDH(sub.totalDH)}</span>
                  </div>
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* TARIF & EXCEPTIONS */}
          <motion.div {...fade(2)}>
            <SectionCard
              title="Tarif & exceptions"
              action={
                <button onClick={() => setExcOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ash hover:text-bone">
                  <Tag className="h-3.5 w-3.5" /> Exception
                </button>
              }
            >
              {(() => {
                const base = sub?.basePriceDH ?? (plan ? plan.price12mDH : 0);
                const eff = S.effectivePrice(db, base, member.id);
                const exc = S.activePriceException(db, member.id);
                return (
                  <div className="space-y-3">
                    <div className="flex items-end justify-between rounded-xl border border-white/10 bg-ink p-4">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-ash">Tarif appliqué</div>
                        <div className="mt-1 font-display text-2xl tracking-wide tabular-nums text-gold">{formatDH(eff.price)}</div>
                      </div>
                      {eff.discount > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-ash line-through">{formatDH(eff.base)}</div>
                          <div className="text-sm font-semibold text-[#3ddc84]">−{formatDH(eff.discount)}</div>
                        </div>
                      )}
                    </div>
                    {exc ? (
                      <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-gold">{exc.label}</div>
                          <div className="text-xs text-ash">
                            {exc.type === "percent" ? `−${exc.value}%` : exc.type === "fixed" ? `−${formatDH(exc.value)}` : `Prix imposé ${formatDH(exc.value)}`}
                          </div>
                        </div>
                        <button onClick={() => removePriceException(exc.id)} className="text-xs font-semibold text-ember hover:underline">Retirer</button>
                      </div>
                    ) : (
                      <p className="text-sm text-ash">Aucune exception. Le membre paie le tarif standard de sa formule.</p>
                    )}
                  </div>
                );
              })()}
            </SectionCard>
          </motion.div>

          {/* CEINTURE & GRADE */}
          {isGraded && (
            <motion.div {...fade(2)}>
              <SectionCard
                title="Ceinture & grade"
                action={
                  <button onClick={() => setPromoteOpen(true)} className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Promouvoir
                  </button>
                }
              >
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink p-3">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-gold" />
                    {currentBelt ? (
                      <BeltPill rank={currentBelt.beltRank} stripes={currentBelt.stripes} />
                    ) : (
                      <span className="text-sm text-ash">Non gradé</span>
                    )}
                  </div>
                  {currentBelt && (
                    <span className="text-xs text-ash">depuis le {formatDateFR(currentBelt.promotedAt)}</span>
                  )}
                </div>

                {belts.length > 0 && (
                  <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
                    {belts.map((b) => (
                      <div key={b.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-coal"
                          style={{ background: b.isCurrent ? "#f5b730" : "#5a5a62" }} />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <BeltPill rank={b.beltRank} stripes={b.stripes} />
                          <span className="text-xs text-ash">{formatDateFR(b.promotedAt)}</span>
                        </div>
                        {b.note && <p className="mt-0.5 text-xs text-ash">{b.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </motion.div>
          )}

          {/* PRÉSENCES */}
          <motion.div {...fade(3)}>
            <SectionCard title="Présences">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "total", icon: <Activity className="h-4 w-4" />, label: "Total", value: attendance.length, color: "#3aa0ff" },
                  { key: "30j", icon: <TrendingUp className="h-4 w-4" />, label: "30 j", value: attCount30, color: "#3ddc84" },
                  { key: "serie", icon: <Flame className="h-4 w-4" />, label: "Série", value: member.attendanceStreak, color: "#ff3d2e" },
                ].map((s) => (
                  <div key={s.key} className="rounded-xl border border-white/10 bg-ink p-3 text-center">
                    <span className="inline-flex" style={{ color: s.color }}>{s.icon}</span>
                    <p className="mt-1 font-display text-2xl tracking-wide text-bone">{s.value}</p>
                    <p className="text-[11px] text-ash">{s.label}</p>
                  </div>
                ))}
                <div className="rounded-xl border border-white/10 bg-ink p-3 text-center">
                  <span className="inline-flex text-gold"><Clock className="h-4 w-4" /></span>
                  <p className="mt-1 text-xs font-semibold text-bone">
                    {member.lastAttendanceAt ? formatDateFR(member.lastAttendanceAt) : "—"}
                  </p>
                  <p className="text-[11px] text-ash">Dernière</p>
                </div>
              </div>

              {attendance.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {attendance.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-ink/60 px-3 py-1.5 text-xs">
                      <span className="inline-flex items-center gap-2 text-bone">
                        <CalendarDays className="h-3.5 w-3.5 text-ash" />
                        {formatDateFR(a.date)} · {a.checkInTime}
                      </span>
                      <Pill label={DISCIPLINE_LABELS[a.disciplineId]} color={DISCIPLINE_COLORS[a.disciplineId]} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* TECHNIQUES TRAVAILLÉES */}
          {(() => {
            const techs = S.memberTechniques(db, member.id);
            if (techs.length === 0) return null;
            return (
              <motion.div {...fade(3)}>
                <SectionCard title="Techniques travaillées" action={<span className="text-xs text-ash">{techs.length}</span>}>
                  <div className="flex flex-wrap gap-2">
                    {techs.slice(0, 12).map((t) => (
                      <span key={t.technique.id} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink px-2.5 py-1.5 text-xs text-bone" title={`${t.count}× · dernière fois ${formatDateFR(t.lastDate)}`}>
                        <Dumbbell className="h-3 w-3 text-ember" />
                        {t.technique.name}
                        <span className="font-bold text-ember">{t.count}×</span>
                      </span>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            );
          })()}

          {/* RELANCE WHATSAPP */}
          {balance > 0 && (
            <motion.div {...fade(4)}>
              <SectionCard title="Relance WhatsApp">
                <WhatsAppReminder
                  member={member}
                  type="paiement"
                  amount={balance}
                  dueDate={nextOpen?.dueDate}
                />
              </SectionCard>
            </motion.div>
          )}

          {/* RESPONSABLE + CERTIFICAT MÉDICAL */}
          {(member.guardianName || medExpiry) && (
            <motion.div {...fade(5)}>
              <SectionCard title="Responsable & dossier médical">
                <div className="space-y-3">
                  {member.guardianName && (
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink p-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-ash">
                        <UserCog className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-bone">{member.guardianName}</p>
                        <p className="text-xs text-ash">
                          Tuteur · {member.emergencyContactName} ({member.emergencyContactPhone})
                        </p>
                      </div>
                    </div>
                  )}
                  {medExpiry && (
                    <div
                      className="flex items-center justify-between gap-3 rounded-xl border p-3"
                      style={{
                        borderColor: medExpired ? "rgba(255,61,46,0.4)" : medSoon ? "rgba(245,183,48,0.4)" : "rgba(255,255,255,0.1)",
                        background: medExpired ? "rgba(255,61,46,0.08)" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg"
                          style={{ background: medExpired ? "rgba(255,61,46,0.15)" : "rgba(255,255,255,0.05)", color: medExpired ? "#ff3d2e" : "#8a8a93" }}>
                          {medExpired ? <AlertTriangle className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-bone">Certificat médical</p>
                          <p className="text-xs text-ash">Valide jusqu'au {formatDateLong(medExpiry)}</p>
                        </div>
                      </div>
                      {medExpired ? (
                        <Pill label="Expiré" color="#ff3d2e" />
                      ) : medSoon ? (
                        <Pill label="Bientôt" color="#f5b730" />
                      ) : (
                        <Pill label="Valide" color="#3ddc84" />
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            </motion.div>
          )}
        </div>
      </div>

      {/* ============ MODALES ============ */}
      <CollectPaymentModal
        open={collectOpen}
        onClose={() => setCollectOpen(false)}
        memberId={member.id}
        installmentId={collectInst}
        defaultAmount={collectInst ? (() => { const i = installments.find((x) => x.id === collectInst); return i ? Math.max(0, i.amountDueDH - i.amountPaidDH) : undefined; })() : undefined}
      />

      <PromoteModal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        ageCategory={member.ageCategory}
        disciplineIds={member.disciplineIds}
        currentRank={currentBelt?.beltRank ?? null}
        onConfirm={(discipline, rank, stripes, note) => {
          promote(member.id, discipline, rank, stripes, note);
          setPromoteOpen(false);
        }}
      />

      <ExceptionModal
        open={excOpen}
        onClose={() => setExcOpen(false)}
        onConfirm={(e) => { addPriceException(member.id, e); setExcOpen(false); }}
      />
    </div>
  );
}

/* ---------------- Modale Exception de prix ---------------- */
function ExceptionModal({
  open, onClose, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (e: { label: string; type: "percent" | "fixed" | "override"; value: number }) => void;
}) {
  const [label, setLabel] = useState("Réduction famille");
  const [type, setType] = useState<"percent" | "fixed" | "override">("percent");
  const [value, setValue] = useState(20);
  return (
    <Modal open={open} onClose={onClose} title="Exception de tarif">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Motif</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="field" placeholder="Ex. Réduction famille" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {([["percent", "Remise %"], ["fixed", "Remise DH"], ["override", "Prix imposé"]] as const).map(([t, lbl]) => (
              <button key={t} onClick={() => setType(t)} className={`rounded-xl border px-2 py-2.5 text-xs font-semibold ${type === t ? "border-ember bg-ember/15 text-ember" : "border-white/10 text-ash hover:text-bone"}`}>{lbl}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">{type === "percent" ? "Pourcentage (%)" : "Montant (DH)"}</label>
          <input type="number" value={value} min={0} max={type === "percent" ? 100 : undefined} onChange={(e) => { const v = Number(e.target.value); setValue(Number.isFinite(v) && v >= 0 ? v : 0); }} className="field text-right tabular-nums" />
        </div>
        <button onClick={() => label.trim() && onConfirm({ label: label.trim(), type, value: type === "percent" ? Math.min(100, value) : value })} className="btn-primary w-full">Appliquer l'exception</button>
      </div>
    </Modal>
  );
}

/* ---------------- Modale Promotion ---------------- */
function PromoteModal({
  open, onClose, ageCategory, disciplineIds, currentRank, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  ageCategory: "enfant" | "ado" | "adulte";
  disciplineIds: DisciplineId[];
  currentRank: BeltRank | null;
  onConfirm: (discipline: DisciplineId, rank: BeltRank, stripes: number, note: string) => void;
}) {
  const isKids = ageCategory === "enfant";
  const ranks: BeltRank[] = isKids ? KIDS_BELTS : ADULT_BELTS;
  const gradeDisc = disciplineIds.filter((d) => d === "bjj" || d === "kids");

  const [discipline, setDiscipline] = useState<DisciplineId>(gradeDisc[0] ?? "bjj");
  const [rank, setRank] = useState<BeltRank>(currentRank && ranks.includes(currentRank) ? currentRank : ranks[0]);
  const [stripes, setStripes] = useState(0);
  const [note, setNote] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Promouvoir le membre">
      <div className="space-y-4">
        {gradeDisc.length > 1 && (
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-ash">Discipline</label>
            <div className="flex gap-2">
              {gradeDisc.map((d) => (
                <button
                  key={d}
                  onClick={() => setDiscipline(d)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${discipline === d ? "border-ember/50 bg-ember/15 text-ember" : "border-white/10 text-ash hover:text-bone"}`}
                >
                  {DISCIPLINE_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ash">Nouvelle ceinture</label>
          <div className="grid grid-cols-2 gap-2">
            {ranks.map((r) => (
              <button
                key={r}
                onClick={() => setRank(r)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left ${rank === r ? "border-gold/50 bg-gold/10" : "border-white/10 hover:border-white/20"}`}
              >
                <BeltPill rank={r} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ash">Barres</label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setStripes(s)}
                className={`h-10 flex-1 rounded-xl border text-sm font-bold ${stripes === s ? "border-ember/50 bg-ember/15 text-ember" : "border-white/10 text-ash hover:text-bone"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ash">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ex. : progression remarquable au sol…"
            className="field w-full resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button onClick={() => onConfirm(discipline, rank, stripes, note)} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
            <Award className="h-4 w-4" /> Promouvoir
          </button>
        </div>
      </div>
    </Modal>
  );
}
