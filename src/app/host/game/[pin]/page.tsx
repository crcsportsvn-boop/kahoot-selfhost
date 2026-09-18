'use client';

import React, { useEffect, useState, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/common/Navbar';
import HostAuthGate from '@/components/host/HostAuthGate';
import LobbyView from '@/components/host/LobbyView';
import HostQuestionView from '@/components/host/HostQuestionView';
import HostResultView from '@/components/host/HostResultView';
import HostLeaderboardView from '@/components/host/HostLeaderboardView';
import HostPodiumView from '@/components/host/HostPodiumView';
import ThemeCustomizerModal, { ThemeSettings, THEME_PRESETS } from '@/components/host/ThemeCustomizerModal';
import LanguageToggle from '@/components/common/LanguageToggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  getGameSessionByPin,
  updateSessionState,
  getAnswerDistribution,
  getSessionLeaderboard
} from '@/lib/actions/game';
import { GameSession, Question, Player, SessionStatus } from '@/types';
import {
  Loader2,
  Palette,
  Timer,
  Square,
  AlertTriangle,
  Play,
  RotateCw
} from 'lucide-react';

interface PageProps {
  params: Promise<{ pin: string }>;
}

export default function HostGamePage({ params }: PageProps) {
  const { pin } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { t, lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<GameSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState('Trò Chơi Trắc Nghiệm');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentStatus, setCurrentStatus] = useState<SessionStatus>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  // Auto-advance mode state
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Custom Theme state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeSettings>({
    bgPreset: 'deep-space',
    logoUrl: undefined
  });

  // End Game early confirmation modal state
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuto = localStorage.getItem('quiz_auto_advance');
      if (savedAuto) setAutoAdvance(savedAuto === 'true');

      const savedTheme = localStorage.getItem('quiz_theme_settings');
      if (savedTheme) {
        try {
          setTheme(JSON.parse(savedTheme));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Refs for callbacks inside listeners
  const playersRef = useRef<Player[]>([]);
  playersRef.current = players;
  const statusRef = useRef<SessionStatus>('lobby');
  statusRef.current = currentStatus;

  // Load game session details
  const loadGameData = useCallback(async () => {
    try {
      const res = await getGameSessionByPin(pin);
      if (!res.success || !res.session) {
        alert(res.error || (lang === 'vi' ? 'Không tìm thấy phòng chơi' : 'Room not found'));
        router.push('/host/dashboard');
        return;
      }

      const s = res.session;
      setSession(s);
      setCurrentStatus(s.status);
      setCurrentQuestionIndex(s.current_question_index || 0);

      if (s.quizzes) {
        setQuizTitle(s.quizzes.title || 'Trò Chơi Trắc Nghiệm');
        if (s.quizzes.questions) {
          setQuestions(s.quizzes.questions);
        }
      }

      // Load existing players in session
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', s.id)
        .order('score', { ascending: false });

      if (existingPlayers) {
        setPlayers(existingPlayers);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [pin, router, supabase, lang]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Helper to broadcast to players
  const broadcastEvent = useCallback(async (event: string, payload: Record<string, unknown>) => {
    const channel = supabase.channel(`game_sessions:${pin}`);
    await channel.send({
      type: 'broadcast',
      event,
      payload
    });
  }, [pin, supabase]);

  // ACTION: Question Time's Up
  const handleTimeUp = useCallback(async () => {
    if (!session || questions.length === 0) return;
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    try {
      await updateSessionState(session.id, {
        status: 'question_result'
      });

      // Fetch answer distribution
      const { distribution: dist, totalAnswers: total } = await getAnswerDistribution(session.id, currentQ.id);
      setDistribution(dist);
      setTotalAnswers(total);

      // Broadcast TIMES_UP with result & correct answer
      await broadcastEvent('TIMES_UP', {
        question_id: currentQ.id,
        correct_answer: currentQ.correct_answer,
        answer_distribution: dist
      });

      setCurrentStatus('question_result');
    } catch {
      // ignore
    }
  }, [session, questions, currentQuestionIndex, broadcastEvent]);

  // Setup Supabase Realtime Channel: Presence & Broadcast
  useEffect(() => {
    if (!session) return;

    const channelName = `game_sessions:${pin}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: 'host'
        }
      }
    });

    // Broadcast Listener: When a player submits an answer
    channel.on('broadcast', { event: 'PLAYER_SUBMITTED' }, () => {
      setAnsweredCount(prev => {
        const next = prev + 1;
        const totalConnected = playersRef.current.length;
        // If ALL connected players have answered, immediately end question!
        if (totalConnected > 0 && next >= totalConnected && statusRef.current === 'question') {
          setTimeout(() => {
            handleTimeUp();
          }, 300);
        }
        return next;
      });
    });

    // Postgres Changes: Listen for new player insertions in this session
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${session.id}`
      },
      (payload) => {
        const newPlayer = payload.new as Player;
        setPlayers(prev => {
          if (prev.some(p => p.id === newPlayer.id)) return prev;
          return [...prev, newPlayer];
        });
      }
    );

    // Listen for player score/streak updates
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${session.id}`
      },
      (payload) => {
        const updated = payload.new as Player;
        setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
      }
    );

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ role: 'host' });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, pin, supabase, handleTimeUp]);

  // ACTION: Start Game
  const handleStartGame = async () => {
    if (!session || questions.length === 0) return;
    setIsStarting(true);

    try {
      const now = new Date().toISOString();
      await updateSessionState(session.id, {
        status: 'question',
        current_question_index: 0,
        question_start_time: now
      });

      await broadcastEvent('GAME_START', {
        total_questions: questions.length
      });

      const q = questions[0];
      await broadcastEvent('NEW_QUESTION', {
        question_index: 0,
        total_questions: questions.length,
        question: {
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          time_limit: q.time_limit,
          order_index: q.order_index,
          media_url: q.media_url
        },
        start_time: now
      });

      setCurrentStatus('question');
      setCurrentQuestionIndex(0);
      setAnsweredCount(0);
    } catch {
      alert(lang === 'vi' ? 'Lỗi khi bắt đầu trò chơi' : 'Error starting game');
    } finally {
      setIsStarting(false);
    }
  };

  // ACTION: Show Leaderboard
  const handleShowLeaderboard = useCallback(async () => {
    if (!session) return;

    try {
      await updateSessionState(session.id, {
        status: 'leaderboard'
      });

      const topPlayers = await getSessionLeaderboard(session.id, 10);
      setPlayers(topPlayers);

      await broadcastEvent('SHOW_LEADERBOARD', {
        top_players: topPlayers
      });

      setCurrentStatus('leaderboard');
    } catch {
      // ignore
    }
  }, [session, broadcastEvent]);

  // ACTION: Next Question or End Game
  const handleNextQuestionOrEnd = useCallback(async () => {
    if (!session || questions.length === 0) return;

    const nextIndex = currentQuestionIndex + 1;
    const isLast = nextIndex >= questions.length;

    if (isLast) {
      await updateSessionState(session.id, {
        status: 'ended'
      });

      const finalLeaderboard = await getSessionLeaderboard(session.id, 5);
      await broadcastEvent('GAME_OVER', {
        podium: finalLeaderboard
      });

      setCurrentStatus('ended');
    } else {
      const now = new Date().toISOString();
      await updateSessionState(session.id, {
        status: 'question',
        current_question_index: nextIndex,
        question_start_time: now
      });

      const nextQ = questions[nextIndex];
      await broadcastEvent('NEW_QUESTION', {
        question_index: nextIndex,
        total_questions: questions.length,
        question: {
          id: nextQ.id,
          type: nextQ.type,
          prompt: nextQ.prompt,
          options: nextQ.options,
          time_limit: nextQ.time_limit,
          order_index: nextQ.order_index,
          media_url: nextQ.media_url
        },
        start_time: now
      });

      setCurrentStatus('question');
      setCurrentQuestionIndex(nextIndex);
      setAnsweredCount(0);
    }
  }, [session, questions, currentQuestionIndex, broadcastEvent]);

  // ACTION: End Game Immediately (User Request 5)
  const handleEndGameImmediately = async () => {
    if (!session) return;
    setShowEndGameConfirm(false);

    try {
      await updateSessionState(session.id, {
        status: 'ended'
      });

      const finalLeaderboard = await getSessionLeaderboard(session.id, 5);
      await broadcastEvent('GAME_OVER', {
        podium: finalLeaderboard
      });

      setCurrentStatus('ended');
    } catch {
      alert(lang === 'vi' ? 'Lỗi khi kết thúc trò chơi' : 'Error ending game');
    }
  };

  // AUTO-ADVANCE TIMER EFFECT (User Request 3)
  useEffect(() => {
    if (!autoAdvance) {
      setCountdown(null);
      return;
    }

    // Auto-advance from 'question_result' -> 'leaderboard'
    if (currentStatus === 'question_result') {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            handleShowLeaderboard();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }

    // Auto-advance from 'leaderboard' -> next question / podium
    if (currentStatus === 'leaderboard') {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            handleNextQuestionOrEnd();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }

    setCountdown(null);
  }, [autoAdvance, currentStatus, handleShowLeaderboard, handleNextQuestionOrEnd]);

  const toggleAutoAdvance = () => {
    const nextVal = !autoAdvance;
    setAutoAdvance(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_auto_advance', String(nextVal));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 font-medium">
          {lang === 'vi' ? 'Đang kết nối phòng đấu...' : 'Connecting to game room...'}
        </p>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  // Selected background gradient class
  const activePreset = THEME_PRESETS.find(p => p.id === theme.bgPreset) || THEME_PRESETS[0];
  const bgGradientClass = activePreset.gradient;

  return (
    <HostAuthGate>
      <div className={`min-h-[100dvh] flex flex-col bg-gradient-to-br ${bgGradientClass} text-slate-100 select-none overflow-x-hidden transition-colors duration-500`}>
        {/* Top Host Control Bar */}
        <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Presentation Brand / Title */}
          <div className="flex items-center gap-3">
            {theme.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt="Presentation Brand Logo"
                className="h-8 max-w-[120px] object-contain rounded bg-white/5 p-1 border border-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                K!
              </div>
            )}
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-300 truncate max-w-xs block">
                {quizTitle}
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">
                PIN: {pin}
              </span>
            </div>
          </div>

          {/* Center / Right: Host Control Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Countdown indicator when auto-advance is ticking */}
            {countdown !== null && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse shadow-sm">
                <Timer className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? `Tự chuyển sau ${countdown}s` : `Next in ${countdown}s`}</span>
              </div>
            )}

            {/* Auto-Advance Toggle (User Request 3) */}
            <button
              onClick={toggleAutoAdvance}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm cursor-pointer ${
                autoAdvance
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={lang === 'vi' ? 'Bật/Tắt chế độ tự động chuyển tiếp qua các câu hỏi và bảng điểm' : 'Toggle auto-advance across questions and leaderboard'}
            >
              <Timer className={`w-3.5 h-3.5 ${autoAdvance ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{t.autoNextLabel}:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${autoAdvance ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {autoAdvance ? t.autoNextOn : t.autoNextOff}
              </span>
            </button>

            {/* Customize Theme Button (User Request 4) */}
            <button
              onClick={() => setIsThemeModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-purple-300 hover:text-white transition shadow-sm cursor-pointer"
              title={lang === 'vi' ? 'Thay đổi màu sắc nền và logo thương hiệu hiển thị' : 'Change theme colors & company logo'}
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">{t.themeCustomBtn}</span>
            </button>

            {/* End Game Button (User Request 5) */}
            {currentStatus !== 'lobby' && currentStatus !== 'ended' && (
              <button
                onClick={() => setShowEndGameConfirm(true)}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-xs font-bold text-rose-300 hover:text-white transition shadow-sm cursor-pointer"
                title={lang === 'vi' ? 'Kết thúc vòng đấu ngay và xem bục vinh danh' : 'End game early and show podium'}
              >
                <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                <span className="hidden sm:inline">{t.endGameBtn}</span>
              </button>
            )}

            {/* Bilingual Switcher (User Request 2.2) */}
            <LanguageToggle variant="compact" />
          </div>
        </header>

        {/* Main Stage */}
        <main className="flex-1 flex flex-col">
          {currentStatus === 'lobby' && (
            <LobbyView
              pin={pin}
              quizTitle={quizTitle}
              players={players}
              onStartGame={handleStartGame}
              isStarting={isStarting}
              logoUrl={theme.logoUrl}
            />
          )}

          {currentStatus === 'question' && currentQ && (
            <HostQuestionView
              question={currentQ}
              questionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              answeredCount={answeredCount}
              totalPlayers={players.length}
              onTimeUp={handleTimeUp}
            />
          )}

          {currentStatus === 'question_result' && currentQ && (
            <HostResultView
              question={currentQ}
              distribution={distribution}
              totalAnswers={totalAnswers}
              onNext={handleShowLeaderboard}
            />
          )}

          {currentStatus === 'leaderboard' && (
            <HostLeaderboardView
              players={players}
              isLastQuestion={isLastQuestion}
              onNext={handleNextQuestionOrEnd}
            />
          )}

          {currentStatus === 'ended' && (
            <HostPodiumView
              players={players}
              quizTitle={quizTitle}
              onRestart={() => {
                handleStartGame();
              }}
            />
          )}
        </main>

        {/* Theme Customizer Modal */}
        <ThemeCustomizerModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          theme={theme}
          onUpdateTheme={(newTheme) => setTheme(newTheme)}
        />

        {/* Confirm End Game Dialog */}
        {showEndGameConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{t.confirmEndGameTitle}</h3>
                  <p className="text-xs text-slate-400">{t.confirmEndGameDesc}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndGameConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {t.cancelEndBtn}
                </button>
                <button
                  type="button"
                  onClick={handleEndGameImmediately}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-700/30 transition cursor-pointer"
                >
                  {t.endGameNowBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HostAuthGate>
  );
}
