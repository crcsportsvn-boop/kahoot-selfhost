'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Shield, Trophy, LayoutDashboard } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Nền tảng Trắc Nghiệm Thời Gian Thực</span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Đấu Trí Trực Tiếp <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-indigo-400">
                Cực Nhanh, Cực Vui
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-md mx-auto">
              Tham gia ngay bằng mã PIN 6 số hoặc tạo phòng thi đấu cho lớp học, hội thảo, sự kiện của bạn!
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
                  className="w-full text-center text-3xl sm:text-4xl font-mono font-black tracking-widest py-3 px-4 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-yellow-300 placeholder:text-slate-700 outline-none transition"
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

          {/* Host link CTA */}
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>Bạn là giáo viên hoặc người tổ chức?</span>
            <Link
              href="/host/dashboard"
              className="text-indigo-400 font-bold hover:text-indigo-300 underline inline-flex items-center gap-1"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Mở Dashboard Quản Lý Bộ Đề</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="w-full max-w-4xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left relative z-10">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 w-fit mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Supabase Realtime</h3>
            <p className="text-xs text-slate-400 mt-1">
              Đồng bộ trạng thái câu hỏi, kết quả và điểm số tức thì qua Supabase Broadcast & Presence.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 w-fit mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Chấm Điểm Bảo Mật</h3>
            <p className="text-xs text-slate-400 mt-1">
              Đáp án được giấu kín khỏi client; thuật toán suy giảm điểm theo thời gian chạy trực tiếp trên server.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 w-fit mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Âm Thanh & Hiệu Ứng</h3>
            <p className="text-xs text-slate-400 mt-1">
              Âm thanh Web Audio tổng hợp sống động, pháo hoa bục podium và nhập đề thần tốc từ file Excel.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
