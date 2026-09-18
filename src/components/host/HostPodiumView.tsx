'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Crown, Sparkles, Home, RotateCcw } from 'lucide-react';
import { Player } from '@/types';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HostPodiumViewProps {
  players: Player[];
  quizTitle: string;
  onRestart: () => void;
}

export default function HostPodiumView({ players, quizTitle, onRestart }: HostPodiumViewProps) {
  const { t, lang } = useLanguage();
  const { playPodiumFanfare } = useSoundEffects();

  const first = players[0];
  const second = players[1];
  const third = players[2];

  useEffect(() => {
    // Play fanfare
    playPodiumFanfare();

    // Trigger confetti fireworks
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [playPodiumFanfare]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-8 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white relative overflow-hidden">
      {/* Top Banner */}
      <div className="text-center py-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-widest mb-3">
          <Sparkles className="w-4 h-4" />
          <span>{t.podiumBadge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-amber-200">
          {t.podiumTitle}
        </h1>
        <p className="text-sm text-purple-200/80 mt-1">{quizTitle}</p>
      </div>

      {/* Center: 3D Olympic Style Podium */}
      <div className="my-auto py-8 max-w-4xl mx-auto w-full flex items-end justify-center gap-3 sm:gap-6 relative z-10 min-h-[380px]">
        {/* 2nd Place (Silver) */}
        {second && (
          <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom duration-700 delay-150">
            <div className="flex flex-col items-center mb-3">
              <span className="text-4xl sm:text-5xl mb-1">{second.avatar || '🥈'}</span>
              <p className="font-extrabold text-base sm:text-lg text-slate-200 text-center truncate max-w-[140px]">
                {second.nickname}
              </p>
              <span className="text-xs font-mono font-bold text-slate-300">
                {second.score.toLocaleString()} {t.pointsWord}
              </span>
            </div>
            <div className="w-full h-48 sm:h-56 bg-gradient-to-t from-slate-700 via-slate-600 to-slate-500 rounded-t-3xl border-t-4 border-slate-300 shadow-2xl flex flex-col items-center justify-start pt-4">
              <span className="font-black text-4xl sm:text-6xl text-slate-900/50 font-mono">2</span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 mt-1">
                {t.silverRank}
              </span>
            </div>
          </div>
        )}

        {/* 1st Place (Gold - Highest) */}
        {first && (
          <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom duration-700">
            <div className="flex flex-col items-center mb-3">
              <div className="p-2 rounded-full bg-amber-500/30 text-amber-300 animate-bounce mb-1">
                <Crown className="w-8 h-8 sm:w-10 sm:h-10 fill-current text-yellow-300" />
              </div>
              <span className="text-5xl sm:text-6xl mb-1">{first.avatar || '👑'}</span>
              <p className="font-black text-lg sm:text-2xl text-yellow-300 text-center truncate max-w-[160px]">
                {first.nickname}
              </p>
              <span className="text-sm font-mono font-black text-yellow-200">
                {first.score.toLocaleString()} {t.pointsWord}
              </span>
            </div>
            <div className="w-full h-64 sm:h-76 bg-gradient-to-t from-amber-600 via-yellow-500 to-yellow-400 rounded-t-3xl border-t-4 border-yellow-200 shadow-2xl shadow-yellow-500/20 flex flex-col items-center justify-start pt-6">
              <span className="font-black text-5xl sm:text-7xl text-amber-900/40 font-mono">1</span>
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-950 mt-1">
                {t.goldRank}
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {third && (
          <div className="flex-1 flex flex-col items-center animate-in slide-in-from-bottom duration-700 delay-300">
            <div className="flex flex-col items-center mb-3">
              <span className="text-4xl sm:text-5xl mb-1">{third.avatar || '🥉'}</span>
              <p className="font-extrabold text-base sm:text-lg text-amber-200 text-center truncate max-w-[140px]">
                {third.nickname}
              </p>
              <span className="text-xs font-mono font-bold text-amber-300">
                {third.score.toLocaleString()} {t.pointsWord}
              </span>
            </div>
            <div className="w-full h-36 sm:h-44 bg-gradient-to-t from-amber-900 via-amber-800 to-amber-700 rounded-t-3xl border-t-4 border-amber-600 shadow-2xl flex flex-col items-center justify-start pt-4">
              <span className="font-black text-3xl sm:text-5xl text-amber-950/50 font-mono">3</span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-200 mt-1">
                {t.bronzeRank}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-4 relative z-10">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white shadow-lg transition cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{t.playAgainBtn}</span>
        </button>

        <Link
          href="/host/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-slate-200 hover:text-white transition cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span>{t.returnDashboardBtn}</span>
        </Link>
      </div>
    </div>
  );
}
