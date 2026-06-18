import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Layers,
  ReceiptText,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarClock,
  Banknote,
  Building2,
  CreditCard,
  FileText,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { formatDH, ageFrom, addMonths, formatDateFR } from "../store/format";
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT } from "../constants";
import { SectionCard } from "../components/EmptyState";
import { Pill } from "../components/StatusBadge";
import type { DisciplineId, PayMethod, MembershipPlan } from "../types";

type Duration = "6 mois" | "1 an";
type PayMode = "comptant" | "echelonne";

const STEPS = [
  { n: 1, label: "Identité", icon: User },
  { n: 2, label: "Formule", icon: Layers },
  { n: 3, label: "Facturation", icon: ReceiptText },
  { n: 4, label: "Encaissement", icon: Wallet },
] as const;

const ALL_DISCIPLINES = Object.keys(DISCIPLINE_LABELS) as DisciplineId[];

const PAY_METHODS: { id: PayMethod; label: string; icon: typeof Banknote }[] = [
  { id: "especes", label: "Espèces", icon: Banknote },
  { id: "virement", label: "Virement", icon: Building2 },
  { id: "cheque", label: "Chèque", icon: FileText },
  { id: "carte", label: "Carte", icon: CreditCard },
];

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.32 } }),
};

export default function MemberWizard() {
  const { db, now, addMember, collectPayment } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Étape 1 — Identité
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"H" | "F">("H");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [guardian, setGuardian] = useState("");

  // Étape 2 — Formule
  const [planId, setPlanId] = useState<string>(db.plans[0]?.id ?? "");
  const [duration, setDuration] = useState<Duration>("1 an");
  const [disciplineIds, setDisciplineIds] = useState<DisciplineId[]>(["bjj"]);

  // Étape 3 — Facturation
  const [payMode, setPayMode] = useState<PayMode>("comptant");
  const [installmentsCount, setInstallmentsCount] = useState(3);

  // Étape 4 — Encaissement
  const [payMethod, setPayMethod] = useState<PayMethod>("especes");
  const [firstAmount, setFirstAmount] = useState<number | null>(null);

  const age = birthDate ? ageFrom(birthDate, now) : null;
  const isMinor = age !== null && age < 18;

  const plan: MembershipPlan | undefined = useMemo(
    () => db.plans.find((p) => p.id === planId),
    [db.plans, planId],
  );

  const discLimit: number | "toutes" = plan?.disciplineLimit ?? 1;
  const maxDisc = discLimit === "toutes" ? ALL_DISCIPLINES.length : discLimit;

  // Calcul de prix réactif
  const basePrice = plan ? (duration === "1 an" ? plan.price12mDH : plan.price6mDH) : 0;
  const regFee = plan?.registrationFeeDH ?? 0;
  const yearlyBonus = duration === "1 an"; // frais d'inscription offerts + 2 mois offerts
  const total = basePrice + (yearlyBonus ? 0 : regFee);

  // Échéancier (aperçu — non persisté en base)
  const schedule = useMemo(() => {
    if (payMode === "comptant") {
      return [{ label: "Paiement comptant", dueDate: now, amount: total }];
    }
    const n = installmentsCount;
    const part = Math.floor(total / n);
    const rest = total - part * n;
    return Array.from({ length: n }, (_, i) => ({
      label: `Versement ${i + 1}/${n}`,
      dueDate: addMonths(now, i * (duration === "1 an" ? 4 : 2)),
      amount: i === 0 ? part + rest : part,
    }));
  }, [payMode, installmentsCount, total, now, duration]);

  const suggestedFirst = schedule[0]?.amount ?? total;
  const effFirst = firstAmount ?? suggestedFirst;

  // Validation par étape
  const step1Valid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    birthDate !== "" &&
    phone.trim() !== "" &&
    (!isMinor || guardian.trim() !== "");
  const step2Valid = !!plan && disciplineIds.length > 0 && disciplineIds.length <= maxDisc;
  const canNext = (step === 1 && step1Valid) || (step === 2 && step2Valid) || step === 3;

  function toggleDiscipline(id: DisciplineId) {
    setDisciplineIds((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id);
      if (prev.length >= maxDisc) {
        // remplace la plus ancienne si la limite est atteinte
        return maxDisc === 1 ? [id] : [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }

  function pickPlan(p: MembershipPlan) {
    setPlanId(p.id);
    const lim = p.disciplineLimit === "toutes" ? ALL_DISCIPLINES.length : p.disciplineLimit;
    setDisciplineIds((prev) => (prev.length > lim ? prev.slice(0, lim) : prev.length ? prev : ["bjj"]));
  }

  function finalize() {
    const ageCategory: "enfant" | "ado" | "adulte" =
      age === null ? "adulte" : age < 13 ? "enfant" : age < 18 ? "ado" : "adulte";
    const member = addMember({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      birthDate,
      ageCategory,
      phone: phone.trim(),
      whatsapp: phone.trim(),
      disciplineIds,
      status: "actif",
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      guardianName: isMinor ? guardian.trim() || null : null,
      preferredPaymentMethod: payMethod,
      acquisitionSource: "walkin",
    });
    collectPayment({
      memberId: member.id,
      installmentId: null,
      amount: effFirst,
      method: payMethod,
      type: "inscription",
      note: `Inscription ${plan?.name ?? ""} — ${duration} — ${payMode === "comptant" ? "comptant" : `échelonné ${installmentsCount}×`}`,
    });
    navigate(`/admin/membres/${member.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">Nouvelle inscription</h1>
        <p className="text-ash">
          Assistant guidé — identité, formule, facturation et premier encaissement en 4 étapes.
        </p>
      </div>

      {/* Stepper */}
      <div className="rounded-2xl border border-white/10 bg-coal p-5">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            const Icon = s.icon;
            return (
              <div key={s.n} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  onClick={() => (s.n < step ? setStep(s.n) : undefined)}
                  className={`flex items-center gap-3 ${s.n < step ? "cursor-pointer" : "cursor-default"}`}
                >
                  <motion.span
                    initial={false}
                    animate={{
                      backgroundColor: done
                        ? "rgba(61,220,132,0.16)"
                        : active
                          ? "rgba(255,61,46,0.16)"
                          : "rgba(255,255,255,0.04)",
                      borderColor: done ? "#3ddc84" : active ? "#ff3d2e" : "rgba(255,255,255,0.12)",
                    }}
                    className="grid h-11 w-11 place-items-center rounded-2xl border"
                    style={{ color: done ? "#3ddc84" : active ? "#ff3d2e" : "#8a8a93" }}
                  >
                    {done ? <Check size={20} /> : <Icon size={20} />}
                  </motion.span>
                  <div className="hidden sm:block">
                    <div className="text-[11px] uppercase tracking-wider text-ash">Étape {s.n}</div>
                    <div
                      className={`font-display text-sm tracking-wide ${active ? "text-bone" : done ? "text-bone/80" : "text-ash"}`}
                    >
                      {s.label}
                    </div>
                  </div>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="mx-3 h-px flex-1 overflow-hidden rounded bg-white/10">
                    <motion.div
                      initial={false}
                      animate={{ width: step > s.n ? "100%" : "0%" }}
                      transition={{ duration: 0.4 }}
                      className="h-full"
                      style={{ background: "linear-gradient(90deg,#3ddc84,#f5b730)" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Corps de l'étape */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {step === 1 && (
            <SectionCard title="Identité du membre">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Prénom" required>
                  <input
                    className="field"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Younes"
                  />
                </Field>
                <Field label="Nom" required>
                  <input
                    className="field"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="El Amrani"
                  />
                </Field>
                <Field label="Genre">
                  <div className="grid grid-cols-2 gap-2">
                    {(["H", "F"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                          gender === g
                            ? "border-ember/60 bg-ember/10 text-bone"
                            : "border-white/10 bg-ink text-ash hover:text-bone"
                        }`}
                      >
                        {g === "H" ? "Homme" : "Femme"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Date de naissance" required>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="field"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                    {age !== null && (
                      <Pill label={`${age} ans`} color={isMinor ? "#f5b730" : "#3ddc84"} />
                    )}
                  </div>
                </Field>
                <Field label="Téléphone / WhatsApp" required>
                  <input
                    className="field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6 12 34 56 78"
                  />
                </Field>
                {isMinor && (
                  <Field label="Responsable légal" required>
                    <input
                      className="field"
                      value={guardian}
                      onChange={(e) => setGuardian(e.target.value)}
                      placeholder="Nom du parent / tuteur"
                    />
                  </Field>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-ink/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-ash">
                  <ShieldCheck size={16} className="text-gold" />
                  Contact d'urgence
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nom du contact">
                    <input
                      className="field"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="Proche à prévenir"
                    />
                  </Field>
                  <Field label="Téléphone du contact">
                    <input
                      className="field"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+212 …"
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>
          )}

          {step === 2 && (
            <SectionCard
              title="Choix de la formule"
              action={
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-ink p-1">
                  {(["6 mois", "1 an"] as Duration[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        duration === d ? "bg-ember text-white" : "text-ash hover:text-bone"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {db.plans.map((p, i) => {
                  const price = duration === "1 an" ? p.price12mDH : p.price6mDH;
                  const selected = planId === p.id;
                  return (
                    <motion.button
                      key={p.id}
                      type="button"
                      custom={i}
                      variants={rise}
                      initial="hidden"
                      animate="show"
                      onClick={() => pickPlan(p)}
                      className={`relative overflow-hidden rounded-2xl border p-5 text-left transition ${
                        selected
                          ? "border-ember bg-ember/10"
                          : "border-white/10 bg-ink hover:border-white/25"
                      }`}
                    >
                      {p.featured && (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                          <Sparkles size={11} /> Populaire
                        </span>
                      )}
                      <div className="font-display text-lg tracking-wide text-bone">{p.name}</div>
                      <div className="text-xs text-ash">{p.sub}</div>
                      <div className="mt-4 font-display text-3xl tracking-wide text-bone">
                        {formatDH(price)}
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-ash">
                        <div>
                          {p.disciplineLimit === "toutes"
                            ? "Toutes les disciplines"
                            : `${p.disciplineLimit} discipline${p.disciplineLimit > 1 ? "s" : ""}`}
                        </div>
                        <div>{p.classesPerWeek} cours / semaine</div>
                      </div>
                      {selected && (
                        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ember">
                          <Check size={13} /> Sélectionné
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-bone">Disciplines incluses</span>
                  <span className="text-xs text-ash">
                    {disciplineIds.length} / {discLimit === "toutes" ? "∞" : maxDisc} sélectionnée
                    {disciplineIds.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_DISCIPLINES.map((id) => {
                    const on = disciplineIds.includes(id);
                    const color = DISCIPLINE_COLORS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleDiscipline(id)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                          on ? "text-bone" : "border-white/10 bg-ink text-ash hover:text-bone"
                        }`}
                        style={on ? { borderColor: color, background: `${color}1f` } : undefined}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: color, opacity: on ? 1 : 0.4 }}
                        />
                        {DISCIPLINE_LABELS[id]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          )}

          {step === 3 && (
            <SectionCard title="Récapitulatif & facturation">
              <div className="space-y-2 text-sm">
                <Line label={`Abonnement ${plan?.name ?? ""} — ${duration}`} value={formatDH(basePrice)} />
                {yearlyBonus ? (
                  <>
                    <Line label="Frais d'inscription" value="Offerts" muted />
                    <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
                      <Sparkles size={14} /> Engagement annuel : 2 mois offerts + frais d'inscription inclus.
                    </div>
                  </>
                ) : (
                  <Line label="Frais d'inscription inclus" value={formatDH(regFee)} />
                )}
                <div className="my-3 h-px bg-white/10" />
                <div className="flex items-end justify-between">
                  <span className="text-ash">Total à facturer</span>
                  <span className="font-display text-4xl tracking-wide text-bone">{formatDH(total)}</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm text-bone">Mode de paiement</div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: "comptant", label: "Comptant", hint: "Réglé en une fois" },
                      { id: "echelonne", label: "Échelonné", hint: "2 ou 3 versements" },
                    ] as { id: PayMode; label: string; hint: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMode(m.id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        payMode === m.id
                          ? "border-ember bg-ember/10"
                          : "border-white/10 bg-ink hover:border-white/25"
                      }`}
                    >
                      <div className="font-medium text-bone">{m.label}</div>
                      <div className="text-xs text-ash">{m.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {payMode === "echelonne" && (
                <div className="mt-4">
                  <div className="mb-2 text-sm text-bone">Nombre de versements</div>
                  <div className="flex gap-2">
                    {[2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInstallmentsCount(n)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                          installmentsCount === n
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-white/10 bg-ink text-ash hover:text-bone"
                        }`}
                      >
                        {n} fois
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
                <div className="flex items-center gap-2 border-b border-white/10 bg-ink/60 px-4 py-2.5 text-xs uppercase tracking-wider text-ash">
                  <CalendarClock size={14} className="text-gold" /> Aperçu de l'échéancier
                </div>
                <div className="divide-y divide-white/5">
                  {schedule.map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <div className="text-bone">{row.label}</div>
                        <div className="text-xs text-ash">Échéance {formatDateFR(row.dueDate)}</div>
                      </div>
                      <div className="font-display tracking-wide text-bone tabular-nums">
                        {formatDH(row.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {step === 4 && (
            <SectionCard title="Premier encaissement">
              <div className="rounded-xl border border-white/10 bg-ink/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ash">À encaisser maintenant ({schedule[0]?.label})</span>
                  <span className="font-display text-2xl tracking-wide text-gold tabular-nums">
                    {formatDH(suggestedFirst)}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Montant encaissé (DH)">
                  <div className="relative">
                    <CircleDollarSign
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash"
                    />
                    <input
                      type="number"
                      className="field pl-9 text-right tabular-nums"
                      value={effFirst}
                      min={0}
                      onChange={(e) => { const v = Number(e.target.value); setFirstAmount(Number.isFinite(v) && v >= 0 ? v : 0); }}
                    />
                  </div>
                </Field>
                <Field label="Méthode de paiement">
                  <div className="grid grid-cols-2 gap-2">
                    {PAY_METHODS.map((m) => {
                      const Icon = m.icon;
                      const on = payMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayMethod(m.id)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                            on
                              ? "border-ember bg-ember/10 text-bone"
                              : "border-white/10 bg-ink text-ash hover:text-bone"
                          }`}
                        >
                          <Icon size={15} /> {m.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <button
                type="button"
                onClick={finalize}
                disabled={effFirst <= 0}
                className="btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={18} /> Finaliser l'inscription
              </button>
              <p className="mt-2 text-center text-xs text-ash">
                Le membre sera créé en statut « Actif » et un reçu sera émis pour {formatDH(effFirst)}.
              </p>
            </SectionCard>
          )}
        </div>

        {/* Panneau récap latéral */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-coal p-5">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-ash">
              <ReceiptText size={14} className="text-gold" /> Résumé du dossier
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-ash">Membre</div>
                <div className="font-display text-lg tracking-wide text-bone">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : "—"}
                </div>
                <div className="text-xs text-ash">
                  {gender === "H" ? "Homme" : "Femme"}
                  {age !== null ? ` · ${age} ans` : ""}
                  {isMinor ? " · mineur" : ""}
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <div className="text-xs text-ash">Formule</div>
                <div className="text-bone">{plan?.name ?? "—"}</div>
                <div className="text-xs text-ash">{duration}</div>
                {disciplineIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {disciplineIds.map((id) => (
                      <Pill key={id} label={DISCIPLINE_SHORT[id]} color={DISCIPLINE_COLORS[id]} />
                    ))}
                  </div>
                )}
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-ash">Total</span>
                <span className="font-display text-2xl tracking-wide text-bone tabular-nums">
                  {formatDH(total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-ash">
                <span>
                  {payMode === "comptant" ? "Comptant" : `Échelonné ${installmentsCount}×`}
                </span>
                <span>1er versement {formatDH(suggestedFirst)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} /> Précédent
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => canNext && setStep((s) => Math.min(4, s + 1))}
            disabled={!canNext}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suivant <ChevronRight size={18} />
          </button>
        ) : (
          <span className="text-xs text-ash">Vérifiez puis finalisez ci-dessus.</span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-ash">
        {label}
        {required && <span className="ml-1 text-ember">*</span>}
      </span>
      {children}
    </label>
  );
}

function Line({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ash">{label}</span>
      <span className={`font-medium tabular-nums ${muted ? "text-ash" : "text-bone"}`}>{value}</span>
    </div>
  );
}
