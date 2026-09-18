'use client';

import React, { useEffect, useState } from 'react';
import { Triangle, Diamond, Circle, Square, Check, X, Users, FastForward } from 'lucide-react';
import { Question } from '@/types';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HostQuestionViewProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  totalPlayers: number;
  onTimeUp: () => void;
}

export default function HostQuestionView({
  question,
  questionIndex,
  totalQuestions,
  answeredCount,
  totalPlayers,
  onTimeUp
}: HostQuestionViewProps) {
  const { t, lang } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(question.time_limit || 20);
  const { playCountdownTick, playTimesUp } = useSoundEffects();

  useEffect(() => {
    setTimeLeft(question.time_limit || 20);
  }, [question]);

  // If all players have answered, immediately end question!
  useEffect(() => {
    if (totalPlayers > 0 && answeredCount >= totalPlayers) {
      playTimesUp();
      onTimeUp();
    }
  }, [answeredCount, totalPlayers, onTimeUp, playTimesUp]);

  useEffect(() => {
    if (timeLeft <= 0) {
      playTimesUp();
      onTimeUp();
      return;
    }

    playCountdownTick(timeLeft);

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, playCountdownTick, playTimesUp]);

  const percentage = Math.max(0, (timeLeft / (question.time_limit || 20)) * 100);

  const shapeConfigs = [
    { color: 'bg-red-600', borderColor: 'border-red-400/40', icon: Triangle, label: 'A' },
    { color: 'bg-blue-600', borderColor: 'border-blue-400/40', icon: Diamond, label: 'B' },
    { color: 'bg-amber-500', borderColor: 'border-amber-300/40', icon: Circle, label: 'C' },
    { color: 'bg-emerald-600', borderColor: 'border-emerald-400/40', icon: Square, label: 'D' },
  ];

  const displayTrue = lang === 'vi' ? 'Đúng' : 'True';
  const displayFalse = lang === 'vi' ? 'Sai' : 'False';

  return (
    <div className="w-full min-h-[calc(100dvh-4rem)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-slate-950 text-white relative">
      {/* Top Header: Progress & Timer */}
      <div className="flex items-center justify-between gap-4 pb-3">
        {/* Question Counter Pill */}
        <div className="px-4 sm:px-5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-xs sm:text-base shadow-lg">
          <span>{t.questionWord} </span>
          <span className="text-indigo-400 font-mono text-base sm:text-lg">{questionIndex + 1}</span>
          <span className="text-slate-500"> / {totalQuestions}</span>
        </div>

        {/* Circular Countdown Timer */}
        <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              className="stroke-slate-800 stroke-[7px] sm:stroke-[8px] fill-transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              className={`stroke-[7px] sm:stroke-[8px] fill-transparent transition-all duration-1000 stroke-linecap-round ${
                timeLeft <= 5 ? 'stroke-rose-500' : 'stroke-indigo-500'
              }`}
              style={{
                strokeDasharray: 251.2,
                strokeDashoffset: 251.2 - (251.2 * percentage) / 100
              }}
            />
          </svg>
          <span
            className={`absolute font-black text-xl sm:text-2xl font-mono ${
              timeLeft <= 5 ? 'text-rose-400 animate-ping' : 'text-white'
            }`}
          >
            {timeLeft}
          </span>
        </div>

        {/* Answer Counter & Skip button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-4 sm:px-5 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-xs sm:text-base flex items-center gap-2 shadow-lg">
            <Users className="w-4 h-4 text-purple-400" />
            <span>
              <span className="text-purple-400 font-mono text-base sm:text-lg">{answeredCount}</span>
              <span className="text-slate-500"> / {totalPlayers} {t.answersWord}</span>
            </span>
          </div>

          <button
            onClick={() => {
              playTimesUp();
              onTimeUp();
            }}
            className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Kết thúc thời gian làm bài ngay"
          >
            <span className="hidden sm:inline">{t.skipNowBtn}</span>
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Question Prompt + Media Image (if any) */}
      <div className="my-auto py-3 sm:py-6 max-w-5xl mx-auto w-full text-center">
        <div className="inline-block px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] uppercase font-bold tracking-widest mb-3">
          {question.type === 'multiple_choice'
            ? 'Trắc Nghiệm 4 Đáp Án'
            : question.type === 'true_false'
            ? 'Đúng / Sai'
            : 'Điền Từ Vào Chỗ Trống'}
        </div>

        <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md px-2">
          {question.prompt}
        </h2>

        {/* Show Question Image if present */}
        {question.media_url && (
          <div className="mt-4 max-h-48 sm:max-h-60 flex justify-center">
            <img
              src={question.media_url}
              alt="Hình ảnh minh họa câu hỏi"
              className="max-h-44 sm:max-h-56 max-w-full object-contain rounded-2xl border border-slate-700/80 shadow-2xl"
            />
          </div>
        )}
      </div>

      {/* Bottom: Options Display */}
      <div className="w-full max-w-6xl mx-auto pb-2">
        {question.type === 'multiple_choice' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {question.options.map((opt, idx) => {
              const cfg = shapeConfigs[idx % shapeConfigs.length];
              const Icon = cfg.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border ${cfg.borderColor} ${cfg.color} text-white shadow-xl`}
                >
                  <div className="p-2.5 rounded-full bg-black/20 shrink-0">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                  </div>
                  <span className="text-base sm:text-xl font-bold leading-snug">{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-4 p-5 sm:p-6 rounded-2xl bg-emerald-600 border border-emerald-400/30 text-white shadow-xl">
              <div className="p-2.5 rounded-full bg-black/20 shrink-0">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold">
                {question.options[0] || 'Đúng (True)'}
              </span>
            </div>

            <div className="flex items-center gap-4 p-5 sm:p-6 rounded-2xl bg-red-600 border border-red-400/30 text-white shadow-xl">
              <div className="p-2.5 rounded-full bg-black/20 shrink-0">
                <X className="w-7 h-7 stroke-[3]" />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold">
                {question.options[1] || 'Sai (False)'}
              </span>
            </div>
          </div>
        )}

        {question.type === 'fill_in_the_blank' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <p className="text-base sm:text-lg text-slate-300 font-semibold mb-1">
              Các bạn hãy nhập đáp án chính xác trên màn hình điện thoại!
            </p>
            <p className="text-xs text-slate-500">Hệ thống tự động chuẩn hóa chữ hoa/thường và khoảng trắng khi chấm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
