import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  AlarmClock,
  Flame,
  ShieldCheck,
  HandCoins,
  Inbox,
  ArrowUpRight,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH, formatDateFR, daysBetween } from "../store/format";
import type { Installment, Member } from "../types";
import StatCard from "../components/StatCard";
import { InstallmentBadge, Pill } from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import CollectPaymentModal from "../components/CollectPaymentModal";
import WhatsAppReminder from "../components/WhatsAppReminder";
import AgingBars from "../components/charts/AgingBars";
import EmptyState, { SectionCard } from "../components/EmptyState";

type OpenInstallment = Installment & { daysLate: number; remaining: number };
type TabId = "retard" | "bientot" | "tous";

const TABS: { id: TabId; label: string }[] = [
  { id: "retard", label: "En retard" },
  { id: "bientot", label: "Dû bientôt" },
  { id: "tous", label: "Tous impayés" },
];

// Escalade visuelle ambre → ember selon l'ancienneté de la dette.
function lateMeta(daysLate: number): { color: string; label: string } {
  if (daysLate <= 0) return { color: "#f5b730", label: "À échoir" };
  if (daysLate <= 7) return { color: "#f5b730", label: `${daysLate}j` };
  if (daysLate <= 30) return { color: "#ff8c2e", label: `${daysLate}j` };
  return { color: "#ff3d2e", label: `${daysLate}j` };
}

export default function DuesReminders() {
  const { db } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("retard");
  const [collect, setCollect] = useState<{ memberId: string; installmentId: string; amount: number } | null>(null);

  const impayes = S.impayesTotauxDH(db);
  const enRetard = S.membresEnRetard(db);
  const aging = S.agingBuckets(db);
  const recouvrement = S.tauxRecouvrement(db);
  const open = S.openInstallments(db) as OpenInstallment[];
  const memberById = useMemo(() => new Map(db.members.map((m) => [m.id, m])), [db.members]);

  // Échéances "dû bientôt": en attente, non échues, dueDate dans les 7 prochains jours.
  const bientot = useMemo<OpenInstallment[]>(() => {
    const now = S.getNow(db);
    return db.installments
      .filter((i) => {
        if (i.status !== "en_attente") return false;
        const d = daysBetween(i.dueDate, now); // jours avant échéance
        return d >= 0 && d <= 7;
      })
      .map((i) => ({ ...i, daysLate: -daysBetween(i.dueDate, now), remaining: i.amountDueDH - i.amountPaidDH }))
      .sort((a, b) => a.daysLate - b.daysLate);
  }, [db]);

  const tousImpayes = useMemo<OpenInstallment[]>(() => {
    const now = S.getNow(db);
    return db.installments
      .filter((i) => i.amountDueDH - i.amountPaidDH > 0)
      .map((i) => ({ ...i, daysLate: daysBetween(now, i.dueDate), remaining: i.amountDueDH - i.amountPaidDH }))
      .sort((a, b) => b.daysLate - a.daysLate);
  }, [db]);

  const rows: OpenInstallment[] = tab === "retard" ? open : tab === "bientot" ? bientot : tousImpayes;

  // Top débiteurs (solde restant décroissant).
  const topDebiteurs = useMemo(() => {
    return enRetard
      .map((m) => ({ member: m, balance: S.memberBalanceDH(db, m.id) }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [enRetard, db]);
  const maxBalance = Math.max(...topDebiteurs.map((d) => d.balance), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">ÉCHÉANCES &amp; RELANCES</h1>
        <p className="text-ash">Recouvrement, priorisation des relances et suivi de la dette client.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Impayés totaux"
          value={impayes}
          format={formatDH}
          accent="#ff3d2e"
          icon={<Wallet className="h-5 w-5" />}
          index={0}
        />
        <StatCard
          label="Membres en retard"
          value={enRetard.length}
          accent="#ff8c2e"
          icon={<AlarmClock className="h-5 w-5" />}
          index={1}
        />
        <StatCard
          label="Dette +30 jours"
          value={aging.b30plus}
          format={formatDH}
          accent="#ff3d2e"
          icon={<Flame className="h-5 w-5" />}
          index={2}
        />
        <StatCard
          label="Taux de recouvrement"
          value={recouvrement}
          format={(n) => `${n}%`}
          accent="#3ddc84"
          icon={<ShieldCheck className="h-5 w-5" />}
          index={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aging */}
        <SectionCard title="Ancienneté de la dette" className="lg:col-span-1">
          <AgingBars buckets={aging} />
          <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
            <span className="text-xs uppercase tracking-wider text-ash">Total dû</span>
            <span className="font-display text-2xl text-ember">{formatDH(impayes)}</span>
          </div>
        </SectionCard>

        {/* Top débiteurs */}
        <SectionCard title="Top débiteurs" className="lg:col-span-2">
          {topDebiteurs.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="Aucune dette en cours" hint="Tous les membres sont à jour." />
          ) : (
            <ul className="space-y-3">
              {topDebiteurs.map((d, i) => (
                <DebtorRow
                  key={d.member.id}
                  member={d.member}
                  balance={d.balance}
                  pct={(d.balance / maxBalance) * 100}
                  index={i}
                  onOpen={() => navigate(`/admin/membres/${d.member.id}`)}
                />
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Onglets + liste priorisée */}
      <SectionCard
        title="File de relances"
        action={
          <div className="flex gap-1 rounded-xl border border-white/10 bg-ink p-1">
            {TABS.map((t) => {
              const count = t.id === "retard" ? open.length : t.id === "bientot" ? bientot.length : tousImpayes.length;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active ? "bg-steel text-bone" : "text-ash hover:text-bone"
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-ember/20 text-ember" : "bg-white/5 text-ash"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title={tab === "bientot" ? "Aucune échéance imminente" : "Aucun impayé"}
            hint={tab === "bientot" ? "Rien à échoir dans les 7 prochains jours." : "La file de relances est vide. Beau travail."}
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((inst, i) => {
              const member = memberById.get(inst.memberId);
              if (!member) return null;
              return (
                <DueRow
                  key={inst.id}
                  inst={inst}
                  member={member}
                  index={i}
                  onOpen={() => navigate(`/admin/membres/${member.id}`)}
                  onCollect={() => setCollect({ memberId: member.id, installmentId: inst.id, amount: inst.remaining })}
                />
              );
            })}
          </ul>
        )}
      </SectionCard>

      <CollectPaymentModal
        open={collect !== null}
        onClose={() => setCollect(null)}
        memberId={collect?.memberId ?? ""}
        installmentId={collect?.installmentId ?? null}
        defaultAmount={collect?.amount}
      />
    </div>
  );
}

function DueRow({
  inst,
  member,
  index,
  onOpen,
  onCollect,
}: {
  inst: OpenInstallment;
  member: Member;
  index: number;
  onOpen: () => void;
  onCollect: () => void;
}) {
  const meta = lateMeta(inst.daysLate);
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-ink/60 p-3 transition-colors hover:border-white/20 sm:flex-row sm:items-center"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      {/* Membre */}
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar first={member.firstName} last={member.lastName} size={40} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-bone">
            {member.firstName} {member.lastName}
          </p>
          <p className="truncate text-xs text-ash">
            {inst.label} · échéance {formatDateFR(inst.dueDate)}
          </p>
        </div>
      </button>

      {/* Statut + retard */}
      <div className="flex items-center gap-2">
        <Pill label={inst.daysLate > 0 ? `${meta.label} de retard` : meta.label} color={meta.color} />
        <InstallmentBadge status={inst.status} />
      </div>

      {/* Montant restant */}
      <div className="w-24 text-right">
        <p className="font-display text-lg leading-none" style={{ color: meta.color }}>
          {formatDH(inst.remaining)}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-ash">restant</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCollect}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/25"
        >
          <HandCoins className="h-3.5 w-3.5" /> Encaisser
        </button>
        <WhatsAppReminder member={member} type="paiement" amount={inst.remaining} dueDate={inst.dueDate} compact />
      </div>
    </motion.li>
  );
}

function DebtorRow({
  member,
  balance,
  pct,
  index,
  onOpen,
}: {
  member: Member;
  balance: number;
  pct: number;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <button onClick={onOpen} className="group flex w-full items-center gap-3 text-left">
        <Avatar first={member.firstName} last={member.lastName} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 truncate font-semibold text-bone">
              {member.firstName} {member.lastName}
              <ArrowUpRight className="h-3.5 w-3.5 text-ash opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="shrink-0 font-display text-base text-ember">{formatDH(balance)}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ff8c2e, #ff3d2e)" }}
            />
          </div>
        </div>
      </button>
    </motion.li>
  );
}
