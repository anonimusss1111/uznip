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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = {
    worker: [
      { icon: LayoutDashboard, label: 'Boshqaruv paneli', path: '/worker/dashboard' },
      { icon: MapPin, label: 'Yaqindagi ishlar', path: '/jobs?near=true' },
      { icon: Briefcase, label: 'Barcha ishlar', path: '/jobs' },
      { icon: FileText, label: 'Xizmatlarim', path: '/worker/service-posts' },
      { icon: FileText, label: 'Arizalarim', path: '/worker/applications' },
      { icon: CheckCircle, label: 'Shartnomalar', path: '/worker/contracts' },
      { icon: MessageSquare, label: 'Xabarlar', path: '/chat' },
      { icon: User, label: 'Profilim', path: '/my-profile' },
      { icon: Bell, label: 'Bildirishnomalar', path: '/notifications' },
    ],
    employer: [
      { icon: LayoutDashboard, label: 'Boshqaruv paneli', path: '/employer/dashboard' },
      { icon: Briefcase, label: 'Ish eʼlon qilish', path: '/employer/create-job' },
      { icon: FileText, label: 'Eʼlonlarim', path: '/employer/jobs' },
      { icon: Users, label: 'Nomzodlar', path: '/employer/applicants' },
      { icon: Users, label: 'Ishchilar bazasi', path: '/workers' },
      { icon: Briefcase, label: 'Xizmatlar', path: '/employer/worker-services' },
      { icon: CheckCircle, label: 'Shartnomalar', path: '/employer/contracts' },
      { icon: MessageSquare, label: 'Xabarlar', path: '/chat' },
      { icon: User, label: 'Tashkilot profili', path: '/my-profile' },
      { icon: Bell, label: 'Bildirishnomalar', path: '/notifications' },
    ],
    admin: [
      { icon: BarChart3, label: 'Umumiy koʻrinish', path: '/admin/dashboard' },
      { icon: Users, label: 'Foydalanuvchilar', path: '/admin/users' },
      { icon: Briefcase, label: 'Ishlar', path: '/admin/jobs' },
      { icon: CheckCircle, label: 'Shartnomalar', path: '/admin/contracts' },
      { icon: AlertTriangle, label: 'Nizolar', path: '/admin/disputes' },
      { icon: ShieldCheck, label: 'Tasdiqlash', path: '/admin/verification' },
      { icon: BarChart3, label: 'Statistika', path: '/statistics' },
      { icon: Settings, label: 'Sozlamalar', path: '/admin/settings' },
    ],
    super_admin: [
      { icon: LayoutDashboard, label: 'Global boshqaruv', path: '/super-admin/dashboard' },
      { icon: Users, label: 'Barcha foydalanuvchilar', path: '/admin/users' },
      { icon: Briefcase, label: 'Barcha ishlar', path: '/admin/jobs' },
      { icon: ShieldCheck, label: 'Tasdiqlash navbati', path: '/admin/verification' },
      { icon: AlertTriangle, label: 'Nizolar', path: '/admin/disputes' },
      { icon: CheckCircle, label: 'Shartnomalar auditi', path: '/admin/contracts' },
      { icon: Activity, label: 'Tizim jurnallari', path: '/admin/logs' },
      { icon: Settings, label: 'Tizim sozlamalari', path: '/admin/settings' },
      { icon: MessageSquare, label: 'Xabarlar', path: '/chat' },
      { icon: Bell, label: 'Bildirishnomalar', path: '/notifications' },
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
          <h1 className="text-xl font-black text-white tracking-tight">QULAY ISH</h1>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Milliy ish platformasi</p>
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
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{profile?.role}</p>
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
