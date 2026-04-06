import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  Maximize2, 
  Minimize2,
  HelpCircle,
  Briefcase,
  Search,
  FileText
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Shield, Info } from 'lucide-react';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: t('chat.ai_welcome', { name: profile?.fullName || t('common.unknown') })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const model = "gemini-3-flash-preview";
      const systemInstruction = `
        You are an AI assistant for the "QULAY ISH" (Convenient Work) platform in Uzbekistan.
        The platform connects workers (mostly women in Samarkand) with employers.
        Current language: ${i18n.language}. Please respond in this language.
        
        Key features:
        - Job search (filtering by district in Samarkand)
        - Worker profiles and skills
        - Digital contracts and secure payments
        - Dispute resolution by admins
        
        Your tone should be professional, helpful, and encouraging.
        Keep responses concise and relevant to the platform.
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: messages.concat({ role: 'user', content: userMessage }).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const assistantMessage = response.text || t('chat.ai_no_response');
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: t('chat.ai_error') }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { icon: Search, label: t('chat.ai_label_jobs'), prompt: t('chat.ai_prompt_jobs') },
    { icon: Briefcase, label: t('chat.ai_label_post'), prompt: t('chat.ai_prompt_post') },
    { icon: FileText, label: t('chat.ai_label_contract'), prompt: t('chat.ai_prompt_contract') },
    { icon: HelpCircle, label: t('chat.ai_label_dispute'), prompt: t('chat.ai_prompt_dispute') },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center group"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />}
        {!isOpen && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
            AI
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-28 right-8 z-50 bg-card border border-border shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
              isExpanded ? 'w-[600px] h-[700px] rounded-[40px]' : 'w-[400px] h-[550px] rounded-[32px]'
            }`}
          >
            {/* Header */}
            <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black tracking-tight">{t('chat.ai_assistant')}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{t('chat.ai_online')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'assistant' 
                      ? 'bg-secondary/50 text-foreground rounded-tl-none' 
                      : 'bg-primary text-primary-foreground rounded-tr-none'
                  }`}>
                    <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bot size={18} />
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 size={18} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4 flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(s.prompt);
                      // Trigger send automatically?
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary border border-border rounded-xl text-xs font-bold transition-all"
                  >
                    <s.icon size={14} className="text-primary" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 border-t border-border bg-card">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('chat.placeholder')}
                  className="w-full pl-5 pr-14 py-4 bg-secondary/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 font-bold uppercase tracking-widest opacity-50">
                {t('chat.ai_disclaimer')}
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
