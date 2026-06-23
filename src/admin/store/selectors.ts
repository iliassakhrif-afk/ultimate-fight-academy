import type { DB, Member, DisciplineId, WeekDay, Technique, PriceException, Family, BeltRank, ClassSession, Booking } from "../types";
import { daysBetween, monthKey, addMonths, parseISO } from "./format";
import { WEEK_DAYS, BELT_CURRICULUM, RAMADAN_EVENING_SHIFT_MIN } from "../constants";

export const getNow = (db: DB): string => db.settings.demoClock;

// --- Membre ---
export const memberBalanceDH = (db: DB, memberId: string): number =>
  db.installments
    .filter((i) => i.memberId === memberId)
    .reduce((s, i) => s + Math.max(0, i.amountDueDH - i.amountPaidDH), 0);

export const memberLTV = (db: DB, memberId: string): number =>
  db.payments.filter((p) => p.memberId === memberId).reduce((s, p) => s + p.amountDH, 0);

export const memberSubscription = (db: DB, memberId: string) =>
  db.subscriptions
    .filter((s) => s.memberId === memberId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] || null;

export const memberCurrentBelt = (db: DB, memberId: string) =>
  db.belts.find((b) => b.memberId === memberId && b.isCurrent) || null;

export const memberAttendance = (db: DB, memberId: string) =>
  db.attendance.filter((a) => a.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));

export const memberAttendanceCount = (db: DB, memberId: string, days: number): number => {
  const now = getNow(db);
  return db.attendance.filter(
    (a) => a.memberId === memberId && a.status === "present" && daysBetween(now, a.date) <= days && daysBetween(now, a.date) >= 0
  ).length;
};

export type RiskLevel = "sain" | "tiede" | "risque";
export const memberRisk = (db: DB, member: Member): RiskLevel => {
  if (member.status !== "actif") return "sain";
  const now = getNow(db);
  const last = member.lastAttendanceAt ? daysBetween(now, member.lastAttendanceAt) : 999;
  const sub = memberSubscription(db, member.id);
  const expSoon = sub ? daysBetween(sub.endDate, now) <= 21 : false;
  const balance = memberBalanceDH(db, member.id) > 0;
  let score = 0;
  if (last > 21) score += 2; else if (last > 12) score += 1;
  if (expSoon) score += 1;
  if (balance) score += 1;
  return score >= 3 ? "risque" : score >= 1 ? "tiede" : "sain";
};

// --- KPIs membres ---
export const membresActifs = (db: DB): number => db.members.filter((m) => m.status === "actif").length;
export const totalMembres = (db: DB): number => db.members.filter((m) => m.status !== "churn").length;
export const gelesCount = (db: DB): number => db.members.filter((m) => m.status === "gele").length;
export const prospectsEssais = (db: DB): number => db.members.filter((m) => m.status === "prospect" || m.status === "essai").length;

export const nouveauxCeMois = (db: DB): number => {
  const mk = monthKey(getNow(db));
  return db.members.filter((m) => monthKey(m.joinedAt) === mk).length;
};

export const expirantSous = (db: DB, days: number) =>
  db.subscriptions.filter((s) => {
    const d = daysBetween(s.endDate, getNow(db));
    return s.status !== "annule" && s.status !== "essai" && d >= 0 && d <= days;
  });

export const membresEnRetard = (db: DB): Member[] =>
  db.members.filter((m) => memberBalanceDH(db, m.id) > 0);

export const membresDecroches = (db: DB, days = 21): Member[] => {
  const now = getNow(db);
  return db.members.filter(
    (m) => m.status === "actif" && (!m.lastAttendanceAt || daysBetween(now, m.lastAttendanceAt) > days)
  );
};

// --- KPIs financiers (DH) ---
export const encaisseCeMois = (db: DB): number => {
  const mk = monthKey(getNow(db));
  return db.payments.filter((p) => monthKey(p.paidAt) === mk).reduce((s, p) => s + p.amountDH, 0);
};

export const encaisseAujourdhui = (db: DB): number => {
  const today = getNow(db);
  return db.payments.filter((p) => p.paidAt.slice(0, 10) === today).reduce((s, p) => s + p.amountDH, 0);
};

export const encaisseParMethode = (db: DB): Record<string, number> => {
  const out: Record<string, number> = { especes: 0, virement: 0, cheque: 0, carte: 0 };
  db.payments.forEach((p) => { out[p.method] = (out[p.method] || 0) + p.amountDH; });
  return out;
};

export const impayesTotauxDH = (db: DB): number =>
  db.installments.reduce((s, i) => s + Math.max(0, i.amountDueDH - i.amountPaidDH), 0);

export const openInstallments = (db: DB) => {
  const now = getNow(db);
  return db.installments
    .filter((i) => i.amountDueDH - i.amountPaidDH > 0 && parseISO(i.dueDate) <= parseISO(now))
    .map((i) => ({ ...i, daysLate: daysBetween(now, i.dueDate), remaining: i.amountDueDH - i.amountPaidDH }))
    .sort((a, b) => b.daysLate - a.daysLate);
};

export const agingBuckets = (db: DB): { b0_7: number; b8_30: number; b30plus: number } => {
  const out = { b0_7: 0, b8_30: 0, b30plus: 0 };
  openInstallments(db).forEach((i) => {
    if (i.daysLate <= 7) out.b0_7 += i.remaining;
    else if (i.daysLate <= 30) out.b8_30 += i.remaining;
    else out.b30plus += i.remaining;
  });
  return out;
};

export const tauxRecouvrement = (db: DB): number => {
  const enc = db.payments.reduce((s, p) => s + p.amountDH, 0);
  const imp = impayesTotauxDH(db);
  return enc + imp === 0 ? 100 : Math.round((enc / (enc + imp)) * 100);
};

export const panierMoyen = (db: DB): number =>
  db.payments.length ? Math.round(db.payments.reduce((s, p) => s + p.amountDH, 0) / db.payments.length) : 0;

export const mrrEstime = (db: DB): number =>
  db.subscriptions
    .filter((s) => s.status === "actif" || s.status === "expire_bientot")
    .reduce((s, sub) => s + sub.totalDH / (sub.duration === "1 an" ? 12 : 6), 0);

export interface MonthCA { key: string; label: string; facture: number; encaisse: number; }
export const caParMois = (db: DB, n = 12): MonthCA[] => {
  const now = getNow(db);
  const out: MonthCA[] = [];
  for (let k = n - 1; k >= 0; k--) {
    const ref = addMonths(now, -k);
    const mk = monthKey(ref);
    const facture = db.installments.filter((i) => monthKey(i.dueDate) === mk).reduce((s, i) => s + i.amountDueDH, 0);
    const encaisse = db.payments.filter((p) => monthKey(p.paidAt) === mk).reduce((s, p) => s + p.amountDH, 0);
    out.push({ key: mk, label: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"][parseISO(ref).getMonth()], facture, encaisse });
  }
  return out;
};

// --- Répartitions ---
export const distributionByDiscipline = (db: DB): { id: DisciplineId; count: number }[] => {
  const map: Record<string, number> = {};
  db.members.filter((m) => m.status === "actif" || m.status === "gele").forEach((m) =>
    m.disciplineIds.forEach((d) => { map[d] = (map[d] || 0) + 1; })
  );
  return (Object.keys(map) as DisciplineId[]).map((id) => ({ id, count: map[id] })).sort((a, b) => b.count - a.count);
};

export const caParPlan = (db: DB): { planId: string; total: number }[] => {
  const map: Record<string, number> = {};
  db.subscriptions.forEach((s) => { map[s.planId] = (map[s.planId] || 0) + s.totalDH; });
  return Object.keys(map).map((planId) => ({ planId, total: map[planId] }));
};

// --- Présences ---
export const presentsAujourdhui = (db: DB): number => {
  const today = getNow(db);
  return new Set(db.attendance.filter((a) => a.date === today && a.status === "present").map((a) => a.memberId)).size;
};

export interface Heatmap { slots: string[]; days: WeekDay[]; cells: number[][]; max: number; }
export const attendanceHeatmap = (db: DB): Heatmap => {
  const days = [...WEEK_DAYS] as WeekDay[];
  const slotSet = new Set<string>();
  db.classSessions.forEach((c) => slotSet.add(c.startTime));
  const slots = [...slotSet].sort();
  const cells = slots.map(() => days.map(() => 0));
  const sessById = new Map(db.classSessions.map((c) => [c.id, c]));
  db.attendance.forEach((a) => {
    const c = sessById.get(a.classSessionId);
    if (!c) return;
    const si = slots.indexOf(c.startTime);
    const di = days.indexOf(c.dayOfWeek);
    if (si >= 0 && di >= 0) cells[si][di]++;
  });
  let max = 1;
  cells.forEach((r) => r.forEach((v) => { if (v > max) max = v; }));
  return { slots, days, cells, max };
};

export const todayClasses = (db: DB) => {
  const dow = (WEEK_DAYS[(parseISO(getNow(db)).getDay() + 6) % 7] ?? WEEK_DAYS[0]) as WeekDay; // dimanche → retombe sur LUN
  const today = getNow(db);
  return db.classSessions
    .filter((c) => c.dayOfWeek === dow && c.isActive)
    .map((c) => ({
      ...c,
      present: db.attendance.filter((a) => a.classSessionId === c.id && a.date === today && a.status === "present").length,
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

// --- Techniques & séances ---
export const sessionInstance = (db: DB, classSessionId: string, date: string) =>
  db.sessionInstances.find((s) => s.classSessionId === classSessionId && s.date === date) || null;

export interface PractitionerRow { member: Member; count: number; lastDate: string; }

// Membres ayant pratiqué une technique (via les séances où elle a été enseignée + présences)
export const membersWhoPracticed = (db: DB, techniqueId: string): PractitionerRow[] => {
  const sessions = db.sessionInstances.filter((s) => s.techniqueIds.includes(techniqueId));
  const keys = new Set(sessions.map((s) => `${s.classSessionId}__${s.date}`));
  const agg = new Map<string, { count: number; lastDate: string }>();
  const counted = new Set<string>(); // une séance ne compte qu'une fois par membre
  db.attendance.forEach((a) => {
    if (a.status !== "present") return;
    const k = `${a.classSessionId}__${a.date}`;
    if (!keys.has(k)) return;
    const dedupe = `${a.memberId}__${k}`;
    if (counted.has(dedupe)) return;
    counted.add(dedupe);
    const cur = agg.get(a.memberId);
    if (cur) { cur.count++; if (a.date > cur.lastDate) cur.lastDate = a.date; }
    else agg.set(a.memberId, { count: 1, lastDate: a.date });
  });
  const rows: PractitionerRow[] = [];
  agg.forEach((v, memberId) => {
    const member = db.members.find((m) => m.id === memberId);
    if (member) rows.push({ member, count: v.count, lastDate: v.lastDate });
  });
  return rows.sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate));
};

export const techniqueStats = (db: DB, techniqueId: string): { timesTaught: number; memberCount: number; lastTaught: string | null } => {
  const sessions = db.sessionInstances.filter((s) => s.techniqueIds.includes(techniqueId));
  const rows = membersWhoPracticed(db, techniqueId);
  const lastTaught = sessions.reduce<string | null>((m, s) => (m && m > s.date ? m : s.date), null);
  return { timesTaught: sessions.length, memberCount: rows.length, lastTaught };
};

// Techniques pratiquées par un membre (avec nb de fois + dernière date)
export interface MemberTechRow { technique: Technique; count: number; lastDate: string; }
export const memberTechniques = (db: DB, memberId: string): MemberTechRow[] => {
  const myKeys = new Set(db.attendance.filter((a) => a.memberId === memberId && a.status === "present").map((a) => `${a.classSessionId}__${a.date}`));
  const agg = new Map<string, { count: number; lastDate: string }>();
  db.sessionInstances.forEach((s) => {
    if (!myKeys.has(`${s.classSessionId}__${s.date}`)) return;
    s.techniqueIds.forEach((tid) => {
      const cur = agg.get(tid);
      if (cur) { cur.count++; if (s.date > cur.lastDate) cur.lastDate = s.date; }
      else agg.set(tid, { count: 1, lastDate: s.date });
    });
  });
  const rows: MemberTechRow[] = [];
  agg.forEach((v, tid) => {
    const technique = db.techniques.find((t) => t.id === tid);
    if (technique) rows.push({ technique, count: v.count, lastDate: v.lastDate });
  });
  return rows.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
};

// --- Tarification ---
export const activePriceException = (db: DB, memberId: string): PriceException | null =>
  db.priceExceptions.find((e) => e.memberId === memberId && e.active) || null;

export interface EffectivePrice { base: number; price: number; discount: number; label: string | null; }
export const effectivePrice = (db: DB, base: number, memberId: string): EffectivePrice => {
  const exc = activePriceException(db, memberId);
  if (!exc) return { base, price: base, discount: 0, label: null };
  let price = base;
  if (exc.type === "percent") price = base * (1 - exc.value / 100);
  else if (exc.type === "fixed") price = base - exc.value;
  else price = exc.value; // override
  price = Math.max(0, Math.round(price));
  return { base, price, discount: Math.max(0, base - price), label: exc.label };
};

// --- Curriculum technique → progression de grade ---
export interface CurriculumProgress {
  currentRank: BeltRank | null;
  nextRank: BeltRank | null;
  practiced: number;
  target: number;
  pct: number;
  focus: string[];
}
export const curriculumProgress = (db: DB, memberId: string, discipline: DisciplineId = "bjj"): CurriculumProgress => {
  const belt = db.belts.find((b) => b.memberId === memberId && b.isCurrent && b.discipline === discipline);
  const currentRank = belt?.beltRank ?? "blanche";
  const entry = BELT_CURRICULUM.find((c) => c.from === currentRank);
  const practiced = memberTechniques(db, memberId).filter((t) => t.technique.discipline === discipline).length;
  if (!entry) return { currentRank, nextRank: null, practiced, target: practiced, pct: 100, focus: [] };
  const pct = Math.min(100, Math.round((practiced / entry.target) * 100));
  return { currentRank, nextRank: entry.to, practiced, target: entry.target, pct, focus: entry.focus };
};

// --- Familles ---
export const familyOf = (db: DB, memberId: string): Family | null =>
  db.families.find((f) => f.memberIds.includes(memberId)) || null;
export const familyMembers = (db: DB, familyId: string): Member[] => {
  const fam = db.families.find((f) => f.id === familyId);
  if (!fam) return [];
  return fam.memberIds.map((id) => db.members.find((m) => m.id === id)).filter((m): m is Member => !!m);
};
export const familyBalanceDH = (db: DB, familyId: string): number =>
  familyMembers(db, familyId).reduce((s, m) => s + memberBalanceDH(db, m.id), 0);

// --- Ramadan : décalage des créneaux du soir ---
export const ramadanTime = (time: string, ramadan: boolean): string => {
  if (!ramadan) return time;
  const [h, m] = time.split(":").map(Number);
  if (h < 17) return time;
  const total = h * 60 + m + RAMADAN_EVENING_SHIFT_MIN;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

// --- Réservations de cours ---
const DOW_IDX: Record<string, number> = { LUN: 1, MAR: 2, MER: 3, JEU: 4, VEN: 5, SAM: 6 };

export interface Occurrence { classSession: ClassSession; date: string; }
export const upcomingOccurrences = (db: DB, days = 7): Occurrence[] => {
  const now = getNow(db);
  const out: Occurrence[] = [];
  for (let d = 0; d < days; d++) {
    const date = addDaysISO(now, d);
    const jsDow = parseISO(date).getDay(); // 0=dim..6=sam
    const dow = WEEK_DAYS[(jsDow + 6) % 7]; // LUN..SAM (dimanche → undefined)
    if (!dow) continue;
    db.classSessions
      .filter((c) => c.isActive && c.dayOfWeek === dow && DOW_IDX[c.dayOfWeek])
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .forEach((classSession) => out.push({ classSession, date }));
  }
  return out;
};

const addDaysISO = (iso: string, n: number): string => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const bookingsForOccurrence = (db: DB, classSessionId: string, date: string): Booking[] =>
  db.bookings
    .filter((b) => b.classSessionId === classSessionId && b.date === date && b.status !== "annule")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

export interface ReservationState { reserved: number; waitlist: number; capacity: number; spotsLeft: number; }
export const reservationState = (db: DB, classSessionId: string, date: string): ReservationState => {
  const cs = db.classSessions.find((c) => c.id === classSessionId);
  const capacity = cs?.capacity ?? 0;
  const list = bookingsForOccurrence(db, classSessionId, date);
  const reserved = list.filter((b) => b.status === "reserve" || b.status === "present").length;
  const waitlist = list.filter((b) => b.status === "liste_attente").length;
  return { reserved, waitlist, capacity, spotsLeft: Math.max(0, capacity - reserved) };
};

export const memberBookings = (db: DB, memberId: string): Booking[] =>
  db.bookings.filter((b) => b.memberId === memberId && b.status !== "annule").sort((a, b) => a.date.localeCompare(b.date));

// --- Recherche globale ---
export const searchMembers = (db: DB, q: string): Member[] => {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return db.members
    .filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(t) ||
      m.phone.toLowerCase().includes(t) ||
      m.memberNo.toLowerCase().includes(t)
    )
    .slice(0, 8);
};
