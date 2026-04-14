import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-3">Politique de confidentialité</h1>
            <p className="text-brand-gray mb-12">
              Dernière mise à jour :{' '}
              {new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <div className="space-y-10 text-brand-gray leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  1. Qui sommes-nous ?
                </h2>
                <p>
                  LUCID Agency est une agence de marketing digital basée à Lomé, Togo. Nous
                  collectons et traitons des données personnelles dans le cadre de notre activité de
                  mise en relation entre clients et créatifs freelances.
                </p>
                <p className="mt-3">
                  <strong className="text-[var(--text-primary)]">Contact :</strong>{' '}
                  agencelucid@gmail.com
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  2. Données collectées
                </h2>
                <p>Nous collectons les données suivantes :</p>
                <ul className="mt-3 space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <span>
                      <strong className="text-[var(--text-primary)]">
                        Formulaire de contact :
                      </strong>{' '}
                      nom, email, entreprise, message.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <span>
                      <strong className="text-[var(--text-primary)]">
                        Inscription freelancer :
                      </strong>{' '}
                      nom, prénom, email, spécialité, portfolio.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <span>
                      <strong className="text-[var(--text-primary)]">Connexion :</strong> email et
                      mot de passe (hashé — jamais stocké en clair).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <span>
                      <strong className="text-[var(--text-primary)]">Préférences :</strong> thème
                      d'affichage et langue (stockés localement sur votre appareil).
                    </span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  3. Finalités du traitement
                </h2>
                <p>Vos données sont utilisées uniquement pour :</p>
                <ul className="mt-3 space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>Répondre à vos demandes de
                    contact.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>Gérer votre inscription et votre
                    espace freelancer.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>Assurer la sécurité et le bon
                    fonctionnement de la plateforme.
                  </li>
                </ul>
                <p className="mt-4">Nous ne vendons jamais vos données à des tiers.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  4. Hébergement & Sécurité
                </h2>
                <p>
                  La plateforme est hébergée sur{' '}
                  <strong className="text-[var(--text-primary)]">Vercel</strong> (CDN) et{' '}
                  <strong className="text-[var(--text-primary)]">Supabase</strong> (base de données,
                  authentification). Ces services sont conformes aux standards de sécurité
                  internationaux. Les mots de passe sont hashés avec bcrypt. Les communications sont
                  chiffrées via HTTPS/TLS.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">5. Vos droits</h2>
                <p>Conformément aux lois applicables, vous disposez des droits suivants :</p>
                <ul className="mt-3 space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <strong className="text-[var(--text-primary)]">Droit d'accès :</strong> obtenir
                    une copie de vos données.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <strong className="text-[var(--text-primary)]">
                      Droit de rectification :
                    </strong>{' '}
                    corriger des données inexactes.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <strong className="text-[var(--text-primary)]">
                      Droit à l'effacement :
                    </strong>{' '}
                    supprimer votre compte et vos données.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-mint mt-1">•</span>
                    <strong className="text-[var(--text-primary)]">
                      Droit à la portabilité :
                    </strong>{' '}
                    exporter vos données.
                  </li>
                </ul>
                <p className="mt-4">
                  Pour exercer ces droits, contactez-nous à{' '}
                  <a
                    href="mailto:agencelucid@gmail.com"
                    className="text-brand-mint hover:underline"
                  >
                    agencelucid@gmail.com
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">6. Cookies</h2>
                <p>
                  Nous utilisons uniquement les données de préférence stockées localement sur votre
                  appareil (thème, langue). Aucun cookie de tracking ou publicitaire n'est utilisé.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
