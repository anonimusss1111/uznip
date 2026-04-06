import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { User, Briefcase, MapPin, CheckCircle, ArrowRight, ArrowLeft, Phone, ShieldCheck, Lock, Sun, Moon, TrendingUp } from 'lucide-react';
import { REGIONS, DISTRICTS } from '../constants/locations';
import { SKILLS } from '../constants/categories';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { getDistrictKey } from '../lib/utils';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

export default function AuthPage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { setDemoProfile } = useAuth();
  const [step, setStep] = React.useState(1);
  // ... rest of state
  const [authMethod, setAuthMethod] = React.useState<'google' | 'phone' | null>(null);
  const [role, setRole] = React.useState<'employer' | 'worker' | null>(null);
  const [formData, setFormData] = React.useState({
    fullName: '',
    region: '',
    district: '',
    neighborhood: '',
    phoneNumber: '+998',
    skills: [] as string[],
    customSkill: '',
    bio: '',
    experienceLevel: 'beginner'
  });
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (!recaptchaContainerRef.current) return;
    
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha resolved');
        },
        'expired-callback': () => {
          setError(t('auth.recaptcha_expired'));
        }
      });
    } catch (err) {
      console.error("Recaptcha setup error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
        navigate('/');
      } else {
        setStep(2);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(t('auth.error_google'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    const phone = formData.phoneNumber.replace(/\s/g, '');
    if (!phone || phone.length < 13) {
      setError(t('auth.error_phone_format'));
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error('Recaptcha not initialized');
      
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      setAuthMethod('phone');
    } catch (error: any) {
      console.error("Phone auth error:", error);
      if (error.code === 'auth/invalid-phone-number') {
        setError(t('auth.error_phone_format'));
      } else if (error.code === 'auth/too-many-requests') {
        setError(t('auth.error_too_many'));
      } else {
        setError(t('auth.error_sms'));
      }
      
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult || !verificationCode) return;
    setLoading(true);
    setError(null);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;

      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
        navigate('/');
      } else {
        setStep(2);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(t('auth.error_code'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'profiles', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        fullName: formData.fullName,
        role,
        region: 'Samarqand viloyati',
        district: formData.district,
        neighborhood: formData.neighborhood,
        phoneNumber: formData.phoneNumber || auth.currentUser.phoneNumber || '',
        skills: formData.skills,
        bio: formData.bio,
        experienceLevel: formData.experienceLevel,
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
        isVerified: false,
        photoUrl: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`,
        createdAt: serverTimestamp()
      });
      navigate('/');
    } catch (error) {
      console.error("Profile creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId]
    }));
  };

  const addCustomSkill = () => {
    if (formData.customSkill.trim() && !formData.skills.includes(formData.customSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, formData.customSkill.trim()],
        customSkill: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
      
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 overflow-hidden">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Emblem_of_Uzbekistan.svg/1024px-Emblem_of_Uzbekistan.svg.png" 
              alt="Uzbekistan Gerb" 
              className="w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          {t('common.branding_short')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {t('auth.platform_subtitle')}
        </p>

        {step > 1 && (
          <div className="mt-6 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((step - 1) / 4) * 100}%` }}
              className="h-full bg-blue-600"
            />
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl border border-border sm:rounded-3xl sm:px-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}

                {!confirmationResult ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('auth.phone_label')}</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-4 top-3.5 text-muted-foreground" />
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder={t('auth.phone_placeholder')}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handlePhoneSignIn}
                        disabled={loading || !formData.phoneNumber}
                        className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-sm bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 focus:outline-none transition-all disabled:opacity-50"
                      >
                        {loading ? t('auth.sending') : t('auth.send_sms')}
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground">{t('auth.or')}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full flex justify-center items-center py-4 px-4 border border-border rounded-2xl shadow-sm bg-card text-sm font-bold text-foreground hover:bg-secondary focus:outline-none transition-all"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
                      {t('auth.google_login')}
                    </button>

                    <div className="relative pt-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground font-bold uppercase tracking-widest text-[10px]">{t('auth.demo_mode')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => { setDemoProfile('worker'); navigate('/worker/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
                      >
                        <User size={20} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">{t('auth.worker')}</span>
                      </button>
                      <button
                        onClick={() => { setDemoProfile('employer'); navigate('/employer/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all group"
                      >
                        <Briefcase size={20} className="text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">{t('auth.employer')}</span>
                      </button>
                      <button
                        onClick={() => { setDemoProfile('admin'); navigate('/admin/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-purple-50 hover:border-purple-200 transition-all group"
                      >
                        <ShieldCheck size={20} className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">{t('auth.admin')}</span>
                      </button>
                      <button
                        onClick={() => { setDemoProfile('super_admin'); navigate('/super-admin/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-orange-50 hover:border-orange-200 transition-all group"
                      >
                        <TrendingUp size={20} className="text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">{t('auth.super_admin')}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setConfirmationResult(null)}
                      className="flex items-center text-sm text-muted-foreground hover:text-primary font-bold"
                    >
                      <ArrowLeft size={16} className="mr-1" /> {t('auth.change_number')}
                    </button>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('auth.enter_sms')}</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                          placeholder="123456"
                          maxLength={6}
                        />
                      </div>
                    </div>
                    <button
                      onClick={verifyCode}
                      disabled={loading || verificationCode.length !== 6}
                      className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-sm bg-green-600 text-sm font-bold text-white hover:bg-green-700 focus:outline-none transition-all disabled:opacity-50"
                    >
                      {loading ? t('auth.verifying') : t('auth.verify')}
                    </button>
                  </div>
                )}

                <div className="text-center text-xs text-muted-foreground">
                  {t('auth.terms')}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auth.who_are_you')}</h3>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => { setRole('worker'); setStep(3); }}
                    className={`flex items-center p-6 border-2 rounded-2xl transition-all ${role === 'worker' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                  >
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600 mr-4">
                      <User size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">{t('auth.worker')}</div>
                      <div className="text-xs text-gray-500">{t('auth.worker_desc')}</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setRole('employer'); setStep(3); }}
                    className={`flex items-center p-6 border-2 rounded-2xl transition-all ${role === 'employer' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                  >
                    <div className="bg-green-100 p-3 rounded-xl text-green-600 mr-4">
                      <Briefcase size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">{t('auth.employer')}</div>
                      <div className="text-xs text-gray-500">{t('auth.employer_desc')}</div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auth.personal_info')}</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('auth.name_label')}</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={t('auth.name_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('auth.phone')}</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder={t('auth.phone_placeholder')}
                    />
                  </div>
                </div>
                <div className="pt-4 flex space-x-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50">{t('auth.back')}</button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!formData.fullName || !formData.phoneNumber}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {t('auth.continue')}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auth.select_district')}</h3>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-4">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{t('auth.region')}</p>
                  <p className="text-sm font-black text-blue-900">{t('common.region_name', { defaultValue: 'Samarqand viloyati' })}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('auth.district')}</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value, region: 'Samarqand viloyati' })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">{t('common.select')}...</option>
                    {DISTRICTS["Samarqand viloyati"].map(d => <option key={d} value={d}>{t(`districts.${getDistrictKey(d)}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('auth.neighborhood_label')}</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={t('auth.neighborhood_placeholder')}
                  />
                </div>
                <div className="pt-4 flex space-x-3">
                  <button onClick={() => setStep(3)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50">{t('auth.back')}</button>
                  <button
                    onClick={() => setStep(role === 'worker' ? 5 : 6)}
                    disabled={!formData.district}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {t('auth.continue')}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auth.skills_experience')}</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('auth.skills_label')}</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SKILLS.map(skill => (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${formData.skills.includes(skill.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {t(`skills.${skill.id}`)}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.customSkill}
                      onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none"
                      placeholder={t('auth.custom_skill_placeholder')}
                    />
                    <button onClick={addCustomSkill} className="bg-gray-900 text-white px-4 rounded-xl text-xs font-bold">{t('auth.add')}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('auth.experience_label')}</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="beginner">{t('auth.beginner')}</option>
                    <option value="intermediate">{t('auth.intermediate')}</option>
                    <option value="professional">{t('auth.professional')}</option>
                  </select>
                </div>
                <div className="pt-4 flex space-x-3">
                  <button onClick={() => setStep(4)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50">{t('auth.back')}</button>
                  <button
                    onClick={() => setStep(6)}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700"
                  >
                    {t('auth.continue')}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <CheckCircle size={48} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{t('auth.ready')}</h3>
                  <p className="text-gray-500">{t('auth.ready_desc')}</p>
                </div>
                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleCompleteRegistration}
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? t('auth.saving') : t('auth.lets_go')}
                  </button>
                  <button onClick={() => setStep(role === 'worker' ? 5 : 4)} className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600">{t('auth.edit_info')}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
