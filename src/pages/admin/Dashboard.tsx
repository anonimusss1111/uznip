import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Job, Profile, Contract, VerificationRequest } from '../../types';
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight,
  UserCheck,
  FileText,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { performanceUtils } from '../../lib/performance';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const { profile, isDemo } = useAuth();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalContracts: 0,
    pendingVerifications: 0,
    activeDisputes: 0
  });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;

      if (isDemo) {
        setStats({
          totalUsers: 850,
          totalJobs: 420,
          totalContracts: 180,
          pendingVerifications: 24,
          activeDisputes: 5
        });
        setRecentUsers([
          { uid: '1', fullName: 'Ali Valiyev', role: 'worker', region: 'Samarqand', createdAt: new Date().toISOString() } as any,
          { uid: '2', fullName: 'Olim Ganiyev', role: 'employer', region: 'Samarqand', createdAt: new Date().toISOString() } as any,
        ]);
        setRecentJobs([
          { id: '1', title: 'Bogʻbon kerak', price: 150000, status: 'open', createdAt: new Date().toISOString() } as any,
          { id: '2', title: 'Usta kerak', price: 200000, status: 'open', createdAt: new Date().toISOString() } as any,
        ]);
        setLoading(false);
        return;
      }

      try {
        // Fetch stats efficiently using getCountFromServer via performanceUtils
        const [
          usersCount, 
          jobsCount, 
          contractsCount, 
          verificationsCount, 
          disputesCount
        ] = await Promise.all([
          performanceUtils.getCollectionCount(collection(db, 'profiles')),
          performanceUtils.getCollectionCount(collection(db, 'jobs')),
          performanceUtils.getCollectionCount(collection(db, 'contracts')),
          performanceUtils.getCollectionCount(query(collection(db, 'verification_requests'), where('status', '==', 'pending'))),
          performanceUtils.getCollectionCount(query(collection(db, 'disputes'), where('status', '==', 'pending')))
        ]);

        setStats({
          totalUsers: usersCount,
          totalJobs: jobsCount,
          totalContracts: contractsCount,
          pendingVerifications: verificationsCount,
          activeDisputes: disputesCount
        });

        // Fetch recent users
        const recentUsersQuery = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'), limit(5));
        const recentUsersSnap = await getDocs(recentUsersQuery);
        setRecentUsers(recentUsersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as Profile)));

        // Fetch recent jobs
        const recentJobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(5));
        const recentJobsSnap = await getDocs(recentJobsQuery);
        setRecentJobs(recentJobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));

        // Fetch pending verifications
        const verificationsSnap = await getDocs(query(collection(db, 'verification_requests'), where('status', '==', 'pending'), limit(5)));
        setPendingVerifications(verificationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as VerificationRequest)));

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, [profile]);

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'en': return enUS;
      default: return uz;
    }
  };

  const statCards = [
    { label: t('admin.dashboard.total_users'), value: stats.totalUsers, icon: Users, color: 'bg-blue-600', shadow: 'shadow-blue-600/20' },
    { label: t('admin.dashboard.total_jobs'), value: stats.totalJobs, icon: Briefcase, color: 'bg-indigo-600', shadow: 'shadow-indigo-600/20' },
    { label: t('admin.dashboard.total_contracts'), value: stats.totalContracts, icon: CheckCircle, color: 'bg-emerald-600', shadow: 'shadow-emerald-600/20' },
    { label: t('admin.dashboard.pending_verifications'), value: stats.pendingVerifications, icon: ShieldCheck, color: 'bg-amber-600', shadow: 'shadow-amber-600/20' },
    { label: t('admin.dashboard.active_disputes'), value: stats.activeDisputes, icon: AlertTriangle, color: 'bg-rose-600', shadow: 'shadow-rose-600/20' },
  ];

  const chartData = [
    { name: 'Yan', jobs: 40, users: 24 },
    { name: 'Feb', jobs: 55, users: 35 },
    { name: 'Mar', jobs: 75, users: 50 },
    { name: 'Apr', jobs: 90, users: 65 },
  ];

  const COLORS = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#e11d48'];

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{t('admin.dashboard.title')}</h2>
            <p className="text-slate-500 mt-2 font-medium">{t('admin.dashboard.subtitle')}</p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-white text-slate-900 rounded-[24px] font-black uppercase tracking-widest border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
              {t('admin.dashboard.reports')}
            </button>
            <Link
              to="/admin/verification"
              className="px-8 py-4 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all duration-300"
            >
              {t('admin.dashboard.verify')}
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex flex-col gap-5">
                <div className={`${stat.color} p-4 rounded-2xl text-white w-fit shadow-xl ${stat.shadow} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              {t('admin.dashboard.growth')}
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  />
                  <Bar dataKey="jobs" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="users" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-emerald-500 rounded-full" />
              {t('admin.dashboard.user_distribution')}
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: t('admin.dashboard.workers'), value: 65 },
                      { name: t('admin.dashboard.employers'), value: 30 },
                      { name: t('admin.dashboard.admins'), value: 5 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Users */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 px-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              {t('admin.dashboard.recent_users')}
            </h3>
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-50">
                {recentUsers.map((u) => (
                  <div key={u.uid} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:border-blue-500/30 transition-colors">
                      <UserCheck className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{u.fullName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{u.role} • {u.region}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </div>
                ))}
              </div>
              <Link to="/admin/users" className="p-6 bg-slate-50/50 border-t border-slate-50 block text-center text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">
                {t('admin.dashboard.view_all_users')}
              </Link>
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 px-2">
              <div className="w-2 h-8 bg-indigo-600 rounded-full" />
              {t('admin.dashboard.recent_jobs')}
            </h3>
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-50">
                {recentJobs.map((j) => (
                  <div key={j.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:border-indigo-500/30 transition-colors">
                      <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{j.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{j.price.toLocaleString()} UZS • {j.status}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </div>
                ))}
              </div>
              <Link to="/admin/jobs" className="p-6 bg-slate-50/50 border-t border-slate-50 block text-center text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700">
                {t('admin.dashboard.view_all_jobs')}
              </Link>
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 px-2">
              <div className="w-2 h-8 bg-amber-500 rounded-full" />
              {t('admin.dashboard.pending_verifications')}
            </h3>
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
              {pendingVerifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {pendingVerifications.map((v) => (
                    <div key={v.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:border-amber-500/30 transition-colors">
                        <Clock className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate group-hover:text-amber-600 transition-colors">ID: {v.userId.slice(-6)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{format(v.createdAt?.toDate?.() || new Date(), 'd MMM', { locale: getDateLocale() })}</p>
                      </div>
                      <Link to={`/admin/verification/${v.id}`} className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                        <CheckCircle className="w-5 h-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <p className="text-sm text-slate-400 font-bold">{t('admin.dashboard.no_pending_requests')}</p>
                </div>
              )}
              <Link to="/admin/verification" className="p-6 bg-slate-50/50 border-t border-slate-50 block text-center text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700">
                {t('admin.dashboard.view_all_requests')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
