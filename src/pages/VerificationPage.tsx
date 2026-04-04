import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { VerificationRequest } from '../types';
import { ShieldCheck, Upload, CheckCircle, Clock, AlertTriangle, User, FileText, Camera, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function VerificationPage() {
  const { profile } = useAuth();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    idPhotoUrl: '',
    selfieUrl: ''
  });

  useEffect(() => {
    async function fetchRequest() {
      if (!profile?.uid) return;
      try {
        const q = query(collection(db, 'verification_requests'), where('userId', '==', profile.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setRequest({ id: snap.docs[0].id, ...snap.docs[0].data() } as VerificationRequest);
        }
      } catch (error) {
        console.error('Error fetching verification request:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    setSubmitting(true);

    try {
      // In a real app, we would upload files to Storage first
      // For this demo, we'll use placeholder URLs
      const newRequest = {
        userId: profile.uid,
        idPhotoUrl: formData.idPhotoUrl || 'https://picsum.photos/seed/id/800/600',
        selfieUrl: formData.selfieUrl || 'https://picsum.photos/seed/selfie/800/600',
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'verification_requests'), newRequest);
      setRequest({ id: docRef.id, ...newRequest } as VerificationRequest);

      // Update profile status
      await updateDoc(doc(db, 'profiles', profile.uid), {
        verificationStatus: 'pending'
      });

    } catch (error) {
      console.error('Error submitting verification request:', error);
    } finally {
      setSubmitting(false);
    }
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-3xl text-primary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Identity Verification</h2>
            <p className="text-muted-foreground mt-1">Verify your identity to build trust and unlock all platform features.</p>
          </div>
        </div>

        {request ? (
          <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm text-center space-y-6">
            {request.status === 'pending' ? (
              <>
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Verification Pending</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Our admin team is currently reviewing your documents. This process usually takes 24-48 hours. We'll notify you once it's complete.
                </p>
                <div className="pt-6 grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase">ID Submitted</p>
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" />
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-2xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Selfie Submitted</p>
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" />
                  </div>
                </div>
              </>
            ) : request.status === 'approved' ? (
              <>
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Verified Account</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Congratulations! Your identity has been verified. You now have a verification badge on your profile.
                </p>
                <div className="pt-6">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    Verified User
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Verification Rejected</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Unfortunately, your verification request was rejected. This could be due to blurry photos or mismatched information.
                </p>
                <button
                  onClick={() => setRequest(null)}
                  className="mt-6 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm space-y-8">
              <section className="space-y-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  1. ID Document
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please upload a clear photo of your National ID card or Passport. Ensure all details are legible.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <div className="aspect-[4/3] bg-secondary/50 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 group-hover:border-primary transition-all overflow-hidden">
                      {formData.idPhotoUrl ? (
                        <img src={formData.idPhotoUrl} alt="ID" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                            <Upload className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-bold text-muted-foreground">Upload ID Front</p>
                        </>
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setFormData(prev => ({ ...prev, idPhotoUrl: 'https://picsum.photos/seed/id-front/800/600' }))}
                      />
                    </div>
                  </div>
                  <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
                    <h4 className="font-bold text-primary flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Requirements
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Full name must be visible</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Photo must be clear</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Document must be valid</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  2. Selfie Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Take a selfie holding your ID document next to your face. This helps us confirm you are the owner of the document.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <div className="aspect-square bg-secondary/50 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 group-hover:border-primary transition-all overflow-hidden">
                      {formData.selfieUrl ? (
                        <img src={formData.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                            <Camera className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-bold text-muted-foreground">Take/Upload Selfie</p>
                        </>
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setFormData(prev => ({ ...prev, selfieUrl: 'https://picsum.photos/seed/selfie-user/800/800' }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 bg-secondary/30 rounded-3xl border border-border">
                      <p className="text-sm font-medium text-foreground italic">
                        "Your privacy is our priority. Documents are stored securely and used only for identity verification purposes."
                      </p>
                    </div>
                    <div className="p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Ensure good lighting and that your face and ID are both clearly visible in the selfie.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !formData.idPhotoUrl || !formData.selfieUrl}
                className="px-12 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
