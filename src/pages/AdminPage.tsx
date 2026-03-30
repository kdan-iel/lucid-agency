import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Users, Briefcase, MessageSquare, Settings, LogOut, Bell, Search, Filter, CheckCircle, Clock, XCircle, MoreVertical, X, Mail, Phone, Globe, Download } from 'lucide-react';
import Navbar from '../components/Navbar';

import { useAuth } from '../context/AuthContext';

interface TalentRequest {
  id: number;
  name: string;
  specialty: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  email: string;
  phone: string;
  portfolio: string;
  experience: string;
}

const INITIAL_REQUESTS: TalentRequest[] = [
  { 
    id: 1, 
    name: 'Thomas K.', 
    specialty: 'Branding', 
    date: '29/03/2026', 
    status: 'pending',
    email: 'thomas.k@example.com',
    phone: '+228 90 12 34 56',
    portfolio: 'behance.net/thomask',
    experience: '5 ans'
  },
  { 
    id: 2, 
    name: 'Amina L.', 
    specialty: 'Web Design', 
    date: '28/03/2026', 
    status: 'approved',
    email: 'amina.l@example.com',
    phone: '+228 91 23 45 67',
    portfolio: 'amina.design',
    experience: '3 ans'
  },
  { 
    id: 3, 
    name: 'Kwame O.', 
    specialty: 'Motion Design', 
    date: '27/03/2026', 
    status: 'rejected',
    email: 'kwame.o@example.com',
    phone: '+228 92 34 56 78',
    portfolio: 'vimeo.com/kwameo',
    experience: '7 ans'
  },
];

interface Project {
  id: number;
  title: string;
  client: string;
  talent: string;
  budget: string;
  status: 'in-progress' | 'completed' | 'on-hold';
  deadline: string;
}

const INITIAL_PROJECTS: Project[] = [
  { id: 1, title: 'Refonte Site Web', client: 'EcoShop', talent: 'Amina L.', budget: '1 200 €', status: 'in-progress', deadline: '15/04/2026' },
  { id: 2, title: 'Campagne Social Ads', client: 'TechFlow', talent: 'Thomas K.', budget: '3 000 €', status: 'completed', deadline: '20/03/2026' },
];

export default function AdminPage() {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('talents');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requests, setRequests] = useState<TalentRequest[]>(INITIAL_REQUESTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedTalent, setSelectedTalent] = useState<TalentRequest | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', client: '', talent: '', budget: '', deadline: '' });
  
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Thomas K.', text: 'Bonjour, j\'aimerais en savoir plus sur LUCID.', time: '09:00', isMe: false },
    { id: 2, sender: 'Admin', text: 'Bonjour Thomas, nous avons bien reçu votre demande.', time: '09:15', isMe: true },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const msg = {
      id: messages.length + 1,
      sender: 'Admin',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };
    
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const handleCreateProject = (e: FormEvent) => {
    e.preventDefault();
    const project: Project = {
      id: projects.length + 1,
      ...newProject,
      status: 'in-progress'
    };
    setProjects([project, ...projects]);
    setIsProjectModalOpen(false);
    setNewProject({ title: '', client: '', talent: '', budget: '', deadline: '' });
  };

  const handleUpdateProjectStatus = (id: number, status: Project['status']) => {
    setProjects(projects.map(p => p.id === id ? { ...p, status } : p));
  };

  const sidebarItems = [
    { id: 'talents', icon: <Users size={20} />, label: t('admin.nav.talents') },
    { id: 'projects', icon: <Briefcase size={20} />, label: t('admin.nav.projects') },
    { id: 'messages', icon: <MessageSquare size={20} />, label: t('admin.nav.messages') },
    { id: 'settings', icon: <Settings size={20} />, label: t('admin.nav.settings') },
  ];

  const stats = [
    { id: 'all', label: t('admin.stats.activeTalents'), value: requests.filter(r => r.status === 'approved').length.toString(), color: 'text-brand-mint' },
    { id: 'projects', label: t('admin.stats.activeProjects'), value: projects.filter(p => p.status === 'in-progress').length.toString(), color: 'text-blue-400' },
    { id: 'pending', label: t('admin.stats.pendingRequests'), value: requests.filter(r => r.status === 'pending').length.toString(), color: 'text-yellow-400' },
  ];

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           r.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const handleUpdateStatus = (id: number, newStatus: 'approved' | 'rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (selectedTalent?.id === id) {
      setSelectedTalent(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const renderTalents = () => (
    <div className="bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-xl font-bold">{t('admin.talents.title')}</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..." 
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint transition-all w-full"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-sm text-brand-gray focus:outline-none focus:border-brand-mint transition-all w-full sm:w-auto"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Refusés</option>
          </select>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-brand-gray text-sm">
              <th className="pb-4 font-medium">{t('admin.talents.table.talent')}</th>
              <th className="pb-4 font-medium">{t('admin.talents.table.specialty')}</th>
              <th className="pb-4 font-medium">{t('admin.talents.table.date')}</th>
              <th className="pb-4 font-medium">{t('admin.talents.table.status')}</th>
              <th className="pb-4 font-medium text-right">{t('admin.talents.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredRequests.map((row) => (
              <tr key={row.id} className="group hover:bg-white/5 transition-all cursor-pointer" onClick={() => setSelectedTalent(row)}>
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
                      <CheckCircle size={14} /> {t('admin.status.approved')}
                    </span>
                  )}
                  {row.status === 'pending' && (
                    <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold uppercase">
                      <Clock size={14} /> {t('admin.status.pending')}
                    </span>
                  )}
                  {row.status === 'rejected' && (
                    <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase">
                      <XCircle size={14} /> {t('admin.status.rejected')}
                    </span>
                  )}
                </td>
                <td className="py-4 text-right">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-brand-gray" onClick={(e) => { e.stopPropagation(); setSelectedTalent(row); }}>
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Talent List */}
      <div className="md:hidden space-y-4">
        {filteredRequests.map((row) => (
          <div 
            key={row.id} 
            onClick={() => setSelectedTalent(row)}
            className="p-4 rounded-2xl border border-[var(--border-color)] bg-white/5 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint font-bold text-xs uppercase">
                  {row.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{row.name}</div>
                  <div className="text-xs text-brand-gray">{row.specialty}</div>
                </div>
              </div>
              <button className="p-1 text-brand-gray">
                <MoreVertical size={16} />
              </button>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-brand-gray">{row.date}</span>
              {row.status === 'approved' && (
                <span className="text-green-400 font-bold uppercase">{t('admin.status.approved')}</span>
              )}
              {row.status === 'pending' && (
                <span className="text-yellow-400 font-bold uppercase">{t('admin.status.pending')}</span>
              )}
              {row.status === 'rejected' && (
                <span className="text-red-400 font-bold uppercase">{t('admin.status.rejected')}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold">{t('admin.nav.projects')}</h2>
        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="bg-brand-mint text-[#0D1117] px-6 py-2 rounded-full font-bold hover:scale-105 transition-all text-sm"
        >
          + {t('admin.nav.projects.new')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-brand-gray text-sm">
              <th className="pb-4 font-medium">{t('admin.projects.table.project')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.client')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.talent')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.budget')}</th>
              <th className="pb-4 font-medium">{t('admin.projects.table.status')}</th>
              <th className="pb-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {projects.map((project) => (
              <tr key={project.id} className="group hover:bg-white/5 transition-all">
                <td className="py-4">
                  <span className="font-bold">{project.title}</span>
                </td>
                <td className="py-4 text-brand-gray">{project.client}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint text-[10px] font-bold">
                      {project.talent.charAt(0)}
                    </div>
                    <span className="text-sm">{project.talent}</span>
                  </div>
                </td>
                <td className="py-4 text-brand-gray">{project.budget}</td>
                <td className="py-4">
                  <select 
                    value={project.status}
                    onChange={(e) => handleUpdateProjectStatus(project.id, e.target.value as any)}
                    className={`text-xs font-bold uppercase px-2 py-1 rounded bg-transparent border border-transparent hover:border-[var(--border-color)] focus:outline-none ${
                      project.status === 'completed' ? 'text-green-400' : 
                      project.status === 'in-progress' ? 'text-blue-400' : 'text-yellow-400'
                    }`}
                  >
                    <option value="in-progress">{t('admin.projects.status.inprogress')}</option>
                    <option value="completed">{t('admin.projects.status.completed')}</option>
                    <option value="on-hold">{t('admin.projects.status.onhold')}</option>
                  </select>
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
  );

  const renderMessages = () => (
    <div className="bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] overflow-hidden flex flex-col md:flex-row h-[600px]">
      <div className={`w-full md:w-1/3 border-r border-[var(--border-color)] p-4 md:p-6 flex flex-col ${messages.length > 0 && 'hidden md:flex'}`}>
        <h2 className="text-xl font-bold mb-6">{t('admin.nav.messages')}</h2>
        <div className="space-y-4 overflow-y-auto">
          {[
            { id: 1, name: 'Thomas K.', last: 'Bonjour, j\'aimerais...', time: '09:00', active: true },
            { id: 2, name: 'Amina L.', last: 'Merci pour l\'invitation.', time: 'Hier', active: false },
          ].map((chat, i) => (
            <div key={i} className={`p-4 rounded-2xl cursor-pointer transition-all ${chat.active ? 'bg-brand-mint/10 border border-brand-mint/30' : 'hover:bg-white/5 border border-transparent'}`}>
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
        <div className="p-4 md:p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint font-bold">T</div>
            <span className="font-bold text-sm md:text-base">Thomas K.</span>
          </div>
          <button className="p-2 rounded-full hover:bg-white/5 text-brand-gray">
            <Search size={20} />
          </button>
        </div>
        <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-2xl ${msg.isMe ? 'bg-brand-mint text-[#0D1117] rounded-tr-none' : 'bg-white/5 border border-[var(--border-color)] rounded-tl-none'}`}>
                <p className="text-sm">{msg.text}</p>
                <span className={`text-[10px] mt-1 block ${msg.isMe ? 'text-[#0D1117]/60' : 'text-brand-gray'}`}>{msg.time}</span>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="p-4 md:p-6 border-t border-[var(--border-color)] flex gap-2 md:gap-4">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..." 
            className="flex-grow bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full px-4 md:px-6 py-2 md:py-3 text-sm focus:outline-none focus:border-brand-mint transition-all"
          />
          <button type="submit" className="bg-brand-mint text-[#0D1117] px-4 md:px-6 py-2 md:py-3 rounded-full font-bold hover:scale-105 transition-all text-sm">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );

  const [agencyData, setAgencyData] = useState({
    name: 'LUCID Agency',
    email: 'contact@lucid-agency.com',
    vision: 'Faire de chaque PME africaine une entreprise qui performe digitalement.',
    mission: 'Transformer votre présence digitale en moteur de croissance réelle.'
  });
  const [isEditingAgency, setIsEditingAgency] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault();
    // Mock password change
    alert('Mot de passe mis à jour avec succès !');
    setIsChangingPassword(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const renderSettings = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">{t('admin.nav.settings')}</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => { setIsEditingAgency(!isEditingAgency); setIsChangingPassword(false); }}
            className="text-brand-mint font-bold hover:underline text-sm"
          >
            {isEditingAgency ? 'Annuler' : t('admin.settings.agency.title')}
          </button>
          <button 
            onClick={() => { setIsChangingPassword(!isChangingPassword); setIsEditingAgency(false); }}
            className="text-brand-mint font-bold hover:underline text-sm"
          >
            {isChangingPassword ? 'Annuler' : t('admin.settings.security.title')}
          </button>
        </div>
      </div>

      {isEditingAgency ? (
        <form className="space-y-6 max-w-xl" onSubmit={(e) => { e.preventDefault(); setIsEditingAgency(false); }}>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Nom de l'agence</label>
            <input 
              type="text" 
              value={agencyData.name}
              onChange={(e) => setAgencyData({...agencyData, name: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Email de contact</label>
            <input 
              type="email" 
              value={agencyData.email}
              onChange={(e) => setAgencyData({...agencyData, email: e.target.value})}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Vision</label>
            <textarea 
              value={agencyData.vision}
              onChange={(e) => setAgencyData({...agencyData, vision: e.target.value})}
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">Mission</label>
            <textarea 
              value={agencyData.mission}
              onChange={(e) => setAgencyData({...agencyData, mission: e.target.value})}
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all resize-none"
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
          <div className="p-6 rounded-2xl bg-white/5 border border-[var(--border-color)]">
            <h3 className="text-xl font-bold mb-4">{agencyData.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-2">Vision</h4>
                <p className="text-sm text-brand-gray">{agencyData.vision}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-2">Mission</h4>
                <p className="text-sm text-brand-gray">{agencyData.mission}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Configuration Agence', desc: 'Gérez les informations de LUCID Agency.' },
              { label: 'Gestion des Rôles', desc: 'Définissez les accès pour votre équipe.' },
              { label: 'Paramètres Système', desc: 'Maintenance et logs du back-office.' },
              { label: 'Intégrations', desc: 'Connectez vos outils tiers (Slack, Trello).' },
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
      case 'talents':
        return renderTalents();
      case 'projects':
        return renderProjects();
      case 'messages':
        return renderMessages();
      case 'settings':
        return renderSettings();
      default:
        return renderTalents();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      
      <div className="pt-24 flex min-h-screen relative">
        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-[var(--border-color)] bg-[var(--bg-primary)] md:bg-transparent
          transform transition-transform duration-300 ease-in-out p-6
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex justify-between items-center mb-8 md:hidden">
            <div className="text-brand-mint font-bold text-xl">LUCID</div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-brand-gray">
              <X size={24} />
            </button>
          </div>
          <nav className="space-y-2 h-full flex flex-col">
            <div className="flex-grow space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
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
        <main className="flex-grow p-4 md:p-8 w-full overflow-x-hidden">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/5 border border-[var(--border-color)] text-brand-mint"
              >
                <Users size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{t('admin.welcome')}</h1>
                <p className="text-brand-gray text-sm md:text-base">{t('admin.welcome.sub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-auto sm:ml-0">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  if (stat.id === 'pending') {
                    setActiveTab('talents');
                    setStatusFilter('pending');
                  } else if (stat.id === 'all') {
                    setActiveTab('talents');
                    setStatusFilter('all');
                  } else if (stat.id === 'projects') {
                    setActiveTab('projects');
                  }
                }}
                className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-brand-mint/50 transition-all group"
              >
                <div className="text-brand-gray text-sm font-medium mb-2">{stat.label}</div>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="mt-4 text-xs text-brand-gray opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Voir les détails <span className="text-brand-mint">→</span>
                </div>
              </motion.div>
            ))}
          </div>

          {renderContent()}
        </main>
      </div>

      {/* Talent Detail Modal */}
      <AnimatePresence>
        {selectedTalent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
              className="relative w-full max-w-2xl bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold text-xl uppercase">
                      {selectedTalent.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedTalent.name}</h2>
                      <p className="text-brand-mint font-medium">{selectedTalent.specialty}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTalent(null)}
                    className="p-2 rounded-full hover:bg-white/5 text-brand-gray transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-brand-gray">
                      <Mail size={18} className="text-brand-mint" />
                      <span className="text-sm">{selectedTalent.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-brand-gray">
                      <Phone size={18} className="text-brand-mint" />
                      <span className="text-sm">{selectedTalent.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-brand-gray">
                      <Globe size={18} className="text-brand-mint" />
                      <span className="text-sm underline cursor-pointer">{selectedTalent.portfolio}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                      <div className="text-xs text-brand-gray mb-1">Expérience</div>
                      <div className="font-bold">{selectedTalent.experience}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                      <div className="text-xs text-brand-gray mb-1">Date de demande</div>
                      <div className="font-bold">{selectedTalent.date}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-[var(--border-color)] mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gray mb-4">Documents joints</h4>
                  <div className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-400/10 rounded-lg flex items-center justify-center text-red-400">
                        PDF
                      </div>
                      <span className="text-sm font-medium">CV_Thomas_K.pdf</span>
                    </div>
                    <button className="p-2 text-brand-gray hover:text-brand-mint transition-colors">
                      <Download size={18} />
                    </button>
                  </div>
                </div>

                {selectedTalent.status === 'pending' ? (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleUpdateStatus(selectedTalent.id, 'approved')}
                      className="flex-grow bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                    >
                      Approuver le talent
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedTalent.id, 'rejected')}
                      className="flex-grow bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                    >
                      Refuser
                    </button>
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl text-center font-bold uppercase tracking-widest ${
                    selectedTalent.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    Statut actuel : {selectedTalent.status === 'approved' ? 'Approuvé' : 'Refusé'}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Project Creation Modal */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProjectModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Nouveau Projet</h2>
                <button onClick={() => setIsProjectModalOpen(false)} className="text-brand-gray hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-brand-gray uppercase font-bold">Titre du projet</label>
                  <input 
                    required
                    type="text" 
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-brand-gray uppercase font-bold">Client</label>
                  <input 
                    required
                    type="text" 
                    value={newProject.client}
                    onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-brand-gray uppercase font-bold">Talent assigné</label>
                  <select 
                    required
                    value={newProject.talent}
                    onChange={(e) => setNewProject({...newProject, talent: e.target.value})}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
                  >
                    <option value="">Sélectionner un talent</option>
                    {requests.filter(r => r.status === 'approved').map(r => (
                      <option key={r.id} value={r.name}>{r.name} ({r.specialty})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-brand-gray uppercase font-bold">Budget</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. 1 500 €"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-brand-gray uppercase font-bold">Deadline</label>
                    <input 
                      required
                      type="text" 
                      placeholder="JJ/MM/AAAA"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-brand-mint text-[#0D1117] py-4 rounded-xl font-bold hover:scale-[1.02] transition-all mt-4">
                  Créer le projet
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
