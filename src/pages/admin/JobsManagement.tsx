import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { Job, Profile } from '../../types';
import { 
  Briefcase, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    try {
      const jobsSnap = await getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')));
      setJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
    } catch (error) {
      console.error('Error fetching jobs:', error);
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
      console.error('Error updating job status:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!window.confirm('Haqiqatan ham ushbu ishni oʻchirib tashlamoqchimisiz?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.employerId.includes(search);
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || job.region === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

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
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Ishlarni boshqarish</h2>
            <p className="text-muted-foreground mt-2">Platformadagi barcha eʻlonlarni nazorat qilish.</p>
          </div>
          <div className="flex items-center gap-2 bg-card p-1 rounded-2xl border border-border shadow-sm">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Barchasi
            </button>
            <button 
              onClick={() => setStatusFilter('open')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'open' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Ochiq
            </button>
            <button 
              onClick={() => setStatusFilter('in-progress')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'in-progress' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Jarayonda
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Ish nomi yoki ish beruvchi ID orqali qidirish..."
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
            <option value="all">Barcha holatlar</option>
            <option value="open">Ochiq</option>
            <option value="filled">Toʻldirilgan</option>
            <option value="in-progress">Jarayonda</option>
            <option value="completed">Yakunlangan</option>
            <option value="closed">Yopilgan</option>
          </select>
        </div>

        {/* Jobs Table */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ish nomi</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Toifa / Hudud</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Narxi</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Holati</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Sana</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {loading ? (
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
                            <div className="text-xs font-bold text-foreground">{job.category}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin size={12} className="mr-1" />
                              {job.region}, {job.district}
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
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar size={12} className="mr-1" />
                            {job.createdAt ? format(job.createdAt.toDate(), 'dd MMM, yyyy', { locale: uz }) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => updateJobStatus(job.id, job.status === 'closed' ? 'open' : 'closed')}
                              className={`p-2 rounded-xl transition-all ${job.status === 'closed' ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
                              title={job.status === 'closed' ? "Ochish" : "Yopish"}
                            >
                              {job.status === 'closed' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            </button>
                            <button 
                              onClick={() => deleteJob(job.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                              title="Oʻchirish"
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
                        <h3 className="text-lg font-bold text-foreground">Ishlar topilmadi</h3>
                        <p className="text-muted-foreground">Qidiruv parametrlarini oʻzgartirib koʻring.</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
