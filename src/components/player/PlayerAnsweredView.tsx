'use client';

import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

interface PlayerAnsweredViewProps {
  submittedAnswer: string;
}

export default function PlayerAnsweredView({ submittedAnswer }: PlayerAnsweredViewProps) {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950 text-white text-center">
      <div />

      {/* Center state */}
      <div className="my-auto flex flex-col items-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Đã Gửi Câu Trả Lời!
        </h2>

        <p className="text-sm text-slate-300 mb-6">
          Đáp án của bạn: <span className="font-bold text-yellow-300 font-mono text-base px-2 py-1 rounded bg-black/40 border border-slate-700">{submittedAnswer}</span>
        </p>

        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Clock className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Đang đợi những người chơi khác hoàn thành...</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        Giữ nguyên màn hình, kết quả chấm điểm sẽ xuất hiện ngay khi hết thời gian!
      </div>
    </div>
  );
}
