import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../types';

interface Props {
  current: Language;
  onChange: (lang: Language) => void;
}

const LanguageSwitcher: React.FC<Props> = ({ current, onChange }) => {
  return (
    <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden group">
      <div className="p-2 text-stone-300">
        <Globe className="w-4 h-4" />
      </div>
      <div className="flex bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden relative">
        <div
          className="absolute inset-y-0 h-full bg-amber-600 transition-all duration-300 ease-out z-0"
          style={{
            width: '50%',
            left: current === Language.AMHARIC ? '0%' : '50%'
          }}
        />
        <button
          onClick={() => onChange(Language.AMHARIC)}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative z-10 w-24 ${current === Language.AMHARIC ? 'text-white' : 'text-stone-400 hover:text-stone-600'
            }`}
        >
          አማርኛ
        </button>
        <button
          onClick={() => onChange(Language.ENGLISH)}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all relative z-10 w-24 ${current === Language.ENGLISH ? 'text-white' : 'text-stone-400 hover:text-stone-600'
            }`}
        >
          English
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
