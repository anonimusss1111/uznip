import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Application, Profile, Job } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, Briefcase, MessageSquare, CheckCircle, XCircle, Clock, MapPin, Phone, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function EmployerApplications() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<(Application & { worker?: Profile; job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    async function fetchApplications() {
      if (!profile?.uid) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'applications'),
          where('employerId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const appsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));

        // Fetch related data
        const combined = await Promise.all(appsData.map(async (app) => {
          const workerSnap = await getDocs(query(collection(db, 'profiles'), where('uid', '==', app.workerId)));
          const worker = workerSnap.docs[0]?.data() as Profile;
          
          const jobSnap = await getDocs(query(collection(db, 'jobs'), where('__name__', '==', app.jobId)));
          const job = jobSnap.docs[0]?.data() as Job;
          
          return { ...app, worker, job };
        }));

        setApplications(combined);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [profile]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus as any } : app));
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const filteredApps = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === filterStatus);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Arizalar boshqaruvi</h2>
            <p className="text-muted-foreground mt-2">Sizning eʻlonlaringizga kelib tushgan barcha arizalar.</p>
          </div>
          
          <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border">
            {['all', 'pending', 'accepted', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status === 'all' ? 'Barchasi' : status === 'pending' ? 'Kutilmoqda' : status === 'accepted' ? 'Qabul' : 'Rad etilgan'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-secondary/50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredApps.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Worker Info */}
                      <div className="flex items-start gap-4 min-w-[240px]">
                        <div className="w-16 h-16 rounded-2xl bg-secondary overflow-hidden border border-border">
                          {app.worker?.photoUrl ? (
                            <img src={app.worker.photoUrl} alt={app.worker.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <User size={32} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-foreground">{app.worker?.fullName || 'Nomaʻlum'}</h4>
                          <div className="flex items-center gap-1 text-amber-500 text-sm font-bold mt-1">
                            <Star size={14} fill="currentColor" />
                            <span>{app.worker?.rating || '0.0'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Link 
                              to={`/worker/${app.workerId}`}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Profilni koʻrish
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Application Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <Briefcase size={14} />
                          <span>Ish: {app.job?.title || 'Oʻchirilgan ish'}</span>
                        </div>
                        
                        <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50 italic text-muted-foreground text-sm leading-relaxed">
                          "{app.message}"
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {app.createdAt ? format(app.createdAt.toDate(), 'd-MMMM, HH:mm', { locale: uz }) : 'Yaqinda'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            {app.worker?.district}, {app.worker?.region}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(app.id, 'accepted')}
                              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                            >
                              <CheckCircle size={18} />
                              Qabul qilish
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(app.id, 'rejected')}
                              className="w-full py-3 bg-card text-destructive border border-destructive/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-destructive/5 transition-all"
                            >
                              <XCircle size={18} />
                              Rad etish
                            </button>
                          </>
                        ) : app.status === 'accepted' ? (
                          <Link
                            to={`/employer/create-contract?appId=${app.id}`}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                          >
                            <CheckCircle size={18} />
                            Shartnoma tuzish
                          </Link>
                        ) : (
                          <div className="py-3 bg-red-50 text-red-700 border border-red-100 rounded-xl font-bold flex items-center justify-center gap-2">
                            <XCircle size={18} />
                            Rad etilgan
                          </div>
                        )}
                        
                        <Link
                          to={`/chat?with=${app.workerId}`}
                          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                          <MessageSquare size={18} />
                          Chat boshlash
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-secondary/20 rounded-[40px] p-20 text-center border-2 border-dashed border-border">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground shadow-sm">
              <Briefcase size={40} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Arizalar topilmadi</h3>
            <p className="text-muted-foreground mt-2">Hozircha hech kim ariza topshirmagan.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
