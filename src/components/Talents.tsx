import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const talents = [
  { name: 'Thomas', category: 'Branding', expertise: 'Directeur Artistique', skills: ['Branding Minimaliste', 'UI Design', 'Motion'] },
  { name: 'Amina', category: 'Web', expertise: 'Stratège Social Media', skills: ['Growth', 'Content Strategy', 'Ads'] },
  { name: 'Kwame', category: 'Video', expertise: 'Motion Designer', skills: ['3D Animation', 'VFX', 'Storyboarding'] },
  { name: 'Sofia', category: 'Web', expertise: 'Dev No-Code', skills: ['Webflow', 'Bubble', 'Automation'] },
  { name: 'Léo', category: 'Photo', expertise: 'SEO & Data', skills: ['Audit Technique', 'Analytics', 'Ranking'] },
  { name: 'Yasmine', category: 'Branding', expertise: 'Copywriter', skills: ['Storytelling', 'UX Writing', 'Conversion'] },
  { name: 'Marc', category: 'Video', expertise: 'Réalisateur', skills: ['Publicité', 'Documentaire', 'Montage'] },
  { name: 'Elena', category: 'Photo', expertise: 'Photographe', skills: ['Mode', 'Produit', 'Retouche'] },
  { name: 'Lucas', category: 'Branding', expertise: 'Brand Designer', skills: ['Logotype', 'Typographie', 'Identité'] },
  { name: 'Sarah', category: 'Web', expertise: 'UX Designer', skills: ['User Research', 'Prototypage', 'Figma'] },
  { name: 'David', category: 'Video', expertise: 'VFX Artist', skills: ['Compositing', '3D', 'Effets Spéciaux'] },
  { name: 'Chloé', category: 'Photo', expertise: 'Directrice Photo', skills: ['Lumière', 'Portrait', 'Direction Artistique'] },
];

export default function Talents() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(6);

  const categories = ['All', 'Branding', 'Video', 'Web', 'Photo'];

  const filteredTalents = talents.filter(talent => 
    filter === 'All' || talent.category === filter
  );

  const displayedTalents = filteredTalents.slice(0, visibleCount);

  return (
    <section id="talents" className="py-24 bg-brand-anthracite">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-12 text-center text-[var(--text-primary)]">
          {t('talents.title')}
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilter(cat);
                setVisibleCount(6);
              }}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                filter === cat 
                  ? 'bg-brand-mint text-[#0D1117]' 
                  : 'border border-[var(--border-color)] text-[var(--text-primary)] hover:border-brand-mint'
              }`}
            >
              {cat === 'All' ? t('talents.filters.all') : t(`talents.filters.${cat.toLowerCase()}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <AnimatePresence mode="popLayout">
            {displayedTalents.map((talent, i) => (
              <motion.div
                key={talent.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden border border-[var(--border-color)] hover:shadow-2xl hover:shadow-brand-mint/5 transition-all"
              >
                <div className="aspect-[4/5] relative bg-brand-anthracite overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/${talent.name}/800/1000?grayscale`}
                    alt={talent.name}
                    className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-brand-mint text-[#0D1117] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {talent.expertise}
                  </div>
                </div>
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">{talent.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {talent.skills.map(skill => (
                      <span key={skill} className="text-[10px] font-semibold text-brand-gray border border-[var(--border-color)] px-2 py-1 rounded uppercase">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <a
                    href="#contact"
                    className="block w-full text-center py-3 border border-brand-mint text-brand-mint rounded-lg text-sm font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all"
                  >
                    {t('talents.cta')}
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {visibleCount < filteredTalents.length && (
          <div className="text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 6)}
              className="px-10 py-4 border border-brand-mint text-brand-mint rounded-full text-lg font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all"
            >
              {t('talents.viewMore')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
