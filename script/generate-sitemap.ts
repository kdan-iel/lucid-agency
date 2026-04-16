/**
 * generate-sitemap.ts
 * Script de génération automatique du sitemap.xml
 * À exécuter via : npx ts-node scripts/generate-sitemap.ts
 * Ou intégrer dans le build Vite via vite.config.ts (voir bas de fichier)
 */

import * as fs from "fs";
import * as path from "path";

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = "https://lucidagence.com";
const OUTPUT_PATH = path.resolve("public/sitemap.xml");
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// ─── Définition des routes publiques ──────────────────────────────────────────

interface SitemapRoute {
  path: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  lastmod?: string;
}

const PUBLIC_ROUTES: SitemapRoute[] = [
  {
    path: "/",
    changefreq: "weekly",
    priority: 1.0,
    lastmod: TODAY,
  },
  {
    path: "/join",
    changefreq: "monthly",
    priority: 0.8,
    lastmod: TODAY,
  },
  {
    path: "/privacy",
    changefreq: "yearly",
    priority: 0.3,
    lastmod: TODAY,
  },
  {
    path: "/legal",
    changefreq: "yearly",
    priority: 0.3,
    lastmod: TODAY,
  },
  // Ajouter ici toute nouvelle route publique
];

// Routes privées/exclues (documentation uniquement, non utilisées dans la génération)
const _PRIVATE_ROUTES = [
  "/dashboard",
  "/admin",
  "/admin/login",
  "/login",
  "/reset-password",
];

// ─── Génération du XML ────────────────────────────────────────────────────────

function generateSitemapXml(routes: SitemapRoute[]): string {
  const urls = routes
    .map(
      (route) => `
  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${route.lastmod ?? TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>`;
}

// ─── Écriture du fichier ──────────────────────────────────────────────────────

function writeSitemap(): void {
  const xml = generateSitemapXml(PUBLIC_ROUTES);

  // S'assurer que le dossier public/ existe
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(`✅ sitemap.xml généré → ${OUTPUT_PATH}`);
  console.log(`   ${PUBLIC_ROUTES.length} URL(s) indexée(s)`);
}

writeSitemap();

// ─── Intégration Vite (plugin) ────────────────────────────────────────────────
//
// Dans vite.config.ts, ajouter le plugin suivant pour régénérer
// le sitemap automatiquement à chaque build de production :
//
// import { defineConfig } from 'vite'
//
// function sitemapPlugin() {
//   return {
//     name: 'generate-sitemap',
//     closeBundle() {
//       // Exécuter le script après le build
//       import('./scripts/generate-sitemap')
//     }
//   }
// }
//
// export default defineConfig({
//   plugins: [
//     react(),
//     sitemapPlugin(),   // <── ajouter ici
//   ],
// })
