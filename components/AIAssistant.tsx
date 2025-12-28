
import React, { useState } from 'react';
import { askTeffAssistant } from '../services/geminiService';
import { Language, Translation } from '../types';

interface Props {
  lang: Language;
  t: Translation;
}

const AIAssistant: React.FC<Props> = ({ lang, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const aiResponse = await askTeffAssistant(userMsg, lang);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse || '' }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-80 sm:w-96 flex flex-col max-h-[500px]">
          <div className="p-4 bg-amber-600 text-white rounded-t-2xl flex justify-between items-center">
            <h3 className="font-bold flex items-center">
              <span className="mr-2">🌾</span> {t.aiAssistant}
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-amber-700 p-1 rounded">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {messages.length === 0 && (
              <p className="text-stone-400 text-sm italic text-center mt-10">
                {lang === 'am' ? 'እንዴት ልረዳዎ እችላለሁ?' : 'How can I help you today?'}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-800'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-stone-400 text-xs animate-pulse">Assistant is thinking...</div>}
          </div>
          <div className="p-4 border-t border-stone-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.aiPlaceholder}
              className="flex-1 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button 
              onClick={handleSend}
              className="bg-amber-600 text-white p-2 rounded-full hover:bg-amber-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 transition-all flex items-center justify-center group"
        >
          <span className="hidden group-hover:block mr-2 text-sm font-medium">{t.aiAssistant}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
