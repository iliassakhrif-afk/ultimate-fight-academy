import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  TrendingUp,
  RefreshCw,
  Crown,
  Check,
  CalendarClock,
  AlarmClock,
  Layers,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { Modal } from "../components/Overlay";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH, formatDateFR, daysBetween } from "../store/format";
import type { Subscription, MembershipPlan, Member, PlanId } from "../types";
import StatCard from "../components/StatCard";
import DataTable, { type Column } from "../components/DataTable";
import { Pill } from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import EmptyState, { SectionCard } from "../components/EmptyState";
import WhatsAppReminder from "../components/WhatsAppReminder";
import Donut from "../components/charts/Donut";

// Métadonnées de statut d'abonnement (couleurs sémantiques propres à cette page)
const SUB_STATUS_META: Record<Subscription["status"], { label: string; color: string }> = {
  actif: { label: "Actif", color: "#3ddc84" },
  expire_bientot: { label: "Expire bientôt", color: "#f5b730" },
  expire: { label: "Expiré", color: "#ff3d2e" },
  gele: { label: "Gelé", color: "#3aa0ff" },
  annule: { label: "Annulé", color: "#6b6b73" },
  essai: { label: "Essai", color: "#3aa0ff" },
};

const PLAN_ACCENTS: Record<string, string> = {
  "plan-1disc": "#3aa0ff",
  "plan-2disc": "#9b5cff",
  "plan-fullpack": "#f5b730",
};

// Buckets du pipeline de renouvellement
const BUCKETS = [
  { key: "urgent", label: "≤ 7 jours", color: "#ff3d2e", icon: AlarmClock },
  { key: "proche", label: "≤ 30 jours", color: "#f5b730", icon: AlarmClock },
  { key: "horizon", label: "≤ 60 jours", color: "#3aa0ff", icon: CalendarClock },
] as const;

export default function Subscriptions() {
  const { db } = useStore();
  const navigate = useNavigate();
  const now = S.getNow(db);

  const memberById = useMemo(() => new Map(db.members.map((m) => [m.id, m])), [db.members]);
  const planById = useMemo(() => new Map(db.plans.map((p) => [p.id, p])), [db.plans]);

  // --- KPIs ---
  const abosActifs = useMemo(() => db.subscriptions.filter((s) => s.status === "actif").length, [db.subscriptions]);
  const mrr = S.mrrEstime(db);
  const renouvellements30 = S.expirantSous(db, 30).length;
  const totalNonAnnules = useMemo(() => db.subscriptions.filter((s) => s.status !== "annule").length, [db.subscriptions]);
  const fullPackCount = useMemo(
    () => db.subscriptions.filter((s) => s.status !== "annule" && s.planId === "plan-fullpack").length,
    [db.subscriptions]
  );
  const partFullPack = totalNonAnnules ? Math.round((fullPackCount / totalNonAnnules) * 100) : 0;

  // --- Pipeline de renouvellement : expirantSous(60) groupé par bucket ---
  const expirant = useMemo(() => {
    return S.expirantSous(db, 60)
      .map((sub) => ({ sub, days: daysBetween(sub.endDate, now), member: memberById.get(sub.memberId) }))
      .filter((x): x is { sub: Subscription; days: number; member: Member } => !!x.member)
      .sort((a, b) => a.days - b.days);
  }, [db, now, memberById]);

  const grouped = useMemo(() => {
    const out: Record<string, { sub: Subscription; days: number; member: Member }[]> = {
      urgent: [],
      proche: [],
      horizon: [],
    };
    expirant.forEach((x) => {
      if (x.days <= 7) out.urgent.push(x);
      else if (x.days <= 30) out.proche.push(x);
      else out.horizon.push(x);
    });
    return out;
  }, [expirant]);

  // --- Répartition par plan : compte d'abonnements (non annulés) ---
  const countByPlan = useMemo(() => {
    const map: Record<string, number> = {};
    db.subscriptions.filter((s) => s.status !== "annule").forEach((s) => {
      map[s.planId] = (map[s.planId] || 0) + 1;
    });
    return map;
  }, [db.subscriptions]);
  const maxPlanCount = Math.max(1, ...db.plans.map((p) => countByPlan[p.id] || 0));

  // --- Donut CA par plan ---
  const caPlanSegments = useMemo(() => {
    return S.caParPlan(db)
      .map((c) => ({
        label: planById.get(c.planId as PlanId)?.name ?? c.planId,
        value: c.total,
        color: PLAN_ACCENTS[c.planId as PlanId] ?? "#8a8a93",
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [db, planById]);
  const caPlanTotal = caPlanSegments.reduce((s, x) => s + x.value, 0);

  // --- Table des abonnements (non annulés) ---
  const activeSubs = useMemo(
    () => db.subscriptions.filter((s) => s.status !== "annule"),
    [db.subscriptions]
  );

  const columns: Column<Subscription>[] = [
    {
      key: "membre",
      header: "Membre",
      sortValue: (s) => {
        const m = memberById.get(s.memberId);
        return m ? `${m.lastName} ${m.firstName}` : "";
      },
      render: (s) => {
        const m = memberById.get(s.memberId);
        if (!m) return <span className="text-ash">—</span>;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/membres/${m.id}`); }}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-80"
          >
            <Avatar first={m.firstName} last={m.lastName} size={32} />
            <div className="leading-tight">
              <div className="font-medium text-bone">{m.firstName} {m.lastName}</div>
              <div className="font-mono text-[11px] text-ash">{m.memberNo}</div>
            </div>
          </button>
        );
      },
    },
    {
      key: "plan",
      header: "Formule",
      width: "150px",
      sortValue: (s) => s.planId,
      render: (s) => {
        const p = planById.get(s.planId);
        return <Pill label={p?.name ?? s.planId} color={PLAN_ACCENTS[s.planId] ?? "#8a8a93"} />;
      },
    },
    {
      key: "duree",
      header: "Durée",
      width: "90px",
      align: "center",
      sortValue: (s) => s.duration,
      render: (s) => <span className="text-sm text-ash">{s.duration}</span>,
    },
    {
      key: "debut",
      header: "Début",
      width: "110px",
      sortValue: (s) => s.startDate,
      render: (s) => <span className="text-sm text-ash">{formatDateFR(s.startDate)}</span>,
    },
    {
      key: "fin",
      header: "Fin",
      width: "110px",
      sortValue: (s) => s.endDate,
      render: (s) => <span className="text-sm text-bone">{formatDateFR(s.endDate)}</span>,
    },
    {
      key: "restant",
      header: "Jours restants",
      width: "120px",
      align: "right",
      sortValue: (s) => daysBetween(s.endDate, now),
      render: (s) => {
        const d = daysBetween(s.endDate, now);
        const color = d <= 7 ? "#ff3d2e" : d <= 30 ? "#f5b730" : "#3ddc84";
        const txt = d < 0 ? `${Math.abs(d)} j dépassés` : `${d} j`;
        return <span className="font-display tabular-nums" style={{ color }}>{txt}</span>;
      },
    },
    {
      key: "montant",
      header: "Montant",
      width: "120px",
      align: "right",
      sortValue: (s) => s.totalDH,
      render: (s) => <span className="font-display tabular-nums text-bone">{formatDH(s.totalDH)}</span>,
    },
    {
      key: "statut",
      header: "Statut",
      width: "130px",
      sortValue: (s) => s.status,
      render: (s) => <Pill label={SUB_STATUS_META[s.status].label} color={SUB_STATUS_META[s.status].color} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="font-display text-4xl tracking-wide">ABONNEMENTS & TARIFS</h1>
        <p className="text-ash">
          Formules, revenu récurrent et pipeline de renouvellement — {formatDateFR(now)}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Abonnements actifs" value={abosActifs} accent="#3ddc84" icon={<CreditCard className="h-4 w-4" />} index={0} />
        <StatCard label="MRR estimé" value={mrr} format={formatDH} accent="#ff3d2e" icon={<TrendingUp className="h-4 w-4" />} index={1} />
        <StatCard label="Renouvellements < 30j" value={renouvellements30} accent="#f5b730" icon={<RefreshCw className="h-4 w-4" />} index={2} />
        <StatCard label="Part Full Pack" value={partFullPack} format={(n) => `${n} %`} accent="#9b5cff" icon={<Crown className="h-4 w-4" />} index={3} />
      </div>

      {/* Cartes des formules (style vitrine) */}
      <SectionCard
        title="Nos formules"
        action={<span className="text-xs text-ash">Inscription {formatDH(db.plans[0]?.registrationFeeDH ?? 0)} · comptant ou échelonné</span>}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {db.plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} index={i} count={countByPlan[plan.id] || 0} />
          ))}
        </div>
      </SectionCard>

      {/* Exceptions de tarif */}
      <SectionCard
        title="Exceptions de tarif"
        action={<span className="text-xs text-ash">{db.priceExceptions.filter((e) => e.active).length} membre(s) avec tarif personnalisé</span>}
      >
        {db.priceExceptions.filter((e) => e.active).length === 0 ? (
          <p className="py-6 text-center text-sm text-ash">Aucune exception. Ajoutez-en depuis la fiche d'un membre (section « Tarif & exceptions »).</p>
        ) : (
          <div className="space-y-2">
            {db.priceExceptions.filter((e) => e.active).map((e) => {
              const m = db.members.find((x) => x.id === e.memberId);
              if (!m) return null;
              return (
                <button key={e.id} onClick={() => navigate(`/admin/membres/${m.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-ink px-4 py-2.5 text-left hover:border-white/15">
                  <Avatar first={m.firstName} last={m.lastName} size={30} />
                  <div className="flex-1 leading-tight">
                    <div className="text-sm font-medium text-bone">{m.firstName} {m.lastName}</div>
                    <div className="text-xs text-ash">{e.label}</div>
                  </div>
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold">
                    {e.type === "percent" ? `−${e.value}%` : e.type === "fixed" ? `−${formatDH(e.value)}` : `${formatDH(e.value)} imposé`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Pipeline de renouvellement */}
      <SectionCard
        title="Pipeline de renouvellement"
        action={<span className="text-xs text-ash">{expirant.length} abonnement{expirant.length > 1 ? "s" : ""} à échéance sous 60 jours</span>}
      >
        {expirant.length ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {BUCKETS.map((bucket, bi) => {
              const list = grouped[bucket.key];
              const Icon = bucket.icon;
              return (
                <motion.div
                  key={bucket.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * bi }}
                  className="rounded-2xl border border-white/10 bg-ink/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-bone">
                      <Icon className="h-4 w-4" style={{ color: bucket.color }} />
                      {bucket.label}
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: `${bucket.color}22`, color: bucket.color }}
                    >
                      {list.length}
                    </span>
                  </div>

                  {list.length ? (
                    <div className="space-y-2">
                      {list.map(({ sub, days, member }) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-coal/60 px-2.5 py-2"
                        >
                          <button
                            onClick={() => navigate(`/admin/membres/${member.id}`)}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left transition-opacity hover:opacity-80"
                          >
                            <Avatar first={member.firstName} last={member.lastName} size={32} />
                            <div className="min-w-0 leading-tight">
                              <div className="truncate font-medium text-bone">{member.firstName} {member.lastName}</div>
                              <div className="text-[11px] text-ash">
                                Fin {formatDateFR(sub.endDate)} ·{" "}
                                <span className="font-semibold" style={{ color: bucket.color }}>{days} j</span>
                              </div>
                            </div>
                          </button>
                          <WhatsAppReminder member={member} type="expiration" dueDate={sub.endDate} compact />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-ash">Rien dans ce créneau.</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarClock className="h-5 w-5" />}
            title="Aucun renouvellement imminent"
            hint="Tous les abonnements expirent au-delà de 60 jours."
          />
        )}
      </SectionCard>

      {/* Répartition par plan : barres + donut CA */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Répartition des abonnements par formule">
          <div className="space-y-4">
            {db.plans.map((plan, i) => {
              const c = countByPlan[plan.id] || 0;
              const pct = Math.round((c / maxPlanCount) * 100);
              const color = PLAN_ACCENTS[plan.id] ?? "#8a8a93";
              return (
                <div key={plan.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-bone">
                      <Layers className="h-3.5 w-3.5" style={{ color }} />
                      {plan.name}
                    </span>
                    <span className="font-display tabular-nums text-ash">
                      {c} abo{c > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.08 * i }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Chiffre d'affaires par formule">
          {caPlanSegments.length ? (
            <Donut segments={caPlanSegments} centerValue={formatDH(caPlanTotal)} centerLabel="total" />
          ) : (
            <EmptyState icon={<CreditCard className="h-5 w-5" />} title="Aucun CA" hint="Le revenu par formule s'affichera ici." />
          )}
        </SectionCard>
      </div>

      {/* Table des abonnements */}
      <SectionCard
        title="Abonnements en cours"
        action={<span className="text-xs text-ash">{activeSubs.length} abonnement{activeSubs.length > 1 ? "s" : ""}</span>}
      >
        {activeSubs.length ? (
          <DataTable
            columns={columns}
            data={activeSubs}
            onRowClick={(s) => navigate(`/admin/membres/${s.memberId}`)}
            initialSort={{ key: "restant", dir: "asc" }}
          />
        ) : (
          <EmptyState icon={<CreditCard className="h-5 w-5" />} title="Aucun abonnement" hint="Les abonnements actifs apparaîtront ici." />
        )}
      </SectionCard>
    </div>
  );
}

function PlanCard({ plan, index, count }: { plan: MembershipPlan; index: number; count: number }) {
  const { updatePlan } = useStore();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ price6mDH: plan.price6mDH, price12mDH: plan.price12mDH, classesPerWeek: plan.classesPerWeek, registrationFeeDH: plan.registrationFeeDH });
  const accent = PLAN_ACCENTS[plan.id] ?? "#8a8a93";
  const limit =
    plan.disciplineLimit === "toutes"
      ? "Toutes les disciplines"
      : `${plan.disciplineLimit} discipline${plan.disciplineLimit > 1 ? "s" : ""}`;
  const features = [
    `${plan.classesPerWeek} cours / semaine`,
    limit,
    `${plan.freeMonthsYearly} mois offerts sur 1 an`,
    `Inscription ${formatDH(plan.registrationFeeDH)}`,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index }}
      className={`relative flex flex-col rounded-2xl border bg-coal p-5 ${plan.featured ? "border-ember shadow-[0_0_40px_-12px_rgba(255,61,46,0.4)]" : "border-white/10"}`}
    >
      {plan.featured && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-ember px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone">
          <Crown className="h-3 w-3" /> Populaire
        </span>
      )}

      <button onClick={() => { setForm({ price6mDH: plan.price6mDH, price12mDH: plan.price12mDH, classesPerWeek: plan.classesPerWeek, registrationFeeDH: plan.registrationFeeDH }); setEdit(true); }}
        className={`absolute ${plan.featured ? "right-4 top-12" : "right-4 top-4"} grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-ash hover:text-bone`} title="Modifier le tarif">
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>
        Formule
      </div>
      <div className="mt-1 font-display text-2xl tracking-wide text-bone">{plan.name}</div>
      <div className="text-sm text-ash">{plan.sub}</div>

      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-3xl tracking-wide text-bone">{formatDH(plan.price6mDH)}</span>
        <span className="pb-1 text-xs text-ash">/ 6 mois</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="font-display tabular-nums text-gold">{formatDH(plan.price12mDH)}</span>
        <span className="text-xs text-ash">/ 1 an</span>
      </div>

      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-ash">
            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
        <span className="text-ash">Abonnés actuels</span>
        <span className="flex items-center gap-1.5 font-display tabular-nums text-bone">
          {count}
          <ArrowRight className="h-3.5 w-3.5" style={{ color: accent }} />
        </span>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title={`Tarif — ${plan.name}`}>
        <div className="space-y-4">
          {([
            ["price6mDH", "Prix 6 mois (DH)"],
            ["price12mDH", "Prix 1 an (DH)"],
            ["classesPerWeek", "Cours / semaine"],
            ["registrationFeeDH", "Frais d'inscription (DH)"],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">{label}</label>
              <input type="number" min={0} value={form[key]} onChange={(e) => { const v = Number(e.target.value); setForm((f) => ({ ...f, [key]: Number.isFinite(v) && v >= 0 ? v : 0 })); }} className="field text-right tabular-nums" />
            </div>
          ))}
          <button onClick={() => { updatePlan(plan.id, form); setEdit(false); }} className="btn-primary w-full">Enregistrer le tarif</button>
        </div>
      </Modal>
    </motion.div>
  );
}
