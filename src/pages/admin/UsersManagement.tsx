import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Profile } from '../../types';
import { 
  Users, 
  Search, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { performanceUtils } from '../../lib/performance';

export default function UsersManagement() {
  const { t, i18n } = useTranslation();
  const { isDemo } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  
  // Pagination
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers(true);
  }, [roleFilter, verificationFilter]);

  async function fetchUsers(reset = false) {
    setLoading(true);
    if (isDemo) {
      setUsers([
        { uid: '1', fullName: 'Ali Valiyev', role: 'worker', region: 'Samarqand viloyati', isVerified: true, createdAt: { toDate: () => new Date() } as any } as any,
        { uid: '2', fullName: 'Olim Ganiyev', role: 'employer', region: 'Samarqand viloyati', isVerified: false, createdAt: { toDate: () => new Date() } as any } as any,
      ]);
      setLoading(false);
      return;
    }
    try {
      const constraints = [];
      if (roleFilter !== 'all') constraints.push(where('role', '==', roleFilter));
      if (verificationFilter === 'verified') constraints.push(where('isVerified', '==', true));
      if (verificationFilter === 'unverified') constraints.push(where('isVerified', '==', false));
      
      constraints.push(orderBy('createdAt', 'desc'));

      const q = performanceUtils.createPaginatedQuery(
        'profiles', 
        constraints, 
        pageSize, 
        reset ? undefined : (lastVisible || undefined)
      );

      const snap = await getDocs(q);
      const fetchedUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() } as Profile));
      
      if (reset) {
        setUsers(fetchedUsers);
        setPage(1);
      } else {
        setUsers(prev => [...prev, ...fetchedUsers]);
      }
      
      setLastVisible(snap.docs[snap.docs.length - 1] || null);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'profiles');
    } finally {
      setLoading(false);
    }
  }

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        isVerified: !currentStatus,
        verificationStatus: !currentStatus ? 'approved' : 'none'
      });
      setUsers(users.map(u => u.uid === userId ? { ...u, isVerified: !currentStatus, verificationStatus: !currentStatus ? 'approved' : 'none' } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${userId}`);
    }
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'en': return enUS;
      default: return uz;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.phoneNumber?.includes(search) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('admin.users.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('admin.users.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 bg-card p-1 rounded-2xl border border-border shadow-sm">
            {(['all', 'worker', 'employer'] as const).map((role) => (
              <button 
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === role ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t(`admin.users.${role}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder={t('admin.users.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-4 py-3.5 rounded-2xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none font-medium"
          >
            <option value="all">{t('admin.users.all_statuses')}</option>
            <option value="verified">{t('admin.users.verified')}</option>
            <option value="unverified">{t('admin.users.unverified')}</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.user')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.role_region')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.contact')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.date')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">{t('admin.users.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {loading && users.length === 0 ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-8">
                          <div className="h-4 bg-muted rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <motion.tr 
                        key={user.uid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm border border-blue-100">
                              {user.fullName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-foreground flex items-center gap-1">
                                {user.fullName}
                                {user.isVerified && <ShieldCheck size={14} className="text-blue-500" />}
                              </div>
                              <div className="text-xs text-muted-foreground">ID: {user.uid.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              user.role === 'admin' ? 'bg-red-100 text-red-600' :
                              user.role === 'employer' ? 'bg-green-100 text-green-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {t(`auth.${user.role}`)}
                            </span>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin size={12} className="mr-1" />
                              {user.region}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-foreground font-medium">
                              <Phone size={12} className="mr-1 text-muted-foreground" />
                              {user.phoneNumber || 'Nomaʻlum'}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Mail size={12} className="mr-1" />
                              {user.email || 'Nomaʻlum'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.isVerified ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                              <CheckCircle size={14} /> {t('admin.users.verified_status')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                              <Clock size={14} /> {t('admin.users.pending_status')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar size={12} className="mr-1" />
                            {user.createdAt ? format(user.createdAt.toDate(), 'dd MMM, yyyy', { locale: getDateLocale() }) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => toggleVerification(user.uid, user.isVerified)}
                              className={`p-2 rounded-xl transition-all ${user.isVerified ? 'text-amber-500 hover:bg-amber-50' : 'text-blue-500 hover:bg-blue-50'}`}
                              title={user.isVerified ? t('admin.users.unverify') : t('admin.users.verify')}
                            >
                              {user.isVerified ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                            </button>
                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title={t('admin.users.block')}>
                              <UserX size={20} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                          <Users size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{t('admin.users.not_found')}</h3>
                        <p className="text-muted-foreground">{t('admin.users.not_found_desc')}</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Load More */}
          {lastVisible && (
            <div className="p-6 border-t border-border flex justify-center">
              <button
                onClick={() => fetchUsers()}
                disabled={loading}
                className="px-6 py-2 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {loading ? t('common.loading') : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
