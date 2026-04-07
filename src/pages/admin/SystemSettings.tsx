import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, Globe, Shield, Bell, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  premiumEnabled: boolean;
  verificationRequired: boolean;
  supportEmail: string;
  maxJobPostsPerUser: number;
  aiAssistantEnabled: boolean;
}

export default function SystemSettings() {
  const { t } = useTranslation();
  const { isDemo } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    premiumEnabled: true,
    verificationRequired: true,
    supportEmail: 'support@qulayish.uz',
    maxJobPostsPerUser: 10,
    aiAssistantEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'system_config', 'settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SystemSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isDemo]);

  const handleSave = async () => {
    if (isDemo) {
      setMessage({ type: 'success', text: t('admin.settings.demo_save') });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'system_config', 'settings'), settings);
      setMessage({ type: 'success', text: t('admin.settings.save_success') });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: t('admin.settings.save_error') });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={t('nav.sidebar.system_settings')}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('nav.sidebar.system_settings')}>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('nav.sidebar.system_settings')}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">{t('admin.settings.subtitle')}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {t('common.save')}
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Platform Status */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Globe size={20} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{t('admin.settings.platform_status')}</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900 leading-none mb-1">{t('admin.settings.maintenance_mode')}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admin.settings.maintenance_desc')}</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.maintenanceMode ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900 leading-none mb-1">{t('admin.settings.user_registration')}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admin.settings.registration_desc')}</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.registrationEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.registrationEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Security & Verification */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Shield size={20} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{t('admin.settings.security')}</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900 leading-none mb-1">{t('admin.settings.mandatory_verification')}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admin.settings.verification_desc')}</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, verificationRequired: !settings.verificationRequired })}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.verificationRequired ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.verificationRequired ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-gray-900 leading-none mb-1">{t('admin.settings.ai_assistant')}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('admin.settings.ai_desc')}</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, aiAssistantEnabled: !settings.aiAssistantEnabled })}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${settings.aiAssistantEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.aiAssistantEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Business Rules */}
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Database size={20} className="text-amber-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{t('admin.settings.business_rules')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('admin.settings.support_email')}</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('admin.settings.max_jobs')}</label>
                <input
                  type="number"
                  value={settings.maxJobPostsPerUser}
                  onChange={(e) => setSettings({ ...settings, maxJobPostsPerUser: parseInt(e.target.value) })}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
