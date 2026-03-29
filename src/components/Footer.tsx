import { useLanguage } from '../context/LanguageContext';
import { Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-brand-darkest pt-24 pb-12 text-brand-gray">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-16 mb-20">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-bold tracking-tighter text-white">LUCID</span>
              <span className="text-xs font-semibold tracking-widest text-brand-mint uppercase">Agency</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Navigation</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="/" className="hover:text-brand-mint transition-colors">Accueil</a></li>
              <li><a href="/#methode" className="hover:text-brand-mint transition-colors">{t('nav.method')}</a></li>
              <li><a href="/#talents" className="hover:text-brand-mint transition-colors">{t('nav.talents')}</a></li>
              <li><a href="/#resultats" className="hover:text-brand-mint transition-colors">Résultats</a></li>
              <li><a href="/#offres" className="hover:text-brand-mint transition-colors">{t('nav.offers')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Espaces</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="/join" className="hover:text-brand-mint transition-colors">{t('footer.join')}</a></li>
              <li><a href="/dashboard" className="hover:text-brand-mint transition-colors">Espace Freelance</a></li>
              <li><a href="/admin" className="hover:text-brand-mint transition-colors">Administration</a></li>
              <li><a href="/#contact" className="hover:text-brand-mint transition-colors">{t('nav.contact')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-brand-mint" />
                contact@lucid-agency.com
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-brand-mint" />
                +228 90 00 00 00
              </li>
              <li className="flex items-center gap-6 pt-4">
                <a href="#" className="hover:text-brand-mint transition-colors"><Linkedin size={20} /></a>
                <a href="#" className="hover:text-brand-mint transition-colors"><Instagram size={20} /></a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs">
            © 2026 LUCID Agency. Tous droits réservés.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-xs hover:text-brand-mint transition-colors">Politique de confidentialité</a>
            <a href="#" className="text-xs hover:text-brand-mint transition-colors">Mentions légales</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
