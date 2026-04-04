import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { Profile } from '../../types';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function UsersManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const usersSnap = await getDocs(query(collection(db, 'profiles'), orderBy('createdAt', 'desc')));
      setUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as Profile)));
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.phoneNumber?.includes(search) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesVerification = verificationFilter === 'all' || 
      (verificationFilter === 'verified' && user.isVerified) ||
      (verificationFilter === 'unverified' && !user.isVerified);

    return matchesSearch && matchesRole && matchesVerification;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Foydalanuvchilarni boshqarish</h2>
            <p className="text-muted-foreground mt-2">Platformadagi barcha ishchi va ish beruvchilarni nazorat qilish.</p>
          </div>
          <div className="flex items-center gap-2 bg-card p-1 rounded-2xl border border-border shadow-sm">
            <button 
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Barchasi
            </button>
            <button 
              onClick={() => setRoleFilter('worker')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'worker' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Ishchilar
            </button>
            <button 
              onClick={() => setRoleFilter('employer')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'employer' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Ish beruvchilar
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Ism, telefon yoki email orqali qidirish..."
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
            <option value="all">Barcha holatlar</option>
            <option value="verified">Tasdiqlanganlar</option>
            <option value="unverified">Tasdiqlanmaganlar</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Foydalanuvchi</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rol / Hudud</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Kontakt</th>
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
                            <img 
                              src={user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}`} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover border border-border"
                            />
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
                              {user.role}
                            </span>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin size={12} className="mr-1" />
                              {user.region}, {user.district}
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
                              <CheckCircle size={14} /> Tasdiqlangan
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                              <Clock size={14} /> Kutilmoqda
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar size={12} className="mr-1" />
                            {user.createdAt ? format(user.createdAt.toDate(), 'dd MMM, yyyy', { locale: uz }) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => toggleVerification(user.uid, user.isVerified)}
                              className={`p-2 rounded-xl transition-all ${user.isVerified ? 'text-amber-500 hover:bg-amber-50' : 'text-blue-500 hover:bg-blue-50'}`}
                              title={user.isVerified ? "Tasdiqni bekor qilish" : "Tasdiqlash"}
                            >
                              {user.isVerified ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                            </button>
                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Bloklash">
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
                        <h3 className="text-lg font-bold text-foreground">Foydalanuvchilar topilmadi</h3>
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
