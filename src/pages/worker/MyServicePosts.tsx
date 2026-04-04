import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ServicePost } from '../../types';
import { Plus, Briefcase, MapPin, Clock, MoreVertical, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function MyServicePosts() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<ServicePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      if (!profile?.uid) return;
      try {
        const q = query(
          collection(db, 'service_posts'),
          where('workerId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePost)));
      } catch (error) {
        console.error('Error fetching service posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [profile]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Haqiqatan ham ushbu xizmatni oʻchirib tashlamoqchimisiz?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'service_posts', id));
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Mening xizmatlarim</h2>
            <p className="text-muted-foreground mt-2">Siz taklif qilayotgan xizmatlar roʻyxati.</p>
          </div>
          <Link
            to="/worker/create-service"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Yangi xizmat qoʻshish
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-secondary/50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="relative h-48 bg-secondary">
                    {post.images?.[0] ? (
                      <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="p-2 bg-white/90 dark:bg-black/90 rounded-xl text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                        post.status === 'active' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {post.status === 'active' ? 'Faol' : 'Yashirilgan'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-lg text-foreground line-clamp-1">{post.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{post.category}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{post.district}</span>
                      </div>
                      <div className="font-bold text-primary">
                        {post.expectedPrice.toLocaleString()} UZS
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(post.createdAt?.toDate?.() || new Date(), 'd MMM, yyyy', { locale: uz })}</span>
                      </div>
                      <Link 
                        to={`/worker/edit-service/${post.id}`}
                        className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                      >
                        <Edit2 className="w-4 h-4" />
                        Tahrirlash
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-secondary/20 rounded-3xl p-12 text-center border-2 border-dashed border-border">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground">Hali xizmatlar qoʻshilmagan</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Oʻz xizmatlaringizni eʻlon qiling va ish beruvchilar sizni oʻzlari topishsin.
            </p>
            <Link
              to="/worker/create-service"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold mt-8 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Birinchi xizmatni qoʻshish
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
