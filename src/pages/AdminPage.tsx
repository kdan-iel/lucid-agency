import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Building2,
  MessageSquare,
  Settings,
  LogOut,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  X,
  Mail,
  Phone,
  Globe,
  DollarSign,
  ChevronRight,
  Shield,
  Database,
  Eye,
  EyeOff,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { validatePassword } from '../utils/security';
import {
  type AdminContactRecord,
  type AdminFreelancerRecord,
  listAdminContacts,
  listAdminFreelancers,
  validateAdminFreelancer,
} from '../utils/remoteFunctions';
import { useTimeoutRegistry } from '../hooks/useTimeoutRegistry';
import { toErrorMessage } from '../utils/asyncTools';
import { toUserSafeMessage } from '../utils/authSession';

interface TalentRequest {
  id: string;
  name: string;
  specialty: string;
  date: string;
  status: 'pending' | 'validated' | 'rejected' | 'suspended';
  email: string;
  phone: string;
  phone_number?: string | null;
  tarif_jour?: number | null;
  onboarding_completed?: boolean | null;
  portfolio: string;
  experience: string;
  user_id: string;
}

interface ClientContact {
  id: string;
  name: string;
  firstName?: string | null;
  company: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  message: string;
  date: string;
  submittedAt?: string | null;
  status?: string | null;
}

type SettingsTab = 'main' | 'security' | 'system';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const ADMIN_BATCH_SIZE = 100;

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  t: (key: string) => string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function PaginationControls({
  page,
  pageSize,
  total,
  t,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-[var(--border-color)] pt-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 text-sm text-brand-gray sm:flex-row sm:items-center">
        <label className="flex items-center gap-2">
          <span>{t('admin.pagination.rowsPerPage')}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-mint"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <span>
          {total === 0
            ? t('admin.pagination.noResults')
            : `${start}-${end} ${t('admin.pagination.of')} ${total} ${t('admin.pagination.results')}`}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="text-sm text-brand-gray">
          {`${t('admin.pagination.page')} ${currentPage} ${t('admin.pagination.on')} ${totalPages}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-brand-gray transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('admin.pagination.previous')}
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-brand-gray transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('admin.pagination.next')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { t, lang } = useLanguage();
  const { forceLogout, profile, session, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('talents');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'validated' | 'rejected' | 'suspended'
  >('all');
  const [requests, setRequests] = useState<TalentRequest[]>([]);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [loadingTalents, setLoadingTalents] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [talentsError, setTalentsError] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [updatingTalentId, setUpdatingTalentId] = useState<string | null>(null);
  const [selectedTalent, setSelectedTalent] = useState<TalentRequest | null>(null);
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(null);
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('main');
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [talentsPage, setTalentsPage] = useState(1);
  const [talentsPageSize, setTalentsPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsPageSize, setContactsPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  const [settingsError, setSettingsError] = useState('');
  const { clearAll, schedule } = useTimeoutRegistry();
  const dateLocale = lang === 'FR' ? 'fr-FR' : 'en-US';

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString(dateLocale) : t('admin.common.na');

  const formatDateTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString(dateLocale) : t('admin.common.na');

  const normalizeContactStatus = (value?: string | null) => {
    if (!value?.trim()) return t('admin.common.na');

    return value
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const closeSelectedTalent = () => {
    setSelectedTalent(null);
    setIsRejectMode(false);
    setRejectionReason('');
    setRejectionError('');
  };

  const closeSelectedContact = () => {
    setSelectedContact(null);
  };

  const loadTalents = async () => {
    setLoadingTalents(true);
    setTalentsError('');

    try {
      if (!session?.access_token) {
        await forceLogout('invalid_session');
        return;
      }

      const allTalents: AdminFreelancerRecord[] = [];
      let offset = 0;

      while (true) {
        const response = await listAdminFreelancers(session.access_token, {
          limit: ADMIN_BATCH_SIZE,
          offset,
        });

        allTalents.push(...response.data);

        if (response.data.length === 0 || response.data.length < ADMIN_BATCH_SIZE) {
          break;
        }

        offset += response.data.length;
      }

      const mapped: TalentRequest[] = allTalents.map((freelancer) => ({
        id: freelancer.id,
        user_id: freelancer.user_id,
        name: freelancer.profiles?.full_name?.trim() || t('admin.common.na'),
        specialty: freelancer.specialite?.trim() || freelancer.domaine,
        date: formatDate(freelancer.created_at),
        status: freelancer.statut,
        email: freelancer.profiles?.email ?? '',
        phone: freelancer.phone_number ?? t('admin.common.na'),
        phone_number: freelancer.phone_number ?? null,
        tarif_jour: freelancer.tarif_jour ?? null,
        onboarding_completed: Boolean(freelancer.onboarding_completed),
        portfolio: freelancer.portfolio_url ?? t('admin.common.na'),
        experience: freelancer.bio ?? '',
      }));

      setRequests(mapped);
    } catch (err) {
      console.error('[AdminPage] talents load failure', {
        message: toErrorMessage(err, t('admin.error.loadTalents')),
      });
      setTalentsError(toUserSafeMessage(err, t('admin.error.loadTalents')));
    } finally {
      setLoadingTalents(false);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    setContactsError('');

    try {
      if (!session?.access_token) {
        await forceLogout('invalid_session');
        return;
      }

      const allContacts: AdminContactRecord[] = [];
      let offset = 0;

      while (true) {
        const response = await listAdminContacts(session.access_token, {
          limit: ADMIN_BATCH_SIZE,
          offset,
        });

        allContacts.push(...response.data);

        if (response.data.length === 0 || response.data.length < ADMIN_BATCH_SIZE) {
          break;
        }

        offset += response.data.length;
      }

      const mapped: ClientContact[] = allContacts.map((contact) => ({
        id: contact.id,
        name: contact.nom?.trim() || contact.name?.trim() || t('admin.common.na'),
        firstName: contact.prenom?.trim() || contact.first_name?.trim() || null,
        company: contact.entreprise?.trim() || contact.company?.trim() || t('admin.common.na'),
        email: contact.email?.trim() || t('admin.common.na'),
        phone: contact.phone_number?.trim() || contact.phone?.trim() || t('admin.common.na'),
        projectType:
          contact.type_projet?.trim() || contact.project_type?.trim() || t('admin.common.na'),
        budget: contact.budget_estime?.trim() || contact.budget?.trim() || t('admin.common.na'),
        message: contact.message?.trim() || t('admin.common.na'),
        date: formatDate(contact.created_at),
        submittedAt: contact.created_at ?? null,
        status: contact.status?.trim() || null,
      }));

      setContacts(mapped);
    } catch (err) {
      console.error('[AdminPage] contacts load failure', {
        message: toErrorMessage(err, t('admin.error.loadContacts')),
      });
      setContactsError(toUserSafeMessage(err, t('admin.error.loadContacts')));
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (!session?.access_token) return;
    void loadTalents();
    void loadContacts();
  }, [session?.access_token, lang]);

  useEffect(() => {
    setIsRejectMode(false);
    setRejectionReason('');
    setRejectionError('');
  }, [selectedTalent?.id]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'validated' | 'rejected',
    reason?: string
  ) => {
    try {
      if (!session?.access_token) {
        await forceLogout('invalid_session');
        return;
      }

      setUpdatingTalentId(id);
      setTalentsError('');
      setRejectionError('');

      await validateAdminFreelancer(session.access_token, id, newStatus, reason);

      setRequests((previous) =>
        previous.map((request) => (request.id === id ? { ...request, status: newStatus } : request))
      );

      if (selectedTalent?.id === id) {
        setSelectedTalent((previous) => (previous ? { ...previous, status: newStatus } : null));
      }

      if (newStatus === 'rejected') {
        setIsRejectMode(false);
        setRejectionReason('');
      }
    } catch (err) {
      console.error('[AdminPage] talent status failure', {
        message: toErrorMessage(err, t('admin.error.updateStatus')),
        id,
        newStatus,
      });
      const safeMessage = toUserSafeMessage(err, t('admin.error.updateStatus'));
      setTalentsError(safeMessage);
      if (newStatus === 'rejected') {
        setRejectionError(safeMessage);
      }
    } finally {
      setUpdatingTalentId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedTalent) return;

    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectionError(t('admin.reject.reasonRequired'));
      return;
    }

    await handleUpdateStatus(selectedTalent.id, 'rejected', trimmedReason);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    setSettingsError('');

    if (passwordForm.new !== passwordForm.confirm) {
      setSettingsError(t('admin.settings.security.errorMismatch'));
      return;
    }

    if (passwordForm.new.length < 8) {
      setSettingsError(t('admin.settings.security.errorMin'));
      return;
    }

    const passwordValidation = validatePassword(passwordForm.new);
    if (!passwordValidation.valid) {
      setSettingsError(
        t('admin.settings.security.errorInvalid').replace(
          '{{errors}}',
          passwordValidation.errors.join(', ')
        )
      );
      return;
    }

    setSettingsStatus('saving');

    try {
      await updatePassword(passwordForm.new);
      setSettingsStatus('success');
      setPasswordForm({ new: '', confirm: '' });
      schedule(() => {
        setSettingsStatus('idle');
        setActiveSettingsTab('main');
      }, 1500);
    } catch (err) {
      console.error('[AdminPage] password update failure', {
        message: toErrorMessage(err, t('admin.settings.security.error')),
      });
      setSettingsError(toUserSafeMessage(err, t('admin.settings.security.error')));
      setSettingsStatus('error');
    }
  };

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const matchSearch =
          request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' || request.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [requests, searchQuery, statusFilter]
  );

  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) => {
        const haystack = [
          contact.name,
          contact.company,
          contact.email,
          contact.phone,
          contact.projectType,
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(searchQuery.toLowerCase());
      }),
    [contacts, searchQuery]
  );

  const paginatedRequests = useMemo(
    () =>
      filteredRequests.slice((talentsPage - 1) * talentsPageSize, talentsPage * talentsPageSize),
    [filteredRequests, talentsPage, talentsPageSize]
  );

  const paginatedContacts = useMemo(
    () =>
      filteredContacts.slice(
        (contactsPage - 1) * contactsPageSize,
        contactsPage * contactsPageSize
      ),
    [filteredContacts, contactsPage, contactsPageSize]
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRequests.length / talentsPageSize));
    if (talentsPage > totalPages) {
      setTalentsPage(totalPages);
    }
  }, [filteredRequests.length, talentsPage, talentsPageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredContacts.length / contactsPageSize));
    if (contactsPage > totalPages) {
      setContactsPage(totalPages);
    }
  }, [filteredContacts.length, contactsPage, contactsPageSize]);

  const sidebarItems = [
    { id: 'talents', icon: <Users size={20} />, label: t('admin.nav.talents') },
    { id: 'clients', icon: <Building2 size={20} />, label: t('admin.nav.clients') },
    { id: 'messages', icon: <MessageSquare size={20} />, label: t('admin.nav.messages') },
    { id: 'settings', icon: <Settings size={20} />, label: t('admin.nav.settings') },
  ];

  const stats = [
    {
      id: 'talents',
      label: t('admin.stats.activeTalents'),
      value: requests.filter((request) => request.status === 'validated').length.toString(),
      color: 'text-brand-mint',
    },
    {
      id: 'clients',
      label: t('admin.stats.clients'),
      value: contacts.length.toString(),
      color: 'text-blue-400',
    },
    {
      id: 'pending',
      label: t('admin.stats.pendingRequests'),
      value: requests.filter((request) => request.status === 'pending').length.toString(),
      color: 'text-yellow-400',
    },
  ];

  const initials = (profile?.full_name ?? 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const renderTalents = () => (
    <div className="bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-xl font-bold">{t('admin.talents.title')}</h2>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTalentsPage(1);
              }}
              placeholder={t('admin.search.placeholder')}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(
                e.target.value as 'all' | 'pending' | 'validated' | 'rejected' | 'suspended'
              );
              setTalentsPage(1);
            }}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-sm text-brand-gray focus:outline-none"
          >
            <option value="all">{t('admin.filter.all')}</option>
            <option value="pending">{t('admin.filter.pending')}</option>
            <option value="validated">{t('admin.filter.validated')}</option>
            <option value="rejected">{t('admin.filter.rejected')}</option>
            <option value="suspended">{t('admin.filter.suspended')}</option>
          </select>
        </div>
      </div>

      {loadingTalents ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-mint mx-auto" />
        </div>
      ) : talentsError ? (
        <div className="text-center py-12 text-red-400">{talentsError}</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-brand-gray">
          {requests.length === 0
            ? t('admin.talents.empty.none')
            : t('admin.talents.empty.filtered')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-brand-gray text-sm">
                <th className="pb-4 font-medium">{t('admin.talents.table.talent')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.specialty')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.phone')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.dayRate')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.onboarding')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.date')}</th>
                <th className="pb-4 font-medium">{t('admin.talents.table.status')}</th>
                <th className="pb-4 font-medium text-right">{t('admin.talents.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {paginatedRequests.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-white/5 transition-all cursor-pointer"
                  onClick={() => setSelectedTalent(row)}
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-mint/20 flex items-center justify-center text-brand-mint font-bold text-xs">
                        {row.name.charAt(0)}
                      </div>
                      <span className="font-bold">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-brand-gray">{row.specialty}</td>
                  <td className="py-4 text-brand-gray">
                    {row.phone_number || t('admin.common.na')}
                  </td>
                  <td className="py-4 text-brand-gray">
                    {row.tarif_jour ? `${row.tarif_jour} FCFA` : t('admin.common.na')}
                  </td>
                  <td className="py-4 text-brand-gray">
                    {row.onboarding_completed
                      ? t('admin.onboarding.complete')
                      : t('admin.onboarding.incomplete')}
                  </td>
                  <td className="py-4 text-brand-gray">{row.date}</td>
                  <td className="py-4">
                    {row.status === 'validated' && (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase">
                        <CheckCircle size={14} />
                        {t('admin.status.approved')}
                      </span>
                    )}
                    {row.status === 'pending' && (
                      <span className="flex items-center gap-1 text-yellow-400 text-xs font-bold uppercase">
                        <Clock size={14} />
                        {t('admin.status.pending')}
                      </span>
                    )}
                    {row.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase">
                        <XCircle size={14} />
                        {t('admin.status.rejected')}
                      </span>
                    )}
                    {row.status === 'suspended' && (
                      <span className="flex items-center gap-1 text-orange-400 text-xs font-bold uppercase">
                        <XCircle size={14} />
                        {t('admin.status.suspended')}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      disabled={updatingTalentId === row.id}
                      className="p-2 rounded-lg hover:bg-white/10 text-brand-gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTalent(row);
                      }}
                      aria-label={t('admin.talents.table.actions')}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={talentsPage}
            pageSize={talentsPageSize}
            total={filteredRequests.length}
            t={t}
            onPageChange={setTalentsPage}
            onPageSizeChange={(pageSize) => {
              setTalentsPageSize(pageSize);
              setTalentsPage(1);
            }}
          />
        </div>
      )}
    </div>
  );

  const renderClients = () => (
    <div className="bg-[var(--bg-surface)] rounded-2xl md:rounded-3xl border border-[var(--border-color)] p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-xl font-bold">{t('admin.clients.title')}</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setContactsPage(1);
            }}
            placeholder={t('admin.search.placeholder')}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-mint w-full"
          />
        </div>
      </div>

      {loadingContacts ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-mint mx-auto" />
        </div>
      ) : contactsError ? (
        <div className="text-center py-12 text-red-400">{contactsError}</div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 text-brand-gray">
          {contacts.length === 0
            ? t('admin.clients.empty.none')
            : t('admin.clients.empty.filtered')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-brand-gray text-sm">
                <th className="pb-4 font-medium">{t('admin.clients.table.name')}</th>
                <th className="pb-4 font-medium">{t('admin.clients.table.company')}</th>
                <th className="pb-4 font-medium">{t('admin.clients.table.email')}</th>
                <th className="pb-4 font-medium">{t('admin.clients.table.phone')}</th>
                <th className="pb-4 font-medium">{t('admin.clients.table.projectType')}</th>
                <th className="pb-4 font-medium">{t('admin.clients.table.budget')}</th>
                <th className="pb-4 font-medium">{t('admin.clients.table.date')}</th>
                <th className="pb-4 font-medium text-right">{t('admin.clients.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {paginatedContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-white/5 transition-all align-top cursor-pointer"
                  onClick={() => setSelectedContact(contact)}
                >
                  <td className="py-4 font-bold">{contact.name}</td>
                  <td className="py-4 text-brand-gray">{contact.company}</td>
                  <td className="py-4 text-brand-gray">{contact.email}</td>
                  <td className="py-4 text-brand-gray">{contact.phone}</td>
                  <td className="py-4 text-brand-gray">{contact.projectType}</td>
                  <td className="py-4 text-brand-gray">{contact.budget}</td>
                  <td className="py-4 text-brand-gray">{contact.date}</td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContact(contact);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm font-medium text-brand-gray transition-all hover:bg-white/5"
                    >
                      <Eye size={16} />
                      {t('admin.clients.actions.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={contactsPage}
            pageSize={contactsPageSize}
            total={filteredContacts.length}
            t={t}
            onPageChange={setContactsPage}
            onPageSizeChange={(pageSize) => {
              setContactsPageSize(pageSize);
              setContactsPage(1);
            }}
          />
        </div>
      )}
    </div>
  );

  const renderMessages = () => {
    const approved = requests.filter((request) => request.status === 'validated');

    return (
      <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
        <h2 className="text-2xl font-bold mb-2">{t('admin.messages.title')}</h2>
        <p className="text-brand-gray mb-8">{t('admin.messages.subtitle')}</p>
        {approved.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[var(--border-color)] rounded-3xl text-brand-gray">
            {t('admin.messages.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approved.map((freelancer) => (
              <div
                key={freelancer.id}
                className="p-6 rounded-2xl border border-[var(--border-color)] bg-white/5 hover:border-brand-mint/30 transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold text-lg">
                    {freelancer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold">{freelancer.name}</h3>
                    <p className="text-xs text-brand-mint font-medium uppercase">
                      {freelancer.specialty}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-6 text-sm text-brand-gray">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-brand-mint" />
                    {freelancer.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-brand-mint" />
                    {freelancer.email || t('admin.common.na')}
                  </div>
                </div>
                {freelancer.phone_number ? (
                  <a
                    href={`https://wa.me/${freelancer.phone_number.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-brand-mint text-[#0D1117] py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    {t('admin.messages.openWhatsapp')}
                  </a>
                ) : (
                  <div className="w-full border border-[var(--border-color)] text-brand-gray py-3 rounded-xl font-bold text-sm text-center">
                    {t('admin.messages.noPhone')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          {activeSettingsTab === 'main' ? (
            t('admin.nav.settings')
          ) : (
            <button
              onClick={() => setActiveSettingsTab('main')}
              className="flex items-center gap-2 hover:text-brand-mint"
            >
              <ChevronRight className="rotate-180" size={24} />
              {activeSettingsTab === 'security' && t('admin.settings.security.label')}
              {activeSettingsTab === 'system' && t('admin.settings.system.label')}
            </button>
          )}
        </h2>
      </div>

      {activeSettingsTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              id: 'security',
              label: t('admin.settings.security.label'),
              desc: t('admin.settings.security.desc'),
              icon: <Shield size={20} />,
            },
            {
              id: 'system',
              label: t('admin.settings.system.label'),
              desc: t('admin.settings.system.desc'),
              icon: <Database size={20} />,
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveSettingsTab(item.id as 'security' | 'system')}
              className="p-6 rounded-2xl border border-[var(--border-color)] hover:border-brand-mint/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-brand-mint">{item.icon}</div>
                <h3 className="font-bold group-hover:text-brand-mint">{item.label}</h3>
              </div>
              <p className="text-sm text-brand-gray">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeSettingsTab === 'security' && (
        <form className="space-y-6 max-w-xl" onSubmit={handlePasswordChange}>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              {t('admin.settings.security.newLabel')}
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                placeholder={t('admin.settings.security.newPlaceholder')}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-mint"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray"
                aria-label={t('admin.settings.security.toggleVisibility')}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-brand-gray">
              {t('admin.settings.security.confirmLabel')}
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder={t('admin.settings.security.confirmPlaceholder')}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint"
            />
          </div>
          {settingsError && <p className="text-red-400 text-sm">{settingsError}</p>}
          {settingsStatus === 'success' && (
            <p className="text-brand-mint text-sm">{t('admin.settings.security.success')}</p>
          )}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={settingsStatus === 'saving'}
              className="bg-brand-mint text-[#0D1117] px-8 py-3 rounded-xl font-bold hover:scale-105 disabled:opacity-60"
            >
              {settingsStatus === 'saving'
                ? t('admin.settings.security.saving')
                : t('admin.settings.security.submit')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('main')}
              className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {activeSettingsTab === 'system' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: t('admin.settings.system.totalTalents'),
                value: requests.length.toString(),
                color: 'text-brand-mint',
              },
              {
                label: t('admin.settings.system.validatedTalents'),
                value: requests
                  .filter((request) => request.status === 'validated')
                  .length.toString(),
                color: 'text-green-400',
              },
              {
                label: t('admin.settings.system.pendingTalents'),
                value: requests.filter((request) => request.status === 'pending').length.toString(),
                color: 'text-yellow-400',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl border border-[var(--border-color)] bg-white/5"
              >
                <p className="text-xs text-brand-gray mb-1">{item.label}</p>
                <p className={`font-bold text-2xl ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveSettingsTab('main')}
            className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5"
          >
            {t('admin.settings.back')}
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'talents':
        return renderTalents();
      case 'clients':
        return renderClients();
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

        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 border-r border-[var(--border-color)] bg-[var(--bg-primary)] md:bg-transparent transform transition-transform duration-300 p-6 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="flex justify-between items-center mb-8 md:hidden">
            <span className="text-brand-mint font-bold text-xl">LUCID</span>
            <button onClick={() => setIsSidebarOpen(false)} aria-label={t('common.close')}>
              <X size={24} className="text-brand-gray" />
            </button>
          </div>
          <nav className="space-y-2 h-full flex flex-col">
            <div className="flex-grow space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-brand-mint text-[#0D1117]' : 'hover:bg-white/5 text-brand-gray'}`}
                >
                  {item.icon}
                  <span className="font-bold">{item.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                void forceLogout('manual_logout').catch((error) => {
                  console.error('[AdminPage] logout failure', {
                    message: toErrorMessage(error),
                  });
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10"
            >
              <LogOut size={20} />
              <span className="font-bold">{t('dashboard.nav.logout')}</span>
            </button>
          </nav>
        </aside>

        <main className="flex-grow p-4 md:p-8 w-full overflow-x-hidden">
          <header className="flex justify-between items-center gap-4 mb-8 md:mb-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/5 border border-[var(--border-color)] text-brand-mint"
                aria-label={t('common.menu')}
              >
                <Users size={20} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('admin.welcome')}</h1>
                <p className="text-brand-gray text-sm">{t('admin.welcome.sub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-[#0D1117] font-bold">
                {initials}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={`${stat.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  if (stat.id === 'pending') {
                    setActiveTab('talents');
                    setStatusFilter('pending');
                  } else if (stat.id === 'talents') {
                    setActiveTab('talents');
                    setStatusFilter('all');
                  } else {
                    setActiveTab('clients');
                  }
                }}
                className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-color)] cursor-pointer hover:border-brand-mint/50 transition-all group"
              >
                <div className="text-brand-gray text-sm font-medium mb-2">{stat.label}</div>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {renderContent()}
        </main>
      </div>

      <AnimatePresence>
        {selectedContact && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSelectedContact}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-2xl md:p-8"
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm uppercase tracking-[0.2em] text-brand-mint">
                    {t('admin.clients.modal.title')}
                  </p>
                  <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                  <p className="mt-1 text-sm text-brand-gray">
                    {formatDateTime(selectedContact.submittedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSelectedContact}
                  className="rounded-full p-2 text-brand-gray transition-all hover:bg-white/5"
                  aria-label={t('common.close')}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.table.name')}
                  </p>
                  <p className="font-semibold">{selectedContact.name}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.modal.firstName')}
                  </p>
                  <p className="font-semibold">
                    {selectedContact.firstName || t('admin.common.na')}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.table.email')}
                  </p>
                  <p className="font-semibold break-all">{selectedContact.email}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.table.phone')}
                  </p>
                  <p className="font-semibold">{selectedContact.phone}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.table.company')}
                  </p>
                  <p className="font-semibold">{selectedContact.company}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.table.projectType')}
                  </p>
                  <p className="font-semibold">{selectedContact.projectType}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.table.budget')}
                  </p>
                  <p className="font-semibold">{selectedContact.budget}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-color)] bg-white/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wide text-brand-gray">
                    {t('admin.clients.modal.status')}
                  </p>
                  <p className="font-semibold">{normalizeContactStatus(selectedContact.status)}</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-[var(--border-color)] bg-white/5 p-5">
                <p className="mb-2 text-xs uppercase tracking-wide text-brand-gray">
                  {t('admin.clients.modal.message')}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed text-brand-gray">
                  {selectedContact.message}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeSelectedContact}
                  className="rounded-xl border border-[var(--border-color)] px-5 py-3 font-medium text-brand-gray transition-all hover:bg-white/5"
                >
                  {t('common.close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTalent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSelectedTalent}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-mint/10 flex items-center justify-center text-brand-mint font-bold text-xl">
                    {selectedTalent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedTalent.name}</h2>
                    <p className="text-brand-mint font-medium">{selectedTalent.specialty}</p>
                  </div>
                </div>
                <button
                  onClick={closeSelectedTalent}
                  className="p-2 rounded-full hover:bg-white/5 text-brand-gray"
                  aria-label={t('common.close')}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-brand-gray">
                  <Mail size={18} className="text-brand-mint" />
                  <span className="text-sm">{selectedTalent.email || t('admin.common.na')}</span>
                </div>
                <div className="flex items-center gap-3 text-brand-gray">
                  <Phone size={18} className="text-brand-mint" />
                  <span className="text-sm">
                    {selectedTalent.phone_number || selectedTalent.phone || t('admin.common.na')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-brand-gray">
                  <DollarSign size={18} className="text-brand-mint" />
                  <span className="text-sm">
                    {selectedTalent.tarif_jour
                      ? `${selectedTalent.tarif_jour} FCFA/jour`
                      : t('admin.common.na')}
                  </span>
                </div>
                {selectedTalent.portfolio !== t('admin.common.na') && (
                  <div className="flex items-center gap-3 text-brand-gray">
                    <Globe size={18} className="text-brand-mint" />
                    <a
                      href={selectedTalent.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline text-brand-mint"
                    >
                      {selectedTalent.portfolio}
                    </a>
                  </div>
                )}
              </div>

              {selectedTalent.status === 'pending' ? (
                isRejectMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-gray">
                        {t('admin.reject.reasonLabel')}
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => {
                          setRejectionReason(e.target.value);
                          if (rejectionError) setRejectionError('');
                        }}
                        rows={4}
                        placeholder={t('admin.reject.reasonPlaceholder')}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-brand-mint transition-all resize-none"
                      />
                    </div>
                    {rejectionError && <p className="text-red-400 text-sm">{rejectionError}</p>}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRejectMode(false);
                          setRejectionReason('');
                          setRejectionError('');
                        }}
                        className="flex-1 px-6 py-4 rounded-xl border border-[var(--border-color)] text-brand-gray font-bold hover:bg-white/5 transition-all"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        disabled={!rejectionReason.trim() || updatingTalentId === selectedTalent.id}
                        onClick={() => {
                          void handleConfirmReject();
                        }}
                        className="flex-1 bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-60 disabled:hover:bg-red-500"
                      >
                        {updatingTalentId === selectedTalent.id
                          ? t('admin.actions.processing')
                          : t('admin.reject.confirm')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      disabled={updatingTalentId === selectedTalent.id}
                      onClick={() => {
                        void handleUpdateStatus(selectedTalent.id, 'validated');
                      }}
                      className="flex-grow bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-all"
                    >
                      {updatingTalentId === selectedTalent.id
                        ? t('admin.actions.processing')
                        : t('admin.actions.approve')}
                    </button>
                    <button
                      disabled={updatingTalentId === selectedTalent.id}
                      onClick={() => setIsRejectMode(true)}
                      className="flex-grow bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-all"
                    >
                      {t('admin.actions.reject')}
                    </button>
                  </div>
                )
              ) : (
                <div
                  className={`p-4 rounded-xl text-center font-bold uppercase ${selectedTalent.status === 'validated' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : selectedTalent.status === 'suspended' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                >
                  {selectedTalent.status === 'validated'
                    ? t('admin.modal.validated')
                    : selectedTalent.status === 'suspended'
                      ? t('admin.modal.suspended')
                      : t('admin.modal.rejected')}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
