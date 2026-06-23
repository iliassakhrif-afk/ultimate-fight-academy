import type { DisciplineId, BeltRank, MemberStatus, InstallmentStatus, AppRole } from "./types";

export const DEMO_CLOCK = "2026-06-18";
export const SEED_VERSION = 5;
export const ADMIN_PIN = "1234";
export const LS_PREFIX = "ufa.admin.v1";
export const LS_AUTH = "ufa.admin.auth";

export const DISCIPLINE_LABELS: Record<DisciplineId, string> = {
  bjj: "Jiu-Jitsu (BJJ)",
  mma: "MMA",
  kickboxing: "Kickboxing",
  boxe: "Boxe Anglaise",
  kids: "Kids Academy",
  women: "Women Only",
};

export const DISCIPLINE_COLORS: Record<DisciplineId, string> = {
  bjj: "#ff3d2e",
  mma: "#f5b730",
  kickboxing: "#3aa0ff",
  boxe: "#9b5cff",
  kids: "#3ddc84",
  women: "#ff5ea8",
};

export const DISCIPLINE_SHORT: Record<DisciplineId, string> = {
  bjj: "BJJ",
  mma: "MMA",
  kickboxing: "KICK",
  boxe: "BOXE",
  kids: "KIDS",
  women: "WMN",
};

// Couleurs sémantiques de statut membre
export const STATUS_META: Record<MemberStatus, { label: string; color: string; bg: string }> = {
  actif: { label: "Actif", color: "#3ddc84", bg: "rgba(61,220,132,0.14)" },
  essai: { label: "Essai", color: "#3aa0ff", bg: "rgba(58,160,255,0.14)" },
  prospect: { label: "Prospect", color: "#8a8a93", bg: "rgba(138,138,147,0.14)" },
  gele: { label: "Gelé", color: "#f5b730", bg: "rgba(245,183,48,0.14)" },
  expire: { label: "Expiré", color: "#ff3d2e", bg: "rgba(255,61,46,0.14)" },
  churn: { label: "Parti", color: "#6b6b73", bg: "rgba(107,107,115,0.14)" },
};

export const INSTALLMENT_META: Record<InstallmentStatus, { label: string; color: string; bg: string }> = {
  paye: { label: "Payé", color: "#3ddc84", bg: "rgba(61,220,132,0.14)" },
  partiel: { label: "Partiel", color: "#f5b730", bg: "rgba(245,183,48,0.14)" },
  en_attente: { label: "En attente", color: "#8a8a93", bg: "rgba(138,138,147,0.14)" },
  en_retard: { label: "En retard", color: "#ff3d2e", bg: "rgba(255,61,46,0.14)" },
};

// Couleurs officielles des ceintures
export const BELT_COLORS: Record<BeltRank, { label: string; bar: string; text: string }> = {
  blanche: { label: "Blanche", bar: "#f4f1ea", text: "#0a0a0b" },
  bleue: { label: "Bleue", bar: "#2f6fed", text: "#fff" },
  violette: { label: "Violette", bar: "#7c3aed", text: "#fff" },
  marron: { label: "Marron", bar: "#7c4a21", text: "#fff" },
  noire: { label: "Noire", bar: "#16161a", text: "#fff" },
  "kids-grise": { label: "Grise", bar: "#9aa0aa", text: "#0a0a0b" },
  "kids-jaune": { label: "Jaune", bar: "#f5d020", text: "#0a0a0b" },
  "kids-orange": { label: "Orange", bar: "#ff8c2e", text: "#0a0a0b" },
  "kids-verte": { label: "Verte", bar: "#3ddc84", text: "#0a0a0b" },
};

export const ADULT_BELTS: BeltRank[] = ["blanche", "bleue", "violette", "marron", "noire"];
export const KIDS_BELTS: BeltRank[] = ["blanche", "kids-grise", "kids-jaune", "kids-orange", "kids-verte"];

// Navigation admin groupée (les icônes sont des noms lucide résolus dans la Sidebar)
export const NAV_GROUPS: { group: string; items: { label: string; to: string; icon: string; end?: boolean }[] }[] = [
  {
    group: "Pilotage",
    items: [
      { label: "Tableau de bord", to: "/admin", icon: "LayoutDashboard", end: true },
      { label: "Statistiques", to: "/admin/statistiques", icon: "TrendingUp" },
      { label: "Portail membre", to: "/admin/portail", icon: "Smartphone" },
    ],
  },
  {
    group: "Membres",
    items: [
      { label: "Membres", to: "/admin/membres", icon: "Users" },
      { label: "Prospects", to: "/admin/prospects", icon: "UserPlus" },
      { label: "Familles", to: "/admin/familles", icon: "UsersRound" },
      { label: "Présences", to: "/admin/presences", icon: "ClipboardCheck" },
      { label: "Techniques", to: "/admin/techniques", icon: "Dumbbell" },
      { label: "Grades & ceintures", to: "/admin/grades", icon: "Award" },
    ],
  },
  {
    group: "Argent",
    items: [
      { label: "Paiements & caisse", to: "/admin/paiements", icon: "Wallet" },
      { label: "Échéances & relances", to: "/admin/echeances", icon: "AlarmClock" },
      { label: "Abonnements", to: "/admin/abonnements", icon: "CreditCard" },
    ],
  },
  {
    group: "Salle",
    items: [
      { label: "Planning", to: "/admin/planning", icon: "CalendarDays" },
      { label: "Réglages", to: "/admin/reglages", icon: "Settings" },
    ],
  },
];

// Données marocaines pour le seed déterministe
export const MA_FIRST_M = ["Youssef", "Mehdi", "Anas", "Khalil", "Omar", "Reda", "Yassine", "Hamza", "Bilal", "Adam", "Ayoub", "Zakaria", "Soufiane", "Amine", "Othmane", "Ismail", "Nabil", "Marwane", "Ilyas", "Walid"];
export const MA_FIRST_F = ["Salma", "Imane", "Lina", "Sara", "Hiba", "Yasmine", "Nour", "Aya", "Ghita", "Meryem", "Kenza", "Rania", "Douaa", "Israe", "Chaimae"];
export const MA_LAST = ["El Amrani", "Benjelloun", "Tazi", "Cherkaoui", "Bouazza", "El Fassi", "Ouali", "Berrada", "Idrissi", "Sebti", "Lahlou", "Bennani", "Alaoui", "Saidi", "Kabbaj", "Mansouri", "Chraibi", "El Khattabi", "Bouzidi", "Naciri"];
export const KENITRA_AREAS = ["Maâmora", "Mimosas", "Val Fleuri", "Bir Rami", "Ouled Oujih", "Saknia", "La Ville Haute", "Khabazat"];

export const WEEK_DAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM"] as const;

// Curriculum BJJ : exigences (nb de techniques distinctes maîtrisées) pour passer au grade suivant
export const BELT_CURRICULUM: { from: BeltRank; to: BeltRank; target: number; focus: string[] }[] = [
  { from: "blanche", to: "bleue", target: 12, focus: ["Mouvement", "Garde", "Contrôle", "Échappe", "Soumission"] },
  { from: "bleue", to: "violette", target: 22, focus: ["Passage", "Renversement", "Soumission", "Soumission jambe"] },
  { from: "violette", to: "marron", target: 34, focus: ["Passage", "Renversement", "Soumission", "Soumission jambe", "Projection"] },
  { from: "marron", to: "noire", target: 48, focus: ["Soumission", "Soumission jambe", "Projection", "Passage"] },
];

// Rôles de l'app (démo) et leurs permissions
export const ROLE_META: Record<AppRole, { label: string; icon: string; canMoney: boolean; canPromote: boolean; canConfig: boolean }> = {
  admin: { label: "Administrateur", icon: "ShieldCheck", canMoney: true, canPromote: true, canConfig: true },
  coach: { label: "Coach", icon: "Dumbbell", canMoney: false, canPromote: true, canConfig: false },
  accueil: { label: "Accueil", icon: "ClipboardCheck", canMoney: true, canPromote: false, canConfig: false },
};
export const LS_ROLE = "ufa.admin.role";

// Décalage des créneaux du soir pendant le Ramadan (après la rupture du jeûne)
export const RAMADAN_EVENING_SHIFT_MIN = 90; // +1h30 sur les cours débutant après 17h
