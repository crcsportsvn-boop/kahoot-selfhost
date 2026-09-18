'use client';

import React from 'react';
import { Sparkles, Wifi, ShieldCheck } from 'lucide-react';
import { Player } from '@/types';

interface PlayerLobbyProps {
  player: Player;
  pin: string;
}

export default function PlayerLobby({ player, pin }: PlayerLobbyProps) {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white text-center">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          PIN: <span className="text-yellow-300 font-bold">{pin}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>Trực tuyến</span>
        </div>
      </div>

      {/* Main Avatar & Welcome */}
      <div className="my-auto py-12 flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-1 shadow-2xl shadow-purple-600/30 animate-pulse">
            <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-6xl sm:text-7xl">
              {player.avatar || '🦊'}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-emerald-500 text-white shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          {player.nickname}
        </h1>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Bạn đã vào phòng thi đấu!</span>
        </div>

        <p className="text-slate-400 text-sm sm:text-base max-w-xs leading-relaxed">
          Hãy nhìn lên <span className="text-white font-bold">màn hình lớn của Host</span>. Trò chơi sẽ bắt đầu trong giây lát!
        </p>
      </div>

      {/* Footer Info */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
        Mẹo: Câu trả lời càng nhanh thì số điểm nhận được càng cao!
      </div>
    </div>
  );
}
