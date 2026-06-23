import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { DB, Member, PayMethod, DisciplineId, BeltRank, AttendanceRecord, MembershipPlan, Technique, PriceException, PlanId, Subscription, Installment, Duration, GymSettings, Lead } from "../types";
import { loadDB, saveDB, resetDB as resetDBFile, exportDB, importDB } from "./db";
import { getNow, memberBalanceDH, effectivePrice } from "./selectors";
import { addMonths } from "./format";
import { TEMPLATES } from "../components/WhatsAppReminder";

interface CollectArgs {
  memberId: string;
  installmentId: string | null;
  amount: number;
  method: PayMethod;
  type?: "abonnement" | "inscription" | "autre";
  note?: string;
}

interface StoreCtx {
  db: DB;
  now: string;
  refresh: () => void;
  collectPayment: (a: CollectArgs) => string; // retourne receiptNo
  checkIn: (memberId: string, classSessionId: string, method?: "manuel" | "kiosque") => void;
  promote: (memberId: string, discipline: DisciplineId, rank: BeltRank, stripes: number, note: string) => void;
  addMember: (m: Partial<Member>) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  freezeMember: (id: string) => void;
  addTechnique: (t: Omit<Technique, "id" | "isCustom" | "createdAt">) => void;
  removeTechnique: (id: string) => void;
  setSessionTechniques: (classSessionId: string, date: string, techniqueIds: string[], notes?: string) => void;
  updatePlan: (planId: PlanId, patch: Partial<MembershipPlan>) => void;
  addPriceException: (memberId: string, e: Omit<PriceException, "id" | "memberId" | "active" | "createdAt">) => void;
  removePriceException: (id: string) => void;
  createSubscription: (memberId: string, opts: { planId: PlanId; duration: Duration; disciplineIds: DisciplineId[]; paymentMode: "comptant" | "echelonne"; installmentsCount: number; startDate?: string }) => { subscription: Subscription; firstInstallmentId: string | null };
  renewSubscription: (subscriptionId: string) => void;
  freezeSubscription: (subscriptionId: string) => void;
  cancelSubscription: (subscriptionId: string) => void;
  markAttendance: (memberId: string, classSessionId: string, status: "present" | "no_show" | "excuse") => void;
  removeAttendance: (attendanceId: string) => void;
  convertLead: (leadId: string) => Member | null;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  addLead: (l: Partial<Lead>) => void;
  logReminder: (memberId: string, type: keyof typeof TEMPLATES, amount?: number) => void;
  createFamily: (name: string, memberIds: string[]) => void;
  setFamilyMembers: (familyId: string, memberIds: string[], primaryMemberId: string | null) => void;
  updateSettings: (patch: Partial<GymSettings>) => void;
  addClassSession: (c: Partial<import("../types").ClassSession>) => void;
  updateClassSession: (id: string, patch: Partial<import("../types").ClassSession>) => void;
  removeClassSession: (id: string) => void;
  reserveClass: (memberId: string, classSessionId: string, date: string) => "reserve" | "liste_attente" | "deja" | null;
  cancelBooking: (bookingId: string) => void;
  setTechniqueVideo: (techniqueId: string, videoUrl: string | null) => void;
  resetDemo: () => void;
  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
  saveBackup: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

let SEQ = Date.now();
const uid = (p: string) => `${p}_${(SEQ++).toString(36)}`;
let receiptSeq = 91000;
const nextReceipt = () => `REC-2026-${String(receiptSeq++).slice(-5)}`;

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => loadDB());

  // Mise à jour FONCTIONNELLE: chaque mutation lit toujours l'état le plus récent
  // (corrige les doubles-commits dans un même gestionnaire d'événement).
  const mutate = useCallback((fn: (prev: DB) => DB) => {
    setDb((prev) => {
      const next = fn(prev);
      saveDB(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => setDb({ ...loadDB() }), []);

  const collectPayment = useCallback(
    (a: CollectArgs): string => {
      const receiptNo = nextReceipt();
      const stamp = new Date().toTimeString().slice(0, 8);
      mutate((prev) => {
        const now = getNow(prev);
        const nowTs = now + "T" + stamp;
        const inst = a.installmentId ? prev.installments.find((i) => i.id === a.installmentId) : null;
        // borne le montant au restant de l'échéance ciblée
        const remaining = inst ? Math.max(0, inst.amountDueDH - inst.amountPaidDH) : a.amount;
        const applied = inst ? Math.min(a.amount, remaining) : a.amount;
        const installments = prev.installments.map((i) => {
          if (i.id !== a.installmentId) return i;
          const paid = i.amountPaidDH + applied;
          const status = paid >= i.amountDueDH ? "paye" : paid > 0 ? "partiel" : i.status;
          return { ...i, amountPaidDH: paid, status: status as typeof i.status };
        });
        const member = prev.members.find((m) => m.id === a.memberId);
        const payment = {
          id: uid("p"), memberId: a.memberId, subscriptionId: inst?.subscriptionId || null,
          installmentId: a.installmentId, receiptNo, type: a.type || "abonnement",
          amountDH: applied, method: a.method, status: "paye" as const, paidAt: nowTs,
          chequeRef: a.method === "cheque" ? "CHQ" + Math.floor(Math.random() * 99999) : null, note: a.note || "",
        };
        const activity = [
          { id: uid("act"), type: "paiement" as const, memberId: a.memberId, timestamp: nowTs, summaryFR: `Paiement encaissé — ${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim(), amountDH: applied },
          ...prev.activity,
        ];
        return { ...prev, installments, payments: [payment, ...prev.payments], activity };
      });
      return receiptNo;
    },
    [mutate]
  );

  const checkIn = useCallback(
    (memberId: string, classSessionId: string, method: "manuel" | "kiosque" = "manuel") => {
      const time = new Date().toTimeString().slice(0, 5);
      mutate((prev) => {
        const now = getNow(prev);
        const cs = prev.classSessions.find((c) => c.id === classSessionId);
        const member = prev.members.find((m) => m.id === memberId);
        if (!cs || !member) return prev;
        if (prev.attendance.some((x) => x.memberId === memberId && x.classSessionId === classSessionId && x.date === now)) return prev;
        const sub = prev.subscriptions.filter((s) => s.memberId === memberId).sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
        const rec: AttendanceRecord = {
          id: uid("a"), memberId, classSessionId, disciplineId: cs.disciplineId, date: now,
          checkInTime: time, method, status: "present",
          flaggedExpiredSub: sub ? sub.endDate < now : true,
          flaggedDueBalance: memberBalanceDH(prev, memberId) > 0,
          flaggedMedicalExpired: member.medicalCertExpiry ? member.medicalCertExpiry < now : false,
        };
        const members = prev.members.map((m) => (m.id === memberId ? { ...m, lastAttendanceAt: now } : m));
        const activity = [
          { id: uid("act"), type: "check-in" as const, memberId, timestamp: now + "T" + time + ":00", summaryFR: `Check-in — ${member.firstName} ${member.lastName}`, amountDH: null },
          ...prev.activity,
        ];
        return { ...prev, attendance: [rec, ...prev.attendance], members, activity };
      });
    },
    [mutate]
  );

  const promote = useCallback(
    (memberId: string, discipline: DisciplineId, rank: BeltRank, stripes: number, note: string) => {
      mutate((prev) => {
        const now = getNow(prev);
        const member = prev.members.find((m) => m.id === memberId);
        const belts = prev.belts.map((b) => (b.memberId === memberId && b.discipline === discipline ? { ...b, isCurrent: false } : b));
        belts.unshift({ id: uid("b"), memberId, discipline, beltRank: rank, stripes, isCurrent: true, promotedAt: now, promotedByCoachId: "c_rachidi", note });
        const activity = [
          { id: uid("act"), type: "promotion" as const, memberId, timestamp: now + "T19:00:00", summaryFR: `Promotion ceinture — ${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim(), amountDH: null },
          ...prev.activity,
        ];
        return { ...prev, belts, activity };
      });
    },
    [mutate]
  );

  const addMember = useCallback(
    (m: Partial<Member>): Member => {
      const now = getNow(db);
      const member: Member = {
        id: uid("m"), memberNo: `UFA-2026-${String(db.members.length + 1).padStart(4, "0")}`,
        firstName: m.firstName || "Nouveau", lastName: m.lastName || "Membre", photoUrl: null,
        gender: m.gender || "H", birthDate: m.birthDate || "2000-01-01", ageCategory: m.ageCategory || "adulte",
        phone: m.phone || "", whatsapp: m.whatsapp || m.phone || "", email: m.email || null,
        address: m.address || "Kénitra", city: "Kénitra", disciplineIds: m.disciplineIds || ["bjj"],
        status: m.status || "actif", joinedAt: now, emergencyContactName: m.emergencyContactName || "",
        emergencyContactPhone: m.emergencyContactPhone || "", guardianName: m.guardianName || null,
        medicalCertExpiry: m.medicalCertExpiry || null, waiverSigned: m.waiverSigned ?? false,
        acquisitionSource: m.acquisitionSource || "walkin", tags: m.tags || [], internalNotes: m.internalNotes || "",
        preferredPaymentMethod: m.preferredPaymentMethod || "especes", lastAttendanceAt: null, attendanceStreak: 0,
        createdAt: now, updatedAt: now,
      };
      mutate((prev) => ({
        ...prev,
        members: [member, ...prev.members],
        activity: [
          { id: uid("act"), type: "inscription" as const, memberId: member.id, timestamp: now + "T10:00:00", summaryFR: `Nouveau membre — ${member.firstName} ${member.lastName}`, amountDH: null },
          ...prev.activity,
        ],
      }));
      return member;
    },
    [db, mutate]
  );

  const updateMember = useCallback(
    (id: string, patch: Partial<Member>) => {
      mutate((prev) => ({ ...prev, members: prev.members.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: getNow(prev) } : m)) }));
    },
    [mutate]
  );

  const freezeMember = useCallback(
    (id: string) => {
      mutate((prev) => {
        const m = prev.members.find((x) => x.id === id);
        if (!m) return prev;
        const gel = m.status !== "gele";
        const members = prev.members.map((x) => (x.id === id ? { ...x, status: (gel ? "gele" : "actif") as Member["status"], updatedAt: getNow(prev) } : x));
        // synchronise le statut de l'abonnement courant
        const subs = [...prev.subscriptions].filter((s) => s.memberId === id).sort((a, b) => b.startDate.localeCompare(a.startDate));
        const cur = subs[0];
        const subscriptions = cur
          ? prev.subscriptions.map((s) => (s.id === cur.id ? { ...s, status: (gel ? "gele" : "actif") as typeof s.status } : s))
          : prev.subscriptions;
        return { ...prev, members, subscriptions };
      });
    },
    [mutate]
  );

  const addTechnique = useCallback((t: Omit<Technique, "id" | "isCustom" | "createdAt">) => {
    mutate((prev) => ({
      ...prev,
      techniques: [{ ...t, id: uid("t"), isCustom: true, createdAt: getNow(prev) }, ...prev.techniques],
    }));
  }, [mutate]);

  const removeTechnique = useCallback((id: string) => {
    mutate((prev) => {
      const tech = prev.techniques.find((t) => t.id === id);
      if (!tech || !tech.isCustom) return prev; // on ne supprime que les techniques ajoutées
      return {
        ...prev,
        techniques: prev.techniques.filter((t) => t.id !== id),
        sessionInstances: prev.sessionInstances.map((s) => ({ ...s, techniqueIds: s.techniqueIds.filter((x) => x !== id) })),
      };
    });
  }, [mutate]);

  const setSessionTechniques = useCallback((classSessionId: string, date: string, techniqueIds: string[], notes = "") => {
    mutate((prev) => {
      const cs = prev.classSessions.find((c) => c.id === classSessionId);
      if (!cs) return prev;
      const id = `${classSessionId}__${date}`;
      const exists = prev.sessionInstances.some((s) => s.id === id);
      const inst = { id, classSessionId, date, disciplineId: cs.disciplineId, techniqueIds, coachId: cs.coachId, notes };
      const sessionInstances = exists
        ? prev.sessionInstances.map((s) => (s.id === id ? { ...s, techniqueIds, notes } : s))
        : [inst, ...prev.sessionInstances];
      return { ...prev, sessionInstances };
    });
  }, [mutate]);

  const updatePlan = useCallback((planId: PlanId, patch: Partial<MembershipPlan>) => {
    mutate((prev) => ({ ...prev, plans: prev.plans.map((p) => (p.id === planId ? { ...p, ...patch } : p)) }));
  }, [mutate]);

  const addPriceException = useCallback((memberId: string, e: Omit<PriceException, "id" | "memberId" | "active" | "createdAt">) => {
    const value = e.type === "percent" ? Math.min(100, Math.max(0, e.value)) : Math.max(0, e.value);
    mutate((prev) => {
      // une seule exception active par membre
      const priceExceptions = prev.priceExceptions.map((x) => (x.memberId === memberId ? { ...x, active: false } : x));
      priceExceptions.unshift({ ...e, value, id: uid("pe"), memberId, active: true, createdAt: getNow(prev) });
      return { ...prev, priceExceptions };
    });
  }, [mutate]);

  const removePriceException = useCallback((id: string) => {
    mutate((prev) => ({ ...prev, priceExceptions: prev.priceExceptions.filter((x) => x.id !== id) }));
  }, [mutate]);

  // --- Abonnements ---
  const buildSubscription = (prev: DB, memberId: string, opts: { planId: PlanId; duration: Duration; disciplineIds: DisciplineId[]; paymentMode: "comptant" | "echelonne"; installmentsCount: number; startDate?: string }) => {
    const now = getNow(prev);
    const plan = prev.plans.find((p) => p.id === opts.planId);
    const base = !plan ? 0 : opts.duration === "1 an" ? plan.price12mDH : plan.price6mDH;
    const total = effectivePrice(prev, base, memberId).price;
    const months = opts.duration === "1 an" ? 14 : 6; // +2 mois offerts en annuel
    const startDate = opts.startDate || now;
    const endDate = addMonths(startDate, months);
    const subId = uid("s");
    const sub: Subscription = {
      id: subId, memberId, planId: opts.planId, duration: opts.duration, disciplineIds: opts.disciplineIds,
      startDate, endDate, basePriceDH: base, registrationFeeDH: 0,
      discountLabel: opts.duration === "1 an" ? "2 mois offerts" : "Frais d'inscription inclus", discountDH: Math.max(0, base - total),
      totalDH: total, status: "actif", paymentMode: opts.paymentMode, installmentsCount: Math.max(1, opts.installmentsCount), createdAt: now,
    };
    const nInst = sub.installmentsCount;
    const per = Math.round(total / nInst);
    const installments: Installment[] = [];
    for (let k = 0; k < nInst; k++) {
      const amount = k === nInst - 1 ? total - per * (nInst - 1) : per;
      installments.push({
        id: uid("i"), subscriptionId: subId, memberId, sequence: k + 1,
        label: nInst > 1 ? (k === 0 ? "Acompte" : `${k + 1}e versement`) : "Paiement intégral",
        dueDate: addMonths(startDate, k), amountDueDH: amount, amountPaidDH: 0, status: k === 0 ? "en_attente" : "en_attente",
      });
    }
    return { sub, installments };
  };

  const createSubscription = useCallback(
    (memberId: string, opts: { planId: PlanId; duration: Duration; disciplineIds: DisciplineId[]; paymentMode: "comptant" | "echelonne"; installmentsCount: number; startDate?: string }) => {
      const built = buildSubscription(db, memberId, opts);
      mutate((prev) => {
        const now = getNow(prev);
        const members = prev.members.map((m) => (m.id === memberId ? { ...m, status: m.status === "prospect" || m.status === "essai" ? "actif" : m.status, disciplineIds: opts.disciplineIds.length ? opts.disciplineIds : m.disciplineIds, updatedAt: now } : m));
        return { ...prev, subscriptions: [built.sub, ...prev.subscriptions], installments: [...built.installments, ...prev.installments], members };
      });
      return { subscription: built.sub, firstInstallmentId: built.installments[0]?.id ?? null };
    },
    [db, mutate]
  );

  const renewSubscription = useCallback((subscriptionId: string) => {
    mutate((prev) => {
      const old = prev.subscriptions.find((s) => s.id === subscriptionId);
      if (!old) return prev;
      const built = buildSubscription({ ...prev }, old.memberId, { planId: old.planId, duration: old.duration, disciplineIds: old.disciplineIds, paymentMode: old.paymentMode, installmentsCount: old.installmentsCount, startDate: getNow(prev) });
      const subscriptions = prev.subscriptions.map((s) => (s.id === subscriptionId ? { ...s, status: "expire" as const } : s));
      const members = prev.members.map((m) => (m.id === old.memberId ? { ...m, status: "actif" as Member["status"] } : m));
      const activity = [{ id: uid("act"), type: "renouvellement" as const, memberId: old.memberId, timestamp: getNow(prev) + "T10:00:00", summaryFR: `Abonnement renouvelé`, amountDH: built.sub.totalDH }, ...prev.activity];
      return { ...prev, subscriptions: [built.sub, ...subscriptions], installments: [...built.installments, ...prev.installments], members, activity };
    });
  }, [mutate]);

  const freezeSubscription = useCallback((subscriptionId: string) => {
    mutate((prev) => ({ ...prev, subscriptions: prev.subscriptions.map((s) => (s.id === subscriptionId ? { ...s, status: (s.status === "gele" ? "actif" : "gele") as typeof s.status } : s)) }));
  }, [mutate]);

  const cancelSubscription = useCallback((subscriptionId: string) => {
    mutate((prev) => ({ ...prev, subscriptions: prev.subscriptions.map((s) => (s.id === subscriptionId ? { ...s, status: "annule" as const } : s)) }));
  }, [mutate]);

  // --- Présences (no-show / excuse / correction) ---
  const markAttendance = useCallback((memberId: string, classSessionId: string, status: "present" | "no_show" | "excuse") => {
    const time = new Date().toTimeString().slice(0, 5);
    mutate((prev) => {
      const now = getNow(prev);
      const cs = prev.classSessions.find((c) => c.id === classSessionId);
      if (!cs) return prev;
      let attendance = [...prev.attendance];
      const existing = attendance.find((a) => a.memberId === memberId && a.classSessionId === classSessionId && a.date === now);
      if (existing) {
        attendance = attendance.map((a) => (a.id === existing.id ? { ...a, status } : a));
      } else {
        const member = prev.members.find((m) => m.id === memberId);
        const sub = prev.subscriptions.filter((s) => s.memberId === memberId).sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
        const rec: AttendanceRecord = {
          id: uid("a"), memberId, classSessionId, disciplineId: cs.disciplineId, date: now, checkInTime: time, method: "manuel", status,
          flaggedExpiredSub: sub ? sub.endDate < now : false, flaggedDueBalance: memberBalanceDH(prev, memberId) > 0,
          flaggedMedicalExpired: member?.medicalCertExpiry ? member.medicalCertExpiry < now : false,
        };
        attendance = [rec, ...attendance];
      }
      // recalcule lastAttendanceAt = dernière présence réelle (évite une présence "fantôme" après no-show/excusé)
      const lastPresent = attendance.filter((a) => a.memberId === memberId && a.status === "present").reduce<string | null>((m, a) => (m && m > a.date ? m : a.date), null);
      const members = prev.members.map((m) => (m.id === memberId ? { ...m, lastAttendanceAt: lastPresent } : m));
      return { ...prev, attendance, members };
    });
  }, [mutate]);

  const removeAttendance = useCallback((attendanceId: string) => {
    mutate((prev) => {
      const rec = prev.attendance.find((a) => a.id === attendanceId);
      const attendance = prev.attendance.filter((a) => a.id !== attendanceId);
      if (!rec) return { ...prev, attendance };
      const lastPresent = attendance.filter((a) => a.memberId === rec.memberId && a.status === "present").reduce<string | null>((m, a) => (m && m > a.date ? m : a.date), null);
      const members = prev.members.map((m) => (m.id === rec.memberId ? { ...m, lastAttendanceAt: lastPresent } : m));
      return { ...prev, attendance, members };
    });
  }, [mutate]);

  // --- Leads / CRM ---
  const addLead = useCallback((l: Partial<Lead>) => {
    mutate((prev) => ({ ...prev, leads: [{ id: uid("l"), firstName: l.firstName || "Prospect", lastName: l.lastName || "", phone: l.phone || "", source: l.source || "walkin" as Lead["source"], interestedDisciplineIds: l.interestedDisciplineIds || [], stage: l.stage || "nouveau", heatScore: l.heatScore || "tiede", trialDate: l.trialDate || null, createdAt: getNow(prev) }, ...prev.leads] }));
  }, [mutate]);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    mutate((prev) => ({ ...prev, leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, [mutate]);

  const convertLead = useCallback((leadId: string): Member | null => {
    const lead = db.leads.find((l) => l.id === leadId);
    if (!lead) return null;
    const created = addMember({ firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, disciplineIds: lead.interestedDisciplineIds, status: "essai", acquisitionSource: lead.source as Member["acquisitionSource"] });
    mutate((prev) => ({ ...prev, leads: prev.leads.map((l) => (l.id === leadId ? { ...l, stage: "inscrit" as const } : l)) }));
    return created;
  }, [db, addMember, mutate]);

  // --- Relances (journal) ---
  const logReminder = useCallback((memberId: string, type: keyof typeof TEMPLATES, amount?: number) => {
    const stamp = new Date().toTimeString().slice(0, 8);
    mutate((prev) => {
      const m = prev.members.find((x) => x.id === memberId);
      if (!m) return prev;
      const activity = [{ id: uid("act"), type: "relance" as const, memberId, timestamp: getNow(prev) + "T" + stamp, summaryFR: `Relance ${type} — ${m.firstName} ${m.lastName}`, amountDH: amount ?? null }, ...prev.activity];
      return { ...prev, activity };
    });
  }, [mutate]);

  // --- Familles ---
  const createFamily = useCallback((name: string, memberIds: string[]) => {
    mutate((prev) => ({ ...prev, families: [{ id: uid("fam"), name, memberIds, primaryMemberId: memberIds[0] ?? null }, ...prev.families] }));
  }, [mutate]);

  const setFamilyMembers = useCallback((familyId: string, memberIds: string[], primaryMemberId: string | null) => {
    mutate((prev) => ({ ...prev, families: prev.families.map((f) => (f.id === familyId ? { ...f, memberIds, primaryMemberId } : f)) }));
  }, [mutate]);

  const updateSettings = useCallback((patch: Partial<GymSettings>) => {
    mutate((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, [mutate]);

  // --- Planning (créneaux) ---
  const addClassSession = useCallback((c: Partial<import("../types").ClassSession>) => {
    mutate((prev) => ({ ...prev, classSessions: [...prev.classSessions, {
      id: uid("cs"), disciplineId: c.disciplineId || "bjj", label: c.label || "Nouveau cours", level: c.level || "adultes",
      variant: c.variant ?? null, dayOfWeek: c.dayOfWeek || "LUN", startTime: c.startTime || "18:00", endTime: c.endTime || "19:00",
      coachId: c.coachId || prev.coaches[0]?.id || "c_rachidi", room: c.room || "Tatami 1", capacity: c.capacity ?? 20, isActive: c.isActive ?? true,
    }] }));
  }, [mutate]);

  const updateClassSession = useCallback((id: string, patch: Partial<import("../types").ClassSession>) => {
    mutate((prev) => ({ ...prev, classSessions: prev.classSessions.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }, [mutate]);

  const removeClassSession = useCallback((id: string) => {
    mutate((prev) => ({ ...prev, classSessions: prev.classSessions.filter((c) => c.id !== id) }));
  }, [mutate]);

  // --- Réservations ---
  const reserveClass = useCallback((memberId: string, classSessionId: string, date: string): "reserve" | "liste_attente" | "deja" | null => {
    let result: "reserve" | "liste_attente" | "deja" | null = null;
    const stamp = new Date().toTimeString().slice(0, 8);
    mutate((prev) => {
      const cs = prev.classSessions.find((c) => c.id === classSessionId);
      if (!cs) { result = null; return prev; }
      const active = prev.bookings.filter((b) => b.classSessionId === classSessionId && b.date === date && b.status !== "annule");
      if (active.some((b) => b.memberId === memberId)) { result = "deja"; return prev; }
      const reserved = active.filter((b) => b.status === "reserve" || b.status === "present").length;
      const status = reserved < cs.capacity ? "reserve" : "liste_attente";
      result = status;
      // createdAt horodaté (heure réelle) pour un ordre FIFO déterministe de la liste d'attente
      const booking = { id: uid("bk"), memberId, classSessionId, date, status: status as "reserve" | "liste_attente", createdAt: getNow(prev) + "T" + stamp };
      return { ...prev, bookings: [booking, ...prev.bookings] };
    });
    return result;
  }, [mutate]);

  const cancelBooking = useCallback((bookingId: string) => {
    mutate((prev) => {
      const bk = prev.bookings.find((b) => b.id === bookingId);
      if (!bk) return prev;
      let bookings = prev.bookings.map((b) => (b.id === bookingId ? { ...b, status: "annule" as const } : b));
      // si une place se libère, promouvoir le 1er de la liste d'attente
      if (bk.status === "reserve") {
        const waiting = bookings
          .filter((b) => b.classSessionId === bk.classSessionId && b.date === bk.date && b.status === "liste_attente")
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))[0];
        if (waiting) bookings = bookings.map((b) => (b.id === waiting.id ? { ...b, status: "reserve" as const } : b));
      }
      return { ...prev, bookings };
    });
  }, [mutate]);

  const setTechniqueVideo = useCallback((techniqueId: string, videoUrl: string | null) => {
    mutate((prev) => ({ ...prev, techniques: prev.techniques.map((t) => (t.id === techniqueId ? { ...t, videoUrl } : t)) }));
  }, [mutate]);

  const resetDemo = useCallback(() => { const next = resetDBFile(); setDb({ ...next }); }, []);
  const exportJSON = useCallback(() => {
    exportDB(db);
    mutate((prev) => ({ ...prev, settings: { ...prev.settings, lastBackupAt: getNow(prev) + "T" + new Date().toTimeString().slice(0, 8) } }));
  }, [db, mutate]);
  const importJSON = useCallback(async (file: File) => { const next = await importDB(file); setDb({ ...next }); }, []);
  const saveBackup = useCallback(() => exportJSON(), [exportJSON]);

  const value = useMemo<StoreCtx>(
    () => ({ db, now: getNow(db), refresh, collectPayment, checkIn, promote, addMember, updateMember, freezeMember, addTechnique, removeTechnique, setSessionTechniques, updatePlan, addPriceException, removePriceException, createSubscription, renewSubscription, freezeSubscription, cancelSubscription, markAttendance, removeAttendance, convertLead, updateLead, addLead, logReminder, createFamily, setFamilyMembers, updateSettings, addClassSession, updateClassSession, removeClassSession, reserveClass, cancelBooking, setTechniqueVideo, resetDemo, exportJSON, importJSON, saveBackup }),
    [db, refresh, collectPayment, checkIn, promote, addMember, updateMember, freezeMember, addTechnique, removeTechnique, setSessionTechniques, updatePlan, addPriceException, removePriceException, createSubscription, renewSubscription, freezeSubscription, cancelSubscription, markAttendance, removeAttendance, convertLead, updateLead, addLead, logReminder, createFamily, setFamilyMembers, updateSettings, addClassSession, updateClassSession, removeClassSession, reserveClass, cancelBooking, setTechniqueVideo, resetDemo, exportJSON, importJSON, saveBackup]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore doit être utilisé dans AdminStoreProvider");
  return c;
}
