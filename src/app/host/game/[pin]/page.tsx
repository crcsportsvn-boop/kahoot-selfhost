'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/common/Navbar';
import LobbyView from '@/components/host/LobbyView';
import HostQuestionView from '@/components/host/HostQuestionView';
import HostResultView from '@/components/host/HostResultView';
import HostLeaderboardView from '@/components/host/HostLeaderboardView';
import HostPodiumView from '@/components/host/HostPodiumView';
import {
  getGameSessionByPin,
  updateSessionState,
  getAnswerDistribution,
  getSessionLeaderboard
} from '@/lib/actions/game';
import { GameSession, Question, Player, SessionStatus } from '@/types';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ pin: string }>;
}

export default function HostGamePage({ params }: PageProps) {
  const { pin } = use(params);
  const router = useRouter();
  const supabase = createClient();

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

  // Load game session details
  const loadGameData = useCallback(async () => {
    try {
      const res = await getGameSessionByPin(pin);
      if (!res.success || !res.session) {
        alert(res.error || 'Không tìm thấy phòng chơi');
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
  }, [pin, router, supabase]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

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

    // 1. Presence Sync: Track connected players in room
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const connectedNicknames = new Set<string>();

        Object.values(state).forEach((presences) => {
          (presences as Array<{ nickname?: string }>).forEach(p => {
            if (p.nickname) connectedNicknames.add(p.nickname);
          });
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Player joined presence
      });

    // 2. Broadcast Listener: When a player submits an answer
    channel.on('broadcast', { event: 'PLAYER_SUBMITTED' }, () => {
      setAnsweredCount(prev => prev + 1);
    });

    // 3. Postgres Changes: Listen for new player insertions in this session
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

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ role: 'host' });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, pin, supabase]);

  // Helper to broadcast to players
  const broadcastEvent = useCallback(async (event: string, payload: Record<string, unknown>) => {
    const channel = supabase.channel(`game_sessions:${pin}`);
    await channel.send({
      type: 'broadcast',
      event,
      payload
    });
  }, [pin, supabase]);

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

      // Broadcast GAME_START
      await broadcastEvent('GAME_START', {
        total_questions: questions.length
      });

      // Broadcast NEW_QUESTION (Notice: correct_answer is strictly omitted for security!)
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
          order_index: q.order_index
        },
        start_time: now
      });

      setCurrentStatus('question');
      setCurrentQuestionIndex(0);
      setAnsweredCount(0);
    } catch {
      alert('Lỗi khi bắt đầu trò chơi');
    } finally {
      setIsStarting(false);
    }
  };

  // ACTION: Question Time's Up
  const handleTimeUp = async () => {
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
  };

  // ACTION: Show Leaderboard
  const handleShowLeaderboard = async () => {
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
  };

  // ACTION: Next Question or End Game
  const handleNextQuestionOrEnd = async () => {
    if (!session || questions.length === 0) return;

    const nextIndex = currentQuestionIndex + 1;
    const isLast = nextIndex >= questions.length;

    if (isLast) {
      // Game Over -> Podium
      await updateSessionState(session.id, {
        status: 'ended'
      });

      const finalLeaderboard = await getSessionLeaderboard(session.id, 5);
      await broadcastEvent('GAME_OVER', {
        podium: finalLeaderboard
      });

      setCurrentStatus('ended');
    } else {
      // Next Question
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
          order_index: nextQ.order_index
        },
        start_time: now
      });

      setCurrentStatus('question');
      setCurrentQuestionIndex(nextIndex);
      setAnsweredCount(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-400 font-medium">Đang kết nối phòng đấu...</p>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 select-none">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {currentStatus === 'lobby' && (
          <LobbyView
            pin={pin}
            quizTitle={quizTitle}
            players={players}
            onStartGame={handleStartGame}
            isStarting={isStarting}
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
    </div>
  );
}
