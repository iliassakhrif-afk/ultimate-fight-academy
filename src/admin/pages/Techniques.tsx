import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Dumbbell, Users, Layers, Trash2, ChevronRight } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDateFR } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS } from "../constants";
import { GI_META, TECHNIQUE_CATEGORIES } from "../techniques";
import type { DisciplineId, GiType, Technique } from "../types";
import StatCard from "../components/StatCard";
import { Drawer, Modal } from "../components/Overlay";
import { SectionCard } from "../components/EmptyState";
import Avatar from "../components/Avatar";

const DISCS: DisciplineId[] = ["bjj", "mma", "kickboxing", "boxe"];

function GiBadge({ gi }: { gi: GiType }) {
  const m = GI_META[gi];
  return <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide" style={{ color: m.color, background: m.color + "22" }}>{m.short}</span>;
}

export default function Techniques() {
  const { db, addTechnique, removeTechnique } = useStore();
  const nav = useNavigate();

  const [disc, setDisc] = useState<DisciplineId>("bjj");
  const [gi, setGi] = useState<"all" | GiType>("all");
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [openTech, setOpenTech] = useState<Technique | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return db.techniques
      .filter((x) => x.discipline === disc)
      .filter((x) => gi === "all" || x.gi === gi || x.gi === "both")
      .filter((x) => cat === "all" || x.category === cat)
      .filter((x) => !t || x.name.toLowerCase().includes(t) || x.position.toLowerCase().includes(t))
      .map((x) => ({ ...x, stats: S.techniqueStats(db, x.id) }))
      .sort((a, b) => b.stats.memberCount - a.stats.memberCount || a.name.localeCompare(b.name));
  }, [db, disc, gi, cat, q]);

  const cats = useMemo(() => {
    const used = new Set(db.techniques.filter((x) => x.discipline === disc).map((x) => x.category));
    return TECHNIQUE_CATEGORIES.filter((c) => used.has(c));
  }, [db, disc]);

  const discTechs = db.techniques.filter((x) => x.discipline === disc);
  const practitioners = openTech ? S.membersWhoPracticed(db, openTech.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">TECHNIQUES</h1>
          <p className="mt-1 text-sm text-ash">Catalogue par discipline — qui a pratiqué quoi, Gi & No-Gi.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> Ajouter une technique
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Techniques" value={discTechs.length} accent="#ff3d2e" icon={<Dumbbell className="h-4 w-4" />} index={0} />
        <StatCard label="Gi uniquement" value={discTechs.filter((x) => x.gi === "gi").length} accent="#3aa0ff" icon={<Layers className="h-4 w-4" />} index={1} />
        <StatCard label="No-Gi uniquement" value={discTechs.filter((x) => x.gi === "nogi").length} accent="#ff8c2e" icon={<Layers className="h-4 w-4" />} index={2} />
        <StatCard label="Séances tracées" value={db.sessionInstances.filter((s) => s.disciplineId === disc).length} accent="#3ddc84" icon={<Users className="h-4 w-4" />} index={3} />
      </div>

      {/* Filtres */}
      <SectionCard>
        <div className="flex flex-wrap items-center gap-2">
          {DISCS.map((d) => (
            <button key={d} onClick={() => { setDisc(d); setCat("all"); }}
              className={`rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${disc === d ? "border-ember bg-ember text-white" : "border-white/10 text-ash hover:text-bone"}`}>
              {DISCIPLINE_LABELS[d]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["all", "gi", "nogi"] as const).map((g) => (
            <button key={g} onClick={() => setGi(g)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${gi === g ? "bg-white/10 text-bone" : "text-ash hover:text-bone"}`}>
              {g === "all" ? "Tous" : g === "gi" ? "Gi" : "No-Gi"}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <button onClick={() => setCat("all")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cat === "all" ? "bg-white/10 text-bone" : "text-ash hover:text-bone"}`}>Toutes catégories</button>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cat === c ? "bg-white/10 text-bone" : "text-ash hover:text-bone"}`}>{c}</button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="w-52 rounded-xl border border-white/10 bg-ink py-2 pl-9 pr-3 text-sm text-bone outline-none focus:border-ember" />
          </div>
        </div>
      </SectionCard>

      {/* Liste */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t, i) => (
          <motion.button
            key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 9) * 0.03 }}
            onClick={() => setOpenTech(t)}
            className="group flex flex-col gap-2 rounded-2xl border border-white/10 bg-coal p-4 text-left transition-colors hover:border-ember/40"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-base leading-tight tracking-wide text-bone">{t.name}</span>
              <GiBadge gi={t.gi} />
            </div>
            <div className="flex items-center gap-2 text-xs text-ash">
              <span className="rounded-md bg-white/5 px-1.5 py-0.5">{t.category}</span>
              <span>· {t.position}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-ash"><span className="font-semibold text-bone">{t.stats.memberCount}</span> membres · {t.stats.timesTaught} séances</span>
              <span className="flex items-center gap-1 text-ember opacity-0 transition-opacity group-hover:opacity-100">Voir <ChevronRight className="h-3 w-3" /></span>
            </div>
            {t.isCustom && <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">Ajoutée manuellement</span>}
          </motion.button>
        ))}
        {list.length === 0 && <p className="col-span-full py-10 text-center text-sm text-ash">Aucune technique pour ces filtres.</p>}
      </div>

      {/* Drawer pratiquants */}
      <Drawer open={!!openTech} onClose={() => setOpenTech(null)} title={openTech?.name} width="max-w-lg">
        {openTech && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <GiBadge gi={openTech.gi} />
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-ash">{openTech.category}</span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-ash">{openTech.position}</span>
              <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: DISCIPLINE_COLORS[openTech.discipline], background: DISCIPLINE_COLORS[openTech.discipline] + "22" }}>{DISCIPLINE_LABELS[openTech.discipline]}</span>
            </div>

            {openTech.isCustom && (
              <button onClick={() => { removeTechnique(openTech.id); setOpenTech(null); }} className="flex items-center gap-2 text-sm text-ember hover:underline">
                <Trash2 className="h-4 w-4" /> Supprimer cette technique
              </button>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-display text-lg tracking-wide">Membres ayant pratiqué</h4>
                <span className="text-sm text-ash">{practitioners.length}</span>
              </div>
              {practitioners.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-ash">Aucune séance enregistrée avec cette technique pour l'instant.</p>
              ) : (
                <div className="space-y-1.5">
                  {practitioners.map((p) => (
                    <button key={p.member.id} onClick={() => { setOpenTech(null); nav(`/admin/membres/${p.member.id}`); }}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-ink px-3 py-2.5 text-left hover:border-white/15">
                      <Avatar first={p.member.firstName} last={p.member.lastName} size={32} />
                      <div className="flex-1 leading-tight">
                        <div className="text-sm font-medium text-bone">{p.member.firstName} {p.member.lastName}</div>
                        <div className="text-xs text-ash">Dernière fois : {formatDateFR(p.lastDate)}</div>
                      </div>
                      <span className="rounded-full bg-ember/15 px-2.5 py-1 text-xs font-bold text-ember">{p.count}×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <AddTechniqueModal open={addOpen} onClose={() => setAddOpen(false)} discipline={disc} onAdd={addTechnique} />
    </div>
  );
}

function AddTechniqueModal({ open, onClose, discipline, onAdd }: { open: boolean; onClose: () => void; discipline: DisciplineId; onAdd: (t: { discipline: DisciplineId; name: string; category: string; gi: GiType; position: string }) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(TECHNIQUE_CATEGORIES[1]);
  const [gi, setGi] = useState<GiType>("both");
  const [position, setPosition] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ discipline, name: name.trim(), category, gi, position: position.trim() || "—" });
    setName(""); setPosition(""); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une technique">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Nom de la technique</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Berimbolo" className="field" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Catégorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
              {TECHNIQUE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Position</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex. Garde De La Riva" className="field" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Variante</label>
          <div className="grid grid-cols-3 gap-2">
            {(["gi", "nogi", "both"] as GiType[]).map((g) => (
              <button key={g} onClick={() => setGi(g)} className={`rounded-xl border px-2 py-2.5 text-xs font-semibold ${gi === g ? "border-ember bg-ember/15 text-ember" : "border-white/10 text-ash hover:text-bone"}`}>
                {GI_META[g].label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={submit} className="btn-primary w-full">Ajouter au catalogue</button>
      </div>
    </Modal>
  );
}
