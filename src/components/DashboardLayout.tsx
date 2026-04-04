import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Bell, Search, User, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth" />;
  }

  const languages = [
    { code: 'uz', name: t('common.uzbek'), flag: '🇺🇿' },
    { code: 'ru', name: t('common.russian'), flag: '🇷🇺' },
    { code: 'en', name: t('common.english'), flag: '🇺🇸' },
  ];

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-500">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-10 sticky top-0 z-40 transition-all duration-500">
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            <div className="relative w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={t('dashboard.search_placeholder') || "Ishlar, ishchilar yoki shartnomalarni qidirish..."}
                className="w-full pl-14 pr-6 py-4 bg-secondary/50 rounded-[24px] border-none focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-sm font-medium placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-4 rounded-2xl bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300"
              >
                <Globe className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-2xl shadow-xl overflow-hidden py-1 z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center space-x-3 hover:bg-secondary transition-colors ${
                          i18n.language === lang.code ? 'text-primary bg-primary/5' : 'text-foreground'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleTheme}
              className="p-4 rounded-2xl bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button className="relative p-4 rounded-2xl bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
            </button>

            <div className="flex items-center gap-4 pl-6 border-l border-border">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-black text-foreground leading-none mb-1">{profile.fullName}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{profile.role}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shadow-inner group cursor-pointer hover:border-primary transition-all duration-300">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-background/50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
