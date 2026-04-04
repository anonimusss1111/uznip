import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { Job, Application, Profile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  ChevronLeft, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  User,
  MessageSquare,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function EmployerJobDetails() {
  const { jobId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<(Application & { worker?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    async function fetchJobAndApplicants() {
      if (!jobId || !profile?.uid) return;
      setLoading(true);
      try {
        const jobSnap = await getDoc(doc(db, 'jobs', jobId));
        if (!jobSnap.exists() || jobSnap.data().employerId !== profile.uid) {
          navigate('/employer/dashboard');
          return;
        }
        setJob({ id: jobSnap.id, ...jobSnap.data() } as Job);

        const appsQuery = query(collection(db, 'applications'), where('jobId', '==', jobId));
        const appsSnap = await getDocs(appsQuery);
        const appsData = await Promise.all(appsSnap.docs.map(async (d) => {
          const app = { id: d.id, ...d.data() } as Application;
          const workerSnap = await getDocs(query(collection(db, 'profiles'), where('uid', '==', app.workerId)));
          const worker = workerSnap.docs[0]?.data() as Profile;
          return { ...app, worker };
        }));
        setApplications(appsData);
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobAndApplicants();
  }, [jobId, profile, navigate]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), { status: newStatus });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus as any } : app));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobId || !window.confirm('Haqiqatan ham ushbu ishni oʻchirmoqchimisiz?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      navigate('/employer/dashboard');
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  if (loading) return <DashboardLayout><div className="p-8 animate-pulse">Yuklanmoqda...</div></DashboardLayout>;
  if (!job) return <DashboardLayout><div className="p-8">Ish topilmadi.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors">
            <ChevronLeft size={20} />
            Orqaga qaytish
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-3 bg-card rounded-2xl border border-border hover:bg-secondary transition-all"
            >
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden"
                >
                  <button className="w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-3 hover:bg-secondary transition-all">
                    <Edit size={16} /> Tahrirlash
                  </button>
                  <button 
                    onClick={handleDeleteJob}
                    className="w-full px-4 py-3 text-left text-sm font-bold flex items-center gap-3 text-destructive hover:bg-destructive/5 transition-all"
                  >
                    <Trash2 size={16} /> Oʻchirish
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-[40px] border border-border p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
                  {job.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  job.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {job.status === 'open' ? 'Faol' : 'Yopilgan'}
                </span>
              </div>
              
              <h1 className="text-4xl font-black text-foreground tracking-tight mb-6">{job.title}</h1>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manzil</p>
                    <p className="text-sm font-bold">{job.district}, {job.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ish haqi</p>
                    <p className="text-sm font-bold">{job.price.toLocaleString()} UZS</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sana</p>
                    <p className="text-sm font-bold">{format(job.createdAt?.toDate?.() || new Date(), 'd MMM, yyyy', { locale: uz })}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Ish tavsifi</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </div>

            {/* Applicants List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  Arizalar ({applications.length})
                </h3>
              </div>

              <div className="space-y-4">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card p-6 rounded-3xl border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-secondary overflow-hidden border border-border">
                          {app.worker?.photoUrl ? (
                            <img src={app.worker.photoUrl} alt={app.worker.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <User size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-lg">{app.worker?.fullName}</h4>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-0.5">
                            <Star size={12} fill="currentColor" />
                            <span>{app.worker?.rating || '0.0'} ({app.worker?.reviewCount || 0})</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-1 italic">"{app.message}"</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(app.id, 'accepted')}
                              className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all"
                            >
                              Qabul
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(app.id, 'rejected')}
                              className="flex-1 md:flex-none px-6 py-2.5 bg-secondary text-destructive rounded-xl font-bold text-sm hover:bg-destructive/5 transition-all"
                            >
                              Rad etish
                            </button>
                          </>
                        ) : (
                          <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${
                            app.status === 'accepted' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {app.status === 'accepted' ? 'Qabul qilindi' : 'Rad etildi'}
                          </div>
                        )}
                        <Link
                          to={`/chat?with=${app.workerId}`}
                          className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                          <MessageSquare size={20} />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-secondary/20 rounded-3xl p-12 text-center border-2 border-dashed border-border">
                    <p className="text-muted-foreground font-medium">Hozircha arizalar yoʻq.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Stats */}
          <div className="space-y-6">
            <div className="bg-card rounded-[32px] border border-border p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-foreground uppercase tracking-widest text-xs text-muted-foreground">Ish statistikasi</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Koʻrishlar soni</span>
                  <span className="font-bold">124</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Arizalar soni</span>
                  <span className="font-bold">{applications.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-green-600 font-bold">Faol</span>
                </div>
              </div>
              <div className="pt-6 border-t border-border">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
                  Ushbu ish eʻloni 30 kundan keyin avtomatik ravishda yopiladi.
                </p>
              </div>
            </div>

            <div className="bg-primary/5 rounded-[32px] border border-primary/20 p-6 space-y-4">
              <h4 className="font-bold text-primary">Maslahat</h4>
              <p className="text-sm text-primary/80 leading-relaxed">
                Ishchilarni tanlashda ularning reytingi va avvalgi ish beruvchilar fikrlariga eʻtibor bering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
