import React from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Profile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { REGIONS, DISTRICTS } from '../constants/locations';
import { SKILLS } from '../constants/categories';
import Layout from '../components/Layout';
import WorkerCard from '../components/WorkerCard';
import { useAuth } from '../hooks/useAuth';
import { getDistrictKey, cn } from '../lib/utils';

import { useTranslation } from 'react-i18next';

export default function WorkersPage() {
  const { profile: myProfile } = useAuth();
  const { t } = useTranslation();
  const [workers, setWorkers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState({
    region: '',
    district: '',
    skill: '',
    sortBy: 'rating'
  });
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  React.useEffect(() => {
    // Always filter by worker role and Samarqand viloyati
    let q = query(
      collection(db, 'profiles'), 
      where('role', '==', 'worker'),
      where('region', '==', 'Samarqand viloyati')
    );

    if (filters.district) {
      q = query(q, where('district', '==', filters.district));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let workersData = snapshot.docs.map(doc => ({ ...doc.data() } as Profile));
      
      // Client-side skill filtering
      if (filters.skill) {
        workersData = workersData.filter(w => w.skills?.includes(filters.skill));
      }

      // Client-side sorting
      if (filters.sortBy === 'rating') {
        workersData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'completed') {
        workersData.sort((a, b) => (b.completedJobs || 0) - (a.completedJobs || 0));
      }

      setWorkers(workersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filters]);

  const filteredWorkers = workers.filter(worker => 
    worker.fullName.toLowerCase().includes(search.toLowerCase()) ||
    worker.bio?.toLowerCase().includes(search.toLowerCase())
  );

  const clearFilters = () => {
    setFilters({
      region: '',
      district: '',
      skill: '',
      sortBy: 'rating'
    });
  };

  return (
    <Layout>
      <div className="relative bg-slate-900 pt-24 pb-32 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                {t('workers.subtitle')}
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight leading-[1.1]">
                {t('workers.title')}
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder={t('workers.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all text-lg font-medium backdrop-blur-xl"
                />
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center transition-all duration-500 border backdrop-blur-xl",
                  isFilterOpen 
                    ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/40" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                <SlidersHorizontal size={20} className={cn("mr-3 transition-transform duration-500", isFilterOpen && "rotate-180")} />
                {t('workers.filters')}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('workers.district')}</label>
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{t('workers.all')}</option>
                    {DISTRICTS["Samarqand viloyati"].map(d => <option key={d} value={d}>{t(`districts.${getDistrictKey(d)}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('workers.skill')}</label>
                  <select
                    value={filters.skill}
                    onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{t('workers.all')}</option>
                    {SKILLS.map(s => <option key={s.id} value={s.id}>{t(`skills.${s.id}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('workers.sort_by')}</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="rating">{t('workers.by_rating')}</option>
                    <option value="completed">{t('workers.by_completed')}</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-gray-400 text-sm font-bold hover:text-gray-600"
                >
                  {t('workers.clear_filters')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8">
          <div className="text-gray-500 font-medium">
            {loading ? t('workers.loading') : t('workers.found_workers', { count: filteredWorkers.length })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white h-64 rounded-3xl animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : filteredWorkers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map(worker => (
              <WorkerCard key={worker.uid} worker={worker} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('workers.no_workers_found')}</h3>
            <p className="text-gray-500">{t('workers.no_workers_desc')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
