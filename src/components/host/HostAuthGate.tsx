'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

interface HostAuthGateProps {
  children: React.ReactNode;
}

export default function HostAuthGate({ children }: HostAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('host_unlocked');
      if (stored === '8451') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === '8451') {
      sessionStorage.setItem('host_unlocked', '8451');
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Mật khẩu không chính xác. Vui lòng thử lại!');
      setPassword('');
    }
  };

  // While checking sessionStorage
  if (isAuthenticated === null) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative z-10 animate-in zoom-in-95">
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Khu Vực Quản Trị Viên</h1>
          <p className="text-xs text-slate-400">
            Vui lòng nhập mật khẩu xác thực để truy cập Dashboard Quản Lý Bộ Đề:
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              autoFocus
              maxLength={12}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Nhập mã bảo vệ..."
              className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3.5 px-4 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-600 outline-none transition"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-semibold text-center animate-shake">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white font-bold text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer"
          >
            <span>Mở Khóa Quản Trị</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Bảo mật phiên đăng nhập quản trị
          </span>
        </div>
      </div>
    </div>
  );
}
