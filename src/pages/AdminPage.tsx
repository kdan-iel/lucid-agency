import { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Users, Briefcase, MessageSquare, Settings, LogOut, Bell, Search, Filter, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';

import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('talents');

  const sidebarItems = [
    { id: 'talents', icon: <Users size={20} />, label: 'Gestion Talents' },
    { id: 'projects', icon: <Briefcase size={20} />, label: 'Projets Clients' },
    { id: 'messages', icon: <MessageSquare size={20} />, label: 'Messagerie' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Paramètres' },
  ];

  const stats = [
    { label: 'Talents Actifs', value: '142' },
    { label: 'Projets en cours', value: '28' },
    { label: 'Demandes en attente', value: '12' },
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
              <h1 className="text-3xl font-bold mb-2">Back-office Admin 🛠️</h1>
              <p className="text-brand-gray">Gérez vos talents et vos projets clients en toute simplicité.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-white/5 text-brand-gray relative">
                <Bell size={24} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-mint rounded-full"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] font-bold">
                A
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
              <h2 className="text-xl font-bold">Dernières demandes de talents</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint transition-all"
                  />
                </div>
                <button className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-white/5 text-brand-gray">
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-brand-gray text-sm">
                    <th className="pb-4 font-medium">Talent</th>
                    <th className="pb-4 font-medium">Spécialité</th>
                    <th className="pb-4 font-medium">Date</th>
                    <th className="pb-4 font-medium">Statut</th>
                    <th className="pb-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {[
                    { name: 'Thomas K.', specialty: 'Branding', date: '29/03/2026', status: 'pending' },
                    { name: 'Amina L.', specialty: 'Web Design', date: '28/03/2026', status: 'approved' },
                    { name: 'Kwame O.', specialty: 'Motion Design', date: '27/03/2026', status: 'rejected' },
                  ].map((row, i) => (
                    <tr key={i} className="group hover:bg-white/5 transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint font-bold text-xs uppercase">
                            {row.name.charAt(0)}
                          </div>
                          <span className="font-bold">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-brand-gray">{row.specialty}</td>
                      <td className="py-4 text-brand-gray">{row.date}</td>
                      <td className="py-4">
                        {row.status === 'approved' && (
                          <span className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase">
                            <CheckCircle size={14} /> Approuvé
                          </span>
                        )}
                        {row.status === 'pending' && (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold uppercase">
                            <Clock size={14} /> En attente
                          </span>
                        )}
                        {row.status === 'rejected' && (
                          <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase">
                            <XCircle size={14} /> Refusé
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 rounded-lg hover:bg-white/10 text-brand-gray">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
