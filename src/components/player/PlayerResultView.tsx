'use client';

import React, { useEffect } from 'react';
import { Check, X, Flame, Trophy } from 'lucide-react';
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
      className={`w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-6 text-white text-center transition-colors duration-500 ${
        isCorrect
          ? 'bg-gradient-to-b from-emerald-950 via-green-950 to-slate-950'
          : 'bg-gradient-to-b from-red-950 via-rose-950 to-slate-950'
      }`}
    >
      <div />

      {/* Main Result Card */}
      <div className="my-auto flex flex-col items-center">
        <div
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-in zoom-in-75 duration-300 ${
            isCorrect
              ? 'bg-emerald-500 shadow-emerald-500/40 text-white'
              : 'bg-red-600 shadow-red-600/40 text-white'
          }`}
        >
          {isCorrect ? (
            <Check className="w-16 h-16 stroke-[3]" />
          ) : (
            <X className="w-16 h-16 stroke-[3]" />
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black mb-2">
          {isCorrect ? 'Chính Xác!' : 'Chưa Đúng Rồi!'}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-xs">
          {isCorrect
            ? 'Bạn đã trả lời rất nhanh và chuẩn xác!'
            : 'Đừng nản lòng, hãy bứt phá ở câu hỏi tiếp theo!'}
        </p>

        {/* Points Banner */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md w-full max-w-xs shadow-xl space-y-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Điểm câu này
            </span>
            <span
              className={`text-4xl font-mono font-black ${
                isCorrect ? 'text-yellow-300' : 'text-slate-500'
              }`}
            >
              {isCorrect ? `+${points}` : '+0'}
            </span>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Tổng điểm:</span>
            <span className="font-mono font-black text-lg text-white">
              {totalScore.toLocaleString()}
            </span>
          </div>

          {streak >= 2 && (
            <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-orange-400 font-bold">
              <Flame className="w-4 h-4 fill-current" />
              <span>Chuỗi {streak} câu đúng liên tiếp!</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-slate-400">
        Hãy nhìn lên màn hình Host để xem bảng xếp hạng chi tiết!
      </div>
    </div>
  );
}
