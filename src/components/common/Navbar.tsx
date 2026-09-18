'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Lock } from 'lucide-react';
import AudioControl from './AudioControl';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface NavbarProps {
  showHostLink?: boolean;
  showAudioControl?: boolean;
  showLockButton?: boolean;
  onLock?: () => void;
}

export default function Navbar({
  showHostLink = false,
  showAudioControl = true,
  showLockButton = false,
  onLock
}: NavbarProps) {
  const { t } = useLanguage();

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md shadow-purple-600/30 group-hover:scale-105 transition transform">
            K!
          </div>
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
              {t.gameTitle}
            </span>
            <span className="hidden md:inline text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 ml-1.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {t.serverless}
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageToggle />

          {showHostLink && (
            <Link
              href="/host/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600/20 text-indigo-300 hover:text-white border border-indigo-500/30 hover:bg-indigo-600/30 transition shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.hostDashboard}</span>
            </Link>
          )}

          {showLockButton && onLock && (
            <button
              type="button"
              onClick={onLock}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-rose-500/10 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer"
              title={t.lock}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t.lock}</span>
            </button>
          )}

          {showAudioControl && <AudioControl />}
        </div>
      </div>
    </header>
  );
}
