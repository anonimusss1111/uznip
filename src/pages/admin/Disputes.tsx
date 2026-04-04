import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, where, getDoc } from 'firebase/firestore';
import { Dispute, Profile, Contract } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle, XCircle, Clock, User, FileText, MessageSquare, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function AdminDisputes() {
  const { profile } = useAuth();
  const [disputes, setDisputes] = useState<(Dispute & { openedBy?: Profile; contract?: Contract })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDisputes() {
      if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;
      setLoading(true);
      try {
        const q = query(collection(db, 'disputes'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const disputesData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Dispute));

        const combined = await Promise.all(disputesData.map(async (dispute) => {
          const [userSnap, contractSnap] = await Promise.all([
            getDocs(query(collection(db, 'profiles'), where('uid', '==', dispute.openedById))),
            getDoc(doc(db, 'contracts', dispute.contractId))
          ]);

          return { 
            ...dispute, 
            openedBy: userSnap.docs[0]?.data() as Profile,
            contract: contractSnap.data() as Contract
          };
        }));

        setDisputes(combined);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'disputes');
      } finally {
        setLoading(false);
      }
    }

    fetchDisputes();
  }, [profile]);

  const handleResolve = async (disputeId: string, status: 'resolved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'disputes', disputeId), { status });
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status } : d));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `disputes/${disputeId}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Nizolar boshqaruvi</h2>
          <p className="text-muted-foreground mt-2">Platformadagi barcha nizolar va shikoyatlar.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-secondary/50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : disputes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {disputes.map((dispute) => (
                <motion.div
                  key={dispute.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Dispute Info */}
                      <div className="flex flex-col gap-4 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <ShieldAlert size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ochgan shaxs</p>
                            <p className="text-sm font-bold">{dispute.openedBy?.fullName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shartnoma ID</p>
                            <p className="text-sm font-bold">{dispute.contractId.slice(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Dispute Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span>Status: {dispute.status} • {format(dispute.createdAt?.toDate?.() || new Date(), 'd MMM, HH:mm', { locale: uz })}</span>
                        </div>
                        
                        <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50 text-muted-foreground text-sm leading-relaxed italic">
                          "{dispute.reason}"
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                        {dispute.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleResolve(dispute.id, 'resolved')}
                              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                            >
                              <CheckCircle size={18} />
                              Hal qilish
                            </button>
                            <button
                              onClick={() => handleResolve(dispute.id, 'rejected')}
                              className="w-full py-3 bg-card text-destructive border border-destructive/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-destructive/5 transition-all"
                            >
                              <XCircle size={18} />
                              Rad etish
                            </button>
                          </>
                        ) : (
                          <div className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                            dispute.status === 'resolved' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {dispute.status === 'resolved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                            {dispute.status === 'resolved' ? 'Hal qilingan' : 'Rad etilgan'}
                          </div>
                        )}
                        
                        <Link
                          to={`/contracts/${dispute.contractId}`}
                          className="w-full py-3 bg-card border border-border rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all"
                        >
                          <FileText size={18} />
                          Shartnomani koʻrish
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-secondary/20 rounded-[40px] p-20 text-center border-2 border-dashed border-border">
            <AlertTriangle size={40} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-foreground">Nizolar topilmadi</h3>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
