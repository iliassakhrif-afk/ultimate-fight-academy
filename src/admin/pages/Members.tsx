import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, UserPlus, X, Users, AlertTriangle, UserCheck, Flame } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH, formatDateFR, formatDateShort, ageFrom } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT } from "../constants";
import type { Member, DisciplineId, MemberStatus } from "../types";
import DataTable, { type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import BeltPill from "../components/BeltPill";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";

type StatusFilter = "tous" | "actif" | "gele" | "expire" | "essai";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "actif", label: "Actifs" },
  { key: "essai", label: "Essai" },
  { key: "gele", label: "Gelés" },
  { key: "expire", label: "Expirés" },
];

const DISCIPLINE_IDS: DisciplineId[] = ["bjj", "mma", "kickboxing", "boxe", "kids", "women"];

function FilterPill({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  const color = accent ?? "#ff3d2e";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "text-ink" : "border-white/10 bg-steel/40 text-ash hover:text-bone hover:border-white/25"
      }`}
      style={active ? { background: color, borderColor: color } : undefined}
    >
      {children}
    </button>
  );
}

function MiniStat({
  label,
  value,
  accent = "#ff3d2e",
  icon,
  index,
}: {
  label: string;
  value: string;
  accent?: string;
  icon?: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-white/10 bg-coal p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ash">{label}</span>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      <div className="mt-3 font-display text-3xl leading-none">{value}</div>
      <span className="mt-3 block h-0.5 w-10 rounded-full" style={{ background: accent }} />
    </motion.div>
  );
}

export default function Members() {
  const { db } = useStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tous");
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineId | null>(null);
  const [onlyLate, setOnlyLate] = useState(false);
  const [onlyDropped, setOnlyDropped] = useState(false);

  const droppedIds = useMemo(() => new Set(S.membresDecroches(db).map((m) => m.id)), [db]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.members
      .filter((m) => m.status !== "churn")
      .filter((m) => {
        if (statusFilter !== "tous" && m.status !== statusFilter) return false;
        if (disciplineFilter && !m.disciplineIds.includes(disciplineFilter)) return false;
        if (onlyLate && S.memberBalanceDH(db, m.id) <= 0) return false;
        if (onlyDropped && !droppedIds.has(m.id)) return false;
        if (q) {
          const hay = `${m.firstName} ${m.lastName} ${m.phone} ${m.memberNo}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [db, query, statusFilter, disciplineFilter, onlyLate, onlyDropped, droppedIds]);

  const filteredBalance = useMemo(
    () => rows.reduce((s, m) => s + S.memberBalanceDH(db, m.id), 0),
    [db, rows],
  );

  const hasActiveFilters =
    statusFilter !== "tous" || disciplineFilter !== null || onlyLate || onlyDropped || query.trim() !== "";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("tous");
    setDisciplineFilter(null);
    setOnlyLate(false);
    setOnlyDropped(false);
  };

  const columns: Column<Member>[] = [
    {
      key: "member",
      header: "Membre",
      sortValue: (m) => `${m.lastName} ${m.firstName}`.toLowerCase(),
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar first={m.firstName} last={m.lastName} size={38} />
          <div className="min-w-0">
            <div className="truncate font-medium text-bone">
              {m.firstName} {m.lastName}
            </div>
            <div className="text-xs text-ash">{m.memberNo}</div>
          </div>
        </div>
      ),
    },
    {
      key: "age",
      header: "Âge",
      align: "center",
      width: "70px",
      sortValue: (m) => ageFrom(m.birthDate, db.settings.demoClock),
      render: (m) => <span className="tabular-nums text-ash">{ageFrom(m.birthDate, db.settings.demoClock)}</span>,
    },
    {
      key: "disciplines",
      header: "Disciplines",
      sortValue: (m) => m.disciplineIds.length,
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.disciplineIds.map((d) => (
            <span
              key={d}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
              style={{ color: DISCIPLINE_COLORS[d], background: DISCIPLINE_COLORS[d] + "22" }}
              title={DISCIPLINE_LABELS[d]}
            >
              {DISCIPLINE_SHORT[d]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "belt",
      header: "Ceinture",
      sortValue: (m) => {
        const b = S.memberCurrentBelt(db, m.id);
        return b ? `${b.beltRank}-${b.stripes}` : "";
      },
      render: (m) => {
        const b = S.memberCurrentBelt(db, m.id);
        return b ? (
          <BeltPill rank={b.beltRank} stripes={b.stripes} showLabel={false} />
        ) : (
          <span className="text-ash">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      sortValue: (m) => m.status,
      render: (m) => <StatusBadge status={m.status as MemberStatus} />,
    },
    {
      key: "echeance",
      header: "Échéance",
      sortValue: (m) => {
        const sub = S.memberSubscription(db, m.id);
        return sub ? sub.endDate : "9999";
      },
      render: (m) => {
        const sub = S.memberSubscription(db, m.id);
        return sub ? <span className="text-ash">{formatDateFR(sub.endDate)}</span> : <span className="text-ash">—</span>;
      },
    },
    {
      key: "solde",
      header: "Solde",
      align: "right",
      sortValue: (m) => S.memberBalanceDH(db, m.id),
      render: (m) => {
        const bal = S.memberBalanceDH(db, m.id);
        return (
          <span className={`tabular-nums font-semibold ${bal > 0 ? "text-ember" : "text-ash"}`}>
            {bal > 0 ? formatDH(bal) : "—"}
          </span>
        );
      },
    },
    {
      key: "lastSeen",
      header: "Dernière présence",
      align: "right",
      sortValue: (m) => m.lastAttendanceAt ?? "",
      render: (m) =>
        m.lastAttendanceAt ? (
          <span className="text-ash">{formatDateShort(m.lastAttendanceAt)}</span>
        ) : (
          <span className="text-ash">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">MEMBRES</h1>
          <p className="text-ash">Répertoire complet · {S.totalMembres(db)} membres au club</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/membres/nouveau")}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} /> Nouveau membre
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MiniStat index={0} label="Total membres" value={String(S.totalMembres(db))} icon={<Users size={18} />} />
        <MiniStat index={1} label="Actifs" value={String(S.membresActifs(db))} accent="#3ddc84" icon={<UserCheck size={18} />} />
        <MiniStat index={2} label="En retard" value={String(S.membresEnRetard(db).length)} accent="#ff3d2e" icon={<AlertTriangle size={18} />} />
        <MiniStat index={3} label="Prospects / essais" value={String(S.prospectsEssais(db))} accent="#3aa0ff" icon={<Flame size={18} />} />
        <MiniStat index={4} label="Solde filtré" value={formatDH(filteredBalance)} accent="#f5b730" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4 rounded-2xl border border-white/10 bg-coal p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un nom, téléphone, n° membre…"
              className="field w-full pl-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-bone"
                aria-label="Effacer"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters} className="btn-ghost flex items-center gap-1.5 text-xs">
              <X size={14} /> Réinitialiser
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((t) => (
            <FilterPill key={t.key} active={statusFilter === t.key} onClick={() => setStatusFilter(t.key)}>
              {t.label}
            </FilterPill>
          ))}
          <span className="mx-1 h-5 w-px bg-white/10" />
          <FilterPill active={onlyLate} onClick={() => setOnlyLate((v) => !v)} accent="#ff3d2e">
            En retard
          </FilterPill>
          <FilterPill active={onlyDropped} onClick={() => setOnlyDropped((v) => !v)} accent="#f5b730">
            Décrochés
          </FilterPill>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DISCIPLINE_IDS.map((d) => (
            <FilterPill
              key={d}
              active={disciplineFilter === d}
              onClick={() => setDisciplineFilter((cur) => (cur === d ? null : d))}
              accent={DISCIPLINE_COLORS[d]}
            >
              {DISCIPLINE_LABELS[d]}
            </FilterPill>
          ))}
        </div>
      </motion.div>

      <p className="text-sm text-ash">
        <span className="font-semibold text-bone">{rows.length}</span> résultat{rows.length > 1 ? "s" : ""}
        {hasActiveFilters && " · filtres actifs"}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Aucun membre trouvé"
          hint="Ajustez la recherche ou réinitialisez les filtres pour voir tous les membres."
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <DataTable
            columns={columns}
            data={rows}
            initialSort={{ key: "solde", dir: "desc" }}
            onRowClick={(m) => navigate(`/admin/membres/${m.id}`)}
          />
        </motion.div>
      )}
    </div>
  );
}
