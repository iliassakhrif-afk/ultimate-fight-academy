import type { DB, AppRole } from "../types";
import { LS_PREFIX, LS_AUTH, LS_ROLE, SEED_VERSION } from "../constants";
import { buildSeed } from "./seed";

const KEY = `${LS_PREFIX}.db`;

export function loadDB(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed?.meta?.seedVersion === SEED_VERSION) return parsed;
    }
  } catch {
    /* ignore */
  }
  const fresh = buildSeed();
  saveDB(fresh);
  return fresh;
}

export function saveDB(db: DB): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* quota / private mode — la session reste en mémoire */
  }
}

export function resetDB(): DB {
  const fresh = buildSeed();
  saveDB(fresh);
  return fresh;
}

export function exportDB(db: DB): void {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ufa-admin-${db.meta.demoClock}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDB(file: File): Promise<DB> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DB;
        if (!parsed?.members || !parsed?.meta) throw new Error("Fichier invalide");
        saveDB(parsed);
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function dbSizeKB(db: DB): number {
  return Math.round((JSON.stringify(db).length / 1024) * 10) / 10;
}

export function recordCount(db: DB): number {
  return (
    db.members.length + db.subscriptions.length + db.installments.length + db.payments.length +
    db.attendance.length + db.classSessions.length + db.plans.length + db.belts.length +
    db.coaches.length + db.leads.length + db.activity.length
  );
}

// --- Auth démo ---
export const auth = {
  isAuthed: (): boolean => localStorage.getItem(LS_AUTH) === "ok",
  login: (pin: string, realPin: string): boolean => {
    if (pin === realPin) {
      localStorage.setItem(LS_AUTH, "ok");
      return true;
    }
    return false;
  },
  logout: (): void => localStorage.removeItem(LS_AUTH),
};

// Rôle de la session (démo) : admin / coach / accueil
export const roleStore = {
  get: (): AppRole => (localStorage.getItem(LS_ROLE) as AppRole) || "admin",
  set: (r: AppRole): void => localStorage.setItem(LS_ROLE, r),
};
