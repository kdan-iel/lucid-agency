import { motion } from 'motion/react';
import Navbar from '../components/Navbar';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-[120px] md:text-[180px] font-black text-brand-mint/10 leading-none select-none">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 -mt-4">Page introuvable</h2>
          <p className="text-brand-gray text-lg mb-10 max-w-md mx-auto">
            Cette page n'existe pas ou a été déplacée.
          </p>
          <a
            href="/"
            className="inline-block bg-brand-mint text-[#0D1117] px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-brand-mint/20"
          >
            Retour à l'accueil
          </a>
        </motion.div>
      </main>
    </div>
  );
}
