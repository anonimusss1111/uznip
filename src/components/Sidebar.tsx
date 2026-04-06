import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Search, 
  FileText, 
  MessageSquare, 
  User, 
  Bell, 
  ShieldCheck, 
  Settings,
  LogOut,
  Users,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  MapPin,
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

import { useTranslation } from 'react-i18next';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const menuItems = {
    worker: [
      { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/worker/dashboard' },
      { icon: MapPin, label: t('sidebar.nearby_jobs'), path: '/jobs?near=true' },
      { icon: Briefcase, label: t('sidebar.all_jobs'), path: '/jobs' },
      { icon: FileText, label: t('sidebar.my_services'), path: '/worker/service-posts' },
      { icon: FileText, label: t('sidebar.my_applications'), path: '/worker/applications' },
      { icon: CheckCircle, label: t('sidebar.contracts'), path: '/worker/contracts' },
      { icon: MessageSquare, label: t('sidebar.messages'), path: '/chat' },
      { icon: User, label: t('sidebar.profile'), path: '/my-profile' },
      { icon: Bell, label: t('sidebar.notifications'), path: '/notifications' },
    ],
    employer: [
      { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/employer/dashboard' },
      { icon: Briefcase, label: t('sidebar.post_job'), path: '/employer/create-job' },
      { icon: FileText, label: t('sidebar.my_jobs'), path: '/employer/jobs' },
      { icon: Users, label: t('sidebar.applicants'), path: '/employer/applicants' },
      { icon: Users, label: t('sidebar.worker_base'), path: '/workers' },
      { icon: Briefcase, label: t('sidebar.services'), path: '/employer/worker-services' },
      { icon: CheckCircle, label: t('sidebar.contracts'), path: '/employer/contracts' },
      { icon: MessageSquare, label: t('sidebar.messages'), path: '/chat' },
      { icon: User, label: t('sidebar.org_profile'), path: '/my-profile' },
      { icon: Bell, label: t('sidebar.notifications'), path: '/notifications' },
    ],
    admin: [
      { icon: BarChart3, label: t('sidebar.overview'), path: '/admin/dashboard' },
      { icon: Users, label: t('sidebar.users'), path: '/admin/users' },
      { icon: Briefcase, label: t('sidebar.jobs'), path: '/admin/jobs' },
      { icon: CheckCircle, label: t('sidebar.contracts'), path: '/admin/contracts' },
      { icon: AlertTriangle, label: t('sidebar.disputes'), path: '/admin/disputes' },
      { icon: ShieldCheck, label: t('sidebar.verification'), path: '/admin/verification' },
      { icon: BarChart3, label: t('sidebar.statistics'), path: '/statistics' },
      { icon: Settings, label: t('sidebar.settings'), path: '/admin/settings' },
    ],
    super_admin: [
      { icon: LayoutDashboard, label: t('sidebar.global_mgmt'), path: '/super-admin/dashboard' },
      { icon: Users, label: t('sidebar.all_users'), path: '/admin/users' },
      { icon: Briefcase, label: t('sidebar.all_jobs_admin'), path: '/admin/jobs' },
      { icon: ShieldCheck, label: t('sidebar.verification_queue'), path: '/admin/verification' },
      { icon: AlertTriangle, label: t('sidebar.disputes'), path: '/admin/disputes' },
      { icon: CheckCircle, label: t('sidebar.contract_audit'), path: '/admin/contracts' },
      { icon: Activity, label: t('sidebar.system_logs'), path: '/admin/logs' },
      { icon: Settings, label: t('sidebar.system_settings'), path: '/admin/settings' },
      { icon: MessageSquare, label: t('sidebar.messages'), path: '/chat' },
      { icon: Bell, label: t('sidebar.notifications'), path: '/notifications' },
    ]
  };

  const currentMenu = profile?.role ? menuItems[profile.role] : [];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex flex-col z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Briefcase className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">{t('common.branding_short')}</h1>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('common.national_platform')}</p>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {currentMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
              isActive 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 font-bold" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                <span className="text-sm tracking-wide">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800/50 space-y-3">
        <div className="bg-slate-800/30 rounded-[24px] p-4 border border-slate-800/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center overflow-hidden">
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">{profile?.fullName}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{t(`auth.${profile?.role}`)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800/50"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all border border-rose-500/10"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
