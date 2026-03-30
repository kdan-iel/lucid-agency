import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, Briefcase, MessageSquare, Settings, LogOut, Bell, Search, X, CheckCircle, Clock, MapPin, Calendar, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar';

import { useAuth } from '../context/AuthContext';

interface Mission {
  id: number;
  title: string;
  category: string;
  duration: string;
  budget: string;
  description: string;
  company: string;
  postedAt: string;
}

const MISSIONS: Mission[] = [
  { 
    id: 1, 
    title: 'Refonte Identité Visuelle - Startup Fintech', 
    category: 'Branding', 
    duration: '3-4 semaines', 
    budget: '2 500 €',
    company: 'LumiPay',
    postedAt: 'Il y a 2 jours',
    description: 'Nous recherchons un expert en branding pour refondre complètement l\'identité visuelle de notre startup fintech. Le projet inclut la création d\'un nouveau logo, d\'une charte graphique complète et de supports de communication.'
  },
  { 
    id: 2, 
    title: 'Landing Page High-Convert - E-commerce', 
    category: 'Web Design', 
    duration: '1-2 semaines', 
    budget: '1 200 €',
    company: 'EcoShop',
    postedAt: 'Il y a 5 heures',
    description: 'Besoin d\'une landing page optimisée pour la conversion pour le lancement d\'un nouveau produit écologique. Design moderne, épuré et mobile-first requis.'
  },
  { 
    id: 3, 
    title: 'Série de Vidéos Motion Design pour Réseaux Sociaux', 
    category: 'Motion Design', 
    duration: '2-3 semaines', 
    budget: '3 000 €',
    company: 'TechFlow',
    postedAt: 'Hier',
    description: 'Création de 5 vidéos en motion design de 15-30 secondes pour une campagne publicitaire sur Instagram et LinkedIn.'
  },
];

interface Contract {
  id: number;
  title: string;
  client: string;
  status: 'active' | 'completed';
  budget: string;
  deadline: string;
}

const INITIAL_CONTRACTS: Contract[] = [
  { id: 1, title: 'Campagne Social Ads', client: 'TechFlow', status: 'completed', budget: '3 000 €', deadline: '20/03/2026' },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [appliedMissions, setAppliedMissions] = useState<number[]>([]);
  const [savedMissions, setSavedMissions] = useState<number[]>([]);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Nouvelle mission disponible en Branding !', time: 'Il y a 10 min', read: false },
    { id: 2, text: 'Votre candidature pour EcoShop a été consultée.', time: 'Il y a 2h', read: true },
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [messages, setMessages] = useState<Record<number, any[]>>({
    1: [
      { id: 1, sender: 'LUCID Agency', text: 'Bonjour Thomas, nous avons bien reçu votre candidature.', time: '10:30', isMe: false },
      { id: 2, sender: 'Moi', text: 'Merci ! Quand pourrons-nous en discuter ?', time: '10:35', isMe: true },
    ],
    2: [
      { id: 1, sender: 'Client Alpha', text: 'Le projet avance ?', time: 'Hier', isMe: false },
    ]
  });
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const msg = {
      id: messages[activeChatId].length + 1,
      sender: 'Moi',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };
    
    setMessages({
      ...messages,
      [activeChatId]: [...messages[activeChatId], msg]
    });
    setNewMessage('');
  };

  const handleApply = (missionId: number) => {
    if (!appliedMissions.includes(missionId)) {
      setAppliedMissions([...appliedMissions, missionId]);
      setSelectedMission(null);
      // Add a notification
      const newNotif = {
        id: Date.now(),
        text: `Candidature envoyée pour la mission #${missionId}`,
        time: 'À l\'instant',
        read: false
      };
      setNotifications([newNotif, ...notifications]);
    }
  };

  const handleSave = (missionId: number) => {
    if (savedMissions.includes(missionId)) {
      setSavedMissions(savedMissions.filter(id => id !== missionId));
    } else {
      setSavedMissions([...savedMissions, missionId]);
    }
  };

  const sidebarItems = [
    { id: 'overview', icon: <LayoutDashboard size={20} />, label: t('dashboard.nav.overview') },
    { id: 'projects', icon: <Briefcase size={20} />, label: t('dashboard.nav.missions') },
    { id: 'contracts', icon: <Calendar size={20} />, label: t('dashboard.nav.contracts') },
    { id: 'applications', icon: <CheckCircle size={20} />, label: t('dashboard.nav.applications') },
    { id: 'saved', icon: <Bell size={20} />, label: t('dashboard.nav.saved') },
    { id: 'messages', icon: <MessageSquare size={20} />, label: t('dashboard.nav.messages') },
    { id: 'settings', icon: <Settings size={20} />, label: t('dashboard.nav.settings') },
  ];

  const stats = [
    { id: 'projects', label: t('dashboard.stats.missions'), value: MISSIONS.length.toString(), color: 'text-brand-mint' },
    { id: 'applications', label: 'Candidatures', value: appliedMissions.length.toString(), color: 'text-blue-400' },
    { id: 'contracts', label: 'Contrats Actifs', value: contracts.filter(c => c.status === 'active').length.toString(), color: 'text-green-400' },
  ];

  const filteredMissions = useMemo(() => {
    return MISSIONS.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => stat.id !== 'revenue' && setActiveTab(stat.id)}
            className={`bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-brand-mint/50 transition-all group`}
          >
            <div className="text-brand-gray text-sm font-medium mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="mt-4 text-xs text-brand-gray opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Voir les détails <span className="text-brand-mint">→</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Missions Area */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">{t('dashboard.missions.title')}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.missions.search')} 
                className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint transition-all w-64"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredMissions.length > 0 ? (
              filteredMissions.map((mission) => (
                <div 
                  key={mission.id} 
                  onClick={() => setSelectedMission(mission)}
                  className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                      {mission.company.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold mb-1 group-hover:text-brand-mint transition-colors">{mission.title}</h3>
                      <p className="text-sm text-brand-gray">{mission.category} · {mission.duration} · {mission.budget}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {appliedMissions.includes(mission.id) ? (
                      <span className="text-brand-mint text-sm font-bold flex items-center gap-1">
                        <CheckCircle size={16} /> Postulé
                      </span>
                    ) : (
                      <button className="px-6 py-2 rounded-full border border-brand-mint text-brand-mint text-sm font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all">
                        {t('dashboard.missions.view')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-brand-gray">
                Aucune mission ne correspond à votre recherche.
              </div>
            )}
          </div>
        </div>

        {/* Notifications / Activity */}
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
          <h2 className="text-xl font-bold mb-8">Notifications</h2>
          <div className="space-y-6">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex gap-4 group">
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-brand-gray/30' : 'bg-brand-mint shadow-[0_0_8px_rgba(0,255,186,0.5)]'}`} />
                <div>
                  <p className={`text-sm leading-relaxed ${notif.read ? 'text-brand-gray' : 'text-[var(--text-primary)]'}`}>
                    {notif.text}
                  </p>
                  <span className="text-[10px] text-brand-gray mt-1 block">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray text-sm font-bold hover:bg-white/5 transition-all">
            Tout marquer comme lu
          </button>
        </div>
      </div>
    </>
  );

  const renderContracts = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <h2 className="text-2xl font-bold mb-8">{t('dashboard.nav.contracts')}</h2>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div key={contract.id} className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] bg-white/5">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                {contract.client.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold mb-1">{contract.title}</h3>
                <p className="text-sm text-brand-gray">{contract.client} · Budget: {contract.budget}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                contract.status === 'active' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' : 'bg-green-400/10 text-green-400 border-green-400/20'
              }`}>
                {contract.status === 'active' ? t('admin.projects.status.inprogress') : t('admin.projects.status.completed')}
              </span>
              <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-bold hover:bg-white/5 transition-all">
                Gérer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSaved = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <h2 className="text-2xl font-bold mb-8">{t('dashboard.nav.saved')}</h2>
      {savedMissions.length > 0 ? (
        <div className="space-y-4">
          {MISSIONS.filter(m => savedMissions.includes(m.id)).map((mission) => (
            <div 
              key={mission.id} 
              onClick={() => setSelectedMission(mission)}
              className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                  {mission.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold mb-1 group-hover:text-brand-mint transition-colors">{mission.title}</h3>
                  <p className="text-sm text-brand-gray">{mission.category} · {mission.budget}</p>
                </div>
              </div>
              <button className="px-6 py-2 rounded-full border border-brand-mint text-brand-mint text-sm font-bold hover:bg-brand-mint hover:text-[#0D1117] transition-all">
                {t('dashboard.missions.view')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-brand-gray">
          Vous n'avez aucune mission enregistrée.
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <h2 className="text-2xl font-bold mb-8">{t('dashboard.nav.applications')}</h2>
      {appliedMissions.length > 0 ? (
        <div className="space-y-4">
          {MISSIONS.filter(m => appliedMissions.includes(m.id)).map((mission) => (
            <div key={mission.id} className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] bg-white/5">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold">
                  {mission.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{mission.title}</h3>
                  <p className="text-sm text-brand-gray">{mission.company} · Postulé le {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-400/20">
                  {t('admin.status.pending')}
                </span>
                <button 
                  onClick={() => setSelectedMission(mission)}
                  className="p-2 rounded-lg hover:bg-white/10 text-brand-gray"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-brand-mint/10 rounded-full flex items-center justify-center text-brand-mint mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucune candidature</h3>
          <p className="text-brand-gray mb-8">Vous n'avez pas encore postulé à des missions.</p>
          <button 
            onClick={() => setActiveTab('projects')}
            className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            Découvrir les missions
          </button>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] overflow-hidden flex h-[600px]">
      <div className="w-1/3 border-r border-[var(--border-color)] p-6">
        <h2 className="text-xl font-bold mb-6">{t('dashboard.nav.messages')}</h2>
        <div className="space-y-4">
          {[
            { id: 1, name: 'LUCID Agency', last: messages[1][messages[1].length - 1].text, time: messages[1][messages[1].length - 1].time },
            { id: 2, name: 'Client Alpha', last: messages[2][messages[2].length - 1].text, time: messages[2][messages[2].length - 1].time },
          ].map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChatId(chat.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all ${activeChatId === chat.id ? 'bg-brand-mint/10 border border-brand-mint/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold">{chat.name}</span>
                <span className="text-xs text-brand-gray">{chat.time}</span>
              </div>
              <p className="text-sm text-brand-gray truncate">{chat.last}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint font-bold">
              {activeChatId === 1 ? 'L' : 'C'}
            </div>
            <span className="font-bold">{activeChatId === 1 ? 'LUCID Agency' : 'Client Alpha'}</span>
          </div>
          <button className="p-2 rounded-full hover:bg-white/5 text-brand-gray">
            <Search size={20} />
          </button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          {messages[activeChatId].map((msg, i) => (
            <div key={i} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl ${msg.isMe ? 'bg-brand-mint text-[#0D1117] rounded-tr-none' : 'bg-white/5 border border-[var(--border-color)] rounded-tl-none'}`}>
                <p className="text-sm">{msg.text}</p>
                <span className={`text-[10px] mt-1 block ${msg.isMe ? 'text-[#0D1117]/60' : 'text-brand-gray'}`}>{msg.time}</span>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="p-6 border-t border-[var(--border-color)] flex gap-4">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..." 
            className="flex-grow bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full px-6 py-3 text-sm focus:outline-none focus:border-brand-mint transition-all"
          />
          <button type="submit" className="bg-brand-mint text-[#0D1117] px-6 py-3 rounded-full font-bold hover:scale-105 transition-all">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );

  const [profileData, setProfileData] = useState({
    name: 'Thomas K.',
    email: 'thomas.k@example.com',
    bio: 'Designer UI/UX passionné par les produits digitaux innovants.',
    skills: 'Figma, React, Tailwind CSS'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault();
    alert('Mot de passe mis à jour avec succès !');
    setIsChangingPassword(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const renderSettings = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">{t('dashboard.settings.title')}</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => { setIsEditingProfile(!isEditingProfile); setIsChangingPassword(false); }}
            className="text-brand-mint font-bold hover:underline text-sm"
          >
            {isEditingProfile ? 'Annuler' : t('dashboard.settings.profile')}
          </button>
          <button 
            onClick={() => { setIsChangingPassword(!isChangingPassword); setIsEditingProfile(false); }}
            className="text-brand-mint font-bold hover:underline text-sm"
          >
            {isChangingPassword ? 'Annuler' : t('dashboard.settings.security')}
          </button>
        </div>
      </div>

      {isEditingProfile ? (
        <form className="space-y-6 max-w-xl" onSubmit={(e) => { e.preventDefault(); setIsEditingProfile(false); }}>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Nom complet</label>
            <input 
              type="text" 
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Email</label>
            <input 
              type="email" 
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Bio</label>
            <textarea 
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              rows={4}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Compétences (séparées par des virgules)</label>
            <input 
              type="text" 
              value={profileData.skills}
              onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <button type="submit" className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all">
            Enregistrer les modifications
          </button>
        </form>
      ) : isChangingPassword ? (
        <form className="space-y-6 max-w-xl" onSubmit={handlePasswordChange}>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">{t('dashboard.settings.security.current')}</label>
            <input 
              required
              type="password" 
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">{t('dashboard.settings.security.new')}</label>
            <input 
              required
              type="password" 
              value={passwordForm.new}
              onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">{t('dashboard.settings.security.confirm')}</label>
            <input 
              required
              type="password" 
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <button type="submit" className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all">
            {t('dashboard.settings.security.submit')}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-[var(--border-color)]">
            <div className="w-20 h-20 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] text-3xl font-bold">
              {profileData.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{profileData.name}</h3>
              <p className="text-brand-gray">{profileData.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: t('dashboard.settings.profile'), desc: 'Gérez votre visibilité et vos compétences.' },
              { label: t('dashboard.settings.notifications'), desc: 'Configurez vos alertes de missions.' },
              { label: t('dashboard.settings.security'), desc: 'Mot de passe et authentification.' },
              { label: 'Paiements', desc: 'Gérez vos factures et coordonnées bancaires.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group">
                <h3 className="font-bold mb-1 group-hover:text-brand-mint transition-colors">{item.label}</h3>
                <p className="text-sm text-brand-gray">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
      case 'projects':
        return renderOverview();
      case 'contracts':
        return renderContracts();
      case 'applications':
        return renderApplications();
      case 'saved':
        return renderSaved();
      case 'messages':
        return renderMessages();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      
      <div className="pt-24 flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[var(--border-color)] hidden md:block p-6">
          <nav className="space-y-2 h-full flex flex-col">
            <div className="flex-grow space-y-2">
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
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all mt-auto"
            >
              <LogOut size={20} />
              <span className="font-bold">{t('dashboard.nav.logout')}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-8">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t('dashboard.welcome').replace('{{name}}', 'Thomas')}
              </h1>
              <p className="text-brand-gray">{t('dashboard.welcome.sub')}</p>
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

          {renderContent()}
        </main>
      </div>

      {/* Mission Detail Modal */}
      <AnimatePresence>
        {selectedMission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMission(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold text-xl">
                      {selectedMission.company.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedMission.title}</h2>
                      <p className="text-brand-mint font-medium">{selectedMission.company}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMission(null)}
                    className="p-2 rounded-full hover:bg-white/5 text-brand-gray transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-brand-gray text-xs mb-1">
                      <Calendar size={14} /> Durée
                    </div>
                    <div className="font-bold text-sm">{selectedMission.duration}</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-brand-gray text-xs mb-1">
                      <DollarSign size={14} /> Budget
                    </div>
                    <div className="font-bold text-sm">{selectedMission.budget}</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-brand-gray text-xs mb-1">
                      <MapPin size={14} /> Lieu
                    </div>
                    <div className="font-bold text-sm">Remote</div>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-3">Description du projet</h4>
                    <p className="text-brand-gray leading-relaxed">
                      {selectedMission.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-3">Compétences requises</h4>
                    <div className="flex flex-wrap gap-2">
                      {['UI/UX', 'Figma', 'Prototypage', 'Design System'].map((skill) => (
                        <span key={skill} className="px-3 py-1 rounded-full bg-white/5 border border-[var(--border-color)] text-xs text-brand-gray">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  {appliedMissions.includes(selectedMission.id) ? (
                    <div className="flex-grow bg-brand-mint/10 text-brand-mint py-4 rounded-xl font-bold text-center border border-brand-mint/20">
                      Candidature envoyée
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleApply(selectedMission.id)}
                      className="flex-grow bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-mint/20"
                    >
                      Postuler à cette mission
                    </button>
                  )}
                  <button 
                    onClick={() => handleSave(selectedMission.id)}
                    className={`px-6 py-4 rounded-xl border border-[var(--border-color)] transition-all ${savedMissions.includes(selectedMission.id) ? 'bg-brand-mint text-[#0D1117] border-brand-mint' : 'hover:bg-white/5 text-brand-gray'}`}
                  >
                    {savedMissions.includes(selectedMission.id) ? 'Enregistré' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
