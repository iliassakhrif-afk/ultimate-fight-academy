import type {
  DB, Member, Subscription, Installment, Payment, AttendanceRecord, ClassSession,
  MembershipPlan, Belt, Coach, Lead, ActivityLog, GymSettings, DisciplineId, BeltRank,
} from "../types";
import {
  DEMO_CLOCK, SEED_VERSION, ADMIN_PIN, MA_FIRST_M, MA_FIRST_F, MA_LAST, KENITRA_AREAS,
  ADULT_BELTS, KIDS_BELTS,
} from "../constants";
import { addDays, addMonths, parseISO } from "./format";

// PRNG déterministe (mulberry32) → mêmes données à chaque seed
function rng(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLANS: MembershipPlan[] = [
  { id: "plan-1disc", name: "1 Discipline", sub: "3 cours / semaine", featured: false, disciplineLimit: 1, classesPerWeek: 3, price6mDH: 1600, price12mDH: 2500, registrationFeeDH: 250, freeMonthsYearly: 2 },
  { id: "plan-2disc", name: "2 Disciplines", sub: "6 cours / semaine", featured: false, disciplineLimit: 2, classesPerWeek: 6, price6mDH: 2200, price12mDH: 3500, registrationFeeDH: 250, freeMonthsYearly: 2 },
  { id: "plan-fullpack", name: "Full Pack", sub: "Toutes les disciplines", featured: true, disciplineLimit: "toutes", classesPerWeek: 12, price6mDH: 3000, price12mDH: 5000, registrationFeeDH: 250, freeMonthsYearly: 2 },
];

const COACHES: Coach[] = [
  { id: "c_rachidi", firstName: "Rachidi", lastName: "Zine", role: "Head Coach", disciplineIds: ["bjj"], beltRank: "Ceinture Noire BJJ", phone: "+212 6 61 22 33 44", instagram: "https://www.instagram.com/rachidi_zine_official/", active: true },
  { id: "c_karim", firstName: "Karim", lastName: "Berrada", role: "Coach", disciplineIds: ["mma", "kickboxing"], beltRank: "Pro MMA", phone: "+212 6 70 11 22 33", instagram: null, active: true },
  { id: "c_sofia", firstName: "Sofia", lastName: "Lemaire", role: "Coach", disciplineIds: ["kickboxing", "boxe", "women"], beltRank: "Championne Kickboxing", phone: "+212 6 55 44 33 22", instagram: null, active: true },
];

function buildClassSessions(): ClassSession[] {
  const s: Omit<ClassSession, "id">[] = [
    { disciplineId: "bjj", label: "BJJ Adultes No-Gi", level: "adultes", variant: "No-Gi", dayOfWeek: "LUN", startTime: "13:00", endTime: "14:30", coachId: "c_rachidi", room: "Tatami 1", capacity: 24, isActive: true },
    { disciplineId: "bjj", label: "BJJ Adultes Gi", level: "adultes", variant: "Gi", dayOfWeek: "LUN", startTime: "20:00", endTime: "21:00", coachId: "c_rachidi", room: "Tatami 1", capacity: 24, isActive: true },
    { disciplineId: "mma", label: "MMA Enfants", level: "enfants", variant: null, dayOfWeek: "LUN", startTime: "17:00", endTime: "18:00", coachId: "c_karim", room: "Cage", capacity: 18, isActive: true },
    { disciplineId: "mma", label: "MMA Avancé", level: "avance", variant: null, dayOfWeek: "LUN", startTime: "21:00", endTime: "22:30", coachId: "c_karim", room: "Cage", capacity: 20, isActive: true },
    { disciplineId: "kickboxing", label: "Kickboxing Enfants", level: "enfants", variant: "Kickboxing", dayOfWeek: "MAR", startTime: "18:00", endTime: "19:00", coachId: "c_sofia", room: "Ring", capacity: 20, isActive: true },
    { disciplineId: "kickboxing", label: "Kickboxing Adultes", level: "adultes", variant: "Kickboxing", dayOfWeek: "MAR", startTime: "19:00", endTime: "20:00", coachId: "c_sofia", room: "Ring", capacity: 24, isActive: true },
    { disciplineId: "boxe", label: "Boxe Adultes", level: "adultes", variant: "Boxe", dayOfWeek: "MAR", startTime: "20:00", endTime: "21:00", coachId: "c_sofia", room: "Ring", capacity: 24, isActive: true },
    { disciplineId: "bjj", label: "BJJ Adultes No-Gi", level: "adultes", variant: "No-Gi", dayOfWeek: "MER", startTime: "13:00", endTime: "14:30", coachId: "c_rachidi", room: "Tatami 1", capacity: 24, isActive: true },
    { disciplineId: "mma", label: "MMA Avancé", level: "avance", variant: null, dayOfWeek: "MER", startTime: "21:00", endTime: "22:30", coachId: "c_karim", room: "Cage", capacity: 20, isActive: true },
    { disciplineId: "kickboxing", label: "Kickboxing Adultes", level: "adultes", variant: "Kickboxing", dayOfWeek: "JEU", startTime: "19:00", endTime: "20:00", coachId: "c_sofia", room: "Ring", capacity: 24, isActive: true },
    { disciplineId: "boxe", label: "Boxe Adultes", level: "adultes", variant: "Boxe", dayOfWeek: "JEU", startTime: "20:00", endTime: "21:00", coachId: "c_sofia", room: "Ring", capacity: 24, isActive: true },
    { disciplineId: "bjj", label: "BJJ Adultes Gi", level: "adultes", variant: "Gi", dayOfWeek: "VEN", startTime: "20:00", endTime: "21:00", coachId: "c_rachidi", room: "Tatami 1", capacity: 24, isActive: true },
    { disciplineId: "kickboxing", label: "Kickboxing Adultes", level: "adultes", variant: "Kickboxing", dayOfWeek: "SAM", startTime: "14:00", endTime: "15:00", coachId: "c_sofia", room: "Ring", capacity: 24, isActive: true },
    { disciplineId: "boxe", label: "Boxe Adultes", level: "adultes", variant: "Boxe", dayOfWeek: "SAM", startTime: "15:00", endTime: "16:00", coachId: "c_sofia", room: "Ring", capacity: 24, isActive: true },
  ];
  return s.map((x, i) => ({ ...x, id: `cs_${i + 1}` }));
}

const DAY_INDEX: Record<string, number> = { LUN: 1, MAR: 2, MER: 3, JEU: 4, VEN: 5, SAM: 6 };

type Profile = "actif" | "actif_retard" | "gele" | "expire" | "essai" | "prospect";

// Répartition des 32 membres
function profileList(): Profile[] {
  const list: Profile[] = [];
  const push = (p: Profile, n: number) => { for (let i = 0; i < n; i++) list.push(p); };
  push("actif", 17);
  push("actif_retard", 5);
  push("gele", 3);
  push("expire", 3);
  push("essai", 2);
  push("prospect", 2);
  return list; // 32
}

export function buildSeed(): DB {
  const rnd = rng(20260618);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const now = DEMO_CLOCK;

  const classSessions = buildClassSessions();
  const members: Member[] = [];
  const subscriptions: Subscription[] = [];
  const installments: Installment[] = [];
  const payments: Payment[] = [];
  const attendance: AttendanceRecord[] = [];
  const belts: Belt[] = [];
  const leads: Lead[] = [];
  const activity: ActivityLog[] = [];

  let receiptSeq = 800;
  const profiles = profileList();

  profiles.forEach((profile, idx) => {
    const female = rnd() < 0.32;
    const first = female ? pick(MA_FIRST_F) : pick(MA_FIRST_M);
    const last = pick(MA_LAST);
    const id = `m_${idx + 1}`;
    const memberNo = `UFA-2026-${String(idx + 1).padStart(4, "0")}`;

    // âge / catégorie
    const isKid = rnd() < 0.18 && (profile === "actif" || profile === "essai" || profile === "actif_retard");
    const age = isKid ? ri(6, 13) : ri(16, 44);
    const ageCategory = age < 14 ? "enfant" : age < 18 ? "ado" : "adulte";
    const birthDate = addDays(now, -(age * 365 + ri(0, 360)));

    // disciplines
    const allDisc: DisciplineId[] = isKid ? ["kids", "bjj"] : ["bjj", "mma", "kickboxing", "boxe"];
    const plan = isKid ? PLANS[0] : pick(PLANS);
    let nDisc = plan.disciplineLimit === "toutes" ? (isKid ? 2 : ri(3, 4)) : plan.disciplineLimit;
    nDisc = Math.min(nDisc as number, allDisc.length);
    const disciplineIds: DisciplineId[] = [];
    while (disciplineIds.length < nDisc) {
      const d = pick(allDisc);
      if (!disciplineIds.includes(d)) disciplineIds.push(d);
    }

    const phone = `+212 6${ri(0, 9)}${ri(0, 9)} ${ri(100, 999)}-${ri(100, 999)}`;
    const status =
      profile === "gele" ? "gele" :
      profile === "expire" ? "expire" :
      profile === "essai" ? "essai" :
      profile === "prospect" ? "prospect" : "actif";

    const joinedAt = addDays(now, -ri(40, 520));
    const member: Member = {
      id, memberNo, firstName: first, lastName: last, photoUrl: null,
      gender: female ? "F" : "H", birthDate, ageCategory,
      phone, whatsapp: phone, email: rnd() < 0.6 ? `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@gmail.com` : null,
      address: `${pick(KENITRA_AREAS)}, Kénitra`, city: "Kénitra",
      disciplineIds, status, joinedAt,
      emergencyContactName: `${pick(female ? MA_FIRST_M : MA_FIRST_F)} ${last}`,
      emergencyContactPhone: `+212 6${ri(0, 9)}${ri(0, 9)} ${ri(100, 999)}-${ri(100, 999)}`,
      guardianName: isKid ? `${pick(MA_FIRST_M)} ${last}` : null,
      medicalCertExpiry: rnd() < 0.85 ? addDays(now, ri(-20, 300)) : null,
      waiverSigned: rnd() < 0.9,
      acquisitionSource: pick(["instagram", "walkin", "parrainage", "whatsapp", "google", "site"] as const),
      tags: [
        ...(rnd() < 0.2 ? ["Compétiteur"] : []),
        ...(rnd() < 0.5 ? ["Paie cash"] : []),
      ],
      internalNotes: "",
      preferredPaymentMethod: rnd() < 0.7 ? "especes" : pick(["virement", "cheque", "carte"] as const),
      lastAttendanceAt: null,
      attendanceStreak: 0,
      createdAt: joinedAt,
      updatedAt: now,
    };

    // Abonnement + échéancier (sauf prospect)
    if (profile !== "prospect") {
      const duration = rnd() < 0.45 ? "1 an" : "6 mois";
      const base = duration === "1 an" ? plan.price12mDH : plan.price6mDH;
      const months = duration === "1 an" ? 14 : 6; // +2 mois offerts en annuel
      let startDate: string;
      if (profile === "expire") startDate = addMonths(now, -(months + 1));
      else if (profile === "essai") startDate = addDays(now, -ri(1, 10));
      else startDate = addMonths(now, -ri(1, Math.max(2, months - 2)));
      const endDate = profile === "essai" ? addDays(startDate, 14) : addMonths(startDate, months);
      const subId = `s_${idx + 1}`;
      const regFee = duration === "1 an" ? 0 : 0; // inclus/offerts → total = prix affiché
      const discountLabel = duration === "1 an" ? "2 mois offerts + inscription offerte" : "Frais d'inscription inclus";
      const sub: Subscription = {
        id: subId, memberId: id, planId: plan.id, duration, disciplineIds,
        startDate, endDate, basePriceDH: base, registrationFeeDH: regFee,
        discountLabel, discountDH: 0, totalDH: base,
        status: profile === "gele" ? "gele" : profile === "expire" ? "expire" : profile === "essai" ? "essai" :
          endDate <= addDays(now, 30) ? "expire_bientot" : "actif",
        paymentMode: rnd() < 0.5 ? "comptant" : "echelonne",
        installmentsCount: 1, createdAt: startDate,
      };

      // échéances
      const nInst = sub.paymentMode === "comptant" ? 1 : ri(2, 3);
      sub.installmentsCount = nInst;
      const per = Math.round(base / nInst);
      for (let k = 0; k < nInst; k++) {
        const amount = k === nInst - 1 ? base - per * (nInst - 1) : per;
        const dueDate = addMonths(startDate, k);
        const instId = `i_${idx + 1}_${k + 1}`;
        // statut de paiement selon profil
        let paid = amount;
        let st: Installment["status"] = "paye";
        if (profile === "actif_retard" && k === nInst - 1) {
          // dernière échéance en retard ou partielle
          if (parseISO(dueDate) <= parseISO(now)) {
            if (rnd() < 0.5) { paid = Math.round(amount * 0.4); st = "partiel"; }
            else { paid = 0; st = "en_retard"; }
          } else { paid = 0; st = "en_attente"; }
        } else if (parseISO(dueDate) > parseISO(now) && profile !== "expire") {
          paid = 0; st = "en_attente";
        }
        installments.push({ id: instId, subscriptionId: subId, memberId: id, sequence: k + 1, label: k === 0 ? (nInst > 1 ? "Acompte" : "Paiement intégral") : `${k + 1}e versement`, dueDate, amountDueDH: amount, amountPaidDH: paid, status: st });

        if (paid > 0) {
          receiptSeq++;
          payments.push({
            id: `p_${idx + 1}_${k + 1}`, memberId: id, subscriptionId: subId, installmentId: instId,
            receiptNo: `REC-2026-${String(receiptSeq).padStart(5, "0")}`, type: k === 0 ? "inscription" : "abonnement",
            amountDH: paid, method: member.preferredPaymentMethod, status: "paye",
            paidAt: dueDate + `T${String(ri(9, 20)).padStart(2, "0")}:${String(ri(0, 59)).padStart(2, "0")}:00`,
            chequeRef: member.preferredPaymentMethod === "cheque" ? `CHQ${ri(10000, 99999)}` : null, note: "",
          });
        }
      }
      subscriptions.push(sub);

      // Ceinture (BJJ / kids)
      if (disciplineIds.includes("bjj") || disciplineIds.includes("kids")) {
        const isKidsBelt = isKid;
        const ranks: BeltRank[] = isKidsBelt ? KIDS_BELTS : ADULT_BELTS;
        const rankIdx = isKidsBelt ? ri(0, ranks.length - 1) : (rnd() < 0.6 ? 0 : ri(1, 2));
        belts.push({
          id: `b_${idx + 1}`, memberId: id, discipline: isKidsBelt ? "kids" : "bjj",
          beltRank: ranks[rankIdx], stripes: ri(0, 4), isCurrent: true,
          promotedAt: addMonths(startDate, ri(0, 3)), promotedByCoachId: "c_rachidi",
          note: rankIdx > 0 ? "Promotion validée par le coach" : "Ceinture de départ",
        });
      }

      // Présences (membres actifs / en retard / gelé)
      if (profile === "actif" || profile === "actif_retard" || profile === "gele") {
        const decroche = profile === "actif" && rnd() < 0.16;
        const weeks = ri(6, 10);
        const perWeek = isKid ? 2 : ri(2, 3);
        let last: string | null = null;
        let streak = 0;
        for (let w = weeks; w >= 1; w--) {
          // un membre "décroché" s'arrête il y a ~4 semaines
          if (decroche && w <= 4) break;
          if (profile === "gele" && w <= 3) break;
          let weekHad = false;
          for (let s = 0; s < perWeek; s++) {
            const cs = pick(classSessions.filter((c) => disciplineIds.includes(c.disciplineId)));
            if (!cs) continue;
            const weekStart = addDays(now, -(w * 7));
            const target = parseISO(weekStart);
            const delta = (DAY_INDEX[cs.dayOfWeek] - target.getDay() + 7) % 7;
            const date = addDays(weekStart, delta);
            if (parseISO(date) > parseISO(now)) continue;
            attendance.push({
              id: `a_${idx}_${w}_${s}`, memberId: id, classSessionId: cs.id, disciplineId: cs.disciplineId,
              date, checkInTime: cs.startTime, method: rnd() < 0.7 ? "manuel" : "kiosque", status: "present",
              flaggedExpiredSub: false, flaggedDueBalance: profile === "actif_retard", flaggedMedicalExpired: false,
            });
            last = date; weekHad = true;
          }
          if (weekHad) streak++;
        }
        member.lastAttendanceAt = last;
        member.attendanceStreak = decroche ? 0 : streak;
        if (decroche) member.tags.push("À risque");
      }
    }

    members.push(member);
  });

  // Quelques encaissements datés d'AUJOURD'HUI (horloge démo) pour alimenter "Caisse du jour"
  const todayMethods: Payment["method"][] = ["especes", "especes", "carte", "virement"];
  const todayAmounts = [800, 1600, 1200, 2500, 500];
  for (let i = 0; i < 5; i++) {
    const m = members[(i * 5 + 3) % members.length];
    if (!m || m.status === "prospect") continue;
    receiptSeq++;
    payments.push({
      id: `p_today_${i}`, memberId: m.id, subscriptionId: null, installmentId: null,
      receiptNo: `REC-2026-${String(receiptSeq).padStart(5, "0")}`,
      type: i % 3 === 0 ? "inscription" : i === 4 ? "boutique" : "abonnement",
      amountDH: todayAmounts[i], method: todayMethods[i % todayMethods.length], status: "paye",
      paidAt: `${now}T${String(9 + i * 2).padStart(2, "0")}:${String(ri(0, 59)).padStart(2, "0")}:00`,
      chequeRef: null, note: "",
    });
  }

  // Leads (pipeline)
  for (let i = 0; i < 5; i++) {
    const female = rnd() < 0.4;
    leads.push({
      id: `l_${i + 1}`, firstName: female ? pick(MA_FIRST_F) : pick(MA_FIRST_M), lastName: pick(MA_LAST),
      phone: `+212 6${ri(0, 9)}${ri(0, 9)} ${ri(100, 999)}-${ri(100, 999)}`,
      source: pick(["instagram", "walkin", "parrainage", "whatsapp", "site"] as const),
      interestedDisciplineIds: [pick(["bjj", "mma", "kickboxing", "boxe"] as const)],
      stage: pick(["nouveau", "contacte", "essai_planifie", "essai_fait"] as const),
      heatScore: pick(["chaud", "tiede", "froid"] as const),
      trialDate: rnd() < 0.5 ? addDays(now, ri(1, 7)) : null, createdAt: addDays(now, -ri(1, 20)),
    });
  }

  // Activité récente (20 dernières actions) à partir des paiements + présences + promotions
  const recentPays = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 10);
  recentPays.forEach((p, i) => {
    const m = members.find((x) => x.id === p.memberId)!;
    activity.push({ id: `act_p_${i}`, type: "paiement", memberId: p.memberId, timestamp: p.paidAt, summaryFR: `Paiement encaissé — ${m.firstName} ${m.lastName}`, amountDH: p.amountDH });
  });
  const recentAtt = [...attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  recentAtt.forEach((a, i) => {
    const m = members.find((x) => x.id === a.memberId)!;
    activity.push({ id: `act_a_${i}`, type: "check-in", memberId: a.memberId, timestamp: a.date + "T" + a.checkInTime + ":00", summaryFR: `Check-in — ${m.firstName} ${m.lastName}`, amountDH: null });
  });
  belts.slice(0, 4).forEach((b, i) => {
    const m = members.find((x) => x.id === b.memberId)!;
    activity.push({ id: `act_b_${i}`, type: "promotion", memberId: b.memberId, timestamp: b.promotedAt + "T19:00:00", summaryFR: `Promotion ceinture — ${m.firstName} ${m.lastName}`, amountDH: null });
  });
  activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const settings: GymSettings = {
    name: "Ultimate Fight Academy", city: "Kénitra", address: "Av. Mohamed V, Kénitra, Maroc",
    phone: "+212 6 12 34 56 78", whatsapp: "+212 6 12 34 56 78", currency: "DH",
    adminPin: ADMIN_PIN, demoClock: DEMO_CLOCK, seedVersion: SEED_VERSION, lastBackupAt: null,
    receiptFooterText: "Merci de votre confiance — Ultimate Fight Academy, Kénitra.",
  };

  return {
    meta: { seedVersion: SEED_VERSION, demoClock: DEMO_CLOCK },
    members, subscriptions, installments, payments, attendance, classSessions,
    plans: PLANS, belts, coaches: COACHES, leads, activity, settings,
  };
}
