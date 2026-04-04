import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

export default function AuthPage() {
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
    experienceLevel: 'Boshlangʻich'
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
          setError("ReCAPTCHA muddati tugadi. Iltimos, qaytadan urinib koʻring.");
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
      setError("Google orqali kirishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    const phone = formData.phoneNumber.replace(/\s/g, '');
    if (!phone || phone.length < 13) {
      setError("Telefon raqamini toʻliq kiriting (+998XXXXXXXXX)");
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
        setError("Telefon raqami notoʻgʻri formatda.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Juda koʻp urinishlar. Birozdan soʻng qayta urinib koʻring.");
      } else {
        setError(`Xatolik: ${error.message || "SMS yuborishda muammo yuz berdi."}`);
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
      setError("Tasdiqlash kodi notoʻgʻri.");
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
        region: formData.region,
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

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
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
          QULAY ISH
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Samarqand viloyati bandlik portali
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
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Telefon raqam orqali</label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-4 top-3.5 text-muted-foreground" />
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="+998 90 123 45 67"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handlePhoneSignIn}
                        disabled={loading || !formData.phoneNumber}
                        className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-sm bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 focus:outline-none transition-all disabled:opacity-50"
                      >
                        {loading ? 'Yuborilmoqda...' : 'SMS kod yuborish'}
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground">Yoki</span>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full flex justify-center items-center py-4 px-4 border border-border rounded-2xl shadow-sm bg-card text-sm font-bold text-foreground hover:bg-secondary focus:outline-none transition-all"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
                      Google orqali kirish
                    </button>

                    <div className="relative pt-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Demo rejim (Tezkor kirish)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => { setDemoProfile('worker'); navigate('/worker/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
                      >
                        <User size={20} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">Ishchi</span>
                      </button>
                      <button
                        onClick={() => { setDemoProfile('employer'); navigate('/employer/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-green-50 hover:border-green-200 transition-all group"
                      >
                        <Briefcase size={20} className="text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">Ish beruvchi</span>
                      </button>
                      <button
                        onClick={() => { setDemoProfile('admin'); navigate('/admin/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-purple-50 hover:border-purple-200 transition-all group"
                      >
                        <ShieldCheck size={20} className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">Admin</span>
                      </button>
                      <button
                        onClick={() => { setDemoProfile('super_admin'); navigate('/super-admin/dashboard'); }}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl hover:bg-orange-50 hover:border-orange-200 transition-all group"
                      >
                        <TrendingUp size={20} className="text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">Super Admin</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setConfirmationResult(null)}
                      className="flex items-center text-sm text-muted-foreground hover:text-primary font-bold"
                    >
                      <ArrowLeft size={16} className="mr-1" /> Raqamni oʻzgartirish
                    </button>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">SMS kodni kiriting</label>
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
                      {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
                    </button>
                  </div>
                )}

                <div className="text-center text-xs text-muted-foreground">
                  Tizimga kirish orqali siz foydalanish shartlariga rozilik bildirasiz.
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Siz kimsiz?</h3>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => { setRole('worker'); setStep(3); }}
                    className={`flex items-center p-6 border-2 rounded-2xl transition-all ${role === 'worker' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                  >
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600 mr-4">
                      <User size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">Ish qidiruvchiman</div>
                      <div className="text-xs text-gray-500">Oʻz xizmatlarimni taklif qilaman</div>
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
                      <div className="font-bold text-gray-900">Ish beruvchiman</div>
                      <div className="text-xs text-gray-500">Yangi ish eʻlonlari joylayman</div>
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Shaxsiy maʻlumotlar</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Toʻliq ismingiz</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Masalan: Lola Karimova"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefon raqamingiz</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                </div>
                <div className="pt-4 flex space-x-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Orqaga</button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!formData.fullName || !formData.phoneNumber}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Davom etish
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Hududingizni tanlang</h3>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-4">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Viloyat</p>
                  <p className="text-sm font-black text-blue-900">Samarqand viloyati</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tuman</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value, region: 'Samarqand viloyati' })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Tanlang...</option>
                    {DISTRICTS["Samarqand viloyati"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mahalla (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Masalan: Bogʻishamol"
                  />
                </div>
                <div className="pt-4 flex space-x-3">
                  <button onClick={() => setStep(3)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Orqaga</button>
                  <button
                    onClick={() => setStep(role === 'worker' ? 5 : 6)}
                    disabled={!formData.district}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Davom etish
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">Koʻnikmalar va tajriba</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Koʻnikmalaringizni tanlang</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SKILLS.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${formData.skills.includes(skill) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.customSkill}
                      onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none"
                      placeholder="Oʻz koʻnikmangizni kiriting..."
                    />
                    <button onClick={addCustomSkill} className="bg-gray-900 text-white px-4 rounded-xl text-xs font-bold">Qoʻshish</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tajriba darajasi</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="Boshlangʻich">Boshlangʻich</option>
                    <option value="Oʻrta">Oʻrta</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
                <div className="pt-4 flex space-x-3">
                  <button onClick={() => setStep(4)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50">Orqaga</button>
                  <button
                    onClick={() => setStep(6)}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700"
                  >
                    Davom etish
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
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Tayyormisiz?</h3>
                  <p className="text-gray-500">Barcha maʻlumotlar saqlanadi va siz platformadan foydalanishni boshlashingiz mumkin.</p>
                </div>
                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleCompleteRegistration}
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saqlanmoqda...' : 'Boshladik!'}
                  </button>
                  <button onClick={() => setStep(role === 'worker' ? 5 : 4)} className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600">Maʻlumotlarni tahrirlash</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
