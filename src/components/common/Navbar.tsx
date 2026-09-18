'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Gamepad2, LayoutDashboard } from 'lucide-react';
import AudioControl from './AudioControl';

export default function Navbar() {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-600/30 group-hover:scale-105 transition transform">
            K!
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
              QuizLive
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 ml-1.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Serverless
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
          >
            <Gamepad2 className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Chơi game</span>
          </Link>

          <Link
            href="/host/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/30 hover:bg-indigo-600/30 transition shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Host Quản Lý</span>
          </Link>

          <AudioControl />
        </div>
      </div>
    </header>
  );
}
