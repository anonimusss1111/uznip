import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Job } from '../../types';
import { 
  Briefcase, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { performanceUtils } from '../../lib/performance';

export default function JobsManagement() {
  const { t, i18n } = useTranslation();
  const { isDemo } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchJobs(true);
  }, [statusFilter]);

  async function fetchJobs(reset = false) {
    setLoading(true);
    if (isDemo) {
      setJobs([
        { id: '1', title: 'Demo Job 1', category: 'construction', price: 500000, status: 'open', region: 'Samarqand viloyati', employerId: 'employer1', createdAt: { toDate: () => new Date() } as any } as any,
        { id: '2', title: 'Demo Job 2', category: 'cleaning', price: 200000, status: 'open', region: 'Samarqand viloyati', employerId: 'employer2', createdAt: { toDate: () => new Date() } as any } as any,
      ]);
      setLoading(false);
      return;
    }
    try {
      const constraints = [];
      if (statusFilter !== 'all') constraints.push(where('status', '==', statusFilter));
      
      constraints.push(orderBy('createdAt', 'desc'));

      const q = performanceUtils.createPaginatedQuery(
        'jobs', 
        constraints, 
        pageSize, 
        reset ? undefined : (lastVisible || undefined)
      );

      const snap = await getDocs(q);
      const fetchedJobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
      
      if (reset) {
        setJobs(fetchedJobs);
        setPage(1);
      } else {
        setJobs(prev => [...prev, ...fetchedJobs]);
      }
      
      setLastVisible(snap.docs[snap.docs.length - 1] || null);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    } finally {
      setLoading(false);
    }
  }

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: newStatus
      });
      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus as any } : j));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!window.confirm(t('admin.jobs.delete_confirm'))) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `jobs/${jobId}`);
    }
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'en': return enUS;
      default: return uz;
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.employerId.includes(search)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-600';
      case 'filled': return 'bg-blue-100 text-blue-600';
      case 'in-progress': return 'bg-amber-100 text-amber-600';
      case 'completed': return 'bg-purple-100 text-purple-600';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('admin.jobs.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('admin.jobs.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 bg-card p-1 rounded-2xl border border-border shadow-sm">
            {(['all', 'open', 'in_progress', 'closed'] as const).map((status) => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === status ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t(`admin.jobs.${status}`)}
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
              placeholder={t('admin.jobs.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3.5 rounded-2xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none font-medium"
          >
            <option value="all">{t('admin.jobs.all_statuses')}</option>
            <option value="open">{t('admin.jobs.open')}</option>
            <option value="filled">{t('admin.jobs.filled')}</option>
            <option value="in_progress">{t('admin.jobs.in_progress')}</option>
            <option value="completed">{t('admin.jobs.completed')}</option>
            <option value="closed">{t('admin.jobs.closed')}</option>
          </select>
        </div>

        {/* Jobs Table */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.jobs.table.title')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.jobs.table.cat_region')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.jobs.table.price')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.jobs.table.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.jobs.table.date')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">{t('admin.jobs.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {loading && jobs.length === 0 ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-8">
                          <div className="h-4 bg-muted rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <motion.tr 
                        key={job.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                              <Briefcase size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{job.title}</div>
                              <div className="text-xs text-muted-foreground">ID: {job.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-foreground">{t(`categories.${job.category}`)}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin size={12} className="mr-1" />
                              {job.region}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm font-bold text-foreground">
                            <DollarSign size={14} className="mr-0.5 text-green-600" />
                            {job.price.toLocaleString()} UZS
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(job.status)}`}>
                            {t(`admin.jobs.${job.status}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar size={12} className="mr-1" />
                            {job.createdAt ? format(job.createdAt.toDate(), 'dd MMM, yyyy', { locale: getDateLocale() }) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => updateJobStatus(job.id, job.status === 'closed' ? 'open' : 'closed')}
                              className={`p-2 rounded-xl transition-all ${job.status === 'closed' ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
                              title={job.status === 'closed' ? t('admin.jobs.open_job') : t('admin.jobs.close_job')}
                            >
                              {job.status === 'closed' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                            <button 
                              onClick={() => deleteJob(job.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                              title={t('admin.jobs.delete')}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                          <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{t('admin.jobs.not_found')}</h3>
                        <p className="text-muted-foreground">{t('admin.jobs.not_found_desc')}</p>
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
                onClick={() => fetchJobs()}
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
