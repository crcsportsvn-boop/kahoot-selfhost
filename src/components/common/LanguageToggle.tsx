'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  variant?: 'pill' | 'compact';
}

export default function LanguageToggle({ className = '', variant = 'pill' }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  const toggle = () => {
    setLang(lang === 'vi' ? 'en' : 'vi');
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={toggle}
        type="button"
        title={lang === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition shadow-sm ${className}`}
      >
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      type="button"
      title={lang === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition shadow-sm ${className}`}
    >
      <Globe className="w-3.5 h-3.5 text-indigo-400" />
      <span className={lang === 'vi' ? 'text-amber-400 font-black' : 'text-slate-400'}>VI</span>
      <span className="text-slate-600">/</span>
      <span className={lang === 'en' ? 'text-indigo-400 font-black' : 'text-slate-400'}>EN</span>
    </button>
  );
}
