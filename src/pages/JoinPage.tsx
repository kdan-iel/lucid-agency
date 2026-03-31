import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function JoinPage() {
  const { t } = useLanguage();

  return (
    <div className="bg-brand-darkest min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t('join.title')}</h1>
            <p className="text-brand-gray text-xl">{t('join.subtitle')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-brand-darkblue p-8 rounded-2xl border border-white/5">
                <p className="text-brand-gray text-sm leading-relaxed">
                  {t(`join.benefit${i}`)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-brand-darkblue p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">Prénom</label>
                  <input required type="text" className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">Email</label>
                  <input required type="email" className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">Spécialité</label>
                  <input required type="text" className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">Lien portfolio</label>
                  <input type="url" className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-gray ml-1">Message</label>
                <textarea rows={4} className="w-full bg-brand-anthracite border border-white/10 rounded-xl px-4 py-4 text-white focus:border-brand-mint outline-none resize-none" />
              </div>
              <button type="submit" className="w-full bg-brand-mint text-[#1A1A2E] py-5 rounded-xl font-bold text-lg hover:scale-[1.01] transition-all">
                {t('join.cta')}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
