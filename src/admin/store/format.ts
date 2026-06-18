// Helpers de formatage — devise DH, dates FR, WhatsApp, avatars.

export const formatDH = (n: number): string =>
  `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} DH`;

export const formatNum = (n: number): string =>
  Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ");

export const parseISO = (s: string): Date => new Date(s + (s.length <= 10 ? "T00:00:00" : ""));

export const formatDateFR = (iso: string): string => {
  const d = parseISO(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatDateShort = (iso: string): string => {
  const d = parseISO(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export const formatDateLong = (iso: string): string => {
  const d = parseISO(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
};

export const MS_DAY = 86400000;

export const daysBetween = (a: string, b: string): number =>
  Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / MS_DAY);

const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (iso: string, days: number): string => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const addMonths = (iso: string, months: number): string => {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
};

export const ageFrom = (birthISO: string, nowISO: string): number => {
  const b = parseISO(birthISO);
  const n = parseISO(nowISO);
  let age = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) age--;
  return age;
};

export const monthKey = (iso: string): string => iso.slice(0, 7);

export const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
export const monthLabel = (iso: string): string => {
  const d = parseISO(iso);
  return MONTHS_FR[d.getMonth()];
};

// Initiales + couleur déterministe (hash du nom) pour avatars sans image
export const initials = (first: string, last: string): string =>
  (first.charAt(0) + last.charAt(0)).toUpperCase();

const AVATAR_COLORS = ["#ff3d2e", "#f5b730", "#3aa0ff", "#9b5cff", "#3ddc84", "#ff5ea8", "#26c6da", "#ffa726"];
export const avatarColor = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// WhatsApp — lien wa.me à partir d'un numéro +212 6XX-XXXXXX
export const waLink = (phone: string, message: string): string => {
  const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, "212");
  const num = digits.startsWith("212") ? digits : "212" + digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
};

// Interpolation de modèle : {prenom}, {montant}, {echeance}, {plan}
export const interpolate = (tpl: string, vars: Record<string, string>): string =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

// Montant DH en toutes lettres (pour les reçus)
const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
const threeDigits = (n: number): string => {
  let s = "";
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h > 0) s += (h > 1 ? UNITS[h] + " cent" : "cent") + " ";
  if (r < 20) s += UNITS[r];
  else {
    const t = Math.floor(r / 10);
    const u = r % 10;
    if (t === 7 || t === 9) s += TENS[t] + "-" + UNITS[10 + u];
    else s += TENS[t] + (u ? "-" + UNITS[u] : "");
  }
  return s.trim();
};
export const amountInWords = (n: number): string => {
  n = Math.round(n);
  if (n === 0) return "zéro dirham";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  let s = "";
  if (thousands > 0) s += (thousands > 1 ? threeDigits(thousands) + " mille" : "mille") + " ";
  if (rest > 0) s += threeDigits(rest);
  return (s.trim() + " dirham" + (n > 1 ? "s" : "")).replace(/\s+/g, " ");
};

export const phoneFR = (p: string): string => p;
