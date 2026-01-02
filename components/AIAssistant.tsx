import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  X,
  MessageSquare,
  Sparkles,
  User,
  Bot,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { askTeffAssistant } from '../services/geminiService';
import { Language, Translation } from '../types';

interface Props {
  lang: Language;
  t: Translation;
}

const AIAssistant: React.FC<Props> = ({ lang, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; timestamp: Date }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    const now = new Date();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: now }]);
    setLoading(true);

    try {
      const aiResponse = await askTeffAssistant(userMsg, lang);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse || '', timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? '80px' : '600px',
              width: '400px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-6 bg-stone-900 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-stone-900">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">{t.aiAssistant}</h3>
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Active Now</p>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Feed */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-8 space-y-6 bg-stone-50/50"
                >
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-stone-100">
                        <Bot className="w-10 h-10 text-amber-600" />
                      </div>
                      <h4 className="text-xl font-black text-stone-900 mb-2">Hello! How can I help?</h4>
                      <p className="text-stone-400 text-sm font-medium">Ask me anything about Teff quality, storage, or how to use our platform.</p>

                      <div className="grid grid-cols-1 gap-3 mt-10 w-full">
                        {['How to store Teff?', 'Types of Teff?', 'Delivery area?'].map(q => (
                          <button
                            key={q}
                            onClick={() => setInput(q)}
                            className="p-4 bg-white border border-stone-100 rounded-2xl text-xs font-bold text-stone-600 hover:border-amber-500 hover:text-amber-600 transition-all text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i}
                      className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-stone-900 text-white' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                          ? 'bg-stone-900 text-white rounded-tr-none'
                          : 'bg-white text-stone-800 border border-stone-100 rounded-tl-none'
                        }`}>
                        {m.text}
                        <div className={`text-[10px] mt-2 opacity-30 font-bold ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-stone-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-stone-100">
                  <div className="relative group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={t.aiPlaceholder}
                      className="w-full pl-6 pr-16 py-4 bg-stone-50 border border-stone-100 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:grayscale"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`w-16 h-16 rounded-[1.8rem] shadow-2xl flex items-center justify-center transition-all group relative overflow-hidden ${isOpen ? 'bg-stone-900 text-white opacity-0 pointer-events-none' : 'bg-amber-600 text-white'
          }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/20 to-transparent"></div>
        <MessageSquare className="w-7 h-7 relative z-10 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
      </motion.button>
    </div>
  );
};

export default AIAssistant;
