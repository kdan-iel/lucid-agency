import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'FR' | 'EN';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  FR: {
    'nav.method': 'Méthode',
    'nav.talents': 'Talents',
    'nav.offers': 'Offres',
    'nav.contact': 'Contact',
    'nav.cta': 'Démarrer un projet',
    'hero.title1': 'Marketing Digital :',
    'hero.title2': 'Passez de l\'ombre à la lumière.',
    'hero.subtitle': 'L\'agence qui combine l\'agilité des meilleurs créatifs freelances à la rigueur d\'une stratégie Data-Driven.',
    'hero.cta.primary': 'Démarrer un projet',
    'hero.cta.secondary': 'Voir nos talents',
    'vision.title': 'Soyez LUCID sur votre stratégie.',
    'vision.body': 'Le marché est bruyant. Pour vous faire entendre, vous n\'avez pas besoin de crier plus fort — vous avez besoin de voir plus clair. Chez LUCID, nous ne vendons pas du \'joli\', nous vendons du rentable. Nous analysons vos données pour piloter nos experts créatifs.',
    'vision.stat1.val': '3x',
    'vision.stat1.label': 'ROI moyen constaté',
    'vision.stat2.val': '48h',
    'vision.stat2.label': 'Délai de démarrage',
    'vision.stat3.val': '100%',
    'vision.stat3.label': 'Projets livrés clé en main',
    'method.title': 'Notre Méthode',
    'method.step1.title': 'ANALYSE',
    'method.step1.body': 'Nous auditons votre marché et vos chiffres avant de bouger.',
    'method.step2.title': 'CASTING',
    'method.step2.body': 'Nous sélectionnons dans notre réseau l\'expert parfait pour VOTRE besoin.',
    'method.step3.title': 'PILOTAGE',
    'method.step3.body': 'Nous gérons la production de A à Z. Vous recevez un projet clé en main.',
    'talents.title': 'L\'élite des créatifs. Pilotée par nos experts.',
    'talents.cta': 'Réserver ce talent via l\'Agence',
    'talents.filter.all': 'Tous',
    'talents.filter.branding': 'Branding',
    'talents.filter.video': 'Vidéo',
    'talents.filter.web': 'Web',
    'talents.filter.photo': 'Photo',
    'talents.more': 'Voir plus',
    'offers.title': 'Des offres claires. Sans coûts cachés.',
    'offers.pack1.name': 'AUDIT GRATUIT',
    'offers.pack1.type': 'Offre d\'appel',
    'offers.pack1.features': 'Analyse réseaux sociaux · Évaluation contenus · Rapport de synthèse',
    'offers.pack1.included': 'Présentation orale & proposition',
    'offers.pack2.name': 'PRODUCTION',
    'offers.pack2.type': 'À la carte',
    'offers.pack2.features': 'Logo · Site Web · Vidéo Promo · Shooting',
    'offers.pack2.included': 'Audit rapide + Casting + Gestion',
    'offers.pack3.name': 'CROISSANCE',
    'offers.pack3.type': 'Abonnement mensuel',
    'offers.pack3.features': 'Stratégie mensuelle · Contenus réguliers · Reporting performance',
    'offers.pack3.included': 'Accès prioritaire + Optimisation Data',
    'offers.pack3.badge': 'Recommandé',
    'results.title': 'Des résultats mesurables.',
    'results.subtitle': 'Nous ne choisissons pas les likes, nous choisissons les ventes.',
    'contact.title': 'Démarrons votre projet.',
    'contact.reassurance': 'Réponse sous 24h — Premier audit offert.',
    'contact.name': 'Nom complet',
    'contact.company': 'Entreprise',
    'contact.type': 'Type de projet',
    'contact.budget': 'Budget',
    'contact.message': 'Message (facultatif)',
    'contact.submit': 'Envoyer ma demande',
    'footer.tagline': 'Propulsé par la Data. Sublimé par le Talent.',
    'footer.join': 'Espace Freelances',
    'join.title': 'Rejoindre le collectif LUCID.',
    'join.subtitle': 'Fini la prospection. Concentrez-vous sur la création.',
    'join.benefit1': 'Missions régulières. Revenus stables.',
    'join.benefit2': 'Structure professionnelle. Visibilité maîtrisée.',
    'join.benefit3': 'Accédez à des projets premium sélectionnés.',
    'join.cta': 'Soumettre ma candidature'
  },
  EN: {
    'nav.method': 'Method',
    'nav.talents': 'Talents',
    'nav.offers': 'Offers',
    'nav.contact': 'Contact',
    'nav.cta': 'Start a project',
    'hero.title1': 'Digital Marketing:',
    'hero.title2': 'Step out of the shadows.',
    'hero.subtitle': 'The agency that combines the agility of top freelance creatives with the rigor of a Data-Driven strategy.',
    'hero.cta.primary': 'Start a project',
    'hero.cta.secondary': 'Meet our talents',
    'vision.title': 'Be LUCID about your strategy.',
    'vision.body': 'The market is noisy. To be heard, you don\'t need to shout louder — you need to see clearer. At LUCID, we don\'t sell \'pretty\', we sell profitable. We analyze your data to drive our creative experts.',
    'vision.stat1.val': '3x',
    'vision.stat1.label': 'Average measured ROI',
    'vision.stat2.val': '48h',
    'vision.stat2.label': 'Time to launch',
    'vision.stat3.val': '100%',
    'vision.stat3.label': 'Projects delivered end-to-end',
    'method.title': 'Our Method',
    'method.step1.title': 'ANALYSIS',
    'method.step1.body': 'We audit your market and numbers before making any move.',
    'method.step2.title': 'CASTING',
    'method.step2.body': 'We select from our network the perfect expert for YOUR need.',
    'method.step3.title': 'MANAGEMENT',
    'method.step3.body': 'We handle production from A to Z. You receive a ready-to-use project.',
    'talents.title': 'The creative elite. Driven by our experts.',
    'talents.cta': 'Book this talent via the Agency',
    'talents.filter.all': 'All',
    'talents.filter.branding': 'Branding',
    'talents.filter.video': 'Video',
    'talents.filter.web': 'Web',
    'talents.filter.photo': 'Photo',
    'talents.more': 'View more',
    'offers.title': 'Clear pricing. No hidden fees.',
    'offers.pack1.name': 'FREE AUDIT',
    'offers.pack1.type': 'Introductory offer',
    'offers.pack1.features': 'Social media analysis · Content evaluation · Summary report',
    'offers.pack1.included': 'Oral presentation & proposal',
    'offers.pack2.name': 'PRODUCTION',
    'offers.pack2.type': 'On demand',
    'offers.pack2.features': 'Logo · Website · Promo Video · Shooting',
    'offers.pack2.included': 'Quick audit + Casting + Management',
    'offers.pack3.name': 'GROWTH',
    'offers.pack3.type': 'Monthly retainer',
    'offers.pack3.features': 'Monthly strategy · Regular content · Performance reporting',
    'offers.pack3.included': 'Priority access + Data optimization',
    'offers.pack3.badge': 'Recommended',
    'results.title': 'Measurable results.',
    'results.subtitle': 'We don\'t choose likes, we choose sales.',
    'contact.title': 'Let\'s start your project.',
    'contact.reassurance': 'Response within 24h — First audit included free.',
    'contact.name': 'Full name',
    'contact.company': 'Company',
    'contact.type': 'Project type',
    'contact.budget': 'Budget',
    'contact.message': 'Message (optional)',
    'contact.submit': 'Send my request',
    'footer.tagline': 'Powered by Data. Elevated by Talent.',
    'footer.join': 'Freelancer Space',
    'join.title': 'Join the LUCID collective.',
    'join.subtitle': 'No more prospecting. Focus on creating.',
    'join.benefit1': 'Regular missions. Stable income.',
    'join.benefit2': 'Professional structure. Controlled visibility.',
    'join.benefit3': 'Access carefully selected premium projects.',
    'join.cta': 'Submit my application'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('FR');

  useEffect(() => {
    const saved = localStorage.getItem('lucid_lang') as Language;
    if (saved && (saved === 'FR' || saved === 'EN')) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('lucid_lang', newLang);
    document.documentElement.lang = newLang.toLowerCase();
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
