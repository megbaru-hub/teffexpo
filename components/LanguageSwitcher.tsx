
import React from 'react';
import { Language } from '../types';

interface Props {
  current: Language;
  onChange: (lang: Language) => void;
}

const LanguageSwitcher: React.FC<Props> = ({ current, onChange }) => {
  return (
    <div className="flex space-x-2 bg-stone-100 p-1 rounded-full border border-stone-200">
      <button
        onClick={() => onChange(Language.AMHARIC)}
        className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
          current === Language.AMHARIC ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-200'
        }`}
      >
        አማርኛ
      </button>
      <button
        onClick={() => onChange(Language.ENGLISH)}
        className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
          current === Language.ENGLISH ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-200'
        }`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
