'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, Copy, Check, Sparkles, Volume2 } from 'lucide-react';
import { Player } from '@/types';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface LobbyViewProps {
  pin: string;
  quizTitle: string;
  players: Player[];
  onStartGame: () => void;
  isStarting: boolean;
}

export default function LobbyView({
  pin,
  quizTitle,
  players,
  onStartGame,
  isStarting
}: LobbyViewProps) {
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const { playLobbyMusic, stopLobbyMusic } = useSoundEffects();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/play/${pin}`);
    }
  }, [pin]);

  // Start background groove
  useEffect(() => {
    playLobbyMusic();
    return () => {
      stopLobbyMusic();
    };
  }, [playLobbyMusic, stopLobbyMusic]);

  const handleCopy = () => {
    if (navigator.clipboard && joinUrl) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-8 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Game Info & PIN Banner */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs uppercase font-bold tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Phòng Đấu Trực Tiếp</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{quizTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Người chơi quét mã QR hoặc truy cập đường link để tham gia
          </p>
        </div>

        {/* Big PIN Card */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 border border-purple-500/40 px-6 py-4 rounded-2xl shadow-inner">
          <div className="text-center sm:text-right">
            <span className="text-xs text-purple-300 font-bold uppercase tracking-wider block">
              Mã PIN Trò Chơi
            </span>
            <span className="text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-pink-400 select-all font-mono">
              {pin}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 hover:text-white transition cursor-pointer"
            title="Sao chép liên kết phòng"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area: QR Code & Live Player Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 my-8 flex-1 items-start">
        {/* Left Column: QR Code & Link */}
        <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="p-4 bg-white rounded-2xl shadow-xl mb-4">
            {joinUrl && (
              <QRCodeSVG
                value={joinUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            )}
          </div>
          <p className="text-xs font-semibold text-slate-300 mb-1">Quét mã bằng camera điện thoại</p>
          <p className="text-[11px] text-slate-500 break-all">{joinUrl}</p>
        </div>

        {/* Right Column: Player Count & Player Nickname Cards */}
        <div className="lg:col-span-3 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl flex flex-col min-h-[360px] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Người Chơi Đã Vào Phòng</h2>
                <p className="text-xs text-slate-400">Danh sách sẽ tự động cập nhật ngay khi người chơi tham gia</p>
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-sm sm:text-base">
              {players.length} người chơi
            </div>
          </div>

          {/* Players Grid */}
          {players.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mb-4 animate-pulse">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-lg font-bold text-slate-300">Đang chờ người chơi tham gia...</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Hãy mở trang <span className="text-purple-400 font-mono font-semibold">/play/{pin}</span> trên điện thoại để bắt đầu!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto max-h-[380px] pr-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md animate-in zoom-in-95 duration-200"
                >
                  <span className="text-2xl sm:text-3xl">{p.avatar || '🦊'}</span>
                  <div className="overflow-hidden">
                    <p className="font-extrabold text-sm sm:text-base text-slate-100 truncate">
                      {p.nickname}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-semibold">Sẵn sàng</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Bar: Start Game CTA */}
      <div className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-2xl">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span>Nhạc chờ đang phát. Bạn có thể bấm bắt đầu khi mọi người đã vào đủ.</span>
        </div>

        <button
          onClick={onStartGame}
          disabled={players.length === 0 || isStarting}
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-black text-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 text-white shadow-xl shadow-emerald-700/30 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{isStarting ? 'Đang khởi động...' : 'Bắt đầu trò chơi'}</span>
        </button>
      </div>
    </div>
  );
}
