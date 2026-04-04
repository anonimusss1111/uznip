import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { Contract, Job, Profile } from '../types';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  User, 
  Briefcase, 
  Calendar,
  CreditCard,
  Signature
} from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import DisputeModal from '../components/DisputeModal';

export default function ContractPage() {
  const { contractId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState<Profile | null>(null);
  const [employer, setEmployer] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  useEffect(() => {
    async function fetchContractData() {
      if (!contractId) return;

      try {
        const contractSnap = await getDoc(doc(db, 'contracts', contractId));
        if (!contractSnap.exists()) {
          navigate('/dashboard');
          return;
        }

        const contractData = { id: contractSnap.id, ...contractSnap.data() } as Contract;
        setContract(contractData);

        // Fetch related data
        const [jobSnap, workerSnap, employerSnap] = await Promise.all([
          getDoc(doc(db, 'jobs', contractData.jobId)),
          getDoc(doc(db, 'profiles', contractData.workerId)),
          getDoc(doc(db, 'profiles', contractData.employerId))
        ]);

        setJob(jobSnap.data() as Job);
        setWorker(workerSnap.data() as Profile);
        setEmployer(employerSnap.data() as Profile);

      } catch (error) {
        console.error('Error fetching contract data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContractData();
  }, [contractId, navigate]);

  const handleSign = async () => {
    if (!contract || !profile) return;
    setSigning(true);

    try {
      const updates: any = {};
      if (profile.role === 'worker') updates.workerSigned = true;
      if (profile.role === 'employer') updates.employerSigned = true;

      // If both signed, move to signed status
      if ((profile.role === 'worker' && contract.employerSigned) || 
          (profile.role === 'employer' && contract.workerSigned)) {
        updates.status = 'signed';
      }

      await updateDoc(doc(db, 'contracts', contract.id), updates);
      setContract(prev => prev ? { ...prev, ...updates } : null);

      // Create notification for other party
      const otherPartyId = profile.role === 'worker' ? contract.employerId : contract.workerId;
      await addDoc(collection(db, 'notifications'), {
        userId: otherPartyId,
        title: 'Contract Signed',
        message: `${profile.fullName} has signed the contract for "${job?.title}".`,
        type: 'contract',
        link: `/contracts/${contract.id}`,
        read: false,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error signing contract:', error);
    } finally {
      setSigning(false);
    }
  };

  const handleApprove = async () => {
    if (!contract || profile?.role !== 'admin') return;
    setSigning(true);

    try {
      await updateDoc(doc(db, 'contracts', contract.id), {
        adminApproved: true,
        status: 'active'
      });

      // Update job status
      await updateDoc(doc(db, 'jobs', contract.jobId), {
        status: 'in-progress'
      });

      setContract(prev => prev ? { ...prev, adminApproved: true, status: 'active' } : null);

      // Notify both parties
      const notifications = [contract.workerId, contract.employerId].map(uid => 
        addDoc(collection(db, 'notifications'), {
          userId: uid,
          title: 'Contract Approved',
          message: `The contract for "${job?.title}" has been approved by admin and is now active.`,
          type: 'contract',
          link: `/contracts/${contract.id}`,
          read: false,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(notifications);

    } catch (error) {
      console.error('Error approving contract:', error);
    } finally {
      setSigning(false);
    }
  };

  const generatePDF = () => {
    if (!contract || !job || !worker || !employer) return;

    const doc = new jsPDF();
    const primaryColor = [59, 130, 246]; // #3b82f6

    // Header
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('QULAY ISH', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Employment Contract', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Contract ID: ${contract.id}`, 105, 38, { align: 'center' });
    doc.text(`Generated on: ${format(new Date(), 'PPP', { locale: uz })}`, 105, 43, { align: 'center' });

    // Parties
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Parties involved', 20, 60);
    
    doc.setFontSize(10);
    doc.text(`Employer: ${employer.fullName}`, 25, 70);
    doc.text(`Region: ${employer.region}, ${employer.district}`, 25, 75);
    
    doc.text(`Worker: ${worker.fullName}`, 120, 70);
    doc.text(`Region: ${worker.region}, ${worker.district}`, 120, 75);

    // Job Details
    doc.setFontSize(14);
    doc.text('2. Job Details', 20, 95);
    
    doc.setFontSize(10);
    doc.text(`Title: ${job.title}`, 25, 105);
    doc.text(`Category: ${job.category}`, 25, 110);
    doc.text(`Work Type: ${job.workType}`, 25, 115);
    doc.text(`Location: ${job.neighborhood}, ${job.district}, ${job.region}`, 25, 120);

    // Terms
    doc.setFontSize(14);
    doc.text('3. Terms and Conditions', 20, 140);
    
    doc.setFontSize(10);
    doc.text(`Total Amount: ${contract.amount.toLocaleString()} UZS`, 25, 150);
    doc.text(`Start Date: ${contract.startDate}`, 25, 155);
    doc.text(`End Date: ${contract.endDate}`, 25, 160);
    
    const splitTerms = doc.splitTextToSize(contract.terms, 160);
    doc.text(splitTerms, 25, 170);

    // Signatures
    doc.setFontSize(14);
    doc.text('4. Signatures', 20, 220);
    
    doc.setFontSize(10);
    doc.text('Employer Signature:', 25, 235);
    doc.text(contract.employerSigned ? 'SIGNED DIGITAL' : 'PENDING', 25, 245);
    doc.text(contract.employerSigned ? format(contract.createdAt?.toDate?.() || new Date(), 'PPP') : '', 25, 250);

    doc.text('Worker Signature:', 120, 235);
    doc.text(contract.workerSigned ? 'SIGNED DIGITAL' : 'PENDING', 120, 245);
    doc.text(contract.workerSigned ? format(contract.createdAt?.toDate?.() || new Date(), 'PPP') : '', 120, 250);

    // Admin Approval
    if (contract.adminApproved) {
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129); // Green
      doc.text('APPROVED BY QULAY ISH ADMIN', 105, 275, { align: 'center' });
      doc.text(`Verification Code: VER-${contract.id.slice(0, 8).toUpperCase()}`, 105, 282, { align: 'center' });
    }

    doc.save(`Contract_${contract.id.slice(0, 8)}.pdf`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract || !job || !worker || !employer) return null;

  const isMyContract = profile?.uid === contract.workerId || profile?.uid === contract.employerId || profile?.role === 'admin';
  if (!isMyContract) return <Navigate to="/dashboard" />;

  const canSign = (profile?.role === 'worker' && !contract.workerSigned) || 
                  (profile?.role === 'employer' && !contract.employerSigned);

  const canApprove = profile?.role === 'admin' && contract.status === 'signed' && !contract.adminApproved;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-3xl text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">Contract #{contract.id.slice(0, 8)}</h2>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Status: <span className="font-bold uppercase text-primary">{contract.status}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-2xl font-semibold hover:bg-accent transition-all"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            {canSign && (
              <button
                onClick={handleSign}
                disabled={signing}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                <Signature className="w-5 h-5" />
                {signing ? 'Signing...' : 'Sign Contract'}
              </button>
            )}
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={signing}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-600/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                {signing ? 'Approving...' : 'Approve Contract'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contract Body */}
            <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
              
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  1. Parties Involved
                </h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-4 bg-secondary/30 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Employer</p>
                    <p className="text-lg font-bold text-foreground mt-1">{employer.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{employer.region}, {employer.district}</p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Worker</p>
                    <p className="text-lg font-bold text-foreground mt-1">{worker.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{worker.region}, {worker.district}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  2. Job Details
                </h3>
                <div className="p-6 bg-secondary/30 rounded-3xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-foreground">{job.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{job.category} • {job.workType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{contract.amount.toLocaleString()} UZS</p>
                      <p className="text-xs text-muted-foreground mt-1">Agreed Amount</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Start:</span>
                      <span className="font-bold">{contract.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">End:</span>
                      <span className="font-bold">{contract.endDate}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  3. Terms & Conditions
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none p-6 bg-secondary/30 rounded-3xl">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {contract.terms}
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Signature className="w-5 h-5 text-primary" />
                  4. Signatures
                </h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-6 border-2 border-dashed border-border rounded-3xl text-center space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Employer Signature</p>
                    {contract.employerSigned ? (
                      <div className="flex flex-col items-center text-green-600">
                        <CheckCircle className="w-8 h-8 mb-1" />
                        <p className="font-bold">SIGNED DIGITAL</p>
                        <p className="text-[10px] opacity-70">{format(contract.createdAt?.toDate?.() || new Date(), 'PPP')}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-muted-foreground py-4 italic">Pending Signature</p>
                    )}
                  </div>
                  <div className="p-6 border-2 border-dashed border-border rounded-3xl text-center space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Worker Signature</p>
                    {contract.workerSigned ? (
                      <div className="flex flex-col items-center text-green-600">
                        <CheckCircle className="w-8 h-8 mb-1" />
                        <p className="font-bold">SIGNED DIGITAL</p>
                        <p className="text-[10px] opacity-70">{format(contract.createdAt?.toDate?.() || new Date(), 'PPP')}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-muted-foreground py-4 italic">Pending Signature</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-6">
              <h4 className="font-bold text-foreground">Contract Status</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    contract.employerSigned ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
                  )}>
                    1
                  </div>
                  <span className={cn("text-sm font-medium", contract.employerSigned ? "text-foreground" : "text-muted-foreground")}>
                    Employer Signature
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    contract.workerSigned ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
                  )}>
                    2
                  </div>
                  <span className={cn("text-sm font-medium", contract.workerSigned ? "text-foreground" : "text-muted-foreground")}>
                    Worker Signature
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    contract.adminApproved ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
                  )}>
                    3
                  </div>
                  <span className={cn("text-sm font-medium", contract.adminApproved ? "text-foreground" : "text-muted-foreground")}>
                    Admin Approval
                  </span>
                </div>
              </div>

              {contract.adminApproved && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-700">Legally Active</p>
                    <p className="text-xs text-green-600 mt-1">This contract is verified and active on the platform.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold">Nizolarni hal qilish</h4>
              </div>
              <p className="text-sm text-amber-600 leading-relaxed">
                Agar ish jarayonida muammolar yuzaga kelsa, har ikki tomon nizo ochishi mumkin. Adminlarimiz vaziyatni oʻrganib chiqishadi.
              </p>
              <button 
                onClick={() => setIsDisputeModalOpen(true)}
                className="w-full py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all"
              >
                Nizo ochish
              </button>
            </div>
          </div>
        </div>

        <DisputeModal 
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          contractId={contract.id}
          openedById={profile.uid}
        />
      </div>
    </DashboardLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(to); }, [navigate, to]);
  return null;
}
