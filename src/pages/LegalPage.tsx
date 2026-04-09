import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-3">Mentions légales</h1>
            <p className="text-brand-gray mb-12">Conformément aux dispositions légales en vigueur.</p>

            <div className="space-y-10 text-brand-gray leading-relaxed">

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">1. Éditeur du site</h2>
                <ul className="space-y-2">
                  <li><strong className="text-[var(--text-primary)]">Dénomination :</strong> LUCID Agency</li>
                  <li><strong className="text-[var(--text-primary)]">Activité :</strong> Agence de marketing digital et plateforme freelance</li>
                  <li><strong className="text-[var(--text-primary)]">Siège :</strong> Lomé, Togo</li>
                  <li><strong className="text-[var(--text-primary)]">Email :</strong> <a href="mailto:agencelucid@gmail.com" className="text-brand-mint hover:underline">agencelucid@gmail.com</a></li>
                  <li><strong className="text-[var(--text-primary)]">Téléphone :</strong> +228 90 00 00 00</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">2. Directeur de publication</h2>
                <p>Le directeur de la publication est le représentant légal de LUCID Agency.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">3. Hébergement</h2>
                <ul className="space-y-2">
                  <li><strong className="text-[var(--text-primary)]">Frontend :</strong> Vercel Inc., 340 Pine Street Suite 1821, San Francisco, CA 94104, USA — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-brand-mint hover:underline">vercel.com</a></li>
                  <li><strong className="text-[var(--text-primary)]">Base de données :</strong> Supabase Inc. — <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-brand-mint hover:underline">supabase.com</a></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">4. Propriété intellectuelle</h2>
                <p>L'ensemble du contenu de ce site (textes, images, logo, charte graphique) est la propriété exclusive de LUCID Agency et est protégé par les lois sur la propriété intellectuelle. Toute reproduction, même partielle, est strictement interdite sans autorisation écrite préalable.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">5. Responsabilité</h2>
                <p>LUCID Agency s'efforce d'assurer l'exactitude des informations publiées mais ne saurait être tenu responsable des erreurs, omissions ou résultats obtenus par un usage inadéquat de ces informations. Les liens vers des sites tiers sont fournis à titre informatif uniquement.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">6. Droit applicable</h2>
                <p>Le présent site est soumis au droit togolais. En cas de litige, les tribunaux compétents de Lomé (Togo) sont seuls compétents.</p>
              </section>

            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
