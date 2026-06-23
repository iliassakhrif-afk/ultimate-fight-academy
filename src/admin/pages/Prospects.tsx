import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  Users,
  Flame,
  CalendarCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Phone,
  CalendarDays,
  ArrowRightCircle,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { formatDateFR } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT } from "../constants";
import type { Lead, DisciplineId } from "../types";
import { Modal } from "../components/Overlay";
import EmptyState from "../components/EmptyState";

type Stage = Lead["stage"];
type Heat = Lead["heatScore"];
type Source = Lead["source"];

const STAGES: { key: Stage; label: string; accent: string }[] = [
  { key: "nouveau", label: "Nouveau", accent: "#3aa0ff" },
  { key: "contacte", label: "Contacté", accent: "#9b5cff" },
  { key: "essai_planifie", label: "Essai planifié", accent: "#f5b730" },
  { key: "essai_fait", label: "Essai fait", accent: "#ff8a3d" },
  { key: "inscrit", label: "Inscrit", accent: "#3ddc84" },
  { key: "perdu", label: "Perdu", accent: "#6b7280" },
];

const STAGE_ORDER: Stage[] = STAGES.map((s) => s.key);

const HEAT_META: Record<Heat, { label: string; color: string }> = {
  chaud: { label: "Chaud", color: "#ff3d2e" },
  tiede: { label: "Tiède", color: "#f5b730" },
  froid: { label: "Froid", color: "#3aa0ff" },
};

const HEAT_CYCLE: Heat[] = ["chaud", "tiede", "froid"];

const SOURCE_LABELS: Record<Source, string> = {
  instagram: "Instagram",
  walkin: "Passage",
  parrainage: "Parrainage",
  whatsapp: "WhatsApp",
  site: "Site web",
};

const DISCIPLINE_IDS: DisciplineId[] = ["bjj", "mma", "kickboxing", "boxe", "kids", "women"];

function KpiCard({
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

function HeatDot({ heat, onClick }: { heat: Heat; onClick: () => void }) {
  const meta = HEAT_META[heat];
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Score : ${meta.label} — cliquer pour changer`}
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-steel/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors hover:border-white/25"
      style={{ color: meta.color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </button>
  );
}

function LeadCard({
  lead,
  stageIndex,
  onMove,
  onCycleHeat,
  onConvert,
}: {
  lead: Lead;
  stageIndex: number;
  onMove: (dir: -1 | 1) => void;
  onCycleHeat: () => void;
  onConvert: () => void;
}) {
  const heat = HEAT_META[lead.heatScore];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-steel/30 p-3"
      style={{ borderLeft: `3px solid ${heat.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-bone">
            {lead.firstName} {lead.lastName}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-ash">
            <Phone size={11} /> <span className="tabular-nums">{lead.phone || "—"}</span>
          </div>
        </div>
        <HeatDot heat={lead.heatScore} onClick={onCycleHeat} />
      </div>

      {lead.interestedDisciplineIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.interestedDisciplineIds.map((d) => (
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
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ash">
        <span className="rounded-md bg-white/5 px-1.5 py-0.5">{SOURCE_LABELS[lead.source]}</span>
        {lead.trialDate && (
          <span className="flex items-center gap-1 text-gold">
            <CalendarDays size={11} /> {formatDateFR(lead.trialDate)}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={stageIndex === 0}
            title="Reculer d'étape"
            className="grid h-7 w-7 place-items-center rounded-lg text-ash transition-colors hover:bg-white/5 hover:text-bone disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={stageIndex === STAGE_ORDER.length - 1}
            title="Avancer d'étape"
            className="grid h-7 w-7 place-items-center rounded-lg text-ash transition-colors hover:bg-white/5 hover:text-bone disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
        {lead.stage !== "inscrit" && lead.stage !== "perdu" && (
          <button
            type="button"
            onClick={onConvert}
            title="Convertir en membre"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ember transition-colors hover:bg-ember/10"
          >
            <ArrowRightCircle size={13} /> Convertir
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Prospects() {
  const { db, updateLead, convertLead, addLead } = useStore();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    source: Source;
    heatScore: Heat;
    trialDate: string;
    disciplineIds: DisciplineId[];
  }>({
    firstName: "",
    lastName: "",
    phone: "",
    source: "instagram",
    heatScore: "tiede",
    trialDate: "",
    disciplineIds: [],
  });

  const leads = db.leads;

  const byStage = useMemo(() => {
    const map: Record<Stage, Lead[]> = {
      nouveau: [],
      contacte: [],
      essai_planifie: [],
      essai_fait: [],
      inscrit: [],
      perdu: [],
    };
    for (const l of leads) map[l.stage].push(l);
    return map;
  }, [leads]);

  const total = leads.length;
  const chauds = leads.filter((l) => l.heatScore === "chaud").length;
  const essaisPlanifies = byStage.essai_planifie.length;
  const inscrits = byStage.inscrit.length;
  const conversionRate = total > 0 ? Math.round((inscrits / total) * 100) : 0;

  const moveStage = (lead: Lead, dir: -1 | 1) => {
    const idx = STAGE_ORDER.indexOf(lead.stage);
    const next = idx + dir;
    if (next < 0 || next >= STAGE_ORDER.length) return;
    updateLead(lead.id, { stage: STAGE_ORDER[next] });
  };

  const cycleHeat = (lead: Lead) => {
    const idx = HEAT_CYCLE.indexOf(lead.heatScore);
    updateLead(lead.id, { heatScore: HEAT_CYCLE[(idx + 1) % HEAT_CYCLE.length] });
  };

  const handleConvert = (lead: Lead) => {
    const member = convertLead(lead.id);
    if (member) navigate(`/admin/membres/${member.id}`);
  };

  const toggleDiscipline = (d: DisciplineId) =>
    setForm((f) => ({
      ...f,
      disciplineIds: f.disciplineIds.includes(d)
        ? f.disciplineIds.filter((x) => x !== d)
        : [...f.disciplineIds, d],
    }));

  const submit = () => {
    addLead({
      firstName: form.firstName.trim() || "Prospect",
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      source: form.source,
      heatScore: form.heatScore,
      trialDate: form.trialDate || null,
      interestedDisciplineIds: form.disciplineIds,
      stage: form.trialDate ? "essai_planifie" : "nouveau",
    });
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      source: "instagram",
      heatScore: "tiede",
      trialDate: "",
      disciplineIds: [],
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">PROSPECTS / CRM</h1>
          <p className="text-ash">Pipeline d'acquisition · {total} prospect{total > 1 ? "s" : ""} suivis</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Nouveau prospect
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard index={0} label="Total prospects" value={String(total)} icon={<Users size={18} />} />
        <KpiCard index={1} label="Chauds" value={String(chauds)} accent="#ff3d2e" icon={<Flame size={18} />} />
        <KpiCard
          index={2}
          label="Essais planifiés"
          value={String(essaisPlanifies)}
          accent="#f5b730"
          icon={<CalendarCheck size={18} />}
        />
        <KpiCard
          index={3}
          label="Taux de conversion"
          value={`${conversionRate}%`}
          accent="#3ddc84"
          icon={<TrendingUp size={18} />}
        />
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Aucun prospect"
          hint="Ajoutez un prospect pour démarrer votre pipeline d'acquisition et suivre sa progression jusqu'à l'inscription."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {STAGES.map((stage, si) => {
            const items = byStage[stage.key];
            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * si }}
                className="flex flex-col rounded-2xl border border-white/10 bg-coal p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-bone">{stage.label}</span>
                  </div>
                  <span
                    className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
                    style={{ color: stage.accent, background: stage.accent + "22" }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-ash">
                      Vide
                    </p>
                  ) : (
                    items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stageIndex={STAGE_ORDER.indexOf(lead.stage)}
                        onMove={(dir) => moveStage(lead, dir)}
                        onCycleHeat={() => cycleHeat(lead)}
                        onConvert={() => handleConvert(lead)}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau prospect">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ash">Prénom</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Prénom"
                className="field w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ash">Nom</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Nom"
                className="field w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ash">Téléphone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="field w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ash">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as Source }))}
                className="field w-full"
              >
                {(Object.keys(SOURCE_LABELS) as Source[]).map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ash">Score</label>
              <div className="flex gap-2">
                {HEAT_CYCLE.map((h) => {
                  const meta = HEAT_META[h];
                  const active = form.heatScore === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, heatScore: h }))}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors"
                      style={
                        active
                          ? { color: meta.color, borderColor: meta.color, background: meta.color + "1a" }
                          : undefined
                      }
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ash">
                Date d'essai
              </label>
              <input
                type="date"
                value={form.trialDate}
                onChange={(e) => setForm((f) => ({ ...f, trialDate: e.target.value }))}
                className="field w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">
              Disciplines d'intérêt
            </label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINE_IDS.map((d) => {
                const active = form.disciplineIds.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDiscipline(d)}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={
                      active
                        ? {
                            color: DISCIPLINE_COLORS[d],
                            borderColor: DISCIPLINE_COLORS[d],
                            background: DISCIPLINE_COLORS[d] + "1a",
                          }
                        : { borderColor: "rgba(255,255,255,0.1)" }
                    }
                  >
                    {DISCIPLINE_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">
              Annuler
            </button>
            <button type="button" onClick={submit} className="btn-primary">
              Ajouter le prospect
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
