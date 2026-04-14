import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Search, X } from 'lucide-react';

const talents = [
  {
    name: 'Thomas K.',
    category: 'Branding',
    expertise: 'Directeur Artistique',
    skills: ['Branding Minimaliste', 'UI Design', 'Motion'],
    initials: 'TK',
    color: '#00FFA3',
    rate: '85 000 FCFA/j',
    bio: "Directeur artistique avec 7 ans d'expérience. Spécialisé dans les identités visuelles premium pour startups et PME africaines.",
  },
  {
    name: 'Amina L.',
    category: 'Web',
    expertise: 'Stratège Social Media',
    skills: ['Growth', 'Content Strategy', 'Ads'],
    initials: 'AL',
    color: '#6C63FF',
    rate: '65 000 FCFA/j',
    bio: 'Experte en croissance digitale. A piloté des campagnes pour 40+ marques avec un ROI moyen de 3x.',
  },
  {
    name: 'Kwame O.',
    category: 'Video',
    expertise: 'Motion Designer',
    skills: ['3D Animation', 'VFX', 'Storyboarding'],
    initials: 'KO',
    color: '#FF6B6B',
    rate: '90 000 FCFA/j',
    bio: 'Motion designer primé. Crée des vidéos qui captivent et convertissent pour les réseaux sociaux et la publicité.',
  },
  {
    name: 'Sofia M.',
    category: 'Web',
    expertise: 'Dev No-Code',
    skills: ['Webflow', 'Bubble', 'Automation'],
    initials: 'SM',
    color: '#FFB347',
    rate: '70 000 FCFA/j',
    bio: 'Développeuse no-code certifiée Webflow. Livre des sites performants en 2x moins de temps.',
  },
  {
    name: 'Léo B.',
    category: 'Photo',
    expertise: 'SEO & Data',
    skills: ['Audit Technique', 'Analytics', 'Ranking'],
    initials: 'LB',
    color: '#4ECDC4',
    rate: '75 000 FCFA/j',
    bio: 'Expert SEO avec un track record de +150% de trafic organique sur ses projets en 6 mois.',
  },
  {
    name: 'Yasmine D.',
    category: 'Branding',
    expertise: 'Copywriter',
    skills: ['Storytelling', 'UX Writing', 'Conversion'],
    initials: 'YD',
    color: '#A8E063',
    rate: '60 000 FCFA/j',
    bio: 'Copywriter spécialisée en conversion. Ses textes ont généré +200% de leads pour ses clients.',
  },
  {
    name: 'Marc F.',
    category: 'Video',
    expertise: 'Réalisateur',
    skills: ['Publicité', 'Documentaire', 'Montage'],
    initials: 'MF',
    color: '#FF8C94',
    rate: '95 000 FCFA/j',
    bio: "Réalisateur publicitaire avec 10 ans d'expérience. A travaillé pour des marques internationales.",
  },
  {
    name: 'Elena R.',
    category: 'Photo',
    expertise: 'Photographe',
    skills: ['Mode', 'Produit', 'Retouche'],
    initials: 'ER',
    color: '#C3B1E1',
    rate: '55 000 FCFA/j',
    bio: 'Photographe créative spécialisée produit et mode. Son travail a été publié dans plusieurs magazines.',
  },
  {
    name: 'Lucas P.',
    category: 'Branding',
    expertise: 'Brand Designer',
    skills: ['Logotype', 'Typographie', 'Identité'],
    initials: 'LP',
    color: '#00D2FF',
    rate: '80 000 FCFA/j',
    bio: 'Brand designer avec une approche data-driven. Crée des identités visuelles mémorables et cohérentes.',
  },
  {
    name: 'Sarah T.',
    category: 'Web',
    expertise: 'UX Designer',
    skills: ['User Research', 'Prototypage', 'Figma'],
    initials: 'ST',
    color: '#FFA07A',
    rate: '72 000 FCFA/j',
    bio: 'UX designer centrée utilisateur. Améliore les taux de conversion grâce à des interfaces intuitives.',
  },
  {
    name: 'David N.',
    category: 'Video',
    expertise: 'VFX Artist',
    skills: ['Compositing', '3D', 'Effets Spéciaux'],
    initials: 'DN',
    color: '#98FB98',
    rate: '#88000 FCFA/j',
    bio: 'Artiste VFX passionné. Crée des effets visuels spectaculaires pour la publicité et le cinéma.',
  },
  {
    name: 'Chloé A.',
    category: 'Photo',
    expertise: 'Directrice Photo',
    skills: ['Lumière', 'Portrait', 'Direction Artistique'],
    initials: 'CA',
    color: '#DDA0DD',
    rate: '85 000 FCFA/j',
    bio: 'Directrice photo avec un œil artistique unique. Transforme chaque projet en œuvre visuelle forte.',
  },
];

type Talent = (typeof talents)[0];

// ✅ Avatar SVG généré — plus besoin de vraies photos
function TalentAvatar({ talent, size = 'card' }: { talent: Talent; size?: 'card' | 'modal' }) {
  const dim = size === 'modal' ? 96 : 64;
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-[#0D1117] flex-shrink-0"
      style={{
        width: dim,
        height: dim,
        background: `linear-gradient(135deg, ${talent.color}, ${talent.color}99)`,
        fontSize: size === 'modal' ? 28 : 18,
        boxShadow: `0 0 24px ${talent.color}40`,
      }}
    >
      {talent.initials}
    </div>
  );
}

export default function Talents() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);

  const categories = [
    { key: 'All', label: t('talents.filter.all') },
    { key: 'Branding', label: t('talents.filter.branding') },
    { key: 'Video', label: t('talents.filter.video') },
    { key: 'Web', label: t('talents.filter.web') },
    { key: 'Photo', label: t('talents.filter.photo') },
  ];

  const filteredTalents = talents.filter((talent) => {
    const matchesFilter = filter === 'All' || talent.category === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      talent.category.toLowerCase().includes(q) ||
      talent.expertise.toLowerCase().includes(q) ||
      talent.name.toLowerCase().includes(q) ||
      talent.skills.some((s) => s.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const displayedTalents = filteredTalents.slice(0, visibleCount);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(6);
  }, []);

  return (
    <section id="talents" className="py-24 bg-brand-anthracite">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold tracking-tight mb-12 text-center text-[var(--text-primary)]"
        >
          {t('talents.title')}
        </motion.h2>

        {/* Search & Filters */}
        <div className="max-w-4xl mx-auto mb-16 space-y-6">
          <div className="relative group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gray group-focus-within:text-brand-mint transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher un talent, une expertise..."
              value={searchQuery}
              onChange={handleSearch}
              maxLength={100}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full py-4 pl-16 pr-8 text-[var(--text-primary)] focus:outline-none focus:border-brand-mint transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setVisibleCount(6);
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-mint transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setVisibleCount(6);
                }}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${filter === key ? 'bg-brand-mint text-[#0D1117]' : 'border border-[var(--border-color)] text-[var(--text-primary)] hover:border-brand-mint hover:text-brand-mint'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille talents */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <AnimatePresence mode="popLayout">
            {displayedTalents.length > 0 ? (
              displayedTalents.map((talent, i) => (
                <motion.div
                  key={talent.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden border border-[var(--border-color)] hover:shadow-2xl hover:shadow-brand-mint/5 hover:border-brand-mint/20 transition-all duration-300"
                >
                  {/* Header coloré avec avatar */}
                  <div
                    className="h-32 relative flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${talent.color}15, ${talent.color}05)`,
                    }}
                  >
                    <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
                      {talent.expertise}
                    </div>
                    <TalentAvatar talent={talent} />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1 text-[var(--text-primary)]">
                      {talent.name}
                    </h3>
                    <p className="text-brand-gray text-sm mb-4">{talent.bio.slice(0, 80)}...</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {talent.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold text-brand-gray border border-[var(--border-color)] px-2 py-1 rounded uppercase"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedTalent(talent)}
                        className="flex-grow text-center py-2.5 border border-[var(--border-color)] text-brand-gray rounded-lg text-sm font-bold hover:border-brand-mint hover:text-brand-mint transition-all"
                      >
                        Voir le profil
                      </button>
                      <a
                        href="#contact"
                        className="flex-grow text-center py-2.5 border border-brand-mint text-brand-mint rounded-lg text-sm font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all"
                      >
                        {t('talents.cta')}
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-3 text-center py-20 text-brand-gray"
              >
                <Search size={40} className="mx-auto mb-4 opacity-30" />
                <p>Aucun talent trouvé pour "{searchQuery}"</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('All');
                  }}
                  className="mt-4 text-brand-mint font-bold hover:underline text-sm"
                >
                  Réinitialiser la recherche
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voir plus */}
        {visibleCount < filteredTalents.length && (
          <div className="text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="px-10 py-4 border border-brand-mint text-brand-mint rounded-full text-lg font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all"
            >
              {t('talents.more')} ({filteredTalents.length - visibleCount} restants)
            </button>
          </div>
        )}
      </div>

      {/* ✅ Modal détail talent */}
      <AnimatePresence>
        {selectedTalent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTalent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8 shadow-2xl"
            >
              <button
                onClick={() => setSelectedTalent(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-brand-gray transition-colors"
              >
                <X size={20} />
              </button>

              {/* En-tête talent */}
              <div className="flex items-center gap-5 mb-6">
                <TalentAvatar talent={selectedTalent} size="modal" />
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedTalent.name}
                  </h2>
                  <p className="font-medium" style={{ color: selectedTalent.color }}>
                    {selectedTalent.expertise}
                  </p>
                  <span className="text-xs text-brand-gray bg-white/5 px-2 py-1 rounded-full border border-[var(--border-color)] mt-1 inline-block">
                    {selectedTalent.category}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-brand-gray leading-relaxed mb-6">{selectedTalent.bio}</p>

              {/* Compétences */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-3">
                  Compétences
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTalent.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-bold px-3 py-1.5 rounded-full border"
                      style={{
                        color: selectedTalent.color,
                        borderColor: `${selectedTalent.color}40`,
                        background: `${selectedTalent.color}10`,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Taux */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-mint/5 border border-brand-mint/20 mb-8">
                <span className="text-sm text-brand-gray font-medium">
                  Taux journalier indicatif
                </span>
                <span className="font-bold text-brand-mint">{selectedTalent.rate}</span>
              </div>

              {/* CTA */}
              <a
                href="#contact"
                onClick={() => setSelectedTalent(null)}
                className="block w-full text-center bg-brand-mint text-[#0D1117] py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-mint/20"
              >
                Réserver {selectedTalent.name.split(' ')[0]} via l'Agence
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
