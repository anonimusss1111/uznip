import React from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { EmploymentStat } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, Users, MapPin, BarChart2, PieChart } from 'lucide-react';
import Layout from '../components/Layout';
import { DISTRICTS } from '../constants/locations';

export default function StatisticsPage() {
  const [stats, setStats] = React.useState<EmploymentStat[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // In a real app, we would fetch stats for Samarkand districts
    const q = query(collection(db, 'employment_stats'), where('region', '==', 'Samarqand viloyati'), orderBy('count', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmploymentStat)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mock data if empty - focus on Samarkand districts
  const displayStats = stats.length > 0 ? stats : DISTRICTS["Samarqand viloyati"].map((d, i) => ({
    id: i.toString(),
    region: d,
    count: Math.floor(Math.random() * 500) + 100
  })).sort((a, b) => b.count - a.count);

  const totalEmployed = displayStats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Bandlik statistikasi</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Platformamiz orqali ish bilan taʻminlangan fuqarolar haqidagi real vaqt rejimidagi maʻlumotlar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6">
              <Users size={32} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-2">{totalEmployed.toLocaleString()}</div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Jami ish bilan taʻminlanganlar</div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-6">
              <TrendingUp size={32} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-2">85%</div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Oylik oʻsish</div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 mx-auto mb-6">
              <MapPin size={32} />
            </div>
            <div className="text-4xl font-black text-gray-900 mb-2">{DISTRICTS["Samarqand viloyati"].length}</div>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Qamrab olingan tumanlar</div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
              <BarChart2 size={24} className="mr-2 text-blue-600" /> Tumanlar kesimida
            </h3>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hududiy koʻrsatkichlar</div>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {displayStats.map((stat, idx) => (
                <div key={stat.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-700">{stat.region}</span>
                    <span className="text-sm font-black text-blue-600">{stat.count} kishi</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.count / displayStats[0].count) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="bg-blue-600 h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
