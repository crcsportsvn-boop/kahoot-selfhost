'use client';

import React, { useEffect } from 'react';
import { Trophy, Flame, ArrowRight } from 'lucide-react';
import { Player } from '@/types';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HostLeaderboardViewProps {
  players: Player[];
  isLastQuestion: boolean;
  onNext: () => void;
}

export default function HostLeaderboardView({
  players,
  isLastQuestion,
  onNext
}: HostLeaderboardViewProps) {
  const { t, lang } = useLanguage();
  const { playLeaderboard } = useSoundEffects();

  useEffect(() => {
    playLeaderboard();
  }, [playLeaderboard]);

  const topPlayers = players.slice(0, 5);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-8 bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950 text-white relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{t.leaderboardTitle}</h1>
            <p className="text-xs text-slate-400">{t.leaderboardSubtitle}</p>
          </div>
        </div>

        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-700/30 transition cursor-pointer"
        >
          <span>{isLastQuestion ? t.seePodiumBtn : t.nextQuestionBtn}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Leaderboard List */}
      <div className="my-auto py-8 max-w-3xl mx-auto w-full space-y-3">
        {topPlayers.map((player, index) => {
          const rank = index + 1;
          const isFirst = rank === 1;
          const isSecond = rank === 2;
          const isThird = rank === 3;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all transform animate-in slide-in-from-bottom duration-500 ${
                isFirst
                  ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-amber-500/50 shadow-xl shadow-amber-500/10 scale-102'
                  : isSecond
                  ? 'bg-gradient-to-r from-slate-400/20 via-slate-500/10 to-transparent border-slate-400/40'
                  : isThird
                  ? 'bg-gradient-to-r from-amber-700/20 via-amber-800/10 to-transparent border-amber-700/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Left: Rank & Nickname */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl font-mono ${
                    isFirst
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50'
                      : isSecond
                      ? 'bg-slate-300 text-slate-950'
                      : isThird
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {rank}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">{player.avatar || '🦊'}</span>
                  <div>
                    <p className="font-black text-lg sm:text-xl text-white">{player.nickname}</p>
                    {player.streak >= 2 && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-400 font-bold">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>{player.streak} {t.streakFire}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Score */}
              <div className="text-right">
                <span className="font-mono font-black text-2xl sm:text-3xl text-yellow-300">
                  {player.score.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                  {t.pointsWord}
                </span>
              </div>
            </div>
          );
        })}

        {players.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            {lang === 'vi' ? 'Chưa có người chơi nào ghi được điểm.' : 'No players have scored yet.'}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="text-center text-xs text-slate-500">
        {lang === 'vi' ? 'Điểm số được tính toán tức thời dựa trên tốc độ và độ chính xác của câu trả lời.' : 'Scores are calculated in real time based on response speed and correctness.'}
      </div>
    </div>
  );
}
