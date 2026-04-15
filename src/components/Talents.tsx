import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../context/AuthContext';
import { Search, X } from 'lucide-react';

type SpecialtyKey =
  | 'graphisme'
  | 'video'
  | 'redaction'
  | 'webdev'
  | 'photo'
  | 'marketing'
  | 'autre';

interface PublicTalent {
  id: string;
  name: string;
  category: SpecialtyKey;
  expertise: string;
  skills: string[];
  initials: string;
  color: string;
  rate: string;
  bio: string;
  portfolioUrl: string | null;
}

const specialtyMeta: Record<
  SpecialtyKey,
  {
    labelFr: string;
    labelEn: string;
    color: string;
    fallbackSkillFr: string;
    fallbackSkillEn: string;
  }
> = {
  graphisme: {
    labelFr: 'Graphisme',
    labelEn: 'Design',
    color: '#00FFA3',
    fallbackSkillFr: 'Direction visuelle',
    fallbackSkillEn: 'Visual direction',
  },
  video: {
    labelFr: 'Video',
    labelEn: 'Video',
    color: '#FF6B6B',
    fallbackSkillFr: 'Production video',
    fallbackSkillEn: 'Video production',
  },
  redaction: {
    labelFr: 'Redaction',
    labelEn: 'Writing',
    color: '#A8E063',
    fallbackSkillFr: 'Redaction',
    fallbackSkillEn: 'Writing',
  },
  webdev: {
    labelFr: 'Webdev',
    labelEn: 'Webdev',
    color: '#6C63FF',
    fallbackSkillFr: 'Developpement web',
    fallbackSkillEn: 'Web development',
  },
  photo: {
    labelFr: 'Photo',
    labelEn: 'Photo',
    color: '#DDA0DD',
    fallbackSkillFr: 'Photographie',
    fallbackSkillEn: 'Photography',
  },
  marketing: {
    labelFr: 'Marketing',
    labelEn: 'Marketing',
    color: '#4ECDC4',
    fallbackSkillFr: 'Marketing digital',
    fallbackSkillEn: 'Digital marketing',
  },
  autre: {
    labelFr: 'Autre',
    labelEn: 'Other',
    color: '#FFB347',
    fallbackSkillFr: 'Expertise creative',
    fallbackSkillEn: 'Creative expertise',
  },
};

function toSpecialtyKey(value: string): SpecialtyKey {
  return value in specialtyMeta ? (value as SpecialtyKey) : 'autre';
}

function formatRate(ratePerHour: number | null) {
  if (!ratePerHour) return 'Tarif sur demande';

  const rounded = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(ratePerHour);

  return `${rounded} FCFA/h`;
}

function buildInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'LU';
}

function TalentAvatar({
  talent,
  size = 'card',
}: {
  talent: PublicTalent;
  size?: 'card' | 'modal';
}) {
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
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<'all' | SpecialtyKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedTalent, setSelectedTalent] = useState<PublicTalent | null>(null);
  const [talents, setTalents] = useState<PublicTalent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTalents = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('freelancers')
        .select('id, user_id, specialty, skills, rate_per_hour, bio, portfolio_url')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement talents publics:', error);
        setTalents([]);
        setLoading(false);
        return;
      }

      const userIds = (data ?? []).map((item: any) => item.user_id).filter(Boolean);

      let profilesByUserId = new Map<string, { first_name: string; last_name: string }>();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Erreur chargement profils publics:', profilesError);
        } else {
          profilesByUserId = new Map(
            (profilesData ?? []).map((profile: any) => [
              profile.user_id,
              { first_name: profile.first_name, last_name: profile.last_name },
            ])
          );
        }
      }

      const mapped = (data ?? []).map((item: any) => {
        const specialty = toSpecialtyKey(item.specialty ?? 'autre');
        const meta = specialtyMeta[specialty];
        const profile = profilesByUserId.get(item.user_id);
        const firstName = profile?.first_name?.trim() || 'Talent';
        const lastName = profile?.last_name?.trim() || 'LUCID';
        const fallbackSkill = lang === 'FR' ? meta.fallbackSkillFr : meta.fallbackSkillEn;
        const rawSkills = Array.isArray(item.skills) ? item.skills.filter(Boolean) : [];

        return {
          id: item.id,
          name: `${firstName} ${lastName}`.trim(),
          category: specialty,
          expertise: lang === 'FR' ? meta.labelFr : meta.labelEn,
          skills: rawSkills.length > 0 ? rawSkills.slice(0, 3) : [fallbackSkill],
          initials: buildInitials(firstName, lastName),
          color: meta.color,
          rate: formatRate(item.rate_per_hour ?? null),
          bio:
            item.bio?.trim() ||
            (lang === 'FR'
              ? 'Profil en cours de completion. Les details seront disponibles tres bientot.'
              : 'Profile is being completed. More details will be available very soon.'),
          portfolioUrl: item.portfolio_url ?? null,
        } satisfies PublicTalent;
      });

      setTalents(mapped);
      setLoading(false);
    };

    loadTalents();
  }, [lang]);

  const categories = useMemo(
    () => [
      { key: 'all' as const, label: t('talents.filter.all') },
      ...(Object.keys(specialtyMeta) as SpecialtyKey[]).map((key) => ({
        key,
        label: lang === 'FR' ? specialtyMeta[key].labelFr : specialtyMeta[key].labelEn,
      })),
    ],
    [lang, t]
  );

  const filteredTalents = useMemo(
    () =>
      talents.filter((talent) => {
        const matchesFilter = filter === 'all' || talent.category === filter;
        const q = searchQuery.trim().toLowerCase();

        if (!q) return matchesFilter;

        const matchesSearch =
          talent.expertise.toLowerCase().includes(q) ||
          talent.name.toLowerCase().includes(q) ||
          talent.bio.toLowerCase().includes(q) ||
          talent.skills.some((skill) => skill.toLowerCase().includes(q));

        return matchesFilter && matchesSearch;
      }),
    [filter, searchQuery, talents]
  );

  const displayedTalents = filteredTalents.slice(0, visibleCount);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setVisibleCount(6);
  }, []);

  const emptyCopy =
    lang === 'FR'
      ? {
          title: 'Les premiers talents verifies arrivent bientot.',
          body: "Nous ouvrons progressivement le collectif. Les profils affiches ici seront uniquement de vrais freelancers approuves par l'agence.",
          loading: 'Chargement des talents...',
          noResults: `Aucun talent trouve pour "${searchQuery}"`,
          reset: 'Reinitialiser la recherche',
          portfolio: 'Voir le portfolio',
          indicativeRate: 'Taux indicatif',
          reserve: "Reserver ce talent via l'Agence",
        }
      : {
          title: 'Our first verified talents are coming soon.',
          body: 'We are gradually opening the collective. Profiles shown here will only be real freelancers approved by the agency.',
          loading: 'Loading talents...',
          noResults: `No talent found for "${searchQuery}"`,
          reset: 'Reset search',
          portfolio: 'View portfolio',
          indicativeRate: 'Indicative rate',
          reserve: 'Book this talent via the Agency',
        };

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

        {loading ? (
          <div className="max-w-4xl mx-auto text-center py-20 text-brand-gray">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-mint mx-auto mb-6" />
            <p>{emptyCopy.loading}</p>
          </div>
        ) : talents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-10 md:p-14 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-mint/10 text-brand-mint flex items-center justify-center mx-auto mb-6 text-3xl font-black">
              LU
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
              {emptyCopy.title}
            </h3>
            <p className="text-brand-gray leading-relaxed max-w-2xl mx-auto mb-8">
              {emptyCopy.body}
            </p>
            <a
              href="/join"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-brand-mint text-brand-mint font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all"
            >
              {lang === 'FR' ? 'Rejoindre le collectif' : 'Join the collective'}
            </a>
          </motion.div>
        ) : (
          <>
            <div className="max-w-4xl mx-auto mb-16 space-y-6">
              <div className="relative group">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gray group-focus-within:text-brand-mint transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={
                    lang === 'FR'
                      ? 'Rechercher un talent, une expertise...'
                      : 'Search a talent or specialty...'
                  }
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <AnimatePresence mode="popLayout">
                {displayedTalents.length > 0 ? (
                  displayedTalents.map((talent, i) => (
                    <motion.div
                      key={talent.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden border border-[var(--border-color)] hover:shadow-2xl hover:shadow-brand-mint/5 hover:border-brand-mint/20 transition-all duration-300"
                    >
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
                        <p className="text-brand-gray text-sm mb-4">
                          {talent.bio.length > 80 ? `${talent.bio.slice(0, 80)}...` : talent.bio}
                        </p>

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
                            {lang === 'FR' ? 'Voir le profil' : 'View profile'}
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
                    className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-brand-gray"
                  >
                    <Search size={40} className="mx-auto mb-4 opacity-30" />
                    <p>{emptyCopy.noResults}</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilter('all');
                      }}
                      className="mt-4 text-brand-mint font-bold hover:underline text-sm"
                    >
                      {emptyCopy.reset}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {visibleCount < filteredTalents.length && (
              <div className="text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-10 py-4 border border-brand-mint text-brand-mint rounded-full text-lg font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all"
                >
                  {t('talents.more')} ({filteredTalents.length - visibleCount}{' '}
                  {lang === 'FR' ? 'restants' : 'remaining'})
                </button>
              </div>
            )}
          </>
        )}
      </div>

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

              <div className="flex items-center gap-5 mb-6">
                <TalentAvatar talent={selectedTalent} size="modal" />
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    {selectedTalent.name}
                  </h2>
                  <p className="font-medium" style={{ color: selectedTalent.color }}>
                    {selectedTalent.expertise}
                  </p>
                </div>
              </div>

              <p className="text-brand-gray leading-relaxed mb-6">{selectedTalent.bio}</p>

              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-3">
                  {lang === 'FR' ? 'Competences' : 'Skills'}
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

              <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-mint/5 border border-brand-mint/20 mb-4">
                <span className="text-sm text-brand-gray font-medium">
                  {emptyCopy.indicativeRate}
                </span>
                <span className="font-bold text-brand-mint">{selectedTalent.rate}</span>
              </div>

              {selectedTalent.portfolioUrl && (
                <a
                  href={selectedTalent.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center border border-[var(--border-color)] text-brand-gray py-3 rounded-2xl font-bold mb-4 hover:border-brand-mint hover:text-brand-mint transition-all"
                >
                  {emptyCopy.portfolio}
                </a>
              )}

              <a
                href="#contact"
                onClick={() => setSelectedTalent(null)}
                className="block w-full text-center bg-brand-mint text-[#0D1117] py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-mint/20"
              >
                {emptyCopy.reserve}
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
