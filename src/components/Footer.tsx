import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Linkedin, Instagram, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  return (
    <footer className="bg-brand-darkest pt-24 pb-12 text-brand-gray">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="LUCID Agency Logo" className="w-10 h-10" />
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tighter text-white font-ibm">
                  LUCID
                </span>
                <span className="text-[10px] font-semibold tracking-[0.3em] text-brand-mint uppercase font-ibm">
                  Agency
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">{t('footer.tagline')}</p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">
              Navigation
            </h4>
            <ul className="space-y-4 text-sm">
              {[
                { href: '/', label: 'Accueil' },
                { href: '/#philosophie', label: t('nav.philosophy') },
                { href: '/#methode', label: t('nav.method') },
                { href: '/#talents', label: t('nav.talents') },
                { href: '/#offres', label: t('nav.offers') },
                { href: '/#contact', label: t('nav.contact') },
              ].map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-brand-mint transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Espaces — ✅ lien /admin masqué sauf si admin connecté */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Espaces</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <a href="/join" className="hover:text-brand-mint transition-colors">
                  {t('footer.join')}
                </a>
              </li>
              {profile?.role === 'freelancer' && (
                <li>
                  <a href="/dashboard" className="hover:text-brand-mint transition-colors">
                    Mon Espace
                  </a>
                </li>
              )}
              {profile?.role === 'admin' && (
                <li>
                  <a href="/admin" className="hover:text-brand-mint transition-colors">
                    Administration
                  </a>
                </li>
              )}
              <li>
                <a href="/#contact" className="hover:text-brand-mint transition-colors">
                  {t('nav.contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-brand-mint flex-shrink-0" />
                <a
                  href="mailto:agencelucid@gmail.com"
                  className="hover:text-brand-mint transition-colors"
                >
                  agencelucid@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-brand-mint flex-shrink-0" />
                <a href="tel:+22890000000" className="hover:text-brand-mint transition-colors">
                  +228 90 00 00 00
                </a>
              </li>
              <li className="flex items-center gap-5 pt-4">
                <a
                  href="https://www.linkedin.com/company/lucid-agency"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-mint transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="https://www.instagram.com/lucid_agence"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-mint transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs">
            © {new Date().getFullYear()} LUCID Agency. Tous droits réservés.
          </p>
          <div className="flex gap-8">
            <a href="/privacy" className="text-xs hover:text-brand-mint transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="/legal" className="text-xs hover:text-brand-mint transition-colors">
              {t('footer.legal')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
