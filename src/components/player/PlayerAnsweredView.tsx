'use client';

import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PlayerAnsweredViewProps {
  submittedAnswer: string;
}

export default function PlayerAnsweredView({ submittedAnswer }: PlayerAnsweredViewProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="w-full max-w-full min-h-[calc(100dvh-3rem)] flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950 text-white text-center overflow-x-hidden">
      <div />

      {/* Center state */}
      <div className="my-auto flex flex-col items-center max-w-sm mx-auto w-full">
        <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mb-5 shadow-2xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 stroke-[2.5]" />
        </div>

        <h2 className="text-xl sm:text-3xl font-black text-white mb-2">
          {t.answeredTitle}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mb-5">
          {t.yourAnswer} <span className="font-bold text-yellow-300 font-mono text-sm sm:text-base px-2 py-0.5 rounded bg-black/40 border border-slate-700">{submittedAnswer}</span>
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>{t.waitingOthers}</span>
        </div>
      </div>

      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 max-w-sm mx-auto w-full">
        {lang === 'vi' ? 'Kết quả chấm điểm sẽ xuất hiện ngay khi tất cả người chơi hoàn thành!' : 'Round scores will be revealed as soon as everyone answers!'}
      </div>
    </div>
  );
}
