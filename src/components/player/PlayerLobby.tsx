'use client';

import React from 'react';
import { Sparkles, Wifi, ShieldCheck } from 'lucide-react';
import { Player } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PlayerLobbyProps {
  player: Player;
  pin: string;
}

export default function PlayerLobby({ player, pin }: PlayerLobbyProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-full min-h-[calc(100dvh-3rem)] flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white text-center overflow-x-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          PIN: <span className="text-yellow-300 font-bold">{pin}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>{t.onlineStatus}</span>
        </div>
      </div>

      {/* Main Avatar & Welcome */}
      <div className="my-auto py-8 sm:py-12 flex flex-col items-center">
        <div className="relative mb-5">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-1 shadow-2xl shadow-purple-600/30 animate-pulse">
            <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-5xl sm:text-6xl">
              {player.avatar || '🦊'}
            </div>
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-emerald-500 text-white shadow-lg">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          {player.nickname}
        </h1>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>{t.inRoomBadge}</span>
        </div>

        <p className="text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed px-2">
          {t.lookAtHostScreen}
        </p>
      </div>

      {/* Footer Info */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 max-w-sm mx-auto w-full">
        {t.speedTip}
      </div>
    </div>
  );
}
