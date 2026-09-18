'use client';

import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Question } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HostResultViewProps {
  question: Question;
  distribution: Record<string, number>;
  totalAnswers: number;
  onNext: () => void;
}

export default function HostResultView({
  question,
  distribution,
  totalAnswers,
  onNext
}: HostResultViewProps) {
  const { t, lang } = useLanguage();

  const isCorrect = (opt: string) => {
    const cleanOpt = opt.trim().toLowerCase();
    if (Array.isArray(question.correct_answer)) {
      return question.correct_answer.some(a => String(a).trim().toLowerCase() === cleanOpt);
    }
    const correctClean = String(question.correct_answer).trim().toLowerCase();
    if (question.type === 'true_false') {
      const isTargetTrue = correctClean.includes('đúng') || correctClean.includes('true');
      const isTargetFalse = correctClean.includes('sai') || correctClean.includes('false');
      if (isTargetTrue && (cleanOpt.includes('đúng') || cleanOpt.includes('true'))) return true;
      if (isTargetFalse && (cleanOpt.includes('sai') || cleanOpt.includes('false'))) return true;
    }
    return cleanOpt === correctClean;
  };

  const getCount = (opt: string) => {
    // Check direct match or normalized match
    let count = distribution[opt] || 0;
    if (question.type === 'true_false') {
      const isTrue = opt.toLowerCase().includes('đúng') || opt.toLowerCase().includes('true');
      Object.entries(distribution).forEach(([key, val]) => {
        const kLower = key.toLowerCase();
        if (isTrue && (kLower.includes('đúng') || kLower.includes('true')) && key !== opt) {
          count += val;
        } else if (!isTrue && (kLower.includes('sai') || kLower.includes('false')) && key !== opt) {
          count += val;
        }
      });
    }
    return count;
  };

  const displayTrue = lang === 'vi' ? 'Đúng' : 'True';
  const displayFalse = lang === 'vi' ? 'Sai' : 'False';

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-8 bg-slate-950 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            {t.questionResultTitle}
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-100">{question.prompt}</h2>
        </div>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-extrabold text-sm sm:text-base text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <span>{t.seeLeaderboardBtn}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Bar Chart: Answer Distribution */}
      <div className="my-auto py-8 max-w-5xl mx-auto w-full">
        {question.type === 'multiple_choice' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 items-end min-h-[300px] sm:min-h-[380px] p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
            {question.options.map((opt, idx) => {
              const count = getCount(opt);
              const maxCount = Math.max(1, ...Object.values(distribution), totalAnswers);
              const heightPercent = totalAnswers > 0 ? Math.max(12, (count / maxCount) * 100) : 12;
              const correct = isCorrect(opt);

              const colorThemes = [
                { bg: 'bg-red-600', ring: 'ring-red-400' },
                { bg: 'bg-blue-600', ring: 'ring-blue-400' },
                { bg: 'bg-amber-500', ring: 'ring-amber-300' },
                { bg: 'bg-emerald-600', ring: 'ring-emerald-400' }
              ];
              const theme = colorThemes[idx % colorThemes.length];

              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full gap-3">
                  {/* Vote Count */}
                  <span className="font-mono font-black text-2xl text-white drop-shadow-md">
                    {count}
                  </span>

                  {/* Animated Bar */}
                  <div className="w-full bg-slate-800 rounded-2xl overflow-hidden flex flex-col justify-end p-1.5 h-64">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-xl ${theme.bg} ${
                        correct ? 'ring-4 ring-white shadow-2xl animate-pulse' : 'opacity-80'
                      } flex items-center justify-center transition-all duration-700`}
                    >
                      {correct && <CheckCircle2 className="w-8 h-8 text-white stroke-[2.5]" />}
                    </div>
                  </div>

                  {/* Option Label */}
                  <div
                    className={`text-center p-3 rounded-xl w-full border ${
                      correct
                        ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <p className="text-xs sm:text-sm line-clamp-2">{opt}</p>
                    {correct && (
                      <span className="text-[10px] text-emerald-400 uppercase font-extrabold tracking-wider block mt-1">
                        {lang === 'vi' ? 'Đáp án đúng' : 'Correct'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="grid grid-cols-2 gap-6 items-end min-h-[300px] p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
            {[displayTrue, displayFalse].map((label, idx) => {
              const count = getCount(label);
              const maxCount = Math.max(1, ...Object.values(distribution), totalAnswers);
              const heightPercent = totalAnswers > 0 ? Math.max(12, (count / maxCount) * 100) : 12;
              const correct = isCorrect(label);

              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full gap-3">
                  <span className="font-mono font-black text-3xl text-white">{count}</span>
                  <div className="w-full bg-slate-800 rounded-2xl overflow-hidden flex flex-col justify-end p-2 h-64">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-xl ${
                        idx === 0 ? 'bg-emerald-600' : 'bg-red-600'
                      } ${
                        correct ? 'ring-4 ring-white shadow-2xl' : 'opacity-80'
                      } flex items-center justify-center transition-all duration-700`}
                    >
                      {correct && <CheckCircle2 className="w-10 h-10 text-white" />}
                    </div>
                  </div>
                  <div
                    className={`text-center p-4 rounded-xl w-full border ${
                      correct
                        ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <p className="text-2xl font-black">{label}</p>
                    {correct && (
                      <span className="text-xs text-emerald-400 uppercase font-extrabold block mt-1">
                        {lang === 'vi' ? 'Đáp án đúng' : 'Correct'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'fill_in_the_blank' && (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6">
            <div>
              <span className="text-xs text-indigo-400 uppercase font-bold tracking-widest block mb-2">
                {t.acceptedAnswers}
              </span>
              <div className="inline-flex flex-wrap gap-2 justify-center">
                {Array.isArray(question.correct_answer) ? (
                  question.correct_answer.map((ans, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xl font-bold"
                    >
                      {ans}
                    </span>
                  ))
                ) : (
                  <span className="px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-2xl font-black">
                    {String(question.correct_answer)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-slate-400">
              {t.totalAnswersCount} <span className="font-bold text-white font-mono">{totalAnswers}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500">
        {lang === 'vi' ? 'Nhấn "Xem Bảng Xếp Hạng" để hiển thị điểm số và vị trí các đấu thủ' : 'Click "View Leaderboard" to reveal updated player ranks'}
      </div>
    </div>
  );
}
