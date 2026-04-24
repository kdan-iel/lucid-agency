# System Audit And Fixes

## 1. Problèmes identifiés

### Blocages UI et états incohérents

- Plusieurs écrans couplaient le statut métier et le loading dans une seule variable (`ContactForm`, `JoinPage`, `CompleteProfilePage`), ce qui laissait un risque de spinner infini si la promesse distante ne revenait jamais.
- `ContactForm` gardait `rateLimitWait > 0` sans décrément, ce qui pouvait bloquer le bouton durablement jusqu’au refresh.
- Des `setTimeout` étaient laissés sans cleanup dans plusieurs vues critiques, avec risque de `setState` après unmount ou de redirections tardives.
- `ProtectedRoute` déclenchait une redirection pendant le render React, provoquant un effet secondaire non déterministe au re-render.

### Appels backend non fiables

- Les Edge Functions n’avaient pas de timeout global.
- Les pages `JoinPage` et `CompleteProfilePage` contournaient `remoteFunctions.ts` avec des appels directs, donc sans stratégie unifiée de logs, timeout et validation.
- `supabaseClient.ts` tolérait des valeurs d’environnement absentes via des placeholders et exposait des logs de configuration sensibles.
- `googleDriveSubmit.ts` ne validait pas uniformément les payloads ni les timeouts.

### Erreurs silencieuses et faible observabilité

- Plusieurs `catch` affichaient seulement un message générique ou avalaient le détail utile.
- Les handlers async React (`logout`, soumissions, update password/profile) pouvaient rejeter sans journalisation exploitable.
- Les opérations auth n’étaient pas protégées contre les réponses lentes ou obsolètes.

### Bugs de logique métier

- `DashboardPage` validait le mot de passe lors de la sauvegarde du profil, ce qui pouvait bloquer une simple mise à jour de profil.
- `AuthContext` pouvait appliquer un profil obsolète après changement de session si plusieurs requêtes revenaient dans le désordre.

### Audit structurel

- Vérification des imports effectuée sur l’ensemble de `src/`.
- Aucune dépendance circulaire évidente n’a été détectée dans le graphe d’imports courant.

## 2. Corrections appliquées

### Centralisation async / backend

Fichiers principaux :

- `src/utils/asyncTools.ts`
- `src/utils/env.ts`
- `src/utils/remoteFunctions.ts`
- `src/lib/supabaseClient.ts`
- `src/utils/googleDriveSubmit.ts`

Changements :

- Ajout d’un wrapper async central avec timeout global, logs `start/success/failure`, normalisation d’erreur et métriques de durée.
- Validation et nettoyage systématique des payloads avant envoi (`undefined`, fonctions, objets non sérialisables).
- Centralisation des appels Edge Functions via `invokeRemoteFunction`.
- Ajout d’un wrapper dédié pour `complete-profile`.
- Validation stricte des variables `import.meta.env` avec erreur explicite si `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` manquent.
- Suppression des logs de secrets et des fallbacks silencieux côté Supabase client.

### Fiabilisation des états React

Fichiers principaux :

- `src/components/ContactForm.tsx`
- `src/pages/JoinPage.tsx`
- `src/pages/CompleteProfilePage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/AdminPage.tsx`

Changements :

- Découplage du loading technique (`isSubmitting`) du statut métier (`success/error`) sur les formulaires critiques.
- Passage des resets de loading dans des blocs `finally`.
- Cleanup centralisé des timers via `src/hooks/useTimeoutRegistry.ts`.
- Décrément du cooldown de rate-limit dans `ContactForm`.
- Messages d’erreur exploitables et logs explicites sur chaque soumission critique.
- Désactivation des actions concurrentes sensibles pendant mise à jour (`AdminPage`).
- Correction du faux contrôle de mot de passe dans la sauvegarde de profil (`DashboardPage`).

### Auth et navigation

Fichiers principaux :

- `src/context/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/hooks/useSessionTimeout.ts`
- `src/App.tsx`
- `src/components/Navbar.tsx`

Changements :

- Ajout de garde-fous timeout sur `getSession`, `signIn`, `signOut`, `resetPassword`, `updatePassword`, `updateProfile`.
- Protection contre les réponses de profil obsolètes avec compteur de requête.
- Redirections déplacées hors du render React dans `ProtectedRoute`.
- Réduction des listeners recréés inutilement dans `App.tsx`.
- Suppression des rejets async non gérés sur les handlers `logout`.

### Robustesse de chargement

Fichiers principaux :

- `src/components/Talents.tsx`
- `src/components/Toast.tsx`

Changements :

- Annulation logique des updates d’état après démontage dans `Talents`.
- Gestion propre des timers de toast pour éviter les effets retardés orphelins.

## 3. Améliorations structurelles

- Création d’un socle réutilisable pour les opérations critiques :
  - `runWithAsyncGuard`
  - `ensureSerializablePayload`
  - validation d’env centralisée
  - registre de timers réutilisable
- Réduction des points d’entrée backend hétérogènes.
- Standardisation des logs et des erreurs sur frontend + appels backend.
- Uniformisation des transitions `idle -> loading -> success/error` sur les vues sensibles.

## 4. Risques éliminés

- Loading infini dû à une promesse distante pendante sur les soumissions critiques.
- Bouton contact bloqué durablement par un cooldown jamais décrémenté.
- Redirections déclenchées pendant le render.
- Rejets async non gérés sur les actions de logout.
- Placeholders Supabase silencieux en production.
- Payloads invalides envoyés aux Edge Functions.
- Écrasement de profil par une réponse auth obsolète.
- Blocage d’une sauvegarde de profil à cause d’une validation de mot de passe hors sujet.

## 5. Recommandations

- Faire passer tout nouvel appel réseau par `runWithAsyncGuard` ou `invokeRemoteFunction`.
- Séparer systématiquement `isLoading` du statut métier affiché à l’utilisateur.
- Ajouter un `finally` sur toute mutation de state liée à une opération async.
- Nettoyer tout timer créé dans un composant via `useTimeoutRegistry`.
- Éviter les redirections et side effects dans le render React.
- Refuser les fallbacks silencieux sur les variables d’environnement critiques.
- Conserver les logs structurés par opération pour accélérer le diagnostic production.

## Validation effectuée

- `npm run type-check` ✅
- `npm run test:ci` ✅

## Fichiers principaux modifiés par cette intervention

- `src/utils/asyncTools.ts`
- `src/utils/env.ts`
- `src/hooks/useTimeoutRegistry.ts`
- `src/utils/remoteFunctions.ts`
- `src/lib/supabaseClient.ts`
- `src/context/AuthContext.tsx`
- `src/components/ContactForm.tsx`
- `src/pages/JoinPage.tsx`
- `src/pages/CompleteProfilePage.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/hooks/useSessionTimeout.ts`
- `src/components/Talents.tsx`
- `src/components/Toast.tsx`
- `src/App.tsx`
- `src/utils/googleDriveSubmit.ts`
- `src/__tests__/utils/asyncTools.test.ts`
- `src/__tests__/pages/CompleteProfilePage.test.tsx`
- `.env.example`
