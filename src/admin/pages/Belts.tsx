import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award, TrendingUp, Sparkles, Swords, ChevronRight, Medal, ArrowUpRight,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDateShort, daysBetween } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT, BELT_COLORS, ADULT_BELTS, KIDS_BELTS } from "../constants";
import type { Member, Belt, BeltRank, DisciplineId } from "../types";
import StatCard from "../components/StatCard";
import DataTable, { type Column } from "../components/DataTable";
import BeltPill from "../components/BeltPill";
import Avatar from "../components/Avatar";
import { Modal } from "../components/Overlay";
import EmptyState, { SectionCard } from "../components/EmptyState";

// Début du trimestre courant, à partir de l'horloge démo (déterministe)
function quarterStart(now: string): string {
  const [y, m] = now.split("-").map(Number);
  const qMonth = Math.floor((m - 1) / 3) * 3 + 1;
  return `${y}-${String(qMonth).padStart(2, "0")}-01`;
}

// Ligne enrichie pour le tableau des pratiquants
interface GradedRow {
  id: string;
  member: Member;
  belt: Belt;
}

export default function Belts() {
  const { db, now, promote } = useStore();
  const navigate = useNavigate();

  const qStart = useMemo(() => quarterStart(now), [now]);

  // --- KPIs -----------------------------------------------------------------
  const blackBelts = useMemo(
    () => db.belts.filter((b) => b.isCurrent && b.beltRank === "noire").length,
    [db.belts],
  );
  const promotionsQuarter = useMemo(
    () => db.belts.filter((b) => b.promotedAt >= qStart && b.promotedAt <= now).length,
    [db.belts, qStart, now],
  );
  const bjjPractitioners = useMemo(
    () => db.members.filter((m) => m.status !== "churn" && m.disciplineIds.includes("bjj")).length,
    [db.members],
  );

  // Éligibles (heuristique): membre actif, assiduité ≥ 8 séances / 30j,
  // dernière promotion il y a > 180 jours (ou ancienneté à défaut), hors ceinture noire.
  const eligibles = useMemo(() => {
    return db.members
      .filter((m) => m.status === "actif")
      .map((m) => {
        const belt = S.memberCurrentBelt(db, m.id);
        const att = S.memberAttendanceCount(db, m.id, 30);
        const sinceLast = belt ? daysBetween(belt.promotedAt, now) : daysBetween(m.joinedAt, now);
        return { member: m, belt, att, sinceLast };
      })
      .filter((r): r is { member: Member; belt: Belt; att: number; sinceLast: number } =>
        r.belt !== null && r.belt.beltRank !== "noire" && r.att >= 8 && r.sinceLast >= 180)
      .sort((a, b) => b.att - a.att);
  }, [db, now]);

  // --- Pyramide BJJ adulte --------------------------------------------------
  const bjjCurrentBelts = useMemo(
    () => db.belts.filter((b) => b.isCurrent && b.discipline === "bjj"),
    [db.belts],
  );
  const pyramid = useMemo(() => {
    const counts = ADULT_BELTS.map((rank) => ({
      rank,
      count: bjjCurrentBelts.filter((b) => b.beltRank === rank).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    const total = counts.reduce((s, c) => s + c.count, 0);
    return { counts, max, total };
  }, [bjjCurrentBelts]);

  // --- Tableau pratiquants gradés ------------------------------------------
  const gradedRows = useMemo<GradedRow[]>(() => {
    return db.members
      .filter((m) => m.status !== "churn")
      .map((m) => {
        const belt = S.memberCurrentBelt(db, m.id);
        return belt ? { id: m.id, member: m, belt } : null;
      })
      .filter((r): r is GradedRow => r !== null);
  }, [db]);

  // --- Coach Head (Rachidi Zine) -------------------------------------------
  const headCoach = useMemo(() => db.coaches.find((c) => c.role === "Head Coach"), [db.coaches]);
  const coachPromotions = useMemo(() => {
    if (!headCoach) return 0;
    return db.belts.filter((b) => b.promotedByCoachId === headCoach.id).length;
  }, [db.belts, headCoach]);
  const coachLastPromo = useMemo(() => {
    if (!headCoach) return null;
    const list = db.belts
      .filter((b) => b.promotedByCoachId === headCoach.id)
      .sort((a, b) => b.promotedAt.localeCompare(a.promotedAt));
    return list[0]?.promotedAt ?? null;
  }, [db.belts, headCoach]);

  // --- Modal Promouvoir -----------------------------------------------------
  const [promoFor, setPromoFor] = useState<Member | null>(null);

  const columns = useMemo<Column<GradedRow>[]>(() => [
    {
      key: "member",
      header: "Membre",
      sortValue: (r) => `${r.member.firstName} ${r.member.lastName}`,
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/membres/${r.member.id}`); }}
          className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
        >
          <Avatar first={r.member.firstName} last={r.member.lastName} size={34} />
          <div>
            <p className="font-medium text-bone">{r.member.firstName} {r.member.lastName}</p>
            <p className="text-xs text-ash">{r.member.memberNo}</p>
          </div>
        </button>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      sortValue: (r) => r.belt.discipline,
      render: (r) => (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ color: DISCIPLINE_COLORS[r.belt.discipline], background: DISCIPLINE_COLORS[r.belt.discipline] + "22" }}
        >
          {DISCIPLINE_SHORT[r.belt.discipline]}
        </span>
      ),
    },
    {
      key: "belt",
      header: "Ceinture",
      sortValue: (r) => ADULT_BELTS.indexOf(r.belt.beltRank) + r.belt.stripes / 10,
      render: (r) => <BeltPill rank={r.belt.beltRank} stripes={r.belt.stripes} />,
    },
    {
      key: "promotedAt",
      header: "Dernière promo",
      align: "right",
      sortValue: (r) => r.belt.promotedAt,
      render: (r) => <span className="tabular-nums text-ash">{formatDateShort(r.belt.promotedAt)}</span>,
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); setPromoFor(r.member); }}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-bone transition-colors hover:border-gold/50 hover:text-gold"
        >
          <ArrowUpRight className="h-3.5 w-3.5" /> Promouvoir
        </button>
      ),
    },
  ], [navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">GRADES &amp; CEINTURES</h1>
        <p className="text-ash">Progression technique des pratiquants — la signature des arts martiaux.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ceintures noires" value={blackBelts} accent="#16161a" icon={<Medal className="h-4 w-4" />} index={0} />
        <StatCard label="Promotions ce trimestre" value={promotionsQuarter} accent="#f5b730" icon={<TrendingUp className="h-4 w-4" />} index={1} />
        <StatCard label="Éligibles promo" value={eligibles.length} accent="#3ddc84" icon={<Sparkles className="h-4 w-4" />} index={2} />
        <StatCard label="Pratiquants BJJ" value={bjjPractitioners} accent={DISCIPLINE_COLORS.bjj} icon={<Swords className="h-4 w-4" />} index={3} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pyramide BJJ */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-2"
        >
          <SectionCard
            title="Répartition des ceintures — BJJ adulte"
            action={<span className="text-xs font-medium uppercase tracking-wider text-ash">{pyramid.total} gradés</span>}
          >
            <div className="space-y-2.5">
              {pyramid.counts.map((c, i) => {
                const meta = BELT_COLORS[c.rank];
                const pct = (c.count / pyramid.max) * 100;
                const share = pyramid.total ? Math.round((c.count / pyramid.total) * 100) : 0;
                return (
                  <motion.div
                    key={c.rank}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-16 shrink-0 text-right text-xs font-semibold text-ash">{meta.label}</span>
                    <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-white/5">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${Math.max(pct, c.count ? 7 : 0)}%` }}
                        transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 120, damping: 20 }}
                        className="flex h-full items-center justify-end rounded-lg pr-2"
                        style={{ background: meta.bar, boxShadow: c.rank === "noire" ? "inset 0 0 0 1px rgba(255,255,255,0.18)" : undefined }}
                      >
                        {c.count > 0 && (
                          <span className="font-display text-sm tabular-nums" style={{ color: meta.text }}>{c.count}</span>
                        )}
                      </motion.div>
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ash">{share}%</span>
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {/* Carte Coach Head */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionCard title="Maître de cérémonie" className="h-full">
            {headCoach ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3">
                  <Avatar first={headCoach.firstName} last={headCoach.lastName} size={52} />
                  <div>
                    <p className="font-display text-lg tracking-wide text-bone">{headCoach.firstName} {headCoach.lastName}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
                      <Award className="h-3 w-3" /> {headCoach.role}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {headCoach.disciplineIds.map((d: DisciplineId) => (
                    <span
                      key={d}
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: DISCIPLINE_COLORS[d], background: DISCIPLINE_COLORS[d] + "1f" }}
                    >
                      {DISCIPLINE_SHORT[d]}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-ink/40 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-ash">Promotions délivrées</p>
                    <p className="mt-1 font-display text-3xl text-gold tabular-nums">{coachPromotions}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-ink/40 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-ash">Dernière promo</p>
                    <p className="mt-1 font-display text-lg text-bone tabular-nums">
                      {coachLastPromo ? formatDateShort(coachLastPromo) : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <BeltPill rank="noire" stripes={4} />
                </div>
              </div>
            ) : (
              <EmptyState title="Aucun Head Coach" hint="Définissez le coach principal dans les réglages." />
            )}
          </SectionCard>
        </motion.div>
      </div>

      {/* Éligibles à la promotion */}
      {eligibles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <SectionCard
            title="Éligibles à la promotion"
            action={<span className="inline-flex items-center gap-1.5 rounded-full bg-[#3ddc84]/15 px-2.5 py-1 text-xs font-semibold text-[#3ddc84]"><Sparkles className="h-3 w-3" /> {eligibles.length} candidats</span>}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {eligibles.slice(0, 6).map((r, i) => (
                <motion.div
                  key={r.member.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink/40 p-3"
                >
                  <Avatar first={r.member.firstName} last={r.member.lastName} size={40} />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => navigate(`/admin/membres/${r.member.id}`)}
                      className="block max-w-full truncate text-left font-medium text-bone transition-opacity hover:opacity-80"
                    >
                      {r.member.firstName} {r.member.lastName}
                    </button>
                    <div className="mt-1 flex items-center gap-2">
                      <BeltPill rank={r.belt.beltRank} stripes={r.belt.stripes} showLabel={false} />
                      <span className="text-[11px] text-ash">{r.att} séances / 30j</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPromoFor(r.member)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-gold transition-colors hover:border-gold/50 hover:bg-gold/10"
                    title="Promouvoir"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Tableau pratiquants & ceintures */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <SectionCard title="Pratiquants & ceintures">
          {gradedRows.length > 0 ? (
            <DataTable
              columns={columns}
              data={gradedRows}
              onRowClick={(r) => navigate(`/admin/membres/${r.member.id}`)}
              initialSort={{ key: "belt", dir: "desc" }}
            />
          ) : (
            <EmptyState icon={<Award className="h-6 w-6" />} title="Aucune ceinture attribuée" hint="Promouvez un membre pour démarrer le suivi des grades." />
          )}
        </SectionCard>
      </motion.div>

      {promoFor && (
        <PromoteModal
          member={promoFor}
          currentBelt={S.memberCurrentBelt(db, promoFor.id)}
          onClose={() => setPromoFor(null)}
          onConfirm={(discipline, rank, stripes, note) => {
            promote(promoFor.id, discipline, rank, stripes, note);
            setPromoFor(null);
          }}
        />
      )}
    </div>
  );
}

// ── Modal de promotion ──────────────────────────────────────────────────────
function PromoteModal({
  member, currentBelt, onClose, onConfirm,
}: {
  member: Member;
  currentBelt: Belt | null;
  onClose: () => void;
  onConfirm: (discipline: DisciplineId, rank: BeltRank, stripes: number, note: string) => void;
}) {
  const defaultDiscipline: DisciplineId =
    currentBelt?.discipline ??
    (member.disciplineIds.includes("bjj") ? "bjj" : member.disciplineIds[0] ?? "bjj");

  const [discipline, setDiscipline] = useState<DisciplineId>(defaultDiscipline);
  const beltScale: BeltRank[] = discipline === "kids" ? KIDS_BELTS : ADULT_BELTS;
  const [rank, setRank] = useState<BeltRank>(
    currentBelt && beltScale.includes(currentBelt.beltRank) ? currentBelt.beltRank : beltScale[0],
  );
  const [stripes, setStripes] = useState<number>(0);
  const [note, setNote] = useState("");

  const onDisciplineChange = (d: DisciplineId) => {
    setDiscipline(d);
    const scale = d === "kids" ? KIDS_BELTS : ADULT_BELTS;
    setRank(scale[0]);
    setStripes(0);
  };

  return (
    <Modal open onClose={onClose} title={`Promouvoir ${member.firstName} ${member.lastName}`} width="max-w-lg">
      <div className="space-y-5">
        {currentBelt && (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-ink/40 px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-ash">Grade actuel</span>
            <BeltPill rank={currentBelt.beltRank} stripes={currentBelt.stripes} />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Discipline</label>
          <div className="flex flex-wrap gap-2">
            {member.disciplineIds.map((d) => (
              <button
                key={d}
                onClick={() => onDisciplineChange(d)}
                className="rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors"
                style={{
                  color: discipline === d ? DISCIPLINE_COLORS[d] : undefined,
                  borderColor: discipline === d ? DISCIPLINE_COLORS[d] : "rgba(255,255,255,0.1)",
                  background: discipline === d ? DISCIPLINE_COLORS[d] + "1f" : "transparent",
                }}
              >
                {DISCIPLINE_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Nouvelle ceinture</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {beltScale.map((b) => {
              const meta = BELT_COLORS[b];
              const active = rank === b;
              return (
                <button
                  key={b}
                  onClick={() => setRank(b)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${active ? "border-white/40" : "border-white/10 hover:border-white/20"}`}
                  style={{ background: active ? "rgba(255,255,255,0.06)" : "transparent" }}
                >
                  <span className="h-4 w-5 shrink-0 rounded-sm border border-white/20" style={{ background: meta.bar }} />
                  <span className={active ? "text-bone" : "text-ash"}>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Barres (stripes)</label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setStripes(n)}
                className={`h-10 w-10 rounded-lg border font-display text-lg tabular-nums transition-colors ${stripes === n ? "border-gold/60 bg-gold/15 text-gold" : "border-white/10 text-ash hover:border-white/25"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Note de promotion</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Assiduité exemplaire, technique solide en garde…"
            className="field w-full resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ash">Aperçu :</span>
            <BeltPill rank={rank} stripes={stripes} />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">Annuler</button>
            <button onClick={() => onConfirm(discipline, rank, stripes, note.trim())} className="btn-primary">
              Confirmer la promotion
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
