export const meta = {
  name: 'admin-pages-build',
  description: 'Construit en parallèle les pages de l\'espace admin Ultimate Fight Academy contre un contrat figé',
  phases: [{ title: 'Pages', detail: '11 pages construites en parallèle' }],
}

const BASE = '/Users/iliass/Documents/New project/ULTIMATE/src/admin/pages'

const CONTRACT = `
Tu construis UNE page React+TypeScript de l'espace ADMIN d'Ultimate Fight Academy (salle de combat, Kénitra, Maroc). Démo 100% client-side (localStorage), UI FRANÇAISE, devise DH. Thème sombre, rouge ember #ff3d2e, or #f5b730. Police d'affichage Anton via classe "font-display".

RÈGLES STRICTES:
- Écris le fichier complet avec l'outil Write au chemin absolu fourni. N'écris AUCUN autre fichier.
- TypeScript STRICT (noUnusedLocals/noUnusedParameters activés): zéro import ou variable inutilisés. Utilise "import type" pour les types.
- N'AJOUTE AUCUNE dépendance. Utilise UNIQUEMENT le contrat ci-dessous, react, react-router-dom, framer-motion, lucide-react.
- Le composant est rendu DANS le layout admin (déjà avec padding). Retourne un <div className="space-y-6"> en racine. Commence par un titre: <h1 className="font-display text-4xl tracking-wide">TITRE</h1> éventuellement avec un sous-titre <p className="text-ash">.
- Réutilise les utilitaires Tailwind du projet: bg-ink/bg-coal/bg-steel, text-bone/text-ash, ember/gold, border-white/10, rounded-2xl, btn-primary, btn-ghost, field. Cartes = "rounded-2xl border border-white/10 bg-coal p-5". Privilégie le composant <SectionCard title=...>.
- Données et actions via le hook useStore(). Toutes les dates se calculent par rapport à db.settings.demoClock (les sélecteurs le font déjà). N'utilise jamais new Date() pour "aujourd'hui": utilise db.settings.demoClock / les sélecteurs.
- Navigation: import { useNavigate, useParams, Link } from "react-router-dom". Fiche membre = /admin/membres/:id.
- Soigne le design: dense mais aéré, animations framer-motion légères (apparition en cascade), pastilles de statut, chiffres DH alignés à droite. Impressionne.

=== CHEMINS D'IMPORT (depuis src/admin/pages/) ===
import { useStore } from "../store/StoreProvider"
import * as S from "../store/selectors"   // sélecteurs (voir signatures)
import { formatDH, formatNum, formatDateFR, formatDateShort, formatDateLong, daysBetween, addDays, addMonths, ageFrom, monthKey, parseISO, MS_DAY, waLink, interpolate, amountInWords, avatarColor, initials } from "../store/format"
import { DISCIPLINE_LABELS, DISCIPLINE_COLORS, DISCIPLINE_SHORT, STATUS_META, INSTALLMENT_META, BELT_COLORS, ADULT_BELTS, KIDS_BELTS, WEEK_DAYS } from "../constants"
import { dbSizeKB, recordCount } from "../store/db"
import type { Member, Subscription, Installment, Payment, AttendanceRecord, ClassSession, MembershipPlan, Belt, Coach, Lead, DisciplineId, BeltRank, PayMethod, MemberStatus } from "../types"
import { asset } from "../../asset"  // pour les images: asset("/images/logo.png")
// Composants partagés:
import StatCard from "../components/StatCard"
import DataTable, { type Column } from "../components/DataTable"
import { StatusBadge, InstallmentBadge, Pill } from "../components/StatusBadge"
import BeltPill from "../components/BeltPill"
import Avatar from "../components/Avatar"
import CountUp from "../components/CountUp"
import { Modal, Drawer } from "../components/Overlay"
import EmptyState, { SectionCard } from "../components/EmptyState"
import CollectPaymentModal from "../components/CollectPaymentModal"
import WhatsAppReminder, { TEMPLATES } from "../components/WhatsAppReminder"
import BarChart from "../components/charts/BarChart"
import Donut from "../components/charts/Donut"
import Heatmap from "../components/charts/Heatmap"
import AgingBars from "../components/charts/AgingBars"
import ProgressRing from "../components/charts/ProgressRing"
import Sparkline from "../components/charts/Sparkline"

=== useStore() retourne ===
{
  db,                       // DB complète (voir collections)
  now: string,              // = db.settings.demoClock (ISO 'YYYY-MM-DD')
  refresh(),
  collectPayment(a: {memberId, installmentId: string|null, amount: number, method: PayMethod, type?: 'abonnement'|'inscription'|'autre', note?: string}): string /*receiptNo*/,
  checkIn(memberId, classSessionId, method?: 'manuel'|'kiosque'),
  promote(memberId, discipline: DisciplineId, rank: BeltRank, stripes: number, note: string),
  addMember(partial: Partial<Member>): Member,
  updateMember(id, patch: Partial<Member>),
  freezeMember(id),
  resetDemo(), exportJSON(), importJSON(file: File): Promise<void>, saveBackup()
}
db collections: db.members, db.subscriptions, db.installments, db.payments, db.attendance, db.classSessions, db.plans, db.belts, db.coaches, db.leads, db.activity, db.settings.

=== Member (champs clés) ===
id, memberNo, firstName, lastName, gender:'H'|'F', birthDate, ageCategory:'enfant'|'ado'|'adulte', phone, whatsapp, email, address, city, disciplineIds: DisciplineId[], status: 'prospect'|'essai'|'actif'|'gele'|'expire'|'churn', joinedAt, emergencyContactName, emergencyContactPhone, guardianName, medicalCertExpiry, waiverSigned, acquisitionSource, tags: string[], internalNotes, preferredPaymentMethod, lastAttendanceAt, attendanceStreak.
DisciplineId = 'bjj'|'mma'|'kickboxing'|'boxe'|'kids'|'women'.
Subscription: id, memberId, planId:'plan-1disc'|'plan-2disc'|'plan-fullpack', duration:'6 mois'|'1 an', disciplineIds, startDate, endDate, basePriceDH, totalDH, status:'actif'|'expire_bientot'|'expire'|'gele'|'annule', paymentMode:'comptant'|'echelonne', installmentsCount, discountLabel.
Installment: id, subscriptionId, memberId, sequence, label, dueDate, amountDueDH, amountPaidDH, status:'paye'|'partiel'|'en_attente'|'en_retard'.
Payment: id, memberId, receiptNo, type, amountDH, method:'especes'|'virement'|'cheque'|'carte', status, paidAt (ISO datetime), chequeRef, note.
ClassSession: id, disciplineId, label, level, variant:'Gi'|'No-Gi'|'Kickboxing'|'Boxe'|null, dayOfWeek:'LUN'..'SAM', startTime '13:00', endTime, coachId, room, capacity, isActive.
Belt: id, memberId, discipline, beltRank: BeltRank, stripes:0..4, isCurrent, promotedAt, note. BeltRank='blanche'|'bleue'|'violette'|'marron'|'noire'|'kids-grise'|'kids-jaune'|'kids-orange'|'kids-verte'.
MembershipPlan: id, name, sub, featured, disciplineLimit:number|'toutes', classesPerWeek, price6mDH, price12mDH, registrationFeeDH, freeMonthsYearly.
Coach: id, firstName, lastName, role:'Head Coach'|'Coach'|'Assistant', disciplineIds, beltRank, phone, instagram, active.
Lead: id, firstName, lastName, phone, source, interestedDisciplineIds, stage:'nouveau'|'contacte'|'essai_planifie'|'essai_fait'|'inscrit'|'perdu', heatScore:'chaud'|'tiede'|'froid', trialDate, createdAt.

=== Sélecteurs (S.*) — tous prennent db en 1er arg ===
S.getNow(db):string; S.memberBalanceDH(db,id):number; S.memberLTV(db,id):number; S.memberSubscription(db,id):Subscription|null; S.memberCurrentBelt(db,id):Belt|null; S.memberAttendance(db,id):AttendanceRecord[]; S.memberAttendanceCount(db,id,days):number; S.memberRisk(db,member):'sain'|'tiede'|'risque';
S.membresActifs(db); S.totalMembres(db); S.gelesCount(db); S.prospectsEssais(db); S.nouveauxCeMois(db);
S.expirantSous(db,days):Subscription[]; S.membresEnRetard(db):Member[]; S.membresDecroches(db,days?=21):Member[];
S.encaisseCeMois(db); S.encaisseAujourdhui(db); S.encaisseParMethode(db):Record<'especes'|'virement'|'cheque'|'carte',number>; S.impayesTotauxDH(db);
S.openInstallments(db): (Installment & {daysLate:number, remaining:number})[]; S.agingBuckets(db):{b0_7,b8_30,b30plus}; S.tauxRecouvrement(db); S.panierMoyen(db); S.mrrEstime(db);
S.caParMois(db,n?=12): {key,label,facture,encaisse}[]; S.distributionByDiscipline(db):{id:DisciplineId,count}[]; S.caParPlan(db):{planId,total}[];
S.presentsAujourdhui(db); S.attendanceHeatmap(db):{slots:string[],days:string[],cells:number[][],max:number}; S.todayClasses(db): (ClassSession & {present:number})[]; S.searchMembers(db,q):Member[].

=== Props des composants partagés ===
<StatCard label value format?={(n)=>string} delta?={{value,positive?}} spark?={number[]} accent?="#hex" icon?={<.../>} onClick?={()=>void} index?={n} />
<DataTable columns={Column<T>[]} data={T[]} onRowClick?={(row)=>void} initialSort?={{key,dir:'asc'|'desc'}} />  où Column<T>={ key, header, align?:'left'|'right'|'center', width?, sortValue?:(row)=>number|string, render:(row)=>ReactNode }. T doit avoir un champ id:string.
<StatusBadge status={MemberStatus} />   <InstallmentBadge status={Installment['status']} />   <Pill label color="#hex" />
<BeltPill rank={BeltRank} stripes?={0..4} showLabel?={bool} />
<Avatar first last size?={38} />
<CountUp value={n} format?={fn} />
<Modal open onClose title? width?="max-w-lg"> ... </Modal>     <Drawer open onClose title? width?="max-w-md"> ... </Drawer>
<EmptyState icon?={<.../>} title hint? />     <SectionCard title? action?={node} className?> ...children </SectionCard>
<CollectPaymentModal open onClose memberId installmentId?={string|null} defaultAmount?={n} />
<WhatsAppReminder member={Member} type?={'paiement'|'expiration'|'decrochage'|'bienvenue'} amount?={n} dueDate?={iso} compact?={bool} />
<BarChart data={{label,a,b}[]} height?={220} />   (a=facturé ember, b=encaissé gold)
<Donut segments={{label,value,color}[]} size?={180} centerValue?="X" centerLabel?="..." />
<Heatmap data={S.attendanceHeatmap(db)} />
<AgingBars buckets={S.agingBuckets(db)} />
<ProgressRing pct={0..100} size?={132} value?="X%" label?="..." color?="#hex" />
<Sparkline data={number[]} color?="#hex" width?={90} height?={30} />

=== Couleurs ===
DISCIPLINE_COLORS[id], DISCIPLINE_LABELS[id], DISCIPLINE_SHORT[id]. STATUS_META[status]={label,color,bg}. INSTALLMENT_META[status]={label,color,bg}. BELT_COLORS[rank]={label,bar,text}. ember=#ff3d2e, gold=#f5b730, vert=#3ddc84.
`

// Spécifications des pages (issues du blueprint)
const PAGES = [
  {
    file: 'Members.tsx', comp: 'Members', title: 'MEMBRES',
    spec: `Répertoire des membres. En haut: bandeau KPI (Total membres S.totalMembres, Actifs S.membresActifs, En retard S.membresEnRetard(db).length, Prospects/essais S.prospectsEssais, et "Solde filtré" = somme S.memberBalanceDH des lignes affichées) en StatCard non cliquables ou simples cartes.
    Barre de recherche instantanée (nom/téléphone/memberNo) + filtres composables (boutons-pastilles): statut (tous/actif/gele/expire/essai), discipline (DISCIPLINE_LABELS), "En retard" (solde>0), "Décrochés" (S.membresDecroches). Boutons "segments" rapides.
    Table dense via DataTable: colonnes = Membre (Avatar + nom + memberNo en sous-texte), Âge (ageFrom(birthDate, db.settings.demoClock)), Disciplines (petites pastilles couleur via DISCIPLINE_SHORT/COLORS), Ceinture (BeltPill depuis S.memberCurrentBelt, showLabel false; sinon "—"), Statut (StatusBadge), Échéance (S.memberSubscription endDate formatDateFR ou "—"), Solde (S.memberBalanceDH, rouge si>0, aligné droite, triable desc), Dernière présence (lastAttendanceAt formatDateShort ou "—"). onRowClick -> navigate(/admin/membres/{id}). Tri initial par solde desc.
    Bouton "+ Nouveau membre" en haut à droite -> /admin/membres/nouveau. Filtrer db.members en excluant 'churn' par défaut. Soigne: compteur de résultats, état vide.`,
  },
  {
    file: 'MemberDetail.tsx', comp: 'MemberDetail', title: 'Fiche membre',
    spec: `Fiche 360° d'un membre via useParams<{id}>(). Si introuvable -> EmptyState + lien retour.
    EN-TÊTE: grand Avatar (size 64), nom (font-display text-3xl), memberNo, StatusBadge, âge, ville, disciplines (pastilles), contacts (phone/whatsapp/email), bouton "← Membres". Bouton "Geler/Réactiver" (freezeMember).
    GRILLE 2 colonnes (lg). Colonne gauche:
    - Carte SOLDE: total dû (S.memberBalanceDH) en grand font-display ember si>0, total versé/LTV (S.memberLTV), prochaine échéance (1re installment non payée: dueDate, compte à rebours "dans X j" ou "EN RETARD de X j" via daysBetween). Bouton proéminent "Encaisser" -> ouvre CollectPaymentModal (installmentId = prochaine échéance ouverte).
    - ÉCHÉANCIER: liste verticale des installments du membre (db.installments filtrés, triés par sequence): label, dueDate (formatDateFR), montant (amountDueDH), InstallmentBadge, barre de progression amountPaidDH/amountDueDH. Bouton encaisser par ligne non soldée.
    - HISTORIQUE PAIEMENTS: db.payments du membre (triés paidAt desc): receiptNo, type, montant, méthode, date.
    Colonne droite:
    - ABONNEMENT (S.memberSubscription): plan (db.plans name), durée, dates début/fin, jours restants (daysBetween endDate now), statut.
    - CEINTURE & GRADE (si BJJ/kids): BeltPill (current), date dernière promotion, timeline des belts du membre (db.belts), bouton "Promouvoir" -> Modal (choix rank dans ADULT_BELTS/KIDS_BELTS selon catégorie, stripes 0-4, note) qui appelle promote().
    - PRÉSENCES: mini-stats (total, ce mois via S.memberAttendanceCount(db,id,30), streak attendanceStreak, dernière venue), + petite liste des dernières présences (S.memberAttendance).
    - RELANCE WhatsApp: <WhatsAppReminder member type="paiement" amount={solde} dueDate={prochaine échéance}/>.
    - Bloc RESPONSABLE (si guardianName) + certificat médical (medicalCertExpiry, alerte si < now).
    Soigne la hiérarchie, halos ember, cartes SectionCard.`,
  },
  {
    file: 'MemberWizard.tsx', comp: 'MemberWizard', title: 'Nouvelle inscription',
    spec: `Assistant d'inscription en 4 étapes avec un WizardStepper visuel (1 Identité, 2 Formule, 3 Facturation, 4 Encaissement). useState pour l'étape et les données.
    Étape 1 Identité: prénom, nom, genre (H/F), date de naissance (affiche l'âge calculé ageFrom), téléphone, contact d'urgence (nom+tel), si mineur (âge<18) champ "Responsable légal".
    Étape 2 Formule: 3 cartes plans (db.plans) sélectionnables, toggle durée 6 mois/1 an (prix price6mDH/price12mDH affichés en DH), sélection des disciplines (selon disciplineLimit du plan: 1, 2, ou toutes) parmi DISCIPLINE_LABELS (exclure 'women' si homme? non, autoriser).
    Étape 3 Facturation: récap (prix de base, "Frais d'inscription inclus" ou "2 mois offerts" si annuel), total à facturer en grand. Mode de paiement: comptant ou échelonné (2/3 fois) -> aperçu de l'échéancier (montants/dates calculés avec addMonths depuis now).
    Étape 4 Encaissement: 1er versement (montant, méthode PayMethod), bouton "Finaliser l'inscription" qui: addMember({...identité, disciplineIds, status:'actif'}) puis collectPayment({memberId, installmentId:null, amount, method, type:'inscription'}) puis navigate vers la fiche du nouveau membre.
    Boutons Précédent/Suivant. Calcul de prix réactif. Pas besoin de créer réellement Subscription/Installments en base (le store n'a pas d'action dédiée) — concentre-toi sur addMember + collectPayment + l'UX du calcul. Soigne l'aperçu.`,
  },
  {
    file: 'Attendance.tsx', comp: 'Attendance', title: 'PRÉSENCES & CHECK-IN',
    spec: `Page de pointage. KPIs: Présents aujourd'hui (S.presentsAujourdhui), Présence moyenne/cours, No-shows, Décrochés (S.membresDecroches length).
    Sélecteur de cours: liste des S.todayClasses(db) (cours du jour) en pastilles; à défaut, sélecteur jour (WEEK_DAYS) + cours db.classSessions de ce jour. Cours sélectionné par défaut = 1er du jour.
    GRILLE CHECK-IN: pour le cours sélectionné, afficher les membres dont disciplineIds inclut la discipline du cours (db.members status actif/gele). Gros boutons (Avatar + nom): cliquer = checkIn(member.id, classSession.id). Si déjà présent aujourd'hui (db.attendance same date+session+member) -> bouton vert "Présent ✓". Badge rouge d'alerte si solde dû (S.memberBalanceDH>0) ou abonnement expiré (S.memberSubscription endDate < now) ou certificat médical périmé.
    Compteur live X/Y présents + jauge capacité.
    Bloc "Affluence de la semaine": <Heatmap data={S.attendanceHeatmap(db)} />.
    Bloc "Membres décrochés (>21j)": liste S.membresDecroches avec WhatsAppReminder compact type="decrochage".
    Recherche rapide pour pointer un membre absent de la liste. Style "kiosque" agréable et tactile.`,
  },
  {
    file: 'Schedule.tsx', comp: 'Schedule', title: 'PLANNING',
    spec: `Planning hebdomadaire. KPIs: Cours/semaine (db.classSessions actifs), Heures de tatami/sem (somme endTime-startTime), Taux de remplissage moyen, Disciplines actives.
    GRILLE: colonnes = WEEK_DAYS (LUN..SAM), lignes = créneaux. Pour chaque jour, empiler les db.classSessions (triés par startTime) en blocs colorés par DISCIPLINE_COLORS: label, niveau, créneau (startTime-endTime), coach (db.coaches name via coachId), salle (room), capacité.
    Filtre par discipline (pastilles) et par coach.
    Vue "Charge des coachs": pour chaque coach actif, total heures/semaine (barre).
    Bouton "Publier vers le site" (cosmétique, toast/alert "Planning synchronisé avec la vitrine").
    Soigne la lisibilité de la grille (responsive: en colonnes empilées sur mobile).`,
  },
  {
    file: 'Payments.tsx', comp: 'Payments', title: 'PAIEMENTS & CAISSE',
    spec: `Caisse et transactions. Bandeau "Caisse du jour": encaissé aujourd'hui (S.encaisseAujourdhui) ventilé par méthode (S.encaisseParMethode). KPIs: Encaissé aujourd'hui, Encaissé ce mois (S.encaisseCeMois), Panier moyen (S.panierMoyen), % espèces.
    Bouton "Encaisser" (ouvre CollectPaymentModal — demande d'abord de choisir un membre via une petite recherche, ou ouvre sur le 1er membre en retard; tu peux gérer un memberId state).
    JOURNAL DES TRANSACTIONS via DataTable (db.payments triés paidAt desc): date+heure (formatDateFR + heure), membre (Avatar+nom, clic -> fiche), motif (type), montant DH (aligné droite), méthode (Pill), n° reçu (receiptNo mono).
    Donut répartition des méthodes (S.encaisseParMethode -> segments).
    Graphe CA mensuel: <BarChart data={S.caParMois(db,8).map(c=>({label:c.label,a:c.facture,b:c.encaisse}))} />.
    Bouton "Clôture de caisse" -> Modal récap du jour (total + par méthode) imprimable (window.print). Export CSV (cosmétique).`,
  },
  {
    file: 'DuesReminders.tsx', comp: 'DuesReminders', title: 'ÉCHÉANCES & RELANCES',
    spec: `Recouvrement. KPIs: Impayés totaux (S.impayesTotauxDH), Membres en retard (S.membresEnRetard length), Dette +30j (S.agingBuckets b30plus), Recouvrement % (S.tauxRecouvrement).
    Bloc AGING: <AgingBars buckets={S.agingBuckets(db)} /> + total.
    Onglets: "En retard" (S.openInstallments avec daysLate>0), "Dû bientôt" (installments en_attente dont dueDate dans 7j), "Tous impayés".
    LISTE PRIORISÉE (triée par daysLate desc): pour chaque installment ouvert -> membre (Avatar+nom, clic fiche), montant restant (remaining, DH), jours de retard (badge couleur selon aging), InstallmentBadge. Actions par ligne: bouton "Encaisser" (CollectPaymentModal avec installmentId + defaultAmount=remaining) ET WhatsAppReminder compact type="paiement" (amount=remaining, dueDate).
    "Top débiteurs": membres triés par S.memberBalanceDH desc (top 5) en barres.
    Soigne l'escalade visuelle (couleurs ambre->ember selon retard).`,
  },
  {
    file: 'Subscriptions.tsx', comp: 'Subscriptions', title: 'ABONNEMENTS & TARIFS',
    spec: `KPIs: Abonnements actifs (db.subscriptions status actif), MRR estimé (S.mrrEstime), Renouvellements <30j (S.expirantSous(db,30) length), Part Full Pack %.
    CARTES PLANS: les 3 db.plans en cartes (prix 6m/an en DH, classesPerWeek, featured = bordure ember), style proche de la vitrine.
    PIPELINE DE RENOUVELLEMENT: S.expirantSous(db,60) groupés (<=7j, <=30j, <=60j) -> listes avec membre, fin (formatDateFR), jours restants, bouton WhatsAppReminder type="expiration".
    TABLE ABONNEMENTS ACTIFS via DataTable (db.subscriptions non annulés): membre (clic fiche), plan, durée, début, fin, jours restants (daysBetween endDate now), montant totalDH, statut.
    Répartition par plan: barres horizontales (compte d'abonnements par planId) + Donut CA par plan (S.caParPlan).`,
  },
  {
    file: 'Belts.tsx', comp: 'Belts', title: 'GRADES & CEINTURES',
    spec: `Suivi des ceintures (signature arts martiaux). KPIs: Ceintures noires actives (db.belts noire & isCurrent), Promotions ce trimestre, Éligibles (heuristique), Pratiquants BJJ.
    PYRAMIDE/RÉPARTITION: pour les ceintures adultes BJJ (ADULT_BELTS), compter les membres dont la ceinture courante (db.belts isCurrent discipline 'bjj') = rang -> barres horizontales aux BELT_COLORS (blanche->noire), façon pyramide.
    TABLEAU "Pratiquants & ceintures": DataTable des membres ayant une ceinture courante (S.memberCurrentBelt): membre (clic fiche), discipline, BeltPill (rank+stripes), date dernière promotion (promotedAt), bouton "Promouvoir" -> Modal (rank parmi ADULT_BELTS si bjj/ KIDS_BELTS si kids, stripes 0-4, note) -> promote().
    CARTE COACH: Rachidi Zine (db.coaches Head Coach) — promotions délivrées (count belts promotedAt).
    Optionnel: section "Éligibles à la promotion" (membres avec assiduité élevée S.memberAttendanceCount> X et ancienneté). Couleurs officielles des ceintures partout.`,
  },
  {
    file: 'Analytics.tsx', comp: 'Analytics', title: 'STATISTIQUES & RÉTENTION',
    spec: `Business intelligence. KPIs: Churn mensuel %, Rétention estimée, LTV moyenne (S.memberLTV moyenne des membres), Croissance nette (nouveaux - partis).
    CROISSANCE: <BarChart data={S.caParMois(db,8).map(c=>({label:c.label,a:c.facture,b:c.encaisse}))} /> (réutilise CA comme proxy d'activité) OU une courbe d'effectif via Sparkline large.
    HEATMAP FRÉQUENTATION: <Heatmap data={S.attendanceHeatmap(db)} /> avec légende "heures creuses".
    CLASSEMENT DISCIPLINES: S.distributionByDiscipline -> barres horizontales (effectif) avec DISCIPLINE_COLORS, + CA par plan (S.caParPlan) en Donut.
    MEMBRES À RISQUE: liste des membres avec S.memberRisk(db,member)==='risque' (et 'tiede'): membre (clic fiche), motif (jours sans venue via daysBetween(now,lastAttendanceAt), solde, expiration proche), Pill de risque, WhatsAppReminder compact type="decrochage".
    INDICATEURS FINANCIERS: encaissé total, panier moyen (S.panierMoyen), MRR (S.mrrEstime), recouvrement (S.tauxRecouvrement) en StatCards. Soigne la densité "cockpit".`,
  },
  {
    file: 'Settings.tsx', comp: 'Settings', title: 'RÉGLAGES & DONNÉES',
    spec: `Réglages. KPIs/infos: Espace localStorage utilisé (dbSizeKB(db) + " Ko"), Nb d'enregistrements (recordCount(db)), Dernière sauvegarde (db.settings.lastBackupAt ou "—"), Version du seed (db.settings.seedVersion).
    IDENTITÉ SALLE (formulaire en lecture/édition légère, champs .field): nom, ville, adresse, téléphone, whatsapp, devise (DH, verrouillé/disabled). (Édition cosmétique via update... non requise; affiche les valeurs db.settings, champs editables locaux.)
    STAFF & COACHS: liste db.coaches (Avatar initiales, nom, rôle, disciplines, beltRank).
    BLOC "DONNÉES DÉMO" (important): boutons "Exporter le JSON" (exportJSON()), "Importer un JSON" (input file -> importJSON(file)), "Réinitialiser la démo" (resetDemo() avec Modal de confirmation). Bandeau explicatif "Mode démo — 100% local".
    Changement de code PIN (champ cosmétique). Soigne, rassurant et clair.`,
  },
]

phase('Pages')
const results = await parallel(PAGES.map((p) => () =>
  agent(
    `${CONTRACT}\n\n=== PAGE À CONSTRUIRE ===\nFichier (chemin ABSOLU pour Write): ${BASE}/${p.file}\nNom du composant (export default function ${p.comp}): ${p.comp}\nTitre affiché: ${p.title}\n\nSPÉCIFICATION:\n${p.spec}\n\nÉcris maintenant le fichier COMPLET et compilable avec Write. Vérifie qu'il n'y a aucun import inutilisé. Réponds uniquement par: "OK ${p.file}" + 1 phrase sur ce que tu as construit.`,
    { label: `page:${p.comp}`, phase: 'Pages' }
  )
))

return { built: PAGES.map((p, i) => ({ file: p.file, ok: !!results[i], summary: results[i] })) }
