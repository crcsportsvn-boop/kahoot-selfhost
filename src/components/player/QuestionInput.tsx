'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Triangle, Diamond, Circle, Square, Check, X, Send } from 'lucide-react';
import { PublicQuestion } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface QuestionInputProps {
  question: PublicQuestion;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export default function QuestionInput({ question, onAnswer, disabled = false }: QuestionInputProps) {
  const { lang } = useLanguage();
  const [blankInput, setBlankInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Trigger mobile haptic feedback if supported
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {
        // Ignore if not allowed
      }
    }
  };

  const handleSelectAnswer = (ans: string) => {
    if (disabled) return;
    triggerHaptic();
    onAnswer(ans);
  };

  const handleSubmitBlank = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !blankInput.trim()) return;
    triggerHaptic();
    onAnswer(blankInput.trim());
  };

  // Auto focus for fill in the blank
  useEffect(() => {
    if (question.type === 'fill_in_the_blank') {
      setBlankInput('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [question]);

  // 1. Multiple Choice (4 colored shapes)
  if (question.type === 'multiple_choice') {
    const shapeConfigs = [
      {
        color: 'bg-red-600 hover:bg-red-500 active:bg-red-700 shadow-red-700/50',
        borderColor: 'border-red-400/40',
        icon: Triangle,
        label: 'A'
      },
      {
        color: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-700/50',
        borderColor: 'border-blue-400/40',
        icon: Diamond,
        label: 'B'
      },
      {
        color: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 shadow-amber-600/50',
        borderColor: 'border-amber-300/40',
        icon: Circle,
        label: 'C'
      },
      {
        color: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-700/50',
        borderColor: 'border-emerald-400/40',
        icon: Square,
        label: 'D'
      }
    ];

    const optionsToRender = question.options && question.options.length > 0
      ? question.options
      : ['A', 'B', 'C', 'D'];

    return (
      <div className="w-full h-full p-3 sm:p-4 grid grid-cols-2 gap-3 sm:gap-4 select-none">
        {optionsToRender.map((opt, idx) => {
          const config = shapeConfigs[idx % shapeConfigs.length];
          const Icon = config.icon;

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectAnswer(opt)}
              className={`relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border ${config.borderColor} ${config.color} text-white font-bold shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[120px] sm:min-h-[160px]`}
            >
              <div className="p-3 rounded-full bg-black/20 mb-2">
                <Icon className="w-8 h-8 sm:w-12 sm:h-12 fill-current" />
              </div>
              <span className="text-base sm:text-xl font-bold text-center line-clamp-3 leading-snug">
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Pure True / False without mixed language
  if (question.type === 'true_false') {
    const displayTrue = lang === 'vi' ? 'Đúng' : 'True';
    const displayFalse = lang === 'vi' ? 'Sai' : 'False';

    const rawTrueOpt = question.options?.[0] || displayTrue;
    const rawFalseOpt = question.options?.[1] || displayFalse;

    return (
      <div className="w-full h-full p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 select-none">
        {/* True Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectAnswer(rawTrueOpt)}
          className="flex flex-col items-center justify-center p-8 rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 text-white font-black shadow-xl border border-emerald-400/30 transition disabled:opacity-50 cursor-pointer min-h-[140px] sm:min-h-[220px]"
        >
          <div className="p-4 rounded-full bg-black/20 mb-3">
            <Check className="w-12 h-12 stroke-[3]" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold">{displayTrue}</span>
        </button>

        {/* False Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectAnswer(rawFalseOpt)}
          className="flex flex-col items-center justify-center p-8 rounded-3xl bg-red-600 hover:bg-red-500 active:bg-red-700 active:scale-95 text-white font-black shadow-xl border border-red-400/30 transition disabled:opacity-50 cursor-pointer min-h-[140px] sm:min-h-[220px]"
        >
          <div className="p-4 rounded-full bg-black/20 mb-3">
            <X className="w-12 h-12 stroke-[3]" />
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold">{displayFalse}</span>
        </button>
      </div>
    );
  }

  // 3. Fill in the Blank (Large Input + Auto-focus + Submit)
  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 flex flex-col justify-center">
      <form onSubmit={handleSubmitBlank} className="space-y-4">
        <div className="bg-slate-900/90 border-2 border-indigo-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
            {lang === 'vi' ? 'Nhập câu trả lời của bạn:' : 'Enter your answer:'}
          </label>
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={blankInput}
            onChange={(e) => setBlankInput(e.target.value)}
            placeholder={lang === 'vi' ? 'Gõ từ khóa vào đây...' : 'Type answer here...'}
            className="w-full text-xl sm:text-2xl font-bold text-white bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-500"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !blankInput.trim()}
          className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-98 text-white font-extrabold text-lg sm:text-xl shadow-xl shadow-purple-900/40 flex items-center justify-center gap-3 transition disabled:opacity-50 cursor-pointer"
        >
          <span>{lang === 'vi' ? 'Gửi câu trả lời' : 'Submit Answer'}</span>
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
