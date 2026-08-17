# 3FAPronostics — guide de mise en ligne

Ce dossier contient un vrai site (Next.js + Supabase) avec inscription par email/mot de passe, pronostics, classements et logos d'équipes. Voici comment le mettre en ligne, étape par étape. Compte ~30-40 minutes, tout est gratuit pour ce volume d'usage.

## Étape 1 — Créer le projet Supabase (base de données + comptes)

1. Va sur [supabase.com](https://supabase.com) et crée un compte gratuit.
2. Clique sur **New Project**. Choisis un nom (ex. `3fapronostics`), un mot de passe pour la base (note-le quelque part), une région proche (ex. `eu-west` / Paris ou Francfort).
3. Attends 1-2 minutes que le projet soit prêt.
4. Dans le menu de gauche, va dans **SQL Editor** → **New query**.
5. Ouvre le fichier `supabase/schema.sql` de ce dossier, copie tout son contenu, colle-le dans l'éditeur SQL de Supabase, puis clique **Run**.
   - Ça crée les tables (équipes, matchs, pronostics, profils), les règles de sécurité, et ajoute directement les 8 équipes de Ligue Élite avec leurs logos.
6. Dans le menu de gauche, va dans **Project Settings** (icône engrenage) → **API**.
   - Note le **Project URL** (ex. `https://xxxxx.supabase.co`)
   - Note la clé **anon public** (une longue chaîne commençant par `eyJ...`)
   - Tu en auras besoin à l'étape 3.

### Emails de confirmation
Par défaut, Supabase envoie automatiquement un email de confirmation à l'inscription (avec son propre service, gratuit mais limité à quelques emails/heure). Pour un usage entre amis, c'est largement suffisant. Si tu veux désactiver la confirmation par email (inscription immédiate) : **Authentication** → **Providers** → **Email** → décoche *Confirm email*.

## Étape 2 — Mettre le code sur GitHub

1. Crée un compte gratuit sur [github.com](https://github.com) si tu n'en as pas.
2. Clique sur **New repository**, nomme-le `3fapronostics`, laisse-le public ou privé (au choix), ne coche aucune case d'initialisation, puis **Create repository**.
3. Sur la page du repo vide, clique **uploading an existing file**, puis glisse-dépose tout le contenu de ce dossier (garde la structure des sous-dossiers `app/`, `components/`, `lib/`, `supabase/`).
4. Valide l'upload (**Commit changes**).

## Étape 3 — Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com), crée un compte gratuit en te connectant avec ton compte GitHub.
2. Clique **Add New** → **Project**, choisis le repo `3fapronostics`, clique **Import**.
3. Avant de déployer, ouvre **Environment Variables** et ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` → colle le Project URL noté à l'étape 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → colle la clé anon public notée à l'étape 1
4. Clique **Deploy**. Après 1-2 minutes, Vercel te donne une URL du type `3fapronostics.vercel.app` — c'est ton site, en ligne.

## Étape 4 — Tester

1. Ouvre l'URL Vercel, clique **Inscription**, crée un compte avec ton email.
2. Vérifie ta boîte mail (et les spams) pour le lien de confirmation.
3. Connecte-toi, va dans **Équipes** pour ajouter celles de D1/D2, puis crée des matchs dans **Pronostics**.

## Pour tester en local avant de déployer (optionnel)

Si tu as [Node.js](https://nodejs.org) installé sur ton ordinateur :

```bash
npm install
cp .env.local.example .env.local
# édite .env.local avec tes vraies valeurs Supabase
npm run dev
```

Puis ouvre `http://localhost:3000`.

## Si quelque chose ne marche pas

Colle-moi le message d'erreur exact (dans le terminal, ou dans la console du navigateur — clic droit > Inspecter > Console) et je corrige.
