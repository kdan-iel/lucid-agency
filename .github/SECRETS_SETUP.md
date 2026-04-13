# 🔑 Secrets GitHub à configurer

Aller dans : **GitHub → Settings → Secrets and variables → Actions**

## Secrets obligatoires

| Nom | Description | Où le trouver |
|-----|-------------|---------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme publique | Supabase → Settings → API |
| `VITE_APP_URL` | URL Vercel de production | ex: `https://lucid-agency-six.vercel.app` |
| `VERCEL_TOKEN` | Token Vercel | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | ID organisation Vercel | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | ID projet Vercel | Vercel → Project → Settings |

## Comment obtenir le VERCEL_TOKEN

1. Aller sur https://vercel.com/account/tokens
2. Cliquer **Create Token**
3. Nom : `github-actions-lucid`
4. Scope : `Full Account`
5. Copier le token → l'ajouter dans GitHub Secrets

## Comment obtenir VERCEL_ORG_ID et VERCEL_PROJECT_ID

```bash
# Dans le dossier du projet
npm i -g vercel
vercel link

# Les IDs apparaissent dans .vercel/project.json
cat .vercel/project.json
# {"orgId": "xxx", "projectId": "yyy"}
```

## ⚠️ Ne jamais mettre dans le code

- `service_role` key de Supabase (côté serveur uniquement)
- Mots de passe en clair
- Tokens privés
