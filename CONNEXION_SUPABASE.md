# 🔧 Guide de connexion Supabase

## Étape 1 — Créer votre projet Supabase
1. Allez sur https://supabase.com
2. Cliquez "New project"
3. Nom : `lucid-agency`, choisissez une région proche

## Étape 2 — Créer les tables
1. Dans Supabase → **SQL Editor** → **New query**
2. Copiez le contenu de `supabase/migrations/001_schema.sql`
3. Cliquez **Run**

## Étape 3 — Configurer les variables d'environnement
1. Créez un fichier `.env.local` à la racine :
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
VITE_APP_URL=https://votre-domaine.com
```
2. Ces valeurs se trouvent dans Supabase → **Settings → API**

## Étape 4 — Créer le compte Admin
1. Dans Supabase → **Authentication → Users** → **Add user**
2. Email : `admin@lucid-agency.com`, mot de passe fort
3. Copiez l'UUID de l'utilisateur créé
4. Dans **SQL Editor**, exécutez :
```sql
INSERT INTO profiles (user_id, email, first_name, last_name, role)
VALUES ('VOTRE_UUID', 'admin@lucid-agency.com', 'Admin', 'LUCID', 'admin');
```

## Étape 5 — Configurer Vercel
Dans votre dashboard Vercel → **Settings → Environment Variables** :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

## Réinitialisation du mot de passe

Dans **Supabase > Authentication > URL Configuration**, ajoutez cette URL de redirection :

- `https://votre-domaine.com/update-password`

Le front utilise ensuite `supabase.auth.resetPasswordForEmail(..., { redirectTo })` avec cette URL.

## Étape 6 — Lancer en local
```bash
npm install
npm run dev
```
