import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle, MessageSquare } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Job, Profile } from '../types';
import { useNavigate } from 'react-router-dom';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  profile: Profile | null;
}

export default function ApplyModal({ isOpen, onClose, job, profile }: ApplyModalProps) {
  const navigate = useNavigate();
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!job || !profile) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create application (Check for duplicates first in real mode)
      let applicationId = '';
      
      const isDemo = profile.uid.startsWith('demo_');

      if (isDemo) {
        applicationId = `demo-app-${Date.now()}`;
      } else {
        // Check if already applied
        const q = query(
          collection(db, 'applications'), 
          where('jobId', '==', job.id), 
          where('workerId', '==', profile.uid)
        );
        const existing = await getDocs(q);
        
        if (!existing.empty) {
          setError("Siz ushbu ishga allaqachon ariza topshirgansiz.");
          setLoading(false);
          return;
        }

        const appDoc = await addDoc(collection(db, 'applications'), {
          jobId: job.id,
          workerId: profile.uid,
          employerId: job.employerId,
          status: 'pending',
          message: message,
          createdAt: serverTimestamp()
        });
        applicationId = appDoc.id;
      }

      // Step 2: Create contract draft
      if (!isDemo) {
        await addDoc(collection(db, 'contracts'), {
          jobId: job.id,
          workerId: profile.uid,
          employerId: job.employerId,
          status: 'draft',
          price: job.price,
          title: job.title,
          createdAt: serverTimestamp()
        });
      }

      // Step 3: Send initial message
      if (!isDemo) {
        await addDoc(collection(db, 'chat_messages'), {
          senderId: profile.uid,
          receiverId: job.employerId,
          text: `Salom! Men "${job.title}" ishi boʻyicha ariza topshirdim. Xabarim: ${message}`,
          jobId: job.id,
          createdAt: serverTimestamp()
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setMessage('');
        navigate(`/chat?with=${job.employerId}&jobId=${job.id}`);
      }, 1500);
    } catch (err) {
      console.error("Application error:", err);
      setError("Xatolik yuz berdi. Iltimos, qaytadan urinib koʻring.");
      handleFirestoreError(err, OperationType.WRITE, 'applications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ariza topshirish</h2>
                  <p className="text-gray-500 text-sm mt-1">{job.title}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {success ? (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                    <Send size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Arizangiz yuborildi!</h3>
                  <p className="text-gray-500">Ish beruvchi arizangizni koʻrib chiqib, siz bilan bogʻlanadi.</p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start space-x-3">
                    <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      Ish beruvchiga oʻzingiz haqingizda qisqacha maʻlumot va nima uchun bu ishga mos ekanligingizni yozing.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sizning xabaringiz</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                      placeholder="Masalan: Salom, men ushbu ish boʻyicha tajribaga egaman..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl disabled:opacity-50"
                  >
                    {loading ? 'Yuborilmoqda...' : 'Arizani yuborish'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
