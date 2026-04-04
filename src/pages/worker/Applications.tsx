import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Application, Job, Profile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Clock, MapPin, CheckCircle, XCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function WorkerApplications() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<(Application & { job?: Job; employer?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyApplications() {
      if (!profile?.uid) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'applications'),
          where('workerId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const appsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));

        const combined = await Promise.all(appsData.map(async (app) => {
          const jobSnap = await getDocs(query(collection(db, 'jobs'), where('__name__', '==', app.jobId)));
          const job = jobSnap.docs[0]?.data() as Job;
          
          const employerSnap = await getDocs(query(collection(db, 'profiles'), where('uid', '==', app.employerId)));
          const employer = employerSnap.docs[0]?.data() as Profile;
          
          return { ...app, job, employer };
        }));

        setApplications(combined);
      } catch (error) {
        console.error('Error fetching my applications:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMyApplications();
  }, [profile]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Mening arizalarim</h2>
          <p className="text-muted-foreground mt-2">Siz topshirgan barcha ish arizalari va ularning holati.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-secondary/50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : applications.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {applications.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden hover:shadow-md transition-all group"
                >
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Briefcase size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {app.job?.title || 'Oʻchirilgan ish'}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-1">
                              <span className="flex items-center gap-1"><MapPin size={14} /> {app.job?.district}, {app.job?.region}</span>
                              <span className="flex items-center gap-1"><Clock size={14} /> {app.createdAt ? format(app.createdAt.toDate(), 'd MMM, HH:mm', { locale: uz }) : 'Yaqinda'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 text-sm text-muted-foreground line-clamp-2">
                          "{app.message}"
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-4 min-w-[180px]">
                        <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                          app.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          app.status === 'accepted' ? 'bg-green-50 text-green-600 border border-green-100' :
                          'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {app.status === 'pending' ? <Clock size={14} /> : 
                           app.status === 'accepted' ? <CheckCircle size={14} /> : 
                           <XCircle size={14} />}
                          {app.status === 'pending' ? 'Kutilmoqda' : 
                           app.status === 'accepted' ? 'Qabul qilindi' : 
                           'Rad etildi'}
                        </div>

                        <div className="flex gap-2 w-full">
                          <Link
                            to={`/chat?with=${app.employerId}`}
                            className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent transition-all"
                          >
                            <MessageSquare size={18} />
                            Chat
                          </Link>
                          <Link
                            to={`/jobs`}
                            className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-secondary/20 rounded-[40px] p-20 text-center border-2 border-dashed border-border">
            <Briefcase size={40} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground">Arizalar topilmadi</h3>
            <p className="text-muted-foreground mt-2">Hali hech qanday ishga ariza topshirmagansiz.</p>
            <Link
              to="/jobs"
              className="mt-6 inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Ish qidirishni boshlash
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
