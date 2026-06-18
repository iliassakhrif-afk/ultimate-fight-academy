import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingDown, Repeat, Coins, ArrowUpRight, Activity, Flame, AlertTriangle,
  Wallet, Gauge, ShoppingBag, BarChart3, ChevronRight,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH, formatNum, daysBetween } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "../constants";
import type { MembershipPlan } from "../types";
import StatCard from "../components/StatCard";
import { Pill } from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import BarChart from "../components/charts/BarChart";
import Donut from "../components/charts/Donut";
import Heatmap from "../components/charts/Heatmap";
import Sparkline from "../components/charts/Sparkline";
import { SectionCard } from "../components/EmptyState";
import WhatsAppReminder from "../components/WhatsAppReminder";

const RISK_META = {
  risque: { label: "À risque", color: "#ff3d2e" },
  tiede: { label: "Tiède", color: "#f5b730" },
} as const;

const fade = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05 },
});

export default function Analytics() {
  const { db } = useStore();
  const nav = useNavigate();
  const now = db.settings.demoClock;

  // --- Croissance / effectif / fréquentation ---
  const ca = S.caParMois(db, 8);
  const disc = S.distributionByDiscipline(db);
  const heat = S.attendanceHeatmap(db);

  // --- Rétention & croissance nette ---
  const retention = useMemo(() => {
    const actifs = S.membresActifs(db);
    const churned = db.members.filter((m) => m.status === "churn").length;
    const base = actifs + churned;
    const nouveaux = S.nouveauxCeMois(db);
    const partis = db.members.filter(
      (m) => m.status === "churn" || m.status === "expire"
    ).length;
    const churnPct = base ? Math.round((churned / base) * 100) : 0;
    const retentionPct = 100 - churnPct;
    const croissanceNette = nouveaux - partis;
    return { actifs, churnPct, retentionPct, nouveaux, partis, croissanceNette };
  }, [db]);

  // --- LTV moyenne (moyenne des membres non churn) ---
  const ltvMoy = useMemo(() => {
    const ms = db.members.filter((m) => m.status !== "churn");
    if (!ms.length) return 0;
    return Math.round(ms.reduce((s, m) => s + S.memberLTV(db, m.id), 0) / ms.length);
  }, [db]);

  // --- Membres à risque (risque + tiède) ---
  const atRisk = useMemo(() => {
    return db.members
      .map((m) => ({ m, risk: S.memberRisk(db, m) }))
      .filter((x): x is { m: typeof x.m; risk: "risque" | "tiede" } => x.risk === "risque" || x.risk === "tiede")
      .map(({ m, risk }) => {
        const sub = S.memberSubscription(db, m.id);
        const sansVenue = m.lastAttendanceAt ? daysBetween(now, m.lastAttendanceAt) : 999;
        const solde = S.memberBalanceDH(db, m.id);
        const expDans = sub ? daysBetween(sub.endDate, now) : null;
        return { m, risk, sansVenue, solde, expDans };
      })
      .sort((a, b) =>
        a.risk === b.risk ? b.sansVenue - a.sansVenue : a.risk === "risque" ? -1 : 1
      );
  }, [db, now]);

  // --- CA par plan (Donut) ---
  const planById = useMemo(() => {
    const map: Record<string, MembershipPlan> = {};
    db.plans.forEach((p) => { map[p.id] = p; });
    return map;
  }, [db]);
  const caPlan = S.caParPlan(db);
  const planColors: Record<string, string> = {
    "plan-1disc": "#3aa0ff",
    "plan-2disc": "#f5b730",
    "plan-fullpack": "#ff3d2e",
  };

  const maxDisc = Math.max(...disc.map((d) => d.count), 1);

  // --- KPIs rétention (haut) ---
  const kpis = [
    {
      label: "Churn mensuel", value: retention.churnPct,
      format: (n: number) => `${n} %`, accent: "#ff3d2e",
      icon: <TrendingDown className="h-4 w-4" />,
    },
    {
      label: "Rétention estimée", value: retention.retentionPct,
      format: (n: number) => `${n} %`, accent: "#3ddc84",
      icon: <Repeat className="h-4 w-4" />,
    },
    {
      label: "LTV moyenne", value: ltvMoy, format: formatDH, accent: "#f5b730",
      icon: <Coins className="h-4 w-4" />, spark: ca.map((c) => c.encaisse),
    },
    {
      label: "Croissance nette", value: retention.croissanceNette,
      format: (n: number) => `${n >= 0 ? "+" : ""}${formatNum(n)}`,
      accent: "#9b5cff", icon: <ArrowUpRight className="h-4 w-4" />,
      delta: { value: retention.nouveaux, positive: retention.croissanceNette >= 0 },
    },
  ];

  // --- Indicateurs financiers (bas) ---
  const encaisseTotal = db.payments.reduce((s, p) => s + p.amountDH, 0);
  const fin = [
    { label: "Encaissé total", value: encaisseTotal, format: formatDH, accent: "#3ddc84", icon: <Wallet className="h-4 w-4" /> },
    { label: "Panier moyen", value: S.panierMoyen(db), format: formatDH, accent: "#3aa0ff", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "MRR estimé", value: Math.round(S.mrrEstime(db)), format: formatDH, accent: "#f5b730", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Taux de recouvrement", value: S.tauxRecouvrement(db), format: (n: number) => `${Math.round(n)} %`, accent: "#ff3d2e", icon: <Gauge className="h-4 w-4" /> },
  ];

  const riskMotif = (r: typeof atRisk[number]): string => {
    const parts: string[] = [];
    if (r.sansVenue >= 999) parts.push("jamais venu");
    else if (r.sansVenue > 12) parts.push(`${r.sansVenue}j sans venir`);
    if (r.solde > 0) parts.push(`solde ${formatDH(r.solde)}`);
    if (r.expDans != null && r.expDans >= 0 && r.expDans <= 21)
      parts.push(`expire dans ${r.expDans}j`);
    return parts.length ? parts.join(" · ") : "signaux faibles";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">STATISTIQUES & RÉTENTION</h1>
          <p className="mt-1 text-sm text-ash">
            Cockpit décisionnel — churn, fidélisation, valeur vie client et membres à reconquérir.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-coal px-3 py-1.5 text-xs font-semibold text-ash">
          <Activity className="h-3.5 w-3.5 text-ember" /> {formatNum(retention.actifs)} membres actifs suivis
        </span>
      </div>

      {/* KPI rétention */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <StatCard key={k.label} index={i} label={k.label} value={k.value} format={k.format}
            accent={k.accent} icon={k.icon} spark={k.spark} delta={k.delta} />
        ))}
      </div>

      {/* Croissance + classement disciplines */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <SectionCard
          title="Croissance & activité (8 mois)"
          action={
            <span className="flex items-center gap-2 text-xs text-ash">
              Tendance encaissé
              <Sparkline data={ca.map((c) => c.encaisse)} color="#3ddc84" width={70} height={22} />
            </span>
          }
        >
          <BarChart data={ca.map((c) => ({ label: c.label, a: c.facture, b: c.encaisse }))} />
        </SectionCard>

        <SectionCard title="Classement disciplines">
          <div className="space-y-3">
            {disc.map((d, i) => (
              <motion.div key={d.id} {...fade(i)} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-bone">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DISCIPLINE_COLORS[d.id] }} />
                    {DISCIPLINE_LABELS[d.id]}
                  </span>
                  <span className="font-display tabular-nums text-bone">{d.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.count / maxDisc) * 100}%` }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: DISCIPLINE_COLORS[d.id] }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Heatmap + CA par plan */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <SectionCard
          title="Heatmap fréquentation"
          action={<span className="text-xs text-ash">Cases pâles = heures creuses</span>}
        >
          <Heatmap data={heat} />
          <div className="mt-3 flex items-center gap-2 text-[11px] text-ash">
            <span>Creux</span>
            <span className="h-2.5 w-24 rounded-full" style={{ background: "linear-gradient(90deg, rgba(255,61,46,0.15), rgba(255,61,46,0.9))" }} />
            <span>Affluence</span>
          </div>
        </SectionCard>

        <SectionCard title="Chiffre d'affaires par plan">
          <Donut
            segments={caPlan.map((p) => ({
              label: planById[p.planId]?.name ?? p.planId,
              value: p.total,
              color: planColors[p.planId] ?? "#8a8a93",
            }))}
            centerValue={formatDH(caPlan.reduce((s, p) => s + p.total, 0))}
            centerLabel="facturé"
          />
        </SectionCard>
      </div>

      {/* Membres à risque */}
      <SectionCard
        title="Membres à risque"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/15 px-3 py-1 text-xs font-semibold text-ember">
            <Flame className="h-3.5 w-3.5" /> {atRisk.filter((r) => r.risk === "risque").length} critiques
          </span>
        }
      >
        {atRisk.length === 0 ? (
          <div className="flex items-center gap-2 py-8 text-sm text-ash">
            <AlertTriangle className="h-4 w-4" /> Aucun membre à risque — rétention au top.
          </div>
        ) : (
          <div className="space-y-2">
            {atRisk.slice(0, 12).map((r, i) => (
              <motion.div
                key={r.m.id} {...fade(i)}
                className="group flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-ink px-4 py-3 transition-colors hover:border-white/15"
              >
                <button
                  onClick={() => nav(`/admin/membres/${r.m.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Avatar first={r.m.firstName} last={r.m.lastName} size={36} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-bone">
                      {r.m.firstName} {r.m.lastName}
                      <ChevronRight className="h-3.5 w-3.5 text-ash opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="truncate text-xs text-ash">{riskMotif(r)}</span>
                  </span>
                </button>

                <span className="ml-auto hidden w-24 text-right font-display tabular-nums text-sm sm:block"
                  style={{ color: r.solde > 0 ? "#ff3d2e" : "#6b6b73" }}>
                  {r.solde > 0 ? formatDH(r.solde) : "—"}
                </span>

                <Pill label={RISK_META[r.risk].label} color={RISK_META[r.risk].color} />
                <WhatsAppReminder member={r.m} type="decrochage" compact />
              </motion.div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Indicateurs financiers */}
      <div>
        <h2 className="mb-3 font-display text-lg tracking-wide text-bone">Indicateurs financiers</h2>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {fin.map((k, i) => (
            <StatCard key={k.label} index={i} label={k.label} value={k.value}
              format={k.format} accent={k.accent} icon={k.icon} />
          ))}
        </div>
      </div>
    </div>
  );
}
