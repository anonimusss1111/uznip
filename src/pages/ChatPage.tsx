import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { ChatMessage, Profile, Job, Contract } from '../types';
import { Send, User, ChevronLeft, Phone, Info, MessageSquare, Briefcase, FileText, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get('with');
  const jobId = searchParams.get('jobId');
  
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [chatPartner, setChatPartner] = React.useState<Profile | null>(null);
  const [jobContext, setJobContext] = React.useState<Job | null>(null);
  const [contract, setContract] = React.useState<Contract | null>(null);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!withUserId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch partner
        if (withUserId.startsWith('demo_')) {
          setChatPartner({
            uid: withUserId,
            fullName: withUserId.replace('demo_', '').charAt(0).toUpperCase() + withUserId.slice(6),
            role: withUserId.includes('employer') ? 'employer' : 'worker',
            isVerified: true,
            createdAt: new Date().toISOString()
          } as Profile);
        } else {
          const docSnap = await getDoc(doc(db, 'profiles', withUserId));
          if (docSnap.exists()) {
            setChatPartner(docSnap.data() as Profile);
          }
        }

        // Fetch job context if available
        if (jobId) {
          if (jobId.startsWith('demo-')) {
            // Import DEMO_JOBS dynamically or just find it
            const { DEMO_JOBS } = await import('../constants/demoData');
            const job = DEMO_JOBS.find(j => j.id === jobId);
            if (job) setJobContext(job);
          } else {
            const jobSnap = await getDoc(doc(db, 'jobs', jobId));
            if (jobSnap.exists()) {
              setJobContext({ id: jobSnap.id, ...jobSnap.data() } as Job);
            }
          }
        }

        // Fetch contract if exists
        if (jobId && !jobId.startsWith('demo-')) {
          const contractQ = query(
            collection(db, 'contracts'),
            where('jobId', '==', jobId),
            where('workerId', 'in', [user.uid, withUserId]),
            where('employerId', 'in', [user.uid, withUserId])
          );
          const contractSnap = await getDocs(contractQ);
          if (!contractSnap.empty) {
            setContract({ id: contractSnap.docs[0].id, ...contractSnap.docs[0].data() } as Contract);
          }
        }
      } catch (err) {
        console.error("Error fetching chat data:", err);
      }
    };
    fetchData();

    // Query messages
    const q = query(
      collection(db, 'chat_messages'),
      where('senderId', 'in', [user.uid, withUserId]),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
        .filter(m => (m.senderId === user.uid && m.receiverId === withUserId) || (m.senderId === withUserId && m.receiverId === user.uid));
      
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chat_messages');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, withUserId, jobId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !withUserId) return;

    const text = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, 'chat_messages'), {
        senderId: user.uid,
        receiverId: withUserId,
        text,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  if (loading) return <Layout><div className="p-8">{t('common.loading')}...</div></Layout>;

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'en': return enUS;
      default: return uz;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)] flex flex-col">
        {!withUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[40px] border border-gray-100 shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
              <MessageSquare size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{t('chat.title')}</h2>
            <p className="text-gray-500 max-w-xs">{t('chat.no_chat_selected')}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full text-gray-400">
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img
                    src={chatPartner?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartner?.fullName || '')}&background=random`}
                    alt="Partner"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{chatPartner?.fullName}</h3>
                  <div className="flex items-center text-[10px] text-green-500 font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                    {t('chat.online')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a href={`tel:${chatPartner?.phoneNumber}`} className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors">
                  <Phone size={20} />
                </a>
                <button className="p-2 hover:bg-gray-50 text-gray-400 rounded-full transition-colors">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* Job Context & Contract Status */}
            {jobContext && (
              <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t('chat.job_context')}</p>
                    <p className="text-xs font-bold text-gray-900">{jobContext.title}</p>
                  </div>
                </div>
                {contract ? (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                    <FileText size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                      {t('chat.contract')}: {contract.status === 'draft' ? t('chat.contract_draft') : contract.status === 'active' ? t('chat.contract_active') : t('chat.contract_completed')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                    <Clock size={14} className="text-amber-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">{t('chat.application_pending')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{t('chat.no_messages')}</p>
                  <p className="text-xs text-gray-400">{t('chat.say_hello')}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-5 py-3 rounded-3xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div className={`text-[9px] mt-1 font-bold uppercase tracking-widest opacity-60 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                          {msg.createdAt ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : t('chat.now')}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-2 border border-gray-100 focus-within:border-blue-200 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:shadow-none"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
