import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Briefcase, 
  FileText, 
  AlertTriangle, 
  Trash2, 
  Check,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'application': return <Briefcase className="text-blue-500" />;
      case 'contract': return <FileText className="text-green-500" />;
      case 'message': return <MessageSquare className="text-purple-500" />;
      case 'dispute': return <AlertTriangle className="text-red-500" />;
      default: return <Bell className="text-primary" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Bildirishnomalar</h2>
            <p className="text-muted-foreground mt-2">Sizga kelgan barcha yangiliklar va xabarlar.</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-2xl font-bold hover:bg-border transition-all"
            >
              <Check size={20} />
              Hammasini oʻqilgan deb belgilash
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-secondary/50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`group relative p-6 rounded-[32px] border transition-all duration-300 ${
                    notification.read 
                      ? 'bg-card border-border opacity-70' 
                      : 'bg-card border-primary/20 shadow-lg shadow-primary/5'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <div className={`p-4 rounded-2xl ${notification.read ? 'bg-secondary' : 'bg-primary/10'}`}>
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-bold truncate ${notification.read ? 'text-foreground/70' : 'text-foreground'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {format(notification.createdAt?.toDate?.() || new Date(), 'd MMM, HH:mm', { locale: uz })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      
                      {notification.link && (
                        <Link
                          to={notification.link}
                          onClick={() => markAsRead(notification.id)}
                          className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-primary hover:underline group-hover:translate-x-1 transition-transform"
                        >
                          Batafsil koʻrish
                          <ChevronRight size={16} />
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 bg-secondary text-foreground rounded-xl hover:bg-border transition-colors"
                          title="Oʻqilgan deb belgilash"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors"
                        title="Oʻchirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-secondary/20 rounded-[40px] p-20 text-center border-2 border-dashed border-border">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Bildirishnomalar yoʻq</h3>
            <p className="text-muted-foreground mt-2">Hozircha sizda hech qanday yangi bildirishnoma mavjud emas.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
