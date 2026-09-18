'use client';

import React, { useEffect } from 'react';
import { Check, X, Flame } from 'lucide-react';
import { AnswerSubmissionResult } from '@/types';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface PlayerResultViewProps {
  result: AnswerSubmissionResult | null;
  totalScore: number;
}

export default function PlayerResultView({ result, totalScore }: PlayerResultViewProps) {
  const { playCorrect, playWrong } = useSoundEffects();

  const isCorrect = result?.is_correct ?? false;
  const points = result?.points_awarded ?? 0;
  const streak = result?.streak ?? 0;

  useEffect(() => {
    if (isCorrect) {
      playCorrect();
    } else {
      playWrong();
    }
  }, [isCorrect, playCorrect, playWrong]);

  return (
    <div
      className={`w-full max-w-full min-h-[calc(100dvh-3rem)] flex flex-col justify-between p-4 sm:p-6 text-white text-center transition-colors duration-500 overflow-x-hidden ${
        isCorrect
          ? 'bg-gradient-to-b from-emerald-950 via-green-950 to-slate-950'
          : 'bg-gradient-to-b from-red-950 via-rose-950 to-slate-950'
      }`}
    >
      <div />

      {/* Main Result Card */}
      <div className="my-auto flex flex-col items-center max-w-sm mx-auto w-full">
        <div
          className={`w-24 h-24 sm:w-30 sm:h-30 rounded-3xl flex items-center justify-center mb-5 shadow-2xl animate-in zoom-in-75 duration-300 ${
            isCorrect
              ? 'bg-emerald-500 shadow-emerald-500/40 text-white'
              : 'bg-red-600 shadow-red-600/40 text-white'
          }`}
        >
          {isCorrect ? (
            <Check className="w-14 h-14 sm:w-16 sm:h-16 stroke-[3]" />
          ) : (
            <X className="w-14 h-14 sm:w-16 sm:h-16 stroke-[3]" />
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black mb-1.5">
          {isCorrect ? 'Chính Xác!' : 'Chưa Đúng Rồi!'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 mb-5 max-w-xs px-2">
          {isCorrect
            ? 'Bạn đã trả lời rất nhanh và chuẩn xác!'
            : 'Đừng nản lòng, hãy bứt phá ở câu hỏi tiếp theo!'}
        </p>

        {/* Points Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md w-full max-w-xs shadow-xl space-y-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Điểm câu này
            </span>
            <span
              className={`text-3xl sm:text-4xl font-mono font-black ${
                isCorrect ? 'text-yellow-300' : 'text-slate-500'
              }`}
            >
              {isCorrect ? `+${points}` : '+0'}
            </span>
          </div>

          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Tổng điểm:</span>
            <span className="font-mono font-black text-base sm:text-lg text-white">
              {totalScore.toLocaleString()}
            </span>
          </div>

          {streak >= 2 && (
            <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-orange-400 font-bold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Chuỗi {streak} câu đúng liên tiếp!</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-slate-400 max-w-sm mx-auto w-full">
        Hãy nhìn lên màn hình Host để xem bảng xếp hạng chi tiết!
      </div>
    </div>
  );
}
