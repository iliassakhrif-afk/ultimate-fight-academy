import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, AlertTriangle, Users, ClipboardCheck, UserPlus, Percent, Clock, ChevronRight, CalendarDays } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import {
  encaisseCeMois, impayesTotauxDH, membresActifs, presentsAujourdhui, nouveauxCeMois,
  tauxRecouvrement, caParMois, distributionByDiscipline, attendanceHeatmap, todayClasses,
  expirantSous, membresEnRetard, membresDecroches,
} from "../store/selectors";
import { formatDH, formatDateLong, MS_DAY, parseISO } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "../constants";
import StatCard from "../components/StatCard";
import BarChart from "../components/charts/BarChart";
import Donut from "../components/charts/Donut";
import Heatmap from "../components/charts/Heatmap";
import ProgressRing from "../components/charts/ProgressRing";
import { SectionCard } from "../components/EmptyState";
import Avatar from "../components/Avatar";

const REVENUE_GOAL = 70000;

export default function Dashboard() {
  const { db } = useStore();
  const nav = useNavigate();

  const ca = caParMois(db, 8);
  const enc = encaisseCeMois(db);
  const disc = distributionByDiscipline(db);
  const heat = attendanceHeatmap(db);
  const classes = todayClasses(db);
  const expiring = expirantSous(db, 14);
  const late = membresEnRetard(db);
  const dropoff = membresDecroches(db);

  const actionQueue = [
    { label: "Abonnements expirant < 14j", count: expiring.length, icon: Clock, color: "#f5b730", to: "/admin/abonnements" },
    { label: "Membres en retard de paiement", count: late.length, icon: Wallet, color: "#ff3d2e", to: "/admin/echeances" },
    { label: "Membres décrochés (> 21j)", count: dropoff.length, icon: AlertTriangle, color: "#ff8c2e", to: "/admin/membres" },
    { label: "Prospects & essais à suivre", count: db.members.filter((m) => m.status === "prospect" || m.status === "essai").length, icon: UserPlus, color: "#3aa0ff", to: "/admin/membres" },
  ];

  const kpis = [
    { label: "Encaissé ce mois", value: enc, format: formatDH, accent: "#3ddc84", icon: <Wallet className="h-4 w-4" />, spark: ca.map((c) => c.encaisse), to: "/admin/paiements" },
    { label: "Impayés en cours", value: impayesTotauxDH(db), format: formatDH, accent: "#ff3d2e", icon: <AlertTriangle className="h-4 w-4" />, to: "/admin/echeances" },
    { label: "Membres actifs", value: membresActifs(db), accent: "#3aa0ff", icon: <Users className="h-4 w-4" />, to: "/admin/membres" },
    { label: "Présents aujourd'hui", value: presentsAujourdhui(db), accent: "#f5b730", icon: <ClipboardCheck className="h-4 w-4" />, to: "/admin/presences" },
    { label: "Nouveaux ce mois", value: nouveauxCeMois(db), accent: "#ff5ea8", icon: <UserPlus className="h-4 w-4" />, to: "/admin/membres" },
    { label: "Taux de recouvrement", value: tauxRecouvrement(db), format: (n: number) => `${Math.round(n)} %`, accent: "#9b5cff", icon: <Percent className="h-4 w-4" />, to: "/admin/echeances" },
  ];

  const now = db.settings.demoClock;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">TABLEAU DE BORD</h1>
          <p className="mt-1 text-sm capitalize text-ash">{formatDateLong(now)}</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <StatCard key={k.label} index={i} label={k.label} value={k.value} format={k.format} accent={k.accent} icon={k.icon} spark={k.spark} onClick={() => nav(k.to)} />
        ))}
      </div>

      {/* Row: revenue + goal */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <SectionCard title="Chiffre d'affaires — facturé vs encaissé">
          <BarChart data={ca.map((c) => ({ label: c.label, a: c.facture, b: c.encaisse }))} />
        </SectionCard>
        <SectionCard title="Objectif du mois">
          <div className="flex flex-col items-center gap-4 py-2">
            <ProgressRing pct={(enc / REVENUE_GOAL) * 100} value={`${Math.round((enc / REVENUE_GOAL) * 100)}%`} label="atteint" size={150} />
            <div className="text-center">
              <div className="font-display text-2xl">{formatDH(enc)}</div>
              <div className="text-sm text-ash">sur un objectif de {formatDH(REVENUE_GOAL)}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Row: action queue + today classes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="À traiter aujourd'hui">
          <div className="space-y-2">
            {actionQueue.map((a) => (
              <button key={a.label} onClick={() => nav(a.to)} className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-ink px-4 py-3 text-left transition-colors hover:border-white/15">
                <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: a.color + "22", color: a.color }}><a.icon className="h-4 w-4" /></span>
                <span className="flex-1 text-sm text-bone">{a.label}</span>
                <span className="font-display text-xl" style={{ color: a.color }}>{a.count}</span>
                <ChevronRight className="h-4 w-4 text-ash" />
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cours d'aujourd'hui" action={<button onClick={() => nav("/admin/presences")} className="text-xs font-semibold text-ember">Check-in →</button>}>
          {classes.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-sm text-ash"><CalendarDays className="h-4 w-4" /> Aucun cours programmé aujourd'hui.</div>
          ) : (
            <div className="space-y-2">
              {classes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink px-4 py-3">
                  <span className="font-mono text-sm text-ember">{c.startTime}</span>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: DISCIPLINE_COLORS[c.disciplineId] }} />
                  <span className="flex-1 text-sm text-bone">{c.label}</span>
                  <span className="text-xs text-ash">{c.present}/{c.capacity}</span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (c.present / c.capacity) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Row: discipline donut + heatmap + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Membres par discipline">
          <Donut segments={disc.map((d) => ({ label: DISCIPLINE_LABELS[d.id], value: d.count, color: DISCIPLINE_COLORS[d.id] }))} centerValue={String(membresActifs(db))} centerLabel="actifs" />
        </SectionCard>

        <SectionCard title="Affluence par créneau" className="lg:col-span-1">
          <Heatmap data={heat} />
        </SectionCard>

        <SectionCard title="Activité récente">
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {db.activity.slice(0, 14).map((a, i) => {
              const m = a.memberId ? db.members.find((x) => x.id === a.memberId) : null;
              const days = Math.round((parseISO(now).getTime() - parseISO(a.timestamp.slice(0, 10)).getTime()) / MS_DAY);
              return (
                <motion.button
                  key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => m && nav(`/admin/membres/${m.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5"
                >
                  {m ? <Avatar first={m.firstName} last={m.lastName} size={28} /> : <span className="h-7 w-7 rounded-full bg-white/5" />}
                  <span className="flex-1 truncate text-sm text-bone">{a.summaryFR}</span>
                  {a.amountDH != null && <span className="text-xs font-semibold text-[#3ddc84]">+{formatDH(a.amountDH)}</span>}
                  <span className="text-[11px] text-ash">{days <= 0 ? "auj." : `${days}j`}</span>
                </motion.button>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
