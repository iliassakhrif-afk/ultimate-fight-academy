import type { DisciplineId, GiType } from "./types";

export interface TechSeed {
  discipline: DisciplineId;
  name: string;
  category: string;
  gi: GiType;
  position: string;
}

// Catalogue de référence (Jiu-Jitsu Brésilien — Gi & No-Gi — + striking).
export const TECHNIQUE_CATALOG: TechSeed[] = [
  // --- Mouvements de base / déplacements ---
  { discipline: "bjj", name: "Esquive de hanche (shrimp)", category: "Mouvement", gi: "both", position: "Sol" },
  { discipline: "bjj", name: "Pont / Upa (bridge)", category: "Mouvement", gi: "both", position: "Sol" },
  { discipline: "bjj", name: "Roulade avant", category: "Mouvement", gi: "both", position: "Debout" },
  { discipline: "bjj", name: "Roulade arrière", category: "Mouvement", gi: "both", position: "Sol" },
  { discipline: "bjj", name: "Technical stand-up", category: "Mouvement", gi: "both", position: "Debout" },
  { discipline: "bjj", name: "Granby roll", category: "Mouvement", gi: "both", position: "Sol" },
  { discipline: "bjj", name: "Sprawl", category: "Mouvement", gi: "both", position: "Debout" },

  // --- Gardes ---
  { discipline: "bjj", name: "Garde fermée", category: "Garde", gi: "both", position: "Garde fermée" },
  { discipline: "bjj", name: "Garde ouverte", category: "Garde", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Demi-garde", category: "Garde", gi: "both", position: "Demi-garde" },
  { discipline: "bjj", name: "Garde araignée (spider)", category: "Garde", gi: "gi", position: "Garde ouverte" },
  { discipline: "bjj", name: "Garde lasso", category: "Garde", gi: "gi", position: "Garde ouverte" },
  { discipline: "bjj", name: "Garde collier-manche (collar-sleeve)", category: "Garde", gi: "gi", position: "Garde ouverte" },
  { discipline: "bjj", name: "Garde De La Riva", category: "Garde", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Garde Reverse De La Riva", category: "Garde", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Garde papillon (butterfly)", category: "Garde", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Garde X", category: "Garde", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Single-leg X (ashi garami)", category: "Garde", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Garde 50/50", category: "Garde", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "K-guard", category: "Garde", gi: "both", position: "Garde ouverte" },

  // --- Passages de garde ---
  { discipline: "bjj", name: "Passage toreando (toreana)", category: "Passage", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Knee cut (knee slice)", category: "Passage", gi: "both", position: "Demi-garde" },
  { discipline: "bjj", name: "Passage smash (écrasement)", category: "Passage", gi: "both", position: "Demi-garde" },
  { discipline: "bjj", name: "Leg drag", category: "Passage", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Stack pass", category: "Passage", gi: "both", position: "Garde fermée" },
  { discipline: "bjj", name: "X-pass", category: "Passage", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Over-under pass", category: "Passage", gi: "both", position: "Demi-garde" },
  { discipline: "bjj", name: "Long step / back step", category: "Passage", gi: "both", position: "Demi-garde" },

  // --- Renversements (sweeps) ---
  { discipline: "bjj", name: "Renversement en ciseaux (scissor sweep)", category: "Renversement", gi: "both", position: "Garde fermée" },
  { discipline: "bjj", name: "Renversement fleur / pendule", category: "Renversement", gi: "both", position: "Garde fermée" },
  { discipline: "bjj", name: "Renversement papillon (butterfly sweep)", category: "Renversement", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Hip bump sweep", category: "Renversement", gi: "both", position: "Garde fermée" },
  { discipline: "bjj", name: "Balayage de demi-garde (old school)", category: "Renversement", gi: "both", position: "Demi-garde" },
  { discipline: "bjj", name: "Sweep De La Riva", category: "Renversement", gi: "both", position: "Garde ouverte" },

  // --- Contrôles / positions dominantes ---
  { discipline: "bjj", name: "Montée (mount)", category: "Contrôle", gi: "both", position: "Montée" },
  { discipline: "bjj", name: "Contrôle latéral (side control)", category: "Contrôle", gi: "both", position: "Contrôle latéral" },
  { discipline: "bjj", name: "Genou sur le ventre (knee on belly)", category: "Contrôle", gi: "both", position: "Contrôle latéral" },
  { discipline: "bjj", name: "Contrôle du dos (back control)", category: "Contrôle", gi: "both", position: "Dos" },
  { discipline: "bjj", name: "Nord-Sud", category: "Contrôle", gi: "both", position: "Nord-Sud" },

  // --- Soumissions (haut du corps) ---
  { discipline: "bjj", name: "Étranglement croisé (cross collar)", category: "Soumission", gi: "gi", position: "Montée" },
  { discipline: "bjj", name: "Étranglement arrière (RNC / mata leão)", category: "Soumission", gi: "both", position: "Dos" },
  { discipline: "bjj", name: "Triangle", category: "Soumission", gi: "both", position: "Garde fermée" },
  { discipline: "bjj", name: "Clé de bras (armbar / juji-gatame)", category: "Soumission", gi: "both", position: "Garde fermée" },
  { discipline: "bjj", name: "Kimura", category: "Soumission", gi: "both", position: "Contrôle latéral" },
  { discipline: "bjj", name: "Americana", category: "Soumission", gi: "both", position: "Montée" },
  { discipline: "bjj", name: "Omoplata", category: "Soumission", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Guillotine", category: "Soumission", gi: "both", position: "Debout" },
  { discipline: "bjj", name: "Étranglement Ezekiel", category: "Soumission", gi: "gi", position: "Montée" },
  { discipline: "bjj", name: "Bow and arrow choke", category: "Soumission", gi: "gi", position: "Dos" },
  { discipline: "bjj", name: "Loop choke", category: "Soumission", gi: "gi", position: "Garde ouverte" },
  { discipline: "bjj", name: "D'arce choke", category: "Soumission", gi: "both", position: "Contrôle latéral" },
  { discipline: "bjj", name: "Anaconda choke", category: "Soumission", gi: "both", position: "Nord-Sud" },
  { discipline: "bjj", name: "Étranglement Nord-Sud", category: "Soumission", gi: "both", position: "Nord-Sud" },
  { discipline: "bjj", name: "Triangle de bras", category: "Soumission", gi: "both", position: "Montée" },

  // --- Soumissions jambes ---
  { discipline: "bjj", name: "Clé de cheville droite (straight ankle lock)", category: "Soumission jambe", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Heel hook", category: "Soumission jambe", gi: "nogi", position: "Garde ouverte" },
  { discipline: "bjj", name: "Toe hold", category: "Soumission jambe", gi: "both", position: "Garde ouverte" },
  { discipline: "bjj", name: "Kneebar", category: "Soumission jambe", gi: "both", position: "Garde ouverte" },

  // --- Projections / Takedowns ---
  { discipline: "bjj", name: "Double leg", category: "Projection", gi: "both", position: "Debout" },
  { discipline: "bjj", name: "Single leg", category: "Projection", gi: "both", position: "Debout" },
  { discipline: "bjj", name: "O soto gari", category: "Projection", gi: "gi", position: "Debout" },
  { discipline: "bjj", name: "Seoi nage", category: "Projection", gi: "gi", position: "Debout" },
  { discipline: "bjj", name: "Uchi mata", category: "Projection", gi: "gi", position: "Debout" },
  { discipline: "bjj", name: "Arm drag vers le dos", category: "Projection", gi: "both", position: "Debout" },

  // --- Échappes ---
  { discipline: "bjj", name: "Échappe de la montée (coude-genou)", category: "Échappe", gi: "both", position: "Montée" },
  { discipline: "bjj", name: "Échappe du contrôle latéral", category: "Échappe", gi: "both", position: "Contrôle latéral" },
  { discipline: "bjj", name: "Échappe du dos", category: "Échappe", gi: "both", position: "Dos" },
  { discipline: "bjj", name: "Défense de guillotine", category: "Échappe", gi: "both", position: "Debout" },

  // --- Striking (kickboxing / boxe / MMA) ---
  { discipline: "kickboxing", name: "Jab", category: "Poing", gi: "both", position: "Debout" },
  { discipline: "kickboxing", name: "Direct (cross)", category: "Poing", gi: "both", position: "Debout" },
  { discipline: "kickboxing", name: "Crochet (hook)", category: "Poing", gi: "both", position: "Debout" },
  { discipline: "kickboxing", name: "Uppercut", category: "Poing", gi: "both", position: "Debout" },
  { discipline: "kickboxing", name: "Low kick", category: "Jambe", gi: "both", position: "Debout" },
  { discipline: "kickboxing", name: "Middle kick", category: "Jambe", gi: "both", position: "Debout" },
  { discipline: "kickboxing", name: "Teep (front kick)", category: "Jambe", gi: "both", position: "Debout" },
  { discipline: "kickboxing", name: "Coup de genou", category: "Genou", gi: "both", position: "Clinch" },
  { discipline: "boxe", name: "Jab-direct", category: "Combinaison", gi: "both", position: "Debout" },
  { discipline: "boxe", name: "Esquive rotative (slip)", category: "Défense", gi: "both", position: "Debout" },
  { discipline: "boxe", name: "Esquive plongeante (bob and weave)", category: "Défense", gi: "both", position: "Debout" },
  { discipline: "mma", name: "Sprawl & brawl", category: "Transition", gi: "nogi", position: "Debout" },
  { discipline: "mma", name: "Ground and pound", category: "Sol", gi: "nogi", position: "Montée" },
  { discipline: "mma", name: "Projection en cage", category: "Projection", gi: "nogi", position: "Debout" },
];

export const TECHNIQUE_CATEGORIES = [
  "Mouvement", "Garde", "Passage", "Renversement", "Contrôle",
  "Soumission", "Soumission jambe", "Projection", "Échappe",
  "Poing", "Jambe", "Genou", "Combinaison", "Défense", "Transition", "Sol",
];

export const GI_META: Record<GiType, { label: string; short: string; color: string }> = {
  gi: { label: "Gi (kimono)", short: "GI", color: "#3aa0ff" },
  nogi: { label: "No-Gi", short: "NO-GI", color: "#ff8c2e" },
  both: { label: "Gi & No-Gi", short: "GI/NO-GI", color: "#3ddc84" },
};
