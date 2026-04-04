import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Contract, Profile, Job } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, User, Briefcase, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function AdminContracts() {
  const { profile } = useAuth();
  const [contracts, setContracts] = useState<(Contract & { employer?: Profile; worker?: Profile; job?: Job })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContracts() {
      if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;
      setLoading(true);
      try {
        const q = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const contractsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Contract));

        const combined = await Promise.all(contractsData.map(async (contract) => {
          const [employerSnap, workerSnap, jobSnap] = await Promise.all([
            getDocs(query(collection(db, 'profiles'), where('uid', '==', contract.employerId))),
            getDocs(query(collection(db, 'profiles'), where('uid', '==', contract.workerId))),
            getDocs(query(collection(db, 'jobs'), where('__name__', '==', contract.jobId)))
          ]);

          return { 
            ...contract, 
            employer: employerSnap.docs[0]?.data() as Profile,
            worker: workerSnap.docs[0]?.data() as Profile,
            job: jobSnap.docs[0]?.data() as Job
          };
        }));

        setContracts(combined);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'contracts');
      } finally {
        setLoading(false);
      }
    }

    fetchContracts();
  }, [profile]);

  const handleApprove = async (contractId: string) => {
    try {
      await updateDoc(doc(db, 'contracts', contractId), { 
        adminApproved: true,
        status: 'active'
      });
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, adminApproved: true, status: 'active' } : c));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `contracts/${contractId}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Shartnomalar nazorati</h2>
          <p className="text-muted-foreground mt-2">Platformadagi barcha shartnomalar va ularning holati.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-secondary/50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : contracts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {contracts.map((contract) => (
                <motion.div
                  key={contract.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Parties Info */}
                      <div className="flex flex-col gap-4 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ish beruvchi</p>
                            <p className="text-sm font-bold">{contract.employer?.fullName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ishchi</p>
                            <p className="text-sm font-bold">{contract.worker?.fullName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contract Content */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <FileText size={14} />
                          <span>ID: {contract.id.slice(0, 8).toUpperCase()} • {contract.job?.title}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ish haqi</p>
                            <p className="text-lg font-bold text-primary">{contract.amount.toLocaleString()} UZS</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${
                              contract.status === 'active' ? 'bg-green-50 text-green-600' : 
                              contract.status === 'signed' ? 'bg-blue-50 text-blue-600' :
                              contract.status === 'draft' ? 'bg-amber-50 text-amber-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {contract.status === 'active' ? 'Faol' : contract.status === 'signed' ? 'Imzolangan' : 'Kutilmoqda'}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin tasdigʻi</p>
                            {contract.adminApproved ? (
                              <span className="text-green-600 font-bold text-sm flex items-center gap-1 mt-1">
                                <ShieldCheck size={14} /> Tasdiqlangan
                              </span>
                            ) : (
                              <span className="text-amber-600 font-bold text-sm flex items-center gap-1 mt-1">
                                <Clock size={14} /> Kutilmoqda
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                        {!contract.adminApproved && contract.status === 'signed' && (
                          <button
                            onClick={() => handleApprove(contract.id)}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                          >
                            <ShieldCheck size={18} />
                            Tasdiqlash
                          </button>
                        )}
                        
                        <Link
                          to={`/contracts/${contract.id}`}
                          className="w-full py-3 bg-card border border-border rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all"
                        >
                          <FileText size={18} />
                          Koʻrib chiqish
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
            <FileText size={40} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-foreground">Shartnomalar topilmadi</h3>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
