// Modèle de données de l'espace admin Ultimate Fight Academy (démo 100% client-side).

export type DisciplineId = "bjj" | "mma" | "kickboxing" | "boxe" | "kids" | "women";
export type Duration = "6 mois" | "1 an";
export type PlanId = "plan-1disc" | "plan-2disc" | "plan-fullpack";
export type PayMethod = "especes" | "virement" | "cheque" | "carte";

export type MemberStatus = "prospect" | "essai" | "actif" | "gele" | "expire" | "churn";
export type AgeCategory = "enfant" | "ado" | "adulte";

export type BeltRank =
  | "blanche" | "bleue" | "violette" | "marron" | "noire"
  | "kids-grise" | "kids-jaune" | "kids-orange" | "kids-verte";

export interface Member {
  id: string;
  memberNo: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  gender: "H" | "F";
  birthDate: string;
  ageCategory: AgeCategory;
  phone: string;
  whatsapp: string;
  email: string | null;
  address: string;
  city: string;
  disciplineIds: DisciplineId[];
  status: MemberStatus;
  joinedAt: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  guardianName: string | null;
  medicalCertExpiry: string | null;
  waiverSigned: boolean;
  acquisitionSource: "instagram" | "walkin" | "parrainage" | "whatsapp" | "google" | "site";
  tags: string[];
  internalNotes: string;
  preferredPaymentMethod: PayMethod;
  lastAttendanceAt: string | null;
  attendanceStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: PlanId;
  name: string;
  sub: string;
  featured: boolean;
  disciplineLimit: number | "toutes";
  classesPerWeek: number;
  price6mDH: number;
  price12mDH: number;
  registrationFeeDH: number;
  freeMonthsYearly: number;
}

export interface Subscription {
  id: string;
  memberId: string;
  planId: PlanId;
  duration: Duration;
  disciplineIds: DisciplineId[];
  startDate: string;
  endDate: string;
  basePriceDH: number;
  registrationFeeDH: number;
  discountLabel: string | null;
  discountDH: number;
  totalDH: number;
  status: "actif" | "expire_bientot" | "expire" | "gele" | "annule" | "essai";
  paymentMode: "comptant" | "echelonne";
  installmentsCount: number;
  createdAt: string;
}

export type InstallmentStatus = "paye" | "partiel" | "en_attente" | "en_retard";

export interface Installment {
  id: string;
  subscriptionId: string;
  memberId: string;
  sequence: number;
  label: string;
  dueDate: string;
  amountDueDH: number;
  amountPaidDH: number;
  status: InstallmentStatus;
}

export interface Payment {
  id: string;
  memberId: string;
  subscriptionId: string | null;
  installmentId: string | null;
  receiptNo: string;
  type: "abonnement" | "inscription" | "boutique" | "autre";
  amountDH: number;
  method: PayMethod;
  status: "paye" | "en_attente" | "en_retard";
  paidAt: string;
  chequeRef: string | null;
  note: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  classSessionId: string;
  disciplineId: DisciplineId;
  date: string; // ISO jour
  checkInTime: string; // HH:mm
  method: "manuel" | "kiosque" | "qr";
  status: "present" | "no_show" | "excuse";
  flaggedExpiredSub: boolean;
  flaggedDueBalance: boolean;
  flaggedMedicalExpired: boolean;
}

export type WeekDay = "LUN" | "MAR" | "MER" | "JEU" | "VEN" | "SAM";

export interface ClassSession {
  id: string;
  disciplineId: DisciplineId;
  label: string;
  level: "enfants" | "ado" | "adultes" | "debutants" | "avance";
  variant: "Gi" | "No-Gi" | "Kickboxing" | "Boxe" | null;
  dayOfWeek: WeekDay;
  startTime: string;
  endTime: string;
  coachId: string;
  room: string;
  capacity: number;
  isActive: boolean;
}

export interface Belt {
  id: string;
  memberId: string;
  discipline: DisciplineId;
  beltRank: BeltRank;
  stripes: number;
  isCurrent: boolean;
  promotedAt: string;
  promotedByCoachId: string;
  note: string;
}

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  role: "Head Coach" | "Coach" | "Assistant";
  disciplineIds: DisciplineId[];
  beltRank: string;
  phone: string;
  instagram: string | null;
  active: boolean;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  source: "instagram" | "walkin" | "parrainage" | "whatsapp" | "site";
  interestedDisciplineIds: DisciplineId[];
  stage: "nouveau" | "contacte" | "essai_planifie" | "essai_fait" | "inscrit" | "perdu";
  heatScore: "chaud" | "tiede" | "froid";
  trialDate: string | null;
  createdAt: string;
}

export type ActivityType =
  | "check-in" | "paiement" | "inscription" | "promotion" | "relance" | "renouvellement";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  memberId: string | null;
  timestamp: string;
  summaryFR: string;
  amountDH: number | null;
}

export interface Family {
  id: string;
  name: string; // "Famille El Amrani"
  memberIds: string[];
  primaryMemberId: string | null; // le payeur/responsable
}

export type AppRole = "admin" | "coach" | "accueil";

export interface GymSettings {
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  currency: string;
  adminPin: string;
  demoClock: string;
  seedVersion: number;
  lastBackupAt: string | null;
  receiptFooterText: string;
  ramadanMode: boolean;
  language: "fr" | "ar";
}

// Techniques & contenu de séance
export type GiType = "gi" | "nogi" | "both";

export interface Technique {
  id: string;
  discipline: DisciplineId;
  name: string;
  category: string; // Garde, Passage, Soumission, Renversement, Contrôle, Projection, Échappe, Mouvement…
  gi: GiType;
  position: string; // ex. "Garde fermée", "Montée", "Debout"
  isCustom: boolean;
  createdAt: string;
  videoUrl?: string | null; // vidéothèque : lien MP4 ou YouTube
}

// Réservation d'un cours (occurrence = classSession + date)
export interface Booking {
  id: string;
  memberId: string;
  classSessionId: string;
  date: string; // jour ISO de l'occurrence
  status: "reserve" | "liste_attente" | "annule" | "present";
  createdAt: string;
}

// Une séance concrète = un cours (classSession) tenu à une date donnée
export interface SessionInstance {
  id: string; // `${classSessionId}__${date}`
  classSessionId: string;
  date: string;
  disciplineId: DisciplineId;
  techniqueIds: string[];
  coachId: string;
  notes: string;
}

// Exception de tarif appliquée à un membre
export interface PriceException {
  id: string;
  memberId: string;
  label: string; // raison: Famille, Étudiant, Fidélité, Geste commercial…
  type: "percent" | "fixed" | "override"; // remise %, remise fixe DH, ou prix imposé DH
  value: number;
  active: boolean;
  createdAt: string;
}

export interface DB {
  meta: { seedVersion: number; demoClock: string };
  members: Member[];
  subscriptions: Subscription[];
  installments: Installment[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  classSessions: ClassSession[];
  plans: MembershipPlan[];
  belts: Belt[];
  coaches: Coach[];
  leads: Lead[];
  activity: ActivityLog[];
  techniques: Technique[];
  sessionInstances: SessionInstance[];
  priceExceptions: PriceException[];
  families: Family[];
  bookings: Booking[];
  settings: GymSettings;
}

export type Collection =
  | "members" | "subscriptions" | "installments" | "payments" | "attendance"
  | "classSessions" | "plans" | "belts" | "coaches" | "leads" | "activity"
  | "techniques" | "sessionInstances" | "priceExceptions" | "families" | "bookings";
