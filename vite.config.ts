import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    // ✅ En dev, bloquer les requêtes vers des hôtes inconnus
    host: false,
  },

  build: {
    // ✅ Supprimer les console.log en production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        // ✅ Supprimer le code mort
        dead_code: true,
      },
    },
    // ✅ Séparer les chunks pour optimiser le cache
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['motion'],
        },
      },
    },
    // ✅ Avertir si un chunk dépasse 500kb
    chunkSizeWarningLimit: 500,
    // ✅ Source maps désactivées en production (ne pas exposer le code source)
    sourcemap: mode !== 'production',
  },
}));
