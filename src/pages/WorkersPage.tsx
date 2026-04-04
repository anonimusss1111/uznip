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

export default function WorkersPage() {
  const { profile: myProfile } = useAuth();
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
      <div className="bg-blue-600 pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white mb-8 tracking-tight">Malakali ishchilar</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-4 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Ishchilarni qidirish (ism, koʻnikma...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-400 outline-none shadow-lg text-lg"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <SlidersHorizontal size={20} className="mr-2" />
              Filtrlar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tuman</label>
                  <select
                    value={filters.district}
                    onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Barchasi</option>
                    {DISTRICTS["Samarqand viloyati"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Koʻnikma</label>
                  <select
                    value={filters.skill}
                    onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Barchasi</option>
                    {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saralash</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="rating">Reyting boʻyicha</option>
                    <option value="completed">Bajarilgan ishlar</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-gray-400 text-sm font-bold hover:text-gray-600"
                >
                  Filtrlarni tozalash
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8">
          <div className="text-gray-500 font-medium">
            {loading ? 'Yuklanmoqda...' : `${filteredWorkers.length} ta ishchi topildi`}
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hech narsa topilmadi</h3>
            <p className="text-gray-500">Qidiruv parametrlarini oʻzgartirib koʻring yoki filtrlarni tozalang.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
