import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Profile, Review } from '../types';
import { MapPin, Star, ShieldCheck, Award, MessageSquare, Phone, Calendar, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [worker, setWorker] = React.useState<Profile | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!userId) return;

    const fetchWorker = async () => {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWorker(docSnap.data() as Profile);
      }
      setLoading(false);
    };

    const q = query(collection(db, 'reviews'), where('workerId', '==', userId));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });

    fetchWorker();
    return () => unsubscribeReviews();
  }, [userId]);

  const startChat = () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    navigate(`/chat?with=${userId}`);
  };

  if (loading) return <Layout><div className="max-w-7xl mx-auto p-8 animate-pulse">Yuklanmoqda...</div></Layout>;
  if (!worker) return <Layout><div className="max-w-7xl mx-auto p-8">Ishchi topilmadi.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
          {/* Header/Cover */}
          <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-400 relative">
            <div className="absolute -bottom-16 left-12">
              <div className="w-32 h-32 rounded-[32px] border-4 border-white overflow-hidden shadow-2xl bg-white">
                <img
                  src={worker.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.fullName)}&background=random`}
                  alt={worker.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          <div className="pt-20 pb-12 px-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{worker.fullName}</h1>
                  {worker.isVerified && (
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-xl" title="Tasdiqlangan">
                      <ShieldCheck size={20} />
                    </div>
                  )}
                  {worker.rating && worker.rating >= 4.5 && (
                    <span className="bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                      <Award size={14} className="mr-1" /> TOP ISHCHI
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center text-gray-500 gap-4 mb-6">
                  <span className="flex items-center"><MapPin size={18} className="mr-1.5 text-gray-400" /> {worker.region}, {worker.district}</span>
                  <span className="flex items-center"><Star size={18} className="mr-1.5 text-yellow-500 fill-current" /> {worker.rating || 'Yangi'} ({worker.reviewCount || 0} ta baho)</span>
                  <span className="flex items-center"><Briefcase size={18} className="mr-1.5 text-gray-400" /> {worker.completedJobs || 0} ta bajarilgan ish</span>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Oʻzim haqimda</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {worker.bio || 'Avtobiografiya mavjud emas.'}
                  </p>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Koʻnikmalar</h3>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills?.map((skill, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-80 space-y-4">
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Bogʻlanish</div>
                  <button
                    onClick={startChat}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg mb-3"
                  >
                    <MessageSquare size={20} className="mr-2" /> Chat boshlash
                  </button>
                  <a
                    href={`tel:${worker.phoneNumber}`}
                    className="w-full bg-white text-gray-900 border border-gray-200 py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-gray-50 transition-all"
                  >
                    <Phone size={20} className="mr-2" /> Qoʻngʻiroq qilish
                  </a>
                </div>

                <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-blue-900">Tajriba darajasi</span>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{worker.experienceLevel}</span>
                  </div>
                  <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full" 
                      style={{ width: worker.experienceLevel === 'Professional' ? '100%' : worker.experienceLevel === 'Oʻrta' ? '60%' : '30%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-16 pt-12 border-t border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Ish beruvchilar fikrlari</h2>
              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=Employer&background=random`} alt="Employer" referrerPolicy="no-referrer" />
                          </div>
                          <span className="font-bold text-gray-900 text-sm">Ish beruvchi</span>
                        </div>
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? '' : 'text-gray-300'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm italic mb-4">"{review.comment}"</p>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {review.createdAt ? format(new Date(review.createdAt.seconds * 1000), 'd-MMMM, yyyy', { locale: uz }) : 'Yaqinda'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">Hozircha fikrlar yoʻq.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
