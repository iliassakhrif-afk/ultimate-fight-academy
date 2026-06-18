import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  CalendarRange,
  ShoppingBag,
  Banknote,
  Plus,
  Search,
  Receipt,
  Printer,
  Download,
  Coins,
  Landmark,
  FileSignature,
  CreditCard,
  X,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH, formatDateFR } from "../store/format";
import { DISCIPLINE_LABELS } from "../constants";
import type { Payment, PayMethod, Member } from "../types";
import StatCard from "../components/StatCard";
import DataTable, { type Column } from "../components/DataTable";
import { Pill } from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import { Modal } from "../components/Overlay";
import EmptyState, { SectionCard } from "../components/EmptyState";
import CollectPaymentModal from "../components/CollectPaymentModal";
import Donut from "../components/charts/Donut";
import BarChart from "../components/charts/BarChart";

const METHOD_META: Record<PayMethod, { label: string; color: string; icon: typeof Coins }> = {
  especes: { label: "Espèces", color: "#3ddc84", icon: Coins },
  virement: { label: "Virement", color: "#3aa0ff", icon: Landmark },
  cheque: { label: "Chèque", color: "#f5b730", icon: FileSignature },
  carte: { label: "Carte", color: "#9b5cff", icon: CreditCard },
};

const TYPE_META: Record<Payment["type"], { label: string; color: string }> = {
  abonnement: { label: "Abonnement", color: "#ff3d2e" },
  inscription: { label: "Inscription", color: "#f5b730" },
  boutique: { label: "Boutique", color: "#9b5cff" },
  autre: { label: "Autre", color: "#8a8a93" },
};

const METHOD_ORDER: PayMethod[] = ["especes", "virement", "cheque", "carte"];

function timeOf(iso: string): string {
  const t = iso.length > 10 ? iso.slice(11, 16) : "";
  return t || "—";
}

export default function Payments() {
  const { db } = useStore();
  const navigate = useNavigate();

  const [collectOpen, setCollectOpen] = useState(false);
  const [collectMemberId, setCollectMemberId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [closureOpen, setClosureOpen] = useState(false);

  // --- KPIs caisse ---
  const today = S.getNow(db);
  const encAuj = S.encaisseAujourdhui(db);
  const encMois = S.encaisseCeMois(db);
  const panier = S.panierMoyen(db);
  const parMethode = S.encaisseParMethode(db);

  const totalAllMethods = METHOD_ORDER.reduce((s, m) => s + (parMethode[m] || 0), 0) || 1;
  const pctEspeces = Math.round(((parMethode.especes || 0) / totalAllMethods) * 100);

  // Ventilation du jour par méthode (caisse du jour)
  const dayPayments = useMemo(
    () => db.payments.filter((p) => p.paidAt.slice(0, 10) === today),
    [db.payments, today]
  );
  const dayByMethod = useMemo(() => {
    const out: Record<PayMethod, number> = { especes: 0, virement: 0, cheque: 0, carte: 0 };
    dayPayments.forEach((p) => { out[p.method] += p.amountDH; });
    return out;
  }, [dayPayments]);

  // Donut répartition des méthodes (cumul)
  const donutSegments = METHOD_ORDER
    .map((m) => ({ label: METHOD_META[m].label, value: parMethode[m] || 0, color: METHOD_META[m].color }))
    .filter((s) => s.value > 0);

  // Graphe CA mensuel (8 derniers mois)
  const caData = useMemo(
    () => S.caParMois(db, 8).map((c) => ({ label: c.label, a: c.facture, b: c.encaisse })),
    [db]
  );

  // Journal des transactions (paidAt desc)
  const journal = useMemo(
    () => [...db.payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    [db.payments]
  );

  const memberById = useMemo(() => new Map(db.members.map((m) => [m.id, m])), [db.members]);

  // Recherche pour le picker d'encaissement
  const searchResults = useMemo(() => S.searchMembers(db, query), [db, query]);
  const enRetard = useMemo(() => S.membresEnRetard(db), [db]);

  const openCollectFor = (memberId: string) => {
    setCollectMemberId(memberId);
    setPickerOpen(false);
    setQuery("");
    setCollectOpen(true);
  };

  const onEncaisser = () => {
    // Ouvre le picker; pré-cible le 1er membre en retard si présent
    setPickerOpen(true);
  };

  const columns: Column<Payment>[] = [
    {
      key: "date",
      header: "Date & heure",
      width: "150px",
      sortValue: (p) => p.paidAt,
      render: (p) => (
        <div className="leading-tight">
          <div className="text-bone">{formatDateFR(p.paidAt)}</div>
          <div className="text-xs text-ash">{timeOf(p.paidAt)}</div>
        </div>
      ),
    },
    {
      key: "membre",
      header: "Membre",
      sortValue: (p) => {
        const m = memberById.get(p.memberId);
        return m ? `${m.lastName} ${m.firstName}` : "";
      },
      render: (p) => {
        const m = memberById.get(p.memberId);
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
      key: "motif",
      header: "Motif",
      width: "130px",
      sortValue: (p) => p.type,
      render: (p) => <Pill label={TYPE_META[p.type].label} color={TYPE_META[p.type].color} />,
    },
    {
      key: "methode",
      header: "Méthode",
      width: "120px",
      sortValue: (p) => p.method,
      render: (p) => (
        <div className="space-y-0.5">
          <Pill label={METHOD_META[p.method].label} color={METHOD_META[p.method].color} />
          {p.method === "cheque" && p.chequeRef && (
            <div className="font-mono text-[10px] text-ash">{p.chequeRef}</div>
          )}
        </div>
      ),
    },
    {
      key: "recu",
      header: "N° reçu",
      align: "left",
      width: "120px",
      sortValue: (p) => p.receiptNo,
      render: (p) => <span className="font-mono text-xs text-ash">{p.receiptNo}</span>,
    },
    {
      key: "montant",
      header: "Montant",
      align: "right",
      width: "120px",
      sortValue: (p) => p.amountDH,
      render: (p) => <span className="font-display tabular-nums text-bone">{formatDH(p.amountDH)}</span>,
    },
  ];

  const exportCSV = () => {
    const rows = [
      ["Date", "Heure", "Membre", "N° membre", "Motif", "Méthode", "N° reçu", "Montant DH"],
      ...journal.map((p) => {
        const m = memberById.get(p.memberId);
        return [
          formatDateFR(p.paidAt),
          timeOf(p.paidAt),
          m ? `${m.firstName} ${m.lastName}` : "",
          m?.memberNo ?? "",
          TYPE_META[p.type].label,
          METHOD_META[p.method].label,
          p.receiptNo,
          String(Math.round(p.amountDH)),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caisse-ufa-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">PAIEMENTS & CAISSE</h1>
          <p className="text-ash">Encaissements, journal des transactions et clôture du jour — {formatDateFR(today)}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setClosureOpen(true)} className="btn-ghost flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Clôture de caisse
          </button>
          <button onClick={onEncaisser} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Encaisser
          </button>
        </div>
      </div>

      {/* Bandeau Caisse du jour */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-coal to-ink p-5"
      >
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-ember/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ash">
              <Wallet className="h-4 w-4 text-ember" /> Caisse du jour
            </div>
            <div className="mt-1 font-display text-4xl tracking-wide text-bone">{formatDH(encAuj)}</div>
            <div className="mt-1 text-sm text-ash">{dayPayments.length} transaction{dayPayments.length > 1 ? "s" : ""} aujourd'hui</div>
          </div>
          <div className="flex flex-wrap gap-3">
            {METHOD_ORDER.map((m, i) => {
              const Icon = METHOD_META[m].icon;
              const val = dayByMethod[m];
              return (
                <motion.div
                  key={m}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="min-w-[124px] rounded-xl border border-white/10 bg-ink/60 px-4 py-3"
                >
                  <div className="flex items-center gap-1.5 text-xs text-ash">
                    <Icon className="h-3.5 w-3.5" style={{ color: METHOD_META[m].color }} />
                    {METHOD_META[m].label}
                  </div>
                  <div className="mt-1 text-right font-display tabular-nums text-lg text-bone">{formatDH(val)}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Encaissé aujourd'hui" value={encAuj} format={formatDH} accent="#ff3d2e" icon={<Wallet className="h-4 w-4" />} index={0} />
        <StatCard label="Encaissé ce mois" value={encMois} format={formatDH} accent="#f5b730" icon={<CalendarRange className="h-4 w-4" />} index={1} />
        <StatCard label="Panier moyen" value={panier} format={formatDH} accent="#3aa0ff" icon={<ShoppingBag className="h-4 w-4" />} index={2} />
        <StatCard label="Part espèces" value={pctEspeces} format={(n) => `${n} %`} accent="#3ddc84" icon={<Banknote className="h-4 w-4" />} index={3} />
      </div>

      {/* Donut + CA mensuel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Répartition par méthode">
          {donutSegments.length ? (
            <Donut segments={donutSegments} centerValue={formatDH(totalAllMethods)} centerLabel="total" />
          ) : (
            <EmptyState icon={<Coins className="h-5 w-5" />} title="Aucun encaissement" hint="Les paiements apparaîtront ici une fois la caisse alimentée." />
          )}
        </SectionCard>

        <SectionCard
          title="Chiffre d'affaires mensuel"
          className="lg:col-span-2"
          action={<span className="text-xs text-ash">Facturé vs encaissé · 8 derniers mois</span>}
        >
          <BarChart data={caData} />
        </SectionCard>
      </div>

      {/* Journal des transactions */}
      <SectionCard
        title="Journal des transactions"
        action={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-ash sm:inline">{journal.length} reçus</span>
            <button onClick={exportCSV} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        }
      >
        {journal.length ? (
          <DataTable
            columns={columns}
            data={journal}
            onRowClick={(p) => navigate(`/admin/membres/${p.memberId}`)}
            initialSort={{ key: "date", dir: "desc" }}
          />
        ) : (
          <EmptyState icon={<Receipt className="h-5 w-5" />} title="Aucune transaction" hint="Encaissez un premier paiement pour démarrer le journal." />
        )}
      </SectionCard>

      {/* Modal: choix du membre pour encaisser */}
      <Modal open={pickerOpen} onClose={() => { setPickerOpen(false); setQuery(""); }} title="Encaisser — choisir un membre">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, n° membre ou téléphone…"
              className="w-full rounded-xl border border-white/10 bg-ink py-3 pl-10 pr-4 text-bone outline-none focus:border-ember"
            />
          </div>

          {query.trim() ? (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {searchResults.length ? (
                searchResults.map((m) => <MemberRow key={m.id} member={m} balance={S.memberBalanceDH(db, m.id)} onPick={() => openCollectFor(m.id)} />)
              ) : (
                <p className="px-2 py-6 text-center text-sm text-ash">Aucun membre trouvé.</p>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ash">
                {enRetard.length ? "Membres avec solde dû" : "Aucun solde dû"}
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {enRetard.slice(0, 8).map((m) => (
                  <MemberRow key={m.id} member={m} balance={S.memberBalanceDH(db, m.id)} onPick={() => openCollectFor(m.id)} />
                ))}
                {!enRetard.length && (
                  <p className="px-2 py-6 text-center text-sm text-ash">Recherchez un membre pour encaisser un paiement libre.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal d'encaissement réel */}
      {collectMemberId && (
        <CollectPaymentModal
          open={collectOpen}
          onClose={() => setCollectOpen(false)}
          memberId={collectMemberId}
          installmentId={null}
        />
      )}

      {/* Modal: Clôture de caisse (imprimable) */}
      <Modal open={closureOpen} onClose={() => setClosureOpen(false)} title="Clôture de caisse" width="max-w-md">
        <div className="space-y-5">
          <div id="ufa-closure" className="rounded-xl border border-white/10 bg-ink p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="font-display text-lg tracking-wide text-bone">Ultimate Fight Academy</div>
                <div className="text-xs text-ash">Clôture du {formatDateFR(today)}</div>
              </div>
              <Receipt className="h-6 w-6 text-ember" />
            </div>

            <div className="mt-4 space-y-2">
              {METHOD_ORDER.map((m) => (
                <div key={m} className="flex items-center justify-between text-sm">
                  <span className="text-ash">{METHOD_META[m].label}</span>
                  <span className="font-display tabular-nums text-bone">{formatDH(dayByMethod[m])}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm font-semibold text-bone">Total du jour</span>
              <span className="font-display text-2xl tabular-nums text-ember">{formatDH(encAuj)}</span>
            </div>

            <div className="mt-3 text-xs text-ash">
              {dayPayments.length} transaction{dayPayments.length > 1 ? "s" : ""} · Kénitra
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setClosureOpen(false)} className="btn-ghost flex flex-1 items-center justify-center gap-2">
              <X className="h-4 w-4" /> Fermer
            </button>
            <button onClick={() => window.print()} className="btn-primary flex flex-1 items-center justify-center gap-2">
              <Printer className="h-4 w-4" /> Imprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MemberRow({ member, balance, onPick }: { member: Member; balance: number; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-ink/40 px-3 py-2.5 text-left transition-colors hover:border-ember/40 hover:bg-white/[0.03]"
    >
      <Avatar first={member.firstName} last={member.lastName} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-bone">{member.firstName} {member.lastName}</div>
        <div className="truncate text-xs text-ash">
          {member.memberNo} · {member.disciplineIds.map((d) => DISCIPLINE_LABELS[d]).slice(0, 1).join("")}
        </div>
      </div>
      {balance > 0 ? (
        <span className="shrink-0 rounded-full bg-ember/15 px-2.5 py-1 text-xs font-semibold text-ember">{formatDH(balance)}</span>
      ) : (
        <span className="shrink-0 text-xs text-ash">À jour</span>
      )}
    </button>
  );
}
