export const disciplines = [
  {
    id: "bjj",
    name: "Jiu-Jitsu Brésilien",
    tag: "Gi & No-Gi",
    desc: "Soumissions, contrôle et technique au sol. Cours Gi et No-Gi pour enfants et adultes, du débutant au compétiteur.",
    img: "/images/bjj.jpg",
    level: "Enfants & Adultes",
  },
  {
    id: "mma",
    name: "MMA",
    tag: "Arts Martiaux Mixtes",
    desc: "Le combat complet : pieds-poings, lutte et sol. Cours enfants, adultes débutants et groupe avancé pour les compétiteurs.",
    img: "/images/hero-2.jpg",
    level: "Enfants & Adultes",
  },
  {
    id: "kickboxing",
    name: "Kickboxing",
    tag: "Pieds-poings",
    desc: "Frappe explosive, cardio et self-défense. Coups de poing et de pied pour une condition physique redoutable.",
    img: "/images/muaythai-1.jpg",
    level: "Enfants & Adultes",
  },
  {
    id: "boxe",
    name: "Boxe Anglaise",
    tag: "Le noble art",
    desc: "Jab, direct, esquive, footwork. Apprends à boxer, gagne en explosivité et en cardio dès la première séance.",
    img: "/images/boxing-1.jpg",
    level: "Adultes",
  },
  {
    id: "kids",
    name: "Kids Academy",
    tag: "Dès 5 ans",
    desc: "Discipline, confiance et respect. BJJ, MMA et kickboxing dans un cadre sécurisé pour former les champions de demain.",
    img: "/images/kids.jpg",
    level: "Enfants",
  },
  {
    id: "women",
    name: "Women Only",
    tag: "Cours 100% féminin",
    desc: "Self-défense, fitness boxing et confiance en soi. Un espace dédié pour se dépasser entre femmes.",
    img: "/images/female-kickbox.jpg",
    level: "Bientôt",
  },
];

export const stats = [
  { value: 12, suffix: "+", label: "Années d'expérience" },
  { value: 850, suffix: "+", label: "Membres actifs" },
  { value: 24, suffix: "", label: "Coachs & combattants" },
  { value: 40, suffix: "+", label: "Titres remportés" },
];

export const coaches = [
  {
    name: "Rachidi Zine",
    role: "Head Coach · Jiu-Jitsu Brésilien",
    img: "/images/coach-rachidi.jpg",
    bio: "Coach fondateur de l'Ultimate Fight Academy. Ceinture noire de Jiu-Jitsu Brésilien, il transmet la technique et l'état d'esprit du BJJ à Kénitra — du tout premier cours jusqu'à la compétition.",
    record: "Ceinture Noire",
    instagram: "https://www.instagram.com/rachidi_zine_official/",
  },
];

// Planning réel par discipline (horaires en 24h)
export type Slot = { name: string; sub?: string; time: string };
export type DayRow = { day: string; slots: Slot[] };
export type Program = { id: string; label: string; note?: string; days: DayRow[] };

export const program: Program[] = [
  {
    id: "bjj-adultes",
    label: "BJJ · Adultes",
    days: [
      { day: "LUN", slots: [{ name: "No-Gi", time: "13h00 – 14h30" }, { name: "Gi", time: "20h00 – 21h00" }] },
      { day: "MAR", slots: [{ name: "No-Gi", time: "13h00 – 14h30" }] },
      { day: "MER", slots: [{ name: "No-Gi", time: "13h00 – 14h30" }, { name: "Gi", time: "20h00 – 21h00" }] },
      { day: "JEU", slots: [{ name: "No-Gi", time: "13h00 – 14h30" }] },
      { day: "VEN", slots: [{ name: "Gi", time: "20h00 – 21h00" }] },
    ],
  },
  {
    id: "bjj-enfants",
    label: "BJJ · Enfants",
    days: [
      { day: "LUN", slots: [{ name: "No-Gi", time: "18h00 – 19h00" }, { name: "Gi", time: "19h00 – 20h00" }] },
      { day: "MAR", slots: [{ name: "No-Gi", time: "17h00 – 18h00" }] },
      { day: "MER", slots: [{ name: "No-Gi", time: "18h00 – 19h00" }, { name: "Gi", time: "19h00 – 20h00" }] },
      { day: "JEU", slots: [{ name: "No-Gi", time: "17h00 – 18h00" }] },
      { day: "VEN", slots: [{ name: "No-Gi", time: "18h00 – 19h00" }, { name: "Gi", time: "19h00 – 20h00" }] },
    ],
  },
  {
    id: "mma",
    label: "MMA",
    days: [
      { day: "LUN", slots: [{ name: "Enfants", time: "17h00 – 18h00" }, { name: "Adultes", sub: "Avancé", time: "21h00 – 22h30" }] },
      { day: "MAR", slots: [{ name: "Adultes", sub: "Débutants", time: "21h00 – 22h30" }] },
      { day: "MER", slots: [{ name: "Enfants", time: "17h00 – 18h00" }, { name: "Adultes", sub: "Avancé", time: "21h00 – 22h30" }] },
      { day: "JEU", slots: [{ name: "Adultes", sub: "Débutants", time: "21h00 – 22h30" }] },
      { day: "VEN", slots: [{ name: "Enfants", time: "17h00 – 18h00" }, { name: "Adultes", sub: "Avancé", time: "21h00 – 22h30" }] },
    ],
  },
  {
    id: "kickboxing-boxe",
    label: "Kickboxing & Boxe",
    days: [
      { day: "MAR", slots: [{ name: "Enfants", sub: "Kickboxing", time: "18h00 – 19h00" }, { name: "Adultes", sub: "Kickboxing", time: "19h00 – 20h00" }, { name: "Adultes", sub: "Boxe", time: "20h00 – 21h00" }] },
      { day: "JEU", slots: [{ name: "Enfants", sub: "Kickboxing", time: "18h00 – 19h00" }, { name: "Adultes", sub: "Kickboxing", time: "19h00 – 20h00" }, { name: "Adultes", sub: "Boxe", time: "20h00 – 21h00" }] },
      { day: "SAM", slots: [{ name: "Enfants", sub: "Kickboxing", time: "12h00 – 13h00" }, { name: "Adultes", sub: "Kickboxing", time: "14h00 – 15h00" }, { name: "Adultes", sub: "Boxe", time: "15h00 – 16h00" }] },
    ],
  },
  {
    id: "women",
    label: "Women Only",
    note: "Programme bientôt disponible — contacte-nous pour connaître les horaires des cours 100% féminins.",
    days: [],
  },
];

export const durations = ["6 mois", "1 an"] as const;
export type Duration = (typeof durations)[number];

export type Membership = {
  name: string;
  sub: string;
  featured: boolean;
  offers: Record<Duration, { price: string; features: string[] }>;
};

export const memberships: Membership[] = [
  {
    name: "1 Discipline",
    sub: "L'essentiel pour démarrer",
    featured: false,
    offers: {
      "6 mois": { price: "1600", features: ["3 cours / semaine", "1 discipline au choix", "Frais d'inscription inclus"] },
      "1 an": { price: "2500", features: ["3 cours / semaine", "1 discipline au choix", "Frais d'inscription inclus", "2 mois offerts"] },
    },
  },
  {
    name: "2 Disciplines",
    sub: "Pour varier ton entraînement",
    featured: false,
    offers: {
      "6 mois": { price: "2200", features: ["6 cours / semaine", "2 disciplines au choix", "Frais d'inscription inclus"] },
      "1 an": { price: "3500", features: ["6 cours / semaine", "2 disciplines au choix", "Frais d'inscription offerts", "2 mois offerts"] },
    },
  },
  {
    name: "Full Pack",
    sub: "Toutes les disciplines, sans limite",
    featured: true,
    offers: {
      "6 mois": { price: "3000", features: ["Accès à toutes les disciplines", "Cours illimités", "Frais d'inscription inclus"] },
      "1 an": { price: "5000", features: ["Accès à toutes les disciplines", "Cours illimités", "Frais d'inscription offerts", "2 mois offerts"] },
    },
  },
];

export const gallery = [
  "/images/hero-1.jpg",
  "/images/muaythai-2.jpg",
  "/images/boxing-2.jpg",
  "/images/bjj.jpg",
  "/images/female-kickbox.jpg",
  "/images/gym.jpg",
];
