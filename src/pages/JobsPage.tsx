import React from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Job } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Filter, X, ChevronDown, SlidersHorizontal, Briefcase, Clock, DollarSign } from 'lucide-react';
import { REGIONS, DISTRICTS } from '../constants/locations';
import { CATEGORIES } from '../constants/categories';
import { DEMO_JOBS } from '../constants/demoData';
import Layout from '../components/Layout';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';
import ApplyModal from '../components/ApplyModal';

export default function JobsPage() {
  const { profile, isDemo } = useAuth();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState({
    region: '',
    district: '',
    category: '',
    sortBy: 'newest'
  });
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    // Always filter by Samarqand viloyati
    let q = query(
      collection(db, 'jobs'), 
      where('status', '==', 'open'),
      where('region', '==', 'Samarqand viloyati')
    );

    if (filters.district) {
      q = query(q, where('district', '==', filters.district));
    }
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      
      // Get custom demo jobs from session storage
      const customDemoJobs = JSON.parse(sessionStorage.getItem('custom_demo_jobs') || '[]');
      
      // Merge all jobs
      let allJobs = [...firestoreJobs, ...customDemoJobs];
      
      // If no real jobs and no custom demo jobs, use the full DEMO_JOBS seed
      if (allJobs.length === 0) {
        allJobs = [...DEMO_JOBS];
      }

      // Filter by search and filters (since demo jobs aren't filtered by Firestore)
      let filtered = allJobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                             job.description?.toLowerCase().includes(search.toLowerCase());
        // Always Samarkand
        const matchesRegion = job.region === 'Samarqand viloyati';
        const matchesDistrict = !filters.district || job.district === filters.district;
        const matchesCategory = !filters.category || job.category === filters.category;
        return matchesSearch && matchesRegion && matchesDistrict && matchesCategory;
      });

      // Client-side sorting
      if (filters.sortBy === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
      } else {
        // Default: newest
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt : 0) || 0;
          const dateB = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt : 0) || 0;
          return dateB - dateA;
        });
      }

      setJobs(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      handleFirestoreError(error, OperationType.LIST, 'jobs');
      
      // Fallback to demo jobs on error
      setJobs(DEMO_JOBS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filters, search]);

  const filteredJobs = jobs; // Filtering is now done inside useEffect for consistency with demo data

  const clearFilters = () => {
    setFilters({
      region: '',
      district: '',
      category: '',
      sortBy: 'newest'
    });
  };

  const useMyLocation = () => {
    if (profile?.region) {
      setFilters(prev => ({ ...prev, region: profile.region, district: profile.district || '' }));
    }
  };

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  return (
    <Layout>
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        job={selectedJob}
        profile={profile}
      />
      <div className="bg-slate-900 pt-16 pb-32 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 skew-x-12 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-emerald-500/5 -skew-x-12 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Oʻzingizga munosib <span className="text-blue-400">ishni toping</span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 font-medium max-w-xl">
              Oʻzbekiston boʻylab minglab ishonchli xonadonlar va tadbirkorlar oʻz ishlarini sizga ishonishga tayyor.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Ish qidirish (masalan: tozalash, repetitor...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-[24px] border-none focus:ring-4 focus:ring-blue-500/20 outline-none shadow-2xl text-lg bg-white transition-all"
                />
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-white/20 transition-all group"
              >
                <SlidersHorizontal size={20} className="mr-3 group-hover:rotate-180 transition-transform duration-500" />
                Filtrlar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-20">
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 mb-12 relative z-20"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tuman</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={filters.district}
                      onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700"
                    >
                      <option value="">Barcha tumanlar</option>
                      {DISTRICTS["Samarqand viloyati"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Toifa</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700"
                    >
                      <option value="">Barcha toifalar</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Saralash</label>
                  <div className="relative">
                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700"
                    >
                      <option value="newest">Eng yangi</option>
                      <option value="price-low">Eng arzon</option>
                      <option value="price-high">Eng qimmat</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  onClick={useMyLocation}
                  className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center hover:text-blue-700 transition-colors"
                >
                  <MapPin size={16} className="mr-2" /> Yaqindagi ishlar
                </button>
                <button
                  onClick={clearFilters}
                  className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
            <div className="text-slate-500 font-bold tracking-tight">
              {loading ? 'Yuklanmoqda...' : `${filteredJobs.length} ta ish topildi`}
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {filters.region && (
              <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center border border-blue-100">
                {filters.region} <X size={14} className="ml-2 cursor-pointer hover:text-blue-800" onClick={() => setFilters({...filters, region: '', district: ''})} />
              </span>
            )}
            {filters.category && (
              <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center border border-emerald-100">
                {filters.category} <X size={14} className="ml-2 cursor-pointer hover:text-emerald-800" onClick={() => setFilters({...filters, category: ''})} />
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white h-[400px] rounded-[32px] animate-pulse border border-slate-100 shadow-sm"></div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map(job => (
              <JobCard key={job.id} job={job} onApply={() => handleApply(job)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[48px] p-20 text-center border border-slate-100 shadow-2xl">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Search size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Hech qanday ish topilmadi</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">Qidiruv parametrlarini oʻzgartirib koʻring yoki boshqa toifadagi ishlarni qidiring.</p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
            >
              Filtrlarni tozalash
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
