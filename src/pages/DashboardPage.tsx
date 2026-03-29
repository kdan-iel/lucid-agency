import { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Briefcase, MessageSquare, Settings, LogOut, Bell, Search } from 'lucide-react';
import Navbar from '../components/Navbar';

import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const sidebarItems = [
    { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { id: 'projects', icon: <Briefcase size={20} />, label: 'Missions' },
    { id: 'messages', icon: <MessageSquare size={20} />, label: 'Messages' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Paramètres' },
  ];

  const stats = [
    { label: 'Missions en cours', value: '3' },
    { label: 'Revenus ce mois', value: '4 500 €' },
    { label: 'Profil complété', value: '85%' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      
      <div className="pt-24 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[var(--border-color)] hidden md:block p-6">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-brand-mint text-[#0D1117]' 
                    : 'hover:bg-white/5 text-brand-gray'
                }`}
              >
                {item.icon}
                <span className="font-bold">{item.label}</span>
              </button>
            ))}
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all mt-auto"
            >
              <LogOut size={20} />
              <span className="font-bold">Déconnexion</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-8">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bonjour, Thomas 👋</h1>
              <p className="text-brand-gray">Voici ce qui se passe sur votre espace aujourd'hui.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-white/5 text-brand-gray relative">
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-mint rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] font-bold">
                T
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)]"
              >
                <div className="text-brand-gray text-sm font-medium mb-2">{stat.label}</div>
                <div className="text-3xl font-bold text-brand-mint">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Missions recommandées</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                      L
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 group-hover:text-brand-mint transition-colors">Refonte Identité Visuelle - Startup Fintech</h3>
                      <p className="text-sm text-brand-gray">Branding · 3-4 semaines · 2 500 €</p>
                    </div>
                  </div>
                  <button className="px-6 py-2 rounded-full border border-brand-mint text-brand-mint text-sm font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all">
                    Voir l'offre
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
