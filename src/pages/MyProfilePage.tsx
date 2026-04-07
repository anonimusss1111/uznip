import React from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, MapPin, Briefcase, Star, Settings, Save, Plus, X } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { REGIONS, DISTRICTS } from '../constants/locations';
import { SKILLS } from '../constants/categories';
import { getDistrictKey } from '../lib/utils';

export default function MyProfilePage() {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    fullName: '',
    region: '',
    district: '',
    neighborhood: '',
    bio: '',
    skills: [] as string[],
    experienceLevel: '',
    phoneNumber: '',
    isPremium: false
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        region: profile.region || '',
        district: profile.district || '',
        neighborhood: profile.neighborhood || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
        experienceLevel: profile.experienceLevel || 'Boshlangʻich',
        phoneNumber: profile.phoneNumber || '',
        isPremium: profile.isPremium || false
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'profiles', profile.uid), formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setSaving(false);
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

  if (authLoading) return <Layout><div className="p-8">{t('common.loading')}...</div></Layout>;
  if (!profile) return <Layout><div className="p-8">{t('profile.not_found')}</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('profile.title')}</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Settings size={20} />
              <span>{t('profile.edit')}</span>
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:text-gray-700"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
              >
                <Save size={20} />
                <span>{saving ? t('profile.saving') : t('profile.save')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl text-center">
              <div className="w-24 h-24 rounded-[24px] overflow-hidden mx-auto mb-4 border-4 border-gray-50 shadow-inner">
                <img
                  src={profile.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-1">{profile.fullName}</h2>
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full inline-block uppercase tracking-widest">
                  {profile.role === 'worker' ? t('auth.worker') : t('auth.employer')}
                </div>
                {profile.isPremium && (
                  <div className="bg-amber-50 text-amber-600 text-[10px] font-bold px-3 py-1 rounded-full inline-block uppercase tracking-widest border border-amber-100">
                    Premium
                  </div>
                )}
              </div>
              
              {profile.role === 'worker' && (
                <div className="flex justify-around pt-6 border-t border-gray-50 mt-6">
                  <div className="text-center">
                    <div className="text-lg font-black text-gray-900">{profile.rating || 0}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{t('profile.rating')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-gray-900">{profile.completedJobs || 0}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{t('profile.jobs')}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-80">{t('profile.status')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('profile.completeness')}</span>
                  <span className="text-sm font-bold">85%</span>
                </div>
                <div className="w-full bg-blue-500 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[85%]"></div>
                </div>
                <p className="text-xs opacity-70 leading-relaxed">
                  {t('profile.completeness_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl space-y-8">
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{t('profile.basic_info')}</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.full_name')}</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.phone')}</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.about_me')}</label>
                    <textarea
                      disabled={!isEditing}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60 resize-none"
                      placeholder={t('profile.about_me_placeholder')}
                    />
                  </div>
                  {isEditing && (
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <div>
                        <p className="text-sm font-bold text-amber-900">Premium Status</p>
                        <p className="text-xs text-amber-700">Enable premium features for testing</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.isPremium ? 'bg-amber-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isPremium ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="pt-8 border-t border-gray-50">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{t('profile.location')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.region')}</label>
                    <select
                      disabled={!isEditing}
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value, district: '' })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60"
                    >
                      {REGIONS.map(r => <option key={r} value={r}>{t('common.region_name', { defaultValue: r })}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.district')}</label>
                    <select
                      disabled={!isEditing || !formData.region}
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60"
                    >
                      <option value="">{t('common.select')}...</option>
                      {formData.region && DISTRICTS[formData.region]?.map(d => <option key={d} value={d}>{t(`districts.${getDistrictKey(d)}`)}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {profile.role === 'worker' && (
                <section className="pt-8 border-t border-gray-50">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{t('profile.skills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(skill => (
                      <button
                        key={skill.id}
                        disabled={!isEditing}
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.skills.includes(skill.id) ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'} disabled:opacity-60`}
                      >
                        {t(`skills.${skill.id}`)}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
