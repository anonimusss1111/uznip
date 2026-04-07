import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Job, Profile, Contract, Dispute, VerificationRequest, ServicePost } from '../../types';
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  ChevronRight,
  UserCheck,
  FileText,
  Activity,
  ShieldAlert,
  Settings,
  Database
} from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function SuperAdminDashboard() {
  const { profile, isDemo } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkers: 0,
    totalEmployers: 0,
    totalJobs: 0,
    totalServicePosts: 0,
    totalContracts: 0,
    totalDisputes: 0,
    pendingVerifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuperAdminData() {
      if (profile?.role !== 'super_admin') return;

      if (isDemo) {
        setStats({
          totalUsers: 1240,
          totalWorkers: 820,
          totalEmployers: 420,
          totalJobs: 560,
          totalServicePosts: 340,
          totalContracts: 280,
          totalDisputes: 12,
          pendingVerifications: 45
        });
        setLoading(false);
        return;
      }

      try {
        const usersSnap = await getDocs(collection(db, 'profiles'));
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        const servicePostsSnap = await getDocs(collection(db, 'service_posts'));
        const contractsSnap = await getDocs(collection(db, 'contracts'));
        const verificationsSnap = await getDocs(query(collection(db, 'verification_requests'), where('status', '==', 'pending')));
        const disputesSnap = await getDocs(collection(db, 'disputes'));

        const users = usersSnap.docs.map(d => d.data());

        setStats({
          totalUsers: users.length,
          totalWorkers: users.filter(u => u.role === 'worker').length,
          totalEmployers: users.filter(u => u.role === 'employer').length,
          totalJobs: jobsSnap.docs.length,
          totalServicePosts: servicePostsSnap.docs.length,
          totalContracts: contractsSnap.docs.length,
          totalDisputes: disputesSnap.docs.length,
          pendingVerifications: verificationsSnap.docs.length
        });

      } catch (error) {
        console.error('Error fetching super admin data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSuperAdminData();
  }, [profile]);

  const statCards = [
    { label: 'Barcha foydalanuvchilar', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Ishchilar', value: stats.totalWorkers, icon: UserCheck, color: 'bg-indigo-500' },
    { label: 'Ish beruvchilar', value: stats.totalEmployers, icon: Briefcase, color: 'bg-purple-500' },
    { label: 'Eʻlonlar (Ishlar)', value: stats.totalJobs, icon: FileText, color: 'bg-green-500' },
    { label: 'Xizmatlar', value: stats.totalServicePosts, icon: Activity, color: 'bg-amber-500' },
    { label: 'Shartnomalar', value: stats.totalContracts, icon: CheckCircle, color: 'bg-teal-500' },
    { label: 'Nizolar', value: stats.totalDisputes, icon: AlertTriangle, color: 'bg-destructive' },
    { label: 'Tasdiqlash kutilmoqda', value: stats.pendingVerifications, icon: ShieldCheck, color: 'bg-orange-500' },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Super Admin Boshqaruvi</h2>
            <p className="text-muted-foreground mt-2">Platformaning toʻliq nazorati va global tahlili.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-secondary text-foreground rounded-2xl font-bold hover:bg-accent transition-all flex items-center gap-2">
              <Database className="w-5 h-5" />
              Maʻlumotlar bazasi
            </button>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all duration-200 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Tizim sozlamalari
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col gap-4">
                <div className={`${stat.color} p-3 rounded-2xl text-white w-fit shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{loading ? '...' : stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Platforma oʻsishi (Oxirgi 6 oy)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Okt', users: 120, jobs: 80 },
                  { name: 'Noy', users: 180, jobs: 110 },
                  { name: 'Dek', users: 250, jobs: 160 },
                  { name: 'Yan', users: 380, jobs: 240 },
                  { name: 'Fev', users: 520, jobs: 320 },
                  { name: 'Mar', users: 700, jobs: 450 },
                ]}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                  <Area type="monotone" dataKey="jobs" stroke="#8b5cf6" fillOpacity={0} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Xavfsizlik va Moderatsiya
            </h3>
            <div className="space-y-6">
              <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-destructive">Shubhali faollik</span>
                  <span className="text-xs font-bold bg-destructive text-white px-2 py-0.5 rounded-full">12 ta</span>
                </div>
                <p className="text-xs text-muted-foreground">Oxirgi 24 soat ichida tizim tomonidan aniqlangan shubhali urinishlar.</p>
              </div>
              
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-amber-600">Moderatsiya kutilmoqda</span>
                  <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">45 ta</span>
                </div>
                <p className="text-xs text-muted-foreground">Yangi eʻlonlar va xizmatlar tekshirilishi kerak.</p>
              </div>

              <div className="pt-4 space-y-3">
                <h4 className="text-sm font-bold text-foreground">Adminlar faolligi</h4>
                {[
                  { name: 'Admin Ali', action: 'Eʻlonni oʻchirdi', time: '5 daqiqa avval' },
                  { name: 'Admin Vali', action: 'Foydalanuvchini tasdiqladi', time: '12 daqiqa avval' },
                  { name: 'Admin Gani', action: 'Nizoni hal qildi', time: '45 daqiqa avval' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{log.name}</span>
                    <span className="text-muted-foreground">{log.action}</span>
                    <span className="text-muted-foreground italic">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
