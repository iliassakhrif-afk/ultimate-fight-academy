import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, UserPlus, Crown, Wallet, Search, X, Pencil, Heart } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import * as S from "../store/selectors";
import { formatDH } from "../store/format";
import { DISCIPLINE_COLORS, DISCIPLINE_SHORT } from "../constants";
import type { Family, Member } from "../types";
import StatCard from "../components/StatCard";
import Avatar from "../components/Avatar";
import EmptyState, { SectionCard } from "../components/EmptyState";
import { Modal } from "../components/Overlay";

// --- Sélecteur de membres réutilisé par la création et l'édition ---
function MemberPicker({
  members,
  selected,
  onToggle,
  query,
  setQuery,
}: {
  members: Member[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const list = members.filter((m) => {
    if (!q) return true;
    return `${m.firstName} ${m.lastName} ${m.memberNo}`.toLowerCase().includes(q);
  });
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un membre…"
          className="field w-full pl-9"
        />
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-steel/30 p-2">
        {list.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-ash">Aucun membre.</p>
        ) : (
          list.map((m) => {
            const on = selected.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggle(m.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  on ? "border-ember/60 bg-ember/10" : "border-transparent hover:bg-white/5"
                }`}
              >
                <Avatar first={m.firstName} last={m.lastName} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-bone">
                    {m.firstName} {m.lastName}
                  </div>
                  <div className="text-xs text-ash">{m.memberNo}</div>
                </div>
                <span
                  className={`grid h-5 w-5 place-items-center rounded-md border text-[10px] font-bold ${
                    on ? "border-ember bg-ember text-ink" : "border-white/20 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Families() {
  const { db, createFamily, setFamilyMembers } = useStore();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Family | null>(null);

  // état du formulaire de création
  const [newName, setNewName] = useState("");
  const [newSel, setNewSel] = useState<Set<string>>(new Set());
  const [newQuery, setNewQuery] = useState("");

  // état du formulaire d'édition
  const [editSel, setEditSel] = useState<Set<string>>(new Set());
  const [editPrimary, setEditPrimary] = useState<string | null>(null);
  const [editQuery, setEditQuery] = useState("");

  const eligibleMembers = useMemo(
    () => db.members.filter((m) => m.status !== "churn").sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)),
    [db.members],
  );

  const families = db.families;
  const membersInFamily = useMemo(() => new Set(families.flatMap((f) => f.memberIds)).size, [families]);
  const totalFamilyBalance = useMemo(() => families.reduce((s, f) => s + S.familyBalanceDH(db, f.id), 0), [db, families]);

  // --- création ---
  const openCreate = () => {
    setNewName("");
    setNewSel(new Set());
    setNewQuery("");
    setCreateOpen(true);
  };
  const toggleNew = (id: string) =>
    setNewSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const submitCreate = () => {
    const name = newName.trim();
    if (!name || newSel.size === 0) return;
    createFamily(name, [...newSel]);
    setCreateOpen(false);
  };

  // --- édition ---
  const openEdit = (f: Family) => {
    setEditing(f);
    setEditSel(new Set(f.memberIds));
    setEditPrimary(f.primaryMemberId);
    setEditQuery("");
  };
  const toggleEdit = (id: string) =>
    setEditSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (editPrimary === id) setEditPrimary(null);
      } else {
        next.add(id);
      }
      return next;
    });
  const submitEdit = () => {
    if (!editing) return;
    const ids = [...editSel];
    const primary = editPrimary && editSel.has(editPrimary) ? editPrimary : ids[0] ?? null;
    setFamilyMembers(editing.id, ids, primary);
    setEditing(null);
  };

  const memberById = (id: string) => db.members.find((m) => m.id === id) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">FAMILLES</h1>
          <p className="text-ash">Fratries &amp; foyers · un seul payeur règle pour toute la famille</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Créer une famille
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Familles" value={families.length} icon={<Heart size={18} />} accent="#ff3d2e" />
        <StatCard index={1} label="Membres en famille" value={membersInFamily} icon={<Users size={18} />} accent="#3aa0ff" />
        <StatCard
          index={2}
          label="Solde familles"
          value={totalFamilyBalance}
          format={formatDH}
          icon={<Wallet size={18} />}
          accent="#f5b730"
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-gold/25 bg-gold/5 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
          <Crown size={18} />
        </span>
        <p className="text-sm text-ash">
          <span className="font-semibold text-bone">Payeur unique.</span> Au Maroc, les cours enfants se règlent en
          fratrie&nbsp;: désignez le <span className="text-gold">responsable / payeur</span> et il encaisse l'ensemble
          des soldes du foyer en une seule fois.
        </p>
      </div>

      {families.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Aucune famille enregistrée"
          hint="Regroupez les frères et sœurs sous un même foyer pour facturer un seul responsable."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {families.map((f, i) => {
            const balance = S.familyBalanceDH(db, f.id);
            const primary = f.primaryMemberId ? memberById(f.primaryMemberId) : null;
            const mems = S.familyMembers(db, f.id);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <SectionCard
                  title={f.name}
                  action={
                    <button
                      type="button"
                      onClick={() => openEdit(f)}
                      className="btn-ghost flex items-center gap-1.5 text-xs"
                    >
                      <Pencil size={14} /> Gérer
                    </button>
                  }
                >
                  <div className="mb-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-ash">Payeur</span>
                      {primary ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
                          <Crown size={12} /> {primary.firstName} {primary.lastName}
                        </span>
                      ) : (
                        <span className="text-xs text-ash">— non défini</span>
                      )}
                    </div>
                    <div className="ml-auto text-right">
                      <span className="block text-xs uppercase tracking-wider text-ash">Solde foyer</span>
                      <span className={`font-display text-2xl leading-none ${balance > 0 ? "text-ember" : "text-bone"}`}>
                        {balance > 0 ? formatDH(balance) : "À jour"}
                      </span>
                    </div>
                  </div>

                  {mems.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-ash">
                      Aucun membre rattaché.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {mems.map((m) => {
                        const isPayer = m.id === f.primaryMemberId;
                        const bal = S.memberBalanceDH(db, m.id);
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/membres/${m.id}`)}
                              className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-steel/30 px-3 py-2 text-left transition-colors hover:border-white/20 hover:bg-white/5"
                            >
                              <Avatar first={m.firstName} last={m.lastName} size={34} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 truncate text-sm font-medium text-bone">
                                  {m.firstName} {m.lastName}
                                  {isPayer && <Crown size={12} className="shrink-0 text-gold" />}
                                </div>
                                <div className="flex items-center gap-1">
                                  {m.disciplineIds.map((d) => (
                                    <span
                                      key={d}
                                      className="rounded px-1 py-0.5 text-[9px] font-bold tracking-wide"
                                      style={{ color: DISCIPLINE_COLORS[d], background: DISCIPLINE_COLORS[d] + "22" }}
                                    >
                                      {DISCIPLINE_SHORT[d]}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className={`shrink-0 tabular-nums text-sm font-semibold ${bal > 0 ? "text-ember" : "text-ash"}`}>
                                {bal > 0 ? formatDH(bal) : "—"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </SectionCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* --- Modal création --- */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Créer une famille">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">Nom du foyer</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Famille El Amrani"
              className="field w-full"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">
              Membres &middot; {newSel.size} sélectionné{newSel.size > 1 ? "s" : ""}
            </label>
            <MemberPicker
              members={eligibleMembers}
              selected={newSel}
              onToggle={toggleNew}
              query={newQuery}
              setQuery={setNewQuery}
            />
            <p className="mt-2 text-xs text-ash">Le 1ᵉʳ membre sélectionné devient le payeur (modifiable ensuite).</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost">
              Annuler
            </button>
            <button
              type="button"
              onClick={submitCreate}
              disabled={!newName.trim() || newSel.size === 0}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Créer la famille
            </button>
          </div>
        </div>
      </Modal>

      {/* --- Modal édition --- */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Gérer · ${editing.name}` : "Gérer"}>
        {editing && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash">
                Membres &middot; {editSel.size} dans le foyer
              </label>
              <MemberPicker
                members={eligibleMembers}
                selected={editSel}
                onToggle={toggleEdit}
                query={editQuery}
                setQuery={setEditQuery}
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ash">
                <Crown size={12} className="text-gold" /> Responsable / payeur
              </label>
              {editSel.size === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-xs text-ash">
                  Sélectionnez au moins un membre pour désigner le payeur.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[...editSel].map((id) => {
                    const m = memberById(id);
                    if (!m) return null;
                    const on = editPrimary === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setEditPrimary(id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          on
                            ? "border-gold bg-gold/15 text-gold"
                            : "border-white/10 bg-steel/40 text-ash hover:border-white/25 hover:text-bone"
                        }`}
                      >
                        {m.firstName} {m.lastName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFamilyMembers(editing.id, [], null);
                  setEditing(null);
                }}
                className="btn-ghost flex items-center gap-1.5 text-xs text-ember/80 hover:text-ember"
              >
                <X size={14} /> Vider le foyer
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
                  Annuler
                </button>
                <button type="button" onClick={submitEdit} className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
