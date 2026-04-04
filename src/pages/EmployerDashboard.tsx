import React from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Job, Application } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Briefcase, Users, CheckCircle, XCircle, Trash2, Image as ImageIcon, X } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES } from '../constants/categories';
import { REGIONS, DISTRICTS } from '../constants/locations';

export default function EmployerDashboard() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isPosting, setIsPosting] = React.useState(false);
  const [newJob, setNewJob] = React.useState({
    title: '',
    description: '',
    category: '',
    price: '',
    region: '',
    district: '',
    neighborhood: ''
  });

  React.useEffect(() => {
    if (!user) return;

    const qJobs = query(collection(db, 'jobs'), where('employerId', '==', user.uid));
    const unsubscribeJobs = onSnapshot(qJobs, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    });

    const qApps = query(collection(db, 'applications'), where('status', '==', 'pending'));
    const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    });

    setLoading(false);
    return () => {
      unsubscribeJobs();
      unsubscribeApps();
    };
  }, [user]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        employerId: user.uid,
        price: Number(newJob.price),
        status: 'open',
        createdAt: serverTimestamp(),
        images: []
      });
      setIsPosting(false);
      setNewJob({
        title: '',
        description: '',
        category: '',
        price: '',
        region: '',
        district: '',
        neighborhood: ''
      });
    } catch (error) {
      console.error("Post job error:", error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Haqiqatan ham ushbu eʻlonni oʻchirmoqchimisiz?')) {
      await deleteDoc(doc(db, 'jobs', jobId));
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    await updateDoc(doc(db, 'applications', appId), { status });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ish beruvchi paneli</h1>
            <p className="text-gray-500">Eʻlonlaringizni va arizalarni boshqaring.</p>
          </div>
          <button
            onClick={() => setIsPosting(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center shadow-xl hover:bg-blue-700 transition-all"
          >
            <Plus size={20} className="mr-2" /> Yangi ish qoʻshish
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jobs List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
              <Briefcase size={24} className="mr-2 text-blue-600" /> Mening eʻlonlarim
            </h2>
            {jobs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map(job => (
                  <div key={job.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{job.title}</h3>
                      <div className="text-xs text-gray-400 mt-1">{job.category} • {job.region}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-black text-blue-600">{job.price.toLocaleString()} soʻm</div>
                        <div className={`text-[10px] font-bold uppercase ${job.status === 'open' ? 'text-green-500' : 'text-gray-400'}`}>
                          {job.status === 'open' ? 'Faol' : 'Yopilgan'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <p className="text-gray-400">Hozircha eʻlonlar yoʻq.</p>
              </div>
            )}
          </div>

          {/* Applications */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
              <Users size={24} className="mr-2 text-green-600" /> Yangi arizalar
            </h2>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">Ishchi #{app.workerId.slice(0, 5)}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">Ariza topshirdi</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'accepted')}
                        className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-xs font-bold hover:bg-green-100 transition-all flex items-center justify-center"
                      >
                        <CheckCircle size={14} className="mr-1" /> Qabul qilish
                      </button>
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'rejected')}
                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center"
                      >
                        <XCircle size={14} className="mr-1" /> Rad etish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <p className="text-gray-400">Yangi arizalar yoʻq.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Job Modal */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Yangi ish eʻloni</h3>
                <button onClick={() => setIsPosting(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handlePostJob} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sarlavha</label>
                    <input
                      required
                      type="text"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Masalan: Uy tozalash xizmati"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Toifa</label>
                    <select
                      required
                      value={newJob.category}
                      onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Tanlang...</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Narxi (soʻm)</label>
                    <input
                      required
                      type="number"
                      value={newJob.price}
                      onChange={(e) => setNewJob({ ...newJob, price: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Viloyat</label>
                    <select
                      required
                      value={newJob.region}
                      onChange={(e) => setNewJob({ ...newJob, region: e.target.value, district: '' })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">Tanlang...</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tuman</label>
                    <select
                      required
                      disabled={!newJob.region}
                      value={newJob.district}
                      onChange={(e) => setNewJob({ ...newJob, district: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                    >
                      <option value="">Tanlang...</option>
                      {newJob.region && DISTRICTS[newJob.region]?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tavsif</label>
                    <textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      rows={4}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                      placeholder="Ish haqida batafsil maʻlumot bering..."
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl transition-all"
                  >
                    Eʻlonni joylashtirish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
