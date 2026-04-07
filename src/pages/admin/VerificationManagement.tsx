import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { VerificationRequest, Profile } from '../../types';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function VerificationManagement() {
  const { t, i18n } = useTranslation();
  const { isDemo } = useAuth();
  const [requests, setRequests] = useState<(VerificationRequest & { user?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  async function fetchRequests() {
    setLoading(true);
    if (isDemo) {
      setRequests([
        { 
          id: '1', 
          userId: 'demo_worker', 
          status: 'pending', 
          idPhotoUrl: 'https://picsum.photos/seed/id/400/300', 
          selfieUrl: 'https://picsum.photos/seed/selfie/400/300',
          createdAt: { toDate: () => new Date() } as any,
          user: { fullName: 'Demo Worker', role: 'worker', region: 'Samarqand viloyati' } as any
        }
      ]);
      setLoading(false);
      return;
    }
    try {
      let q = query(collection(db, 'verification_requests'), orderBy('createdAt', 'desc'));
      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
      }
      
      const snap = await getDocs(q);
      const requestsData = await Promise.all(snap.docs.map(async (d) => {
        const req = { id: d.id, ...d.data() } as VerificationRequest;
        const userSnap = await getDocs(query(collection(db, 'profiles'), where('uid', '==', req.userId)));
        const user = userSnap.docs[0]?.data() as Profile;
        return { ...req, user };
      }));
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDecision = async (requestId: string, userId: string, status: 'approved' | 'rejected') => {
    try {
      // Update request status
      await updateDoc(doc(db, 'verification_requests', requestId), { status });
      
      // Update user profile
      await updateDoc(doc(db, 'profiles', userId), {
        isVerified: status === 'approved',
        verificationStatus: status
      });
      
      setRequests(requests.map(r => r.id === requestId ? { ...r, status } : r));
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
  };

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'en': return enUS;
      default: return uz;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{t('admin.verification.title')}</h2>
            <p className="text-muted-foreground mt-2">{t('admin.verification.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 bg-card p-1 rounded-2xl border border-border shadow-sm">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('common.all')}
            </button>
            <button 
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'pending' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('common.pending')}
            </button>
            <button 
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'approved' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('common.approved')}
            </button>
          </div>
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-card h-96 rounded-3xl animate-pulse border border-border"></div>
              ))
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <motion.div 
                  key={req.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={req.user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user?.fullName || 'User')}`} 
                        alt="" 
                        className="w-12 h-12 rounded-2xl object-cover border border-border"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-foreground">{req.user?.fullName || t('common.unknown_user')}</h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {req.user?.role === 'worker' ? t('auth.worker') : t('auth.employer')} • {req.user?.region === 'Samarqand viloyati' ? t('common.region_name') : req.user?.region}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {req.createdAt ? format(req.createdAt.toDate(), 'dd MMM, yyyy', { locale: getDateLocale() }) : '-'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                        req.status === 'approved' ? 'bg-green-100 text-green-600' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {t(`common.${req.status}`)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('verification.id_document')}</p>
                        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border relative group">
                          <img src={req.idPhotoUrl} alt="ID" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <a href={req.idPhotoUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink size={20} className="text-white" />
                          </a>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('verification.selfie')}</p>
                        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border relative group">
                          <img src={req.selfieUrl} alt="Selfie" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <a href={req.selfieUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink size={20} className="text-white" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="p-6 bg-muted/30 border-t border-border grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleDecision(req.id!, req.userId, 'rejected')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all"
                      >
                        <XCircle size={18} /> {t('common.reject')}
                      </button>
                      <button 
                        onClick={() => handleDecision(req.id!, req.userId, 'approved')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                      >
                        <CheckCircle size={18} /> {t('common.approve')}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-border">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{t('admin.verification.no_requests')}</h3>
                <p className="text-muted-foreground">{t('admin.verification.no_requests_desc')}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
