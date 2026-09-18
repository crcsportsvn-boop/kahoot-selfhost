'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/common/Navbar';

export default function HomePage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!cleanPin) {
      setError('Vui lòng nhập mã PIN');
      return;
    }
    if (cleanPin.length < 6) {
      setError('Mã PIN bao gồm 6 chữ số');
      return;
    }
    router.push(`/play/${cleanPin}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white overflow-x-hidden">
      <Navbar showHostLink={false} />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-gradient-to-tr from-purple-600/25 to-indigo-600/25 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center relative z-10 space-y-6 sm:space-y-8 my-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Nền tảng Trắc Nghiệm Thời Gian Thực</span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Đấu Trí Trực Tiếp <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-indigo-400">
                Cực Nhanh, Cực Vui
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2.5 max-w-sm mx-auto">
              Nhập mã PIN 6 số từ màn hình máy chiếu để tham gia ngay vào vòng thi!
            </p>
          </div>

          {/* Join Game Box */}
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">
                  Nhập Mã PIN Trò Chơi
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/[^0-9]/g, ''));
                    setError(null);
                  }}
                  placeholder="000000"
                  className="w-full text-center text-3xl sm:text-4xl font-mono font-black tracking-widest py-3.5 px-4 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-yellow-300 placeholder:text-slate-700 outline-none transition"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-98 text-white font-black text-lg shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Vào Chơi Ngay</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
