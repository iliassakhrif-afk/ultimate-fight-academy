import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  HardDrive,
  Save,
  Tag,
  Building2,
  Phone,
  MessageCircle,
  MapPin,
  Coins,
  Users,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  KeyRound,
  Lock,
  Check,
  AlertTriangle,
  Moon,
  Languages,
  CalendarClock,
  Receipt,
  UserCog,
  Dumbbell,
  ClipboardCheck,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { formatNum, formatDateLong } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, ROLE_META } from "../constants";
import { dbSizeKB, recordCount, roleStore } from "../store/db";
import type { AppRole, GymSettings } from "../types";
import Avatar from "../components/Avatar";
import { Pill } from "../components/StatusBadge";
import { Modal } from "../components/Overlay";
import { SectionCard } from "../components/EmptyState";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
});

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  admin: <ShieldCheck size={18} />,
  coach: <Dumbbell size={18} />,
  accueil: <ClipboardCheck size={18} />,
};

function InfoTile({
  icon,
  label,
  value,
  accent,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  index: number;
}) {
  return (
    <motion.div
      {...fade(index)}
      className="rounded-2xl border border-white/10 bg-coal p-5"
    >
      <div className="flex items-start justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: accent + "22", color: accent }}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl tracking-wide text-bone">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-ash">{label}</p>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  disabled,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-ash">
        {icon}
        {label}
      </span>
      <input
        type={type}
        className="field disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function Settings() {
  const { db, updateSettings, exportJSON, importJSON, resetDemo } = useStore();
  const s = db.settings;

  // Champs d'édition locaux — persistés réellement via updateSettings au clic.
  const [name, setName] = useState(s.name);
  const [city, setCity] = useState(s.city);
  const [address, setAddress] = useState(s.address);
  const [phone, setPhone] = useState(s.phone);
  const [whatsapp, setWhatsapp] = useState(s.whatsapp);
  const [receiptFooterText, setReceiptFooterText] = useState(s.receiptFooterText);
  const [pin, setPin] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [identitySaved, setIdentitySaved] = useState(false);

  // Rôle de session (démo) — distinct des réglages persistés de la salle.
  const [role, setRole] = useState<AppRole>(roleStore.get());

  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void importJSON(file);
    e.target.value = "";
  };

  const saveIdentity = () => {
    updateSettings({ name, city, address, phone, whatsapp, receiptFooterText });
    setIdentitySaved(true);
    window.setTimeout(() => setIdentitySaved(false), 2000);
  };

  const savePin = () => {
    if (pin.length < 4) return;
    updateSettings({ adminPin: pin });
    setPin("");
    setPinSaved(true);
    window.setTimeout(() => setPinSaved(false), 2000);
  };

  const setLanguage = (language: GymSettings["language"]) => updateSettings({ language });

  const chooseRole = (r: AppRole) => {
    roleStore.set(r);
    setRole(r);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">RÉGLAGES &amp; DONNÉES</h1>
        <p className="text-ash">
          Identité de la salle, équipe encadrante et gestion des données de démonstration.
        </p>
      </div>

      {/* KPIs / infos système */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <InfoTile
          index={0}
          icon={<HardDrive size={18} />}
          label="Espace localStorage"
          value={`${formatNum(dbSizeKB(db))} Ko`}
          accent="#ff3d2e"
        />
        <InfoTile
          index={1}
          icon={<Database size={18} />}
          label="Enregistrements"
          value={formatNum(recordCount(db))}
          accent="#f5b730"
        />
        <InfoTile
          index={2}
          icon={<Save size={18} />}
          label="Dernière sauvegarde"
          value={s.lastBackupAt ? formatDateLong(s.lastBackupAt.slice(0, 10)) : "—"}
          accent="#3ddc84"
        />
        <InfoTile
          index={3}
          icon={<Tag size={18} />}
          label="Version du seed"
          value={`v${s.seedVersion}`}
          accent="#9b8cff"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identité salle */}
        <motion.div {...fade(4)} className="lg:col-span-2">
          <SectionCard
            title="Identité de la salle"
            action={
              <button onClick={saveIdentity} className="btn-ghost text-sm">
                {identitySaved ? (
                  <span className="flex items-center gap-1.5 text-[var(--vert,#3ddc84)]">
                    <Check size={15} /> Enregistré
                  </span>
                ) : (
                  "Enregistrer"
                )}
              </button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Nom de la salle"
                  value={name}
                  onChange={setName}
                  icon={<Building2 size={13} />}
                />
              </div>
              <Field label="Ville" value={city} onChange={setCity} icon={<MapPin size={13} />} />
              <Field
                label="Adresse"
                value={address}
                onChange={setAddress}
                icon={<MapPin size={13} />}
              />
              <Field label="Téléphone" value={phone} onChange={setPhone} icon={<Phone size={13} />} />
              <Field
                label="WhatsApp"
                value={whatsapp}
                onChange={setWhatsapp}
                icon={<MessageCircle size={13} />}
              />
              <Field
                label="Devise"
                value={s.currency}
                onChange={() => {}}
                icon={<Coins size={13} />}
                disabled
              />
              <div className="sm:col-span-2">
                <Field
                  label="Pied de page des reçus"
                  value={receiptFooterText}
                  onChange={setReceiptFooterText}
                  icon={<Receipt size={13} />}
                  placeholder="Merci de votre confiance…"
                />
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ash">
              <Lock size={12} /> La devise est verrouillée (Dirham marocain — DH).
            </p>
          </SectionCard>
        </motion.div>

        {/* Code PIN */}
        <motion.div {...fade(5)}>
          <SectionCard title="Code PIN d'accès">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
                <KeyRound size={18} />
              </span>
              <p className="text-sm text-ash">
                Protège l'espace administrateur de la démo. Choisissez un code à 4 chiffres minimum.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <Field
                label="Nouveau code PIN"
                value={pin}
                onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 6))}
                icon={<Lock size={13} />}
                placeholder="••••"
                type="password"
              />
              <button
                onClick={savePin}
                disabled={pin.length < 4}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pinSaved ? (
                  <span className="flex items-center gap-1.5">
                    <Check size={15} /> Code mis à jour
                  </span>
                ) : (
                  "Modifier le code PIN"
                )}
              </button>
            </div>
          </SectionCard>
        </motion.div>
      </div>

      {/* Préférences salle — Ramadan, langue, horloge démo */}
      <motion.div {...fade(5.5)}>
        <SectionCard title="Préférences de la salle">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Mode Ramadan */}
            <div className="rounded-xl border border-white/10 bg-ink p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                  <Moon size={18} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-bone">Mode Ramadan</p>
                    <button
                      role="switch"
                      aria-checked={s.ramadanMode}
                      onClick={() => updateSettings({ ramadanMode: !s.ramadanMode })}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        s.ramadanMode ? "bg-gold" : "bg-white/15"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-bone transition-transform ${
                          s.ramadanMode ? "translate-x-[22px]" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-ash">
                    Décale automatiquement les créneaux du soir après la rupture du jeûne.
                  </p>
                </div>
              </div>
            </div>

            {/* Langue */}
            <div className="rounded-xl border border-white/10 bg-ink p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#9b8cff]/15 text-[#9b8cff]">
                  <Languages size={18} />
                </span>
                <div className="flex-1">
                  <p className="font-medium text-bone">Langue de l'interface</p>
                  <p className="mt-1 text-xs text-ash">Français ou arabe pour la démo.</p>
                  <div className="mt-3 flex gap-2">
                    {(["fr", "ar"] as const).map((lng) => (
                      <button
                        key={lng}
                        onClick={() => setLanguage(lng)}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          s.language === lng
                            ? "border-gold/50 bg-gold/15 text-gold"
                            : "border-white/10 text-ash hover:bg-white/5"
                        }`}
                      >
                        {lng === "fr" ? "Français" : "العربية"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Horloge démo */}
            <div className="rounded-xl border border-white/10 bg-ink p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
                  <CalendarClock size={18} />
                </span>
                <div className="flex-1">
                  <p className="font-medium text-bone">Horloge démo</p>
                  <p className="mt-1 text-xs text-ash">
                    Date « aujourd'hui » utilisée par toute l'app. Idéale pour les démos.
                  </p>
                  <input
                    type="date"
                    className="field mt-3"
                    value={s.demoClock}
                    onChange={(e) => updateSettings({ demoClock: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Rôle de session */}
      <motion.div {...fade(5.8)}>
        <SectionCard
          title="Rôle de session"
          action={
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-ash">
              <UserCog size={13} /> {ROLE_META[role].label}
            </span>
          }
        >
          <p className="mb-4 text-sm text-ash">
            Choisissez le rôle de la session de démonstration. Il définit les permissions affichées
            (encaissements, promotions, configuration) — il est stocké localement dans ce navigateur,
            indépendamment des données de la salle.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(ROLE_META) as AppRole[]).map((r) => {
              const meta = ROLE_META[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => chooseRole(r)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-ember/50 bg-ember/10"
                      : "border-white/10 bg-ink hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        active ? "bg-ember/20 text-ember" : "bg-white/5 text-ash"
                      }`}
                    >
                      {ROLE_ICONS[r]}
                    </span>
                    {active && <Check size={16} className="text-ember" />}
                  </div>
                  <p className="mt-3 font-medium text-bone">{meta.label}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {meta.canMoney && <Pill label="Encaissements" color="#3ddc84" />}
                    {meta.canPromote && <Pill label="Promotions" color="#f5b730" />}
                    {meta.canConfig && <Pill label="Configuration" color="#9b8cff" />}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </motion.div>

      {/* Staff & coachs */}
      <motion.div {...fade(6)}>
        <SectionCard
          title="Staff & coachs"
          action={
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-ash">
              <Users size={13} /> {db.coaches.length} encadrants
            </span>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {db.coaches.map((c, i) => (
              <motion.div
                key={c.id}
                {...fade(7 + i * 0.4)}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink p-3"
              >
                <Avatar first={c.firstName} last={c.lastName} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-bone">
                      {c.firstName} {c.lastName}
                    </p>
                    {!c.active && (
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ash">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ash">
                    {c.role} · Ceinture {c.beltRank}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.disciplineIds.map((d) => (
                      <Pill key={d} label={DISCIPLINE_LABELS[d]} color={DISCIPLINE_COLORS[d]} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>

      {/* Données démo */}
      <motion.div {...fade(8)}>
        <SectionCard title="Données de démonstration">
          <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="font-medium text-bone">Mode démo — 100% local</p>
              <p className="mt-0.5 text-sm text-ash">
                Toutes les données restent dans votre navigateur (localStorage). Rien n'est envoyé sur
                un serveur. Exportez un instantané, réimportez-le, ou réinitialisez à tout moment en
                toute sécurité.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button onClick={exportJSON} className="btn-ghost justify-center gap-2">
              <Download size={16} /> Exporter le JSON
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-ghost justify-center gap-2"
            >
              <Upload size={16} /> Importer un JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={() => setConfirmReset(true)}
              className="btn-ghost justify-center gap-2 border-ember/40 text-ember hover:bg-ember/10"
            >
              <RotateCcw size={16} /> Réinitialiser la démo
            </button>
          </div>
        </SectionCard>
      </motion.div>

      {/* Confirmation réinitialisation */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Réinitialiser la démo ?">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-ember/30 bg-ember/10 p-4">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-ember" />
            <p className="text-sm text-ash">
              Toutes les modifications de cette session seront effacées et remplacées par les données
              d'origine ({formatNum(recordCount(db))} enregistrements). Cette action est irréversible.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmReset(false)} className="btn-ghost">
              Annuler
            </button>
            <button
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
              }}
              className="btn-primary gap-2"
            >
              <RotateCcw size={16} /> Réinitialiser
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
