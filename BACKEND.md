# Ultimate Fight Academy — Guide de bascule vers un backend réel

La démo actuelle est **100 % client-side** (localStorage). Tout le métier (modèle de données typé, sélecteurs, mutations) est déjà écrit et **prêt à brancher** sur un vrai backend. Ce document décrit exactement comment passer en production multi-appareil, avec authentification réelle, paiement en ligne marocain (CMI) et WhatsApp automatisé.

> Le live nécessite **tes comptes/clés** (Supabase, CMI, Meta WhatsApp). Cette base technique te permet de les brancher sans réécrire l'application.

---

## 1. Pourquoi Supabase (recommandé pour le Maroc)

- **Postgres managé** + API REST/Realtime auto-générée + **Auth** intégrée + Storage (vidéos techniques) + Edge Functions (webhooks CMI/WhatsApp).
- Plan gratuit généreux, hébergement EU (latence correcte depuis le Maroc), pas de carte requise pour démarrer.
- Alternative : **Firebase** (Firestore + Auth + Functions) si tu préfères le NoSQL temps réel.

## 2. Architecture cible

```
Vitrine + Admin (React)            Portail / App membre (React/Expo)
        │                                   │
        └──────────────┬────────────────────┘
                       │  @supabase/supabase-js
                ┌──────▼───────┐
                │   Supabase   │  Postgres + Auth + Realtime + Storage
                │  Edge Funcs  │  webhooks: CMI (paiement), WhatsApp Cloud API
                └──────┬───────┘
            ┌──────────┴──────────┐
        CMI (paiement)     Meta WhatsApp Business API
```

**Point clé** : la couche données de l'app est déjà isolée dans `src/admin/store/db.ts` (chargement/persistance) et `StoreProvider.tsx` (mutations). Il suffit de remplacer `loadDB/saveDB` par un **repository Supabase** (mêmes signatures) — les pages et sélecteurs ne changent pas.

## 3. Schéma SQL Postgres (dérivé des types actuels)

```sql
-- Énumérations
create type member_status as enum ('prospect','essai','actif','gele','expire','churn');
create type pay_method   as enum ('especes','virement','cheque','carte');
create type install_status as enum ('paye','partiel','en_attente','en_retard');

create table members (
  id uuid primary key default gen_random_uuid(),
  member_no text unique not null,
  first_name text not null, last_name text not null,
  gender text, birth_date date, age_category text,
  phone text, whatsapp text, email text, address text, city text default 'Kénitra',
  discipline_ids text[] default '{}',
  status member_status default 'actif',
  joined_at date, emergency_contact_name text, emergency_contact_phone text,
  guardian_name text, medical_cert_expiry date, waiver_signed boolean default false,
  acquisition_source text, tags text[] default '{}', internal_notes text,
  preferred_payment_method pay_method default 'especes',
  family_id uuid, last_attendance_at date, attendance_streak int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table membership_plans (
  id text primary key, name text, sub text, featured boolean,
  discipline_limit text, classes_per_week int,
  price_6m_dh int, price_12m_dh int, registration_fee_dh int, free_months_yearly int
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  plan_id text references membership_plans(id),
  duration text, discipline_ids text[],
  start_date date, end_date date,
  base_price_dh int, registration_fee_dh int, discount_label text, discount_dh int, total_dh int,
  status text, payment_mode text, installments_count int, created_at timestamptz default now()
);

create table installments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  sequence int, label text, due_date date,
  amount_due_dh int, amount_paid_dh int default 0, status install_status default 'en_attente'
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  subscription_id uuid, installment_id uuid,
  receipt_no text unique, type text, amount_dh int, method pay_method,
  status text default 'paye', paid_at timestamptz, cheque_ref text, note text
);

create table class_sessions (
  id uuid primary key default gen_random_uuid(),
  discipline_id text, label text, level text, variant text,
  day_of_week text, start_time text, end_time text,
  coach_id uuid, room text, capacity int, is_active boolean default true
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  class_session_id uuid, discipline_id text, date date, check_in_time text,
  method text, status text, flagged_expired_sub boolean, flagged_due_balance boolean, flagged_medical_expired boolean
);

create table techniques (
  id uuid primary key default gen_random_uuid(),
  discipline text, name text, category text, gi text, position text,
  is_custom boolean default false, created_at timestamptz default now()
);

create table session_instances (
  id text primary key, -- "classSessionId__date"
  class_session_id uuid, date date, discipline_id text, technique_ids text[], coach_id uuid, notes text
);

create table belts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  discipline text, belt_rank text, stripes int, is_current boolean,
  promoted_at date, promoted_by_coach_id uuid, note text
);

create table coaches (
  id uuid primary key default gen_random_uuid(),
  first_name text, last_name text, role text, discipline_ids text[], belt_rank text, phone text, instagram text, active boolean default true
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  first_name text, last_name text, phone text, source text, interested_discipline_ids text[],
  stage text, heat_score text, trial_date date, created_at timestamptz default now()
);

create table price_exceptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  label text, type text, value int, active boolean default true, created_at timestamptz default now()
);

create table families (
  id uuid primary key default gen_random_uuid(),
  name text, member_ids uuid[], primary_member_id uuid
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  type text, member_id uuid, timestamp timestamptz, summary_fr text, amount_dh int
);

create table gym_settings (
  id int primary key default 1,
  name text, city text, address text, phone text, whatsapp text, currency text default 'DH',
  receipt_footer_text text, ramadan_mode boolean default false, language text default 'fr'
);
```

## 4. Authentification & rôles (remplace le PIN démo)

- Supabase Auth : email/téléphone OTP pour le staff. Table `staff_roles(user_id, role)` avec `role in ('admin','coach','accueil')` — déjà modélisé côté UI (`ROLE_META`, `roleStore`).
- **RLS (Row Level Security)** : activer sur toutes les tables. Exemples :
  - `accueil`/`admin` : lecture/écriture membres, paiements, présences.
  - `coach` : lecture membres, écriture présences/promotions/techniques, **pas** d'accès argent.
  - Un **membre** ne lit que ses propres lignes (pour le portail) : `auth.uid() = member.user_id`.

## 5. Paiement en ligne — CMI (passerelle marocaine)

- CMI (Centre Monétique Interbancaire) est le standard carte au Maroc (vs Stripe peu adopté).
- Flux : bouton « Payer en ligne » → Edge Function crée une session CMI signée (clé marchande) → redirection page CMI → **webhook** de confirmation → insertion `payments` + mise à jour `installments`.
- Conserver le **cash en DH** comme méthode première (espèces/virement/chèque) : c'est un avantage du produit. CMI = option pour cotisations à distance, stages, compétitions.
- À surveiller : intégrations **mobile money** locales (ex. wallets) selon adoption.

## 6. WhatsApp — passer des liens `wa.me` à l'API

- Aujourd'hui : liens `wa.me` pré-remplis (zéro coût, manuel) — déjà en place.
- Demain : **WhatsApp Business Cloud API (Meta)** via une Edge Function :
  - Modèles approuvés (templates) pour : rappel d'échéance J-3, expiration d'abonnement, absence 21 j (win-back), félicitations de passage de grade, confirmation de réservation.
  - Séquences déclenchées par cron (Supabase scheduled functions) sur les sélecteurs existants (`openInstallments`, `membresDecroches`, `expirantSous`).
- SMS local en secours (fournisseur marocain) pour les numéros sans WhatsApp.

## 7. Portail / App membre

- La page **/admin/portail** est l'aperçu visuel de ce que verra le membre. Pour le livrer :
  - Web : route publique `/portail` avec login membre (OTP) ; ou app **Expo/React Native** Android-first (parc majoritairement Android, sensibilité data).
  - Contenu : présences, ceinture & progression curriculum, échéancier & solde, réservation de cours, signature de décharge, vidéothèque.

## 8. Étapes de migration (ordre conseillé)

1. Créer le projet Supabase, exécuter le schéma SQL ci-dessus, activer RLS.
2. Écrire `src/admin/store/supabaseRepo.ts` exposant les mêmes opérations que `db.ts` (load/save/CRUD) via `@supabase/supabase-js`. Brancher derrière une variable d'env `VITE_DATA_BACKEND=local|supabase`.
3. Migrer le seed → script d'import (les noms de champs passent en `snake_case`).
4. Auth staff + RLS + sélecteur de rôle déjà prêt côté UI.
5. Edge Function CMI + webhook → paiements en ligne.
6. Edge Function WhatsApp Cloud API + crons de relance.
7. Portail/app membre.

## 9. Estimation indicative

| Lot backend | Effort |
|---|---|
| Supabase + repo + migration données + auth/rôles | 1–2 semaines |
| Paiement en ligne CMI + webhooks | 1 semaine (dépend de l'onboarding CMI) |
| WhatsApp Business API + relances auto | 1 semaine (+ validation templates Meta) |
| Réservation de cours + liste d'attente | 1 semaine |
| Portail/app membre | 2–3 semaines |

---

*Cette base est conçue pour que la bascule soit un branchement, pas une réécriture : le modèle métier, les calculs financiers (DH, échéancier, aging, MRR), la rétention et le curriculum technique sont déjà implémentés et testés côté client.*
