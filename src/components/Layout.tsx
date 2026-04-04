import React from 'react';
import Header from './Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <main>
        {children}
      </main>
      <footer className="bg-white border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">Q</span>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">QULAY ISH</span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs mb-6">
                Oʻzbekistondagi uyda oʻtirgan ayollar va ishonchli ish beruvchilar uchun geo-joylashuvga asoslangan ish platformasi.
              </p>
              <div className="flex space-x-4">
                {/* Social icons */}
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                  <span className="text-xs font-bold">TG</span>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                  <span className="text-xs font-bold">IG</span>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                  <span className="text-xs font-bold">FB</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Platforma</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/jobs" className="hover:text-blue-600 transition-colors">Ishlar</a></li>
                <li><a href="/workers" className="hover:text-blue-600 transition-colors">Ishchilar</a></li>
                <li><a href="/statistics" className="hover:text-blue-600 transition-colors">Statistika</a></li>
                <li><a href="/about" className="hover:text-blue-600 transition-colors">Biz haqimizda</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Yordam</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/faq" className="hover:text-blue-600 transition-colors">Koʻp soʻraladigan savollar</a></li>
                <li><a href="/contact" className="hover:text-blue-600 transition-colors">Bogʻlanish</a></li>
                <li><a href="/privacy" className="hover:text-blue-600 transition-colors">Maxfiylik siyosati</a></li>
                <li><a href="/terms" className="hover:text-blue-600 transition-colors">Foydalanish shartlari</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
            <p>© 2026 QULAY ISH. Barcha huquqlar himoyalangan.</p>
            <p className="mt-2 md:mt-0">Oʻzbekistonda mehr bilan yaratilgan 🇺🇿</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
