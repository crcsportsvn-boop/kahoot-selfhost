'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/common/Navbar';
import QuestionInput from '@/components/player/QuestionInput';
import PlayerLobby from '@/components/player/PlayerLobby';
import PlayerAnsweredView from '@/components/player/PlayerAnsweredView';
import PlayerResultView from '@/components/player/PlayerResultView';
import { joinGameSession, submitPlayerAnswer } from '@/lib/actions/game';
import {
  Player,
  PublicQuestion,
  AnswerSubmissionResult,
  NewQuestionPayload,
  TimesUpPayload,
  GameOverPayload
} from '@/types';
import { Sparkles, ArrowRight, Loader2, Trophy, Award } from 'lucide-react';

interface PlayPageProps {
  params: Promise<{ pin: string }>;
}

const AVATARS = ['🦊', '🐯', '🐼', '🦁', '🚀', '⚡', '🦄', '🎮', '🦉', '🐱'];

export default function PlayPage({ params }: PlayPageProps) {
  const { pin } = use(params);
  const router = useRouter();
  const supabase = createClient();

  // Player state
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Game cycle state
  // 'enter_nickname' | 'lobby' | 'get_ready' | 'answering' | 'answered' | 'result' | 'leaderboard' | 'game_over'
  const [playerView, setPlayerView] = useState<
    'enter_nickname' | 'lobby' | 'get_ready' | 'answering' | 'answered' | 'result' | 'leaderboard' | 'game_over'
  >('enter_nickname');

  const [currentQuestion, setCurrentQuestion] = useState<PublicQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [submittedAnswer, setSubmittedAnswer] = useState<string>('');
  const [answerResult, setAnswerResult] = useState<AnswerSubmissionResult | null>(null);
  const [podiumRank, setPodiumRank] = useState<number | null>(null);

  // Handle Joining Room
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setJoinError('Vui lòng nhập biệt danh');
      return;
    }

    setJoining(true);
    setJoinError(null);

    try {
      const res = await joinGameSession(pin, nickname.trim(), selectedAvatar);
      if (res.success && res.player && res.sessionId) {
        setPlayer(res.player);
        setSessionId(res.sessionId);
        setPlayerView('lobby');
      } else {
        setJoinError(res.error || 'Không thể tham gia phòng');
      }
    } catch {
      setJoinError('Lỗi kết nối máy chủ');
    } finally {
      setJoining(false);
    }
  };

  // Setup Realtime Broadcast Listener for this session
  useEffect(() => {
    if (!player || !sessionId) return;

    const channelName = `game_sessions:${pin}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: player.id
        }
      }
    });

    // 1. Listen for GAME_START
    channel.on('broadcast', { event: 'GAME_START' }, (payload) => {
      const data = payload.payload as { total_questions: number };
      setTotalQuestions(data.total_questions);
      setPlayerView('get_ready');
    });

    // 2. Listen for NEW_QUESTION
    channel.on('broadcast', { event: 'NEW_QUESTION' }, (payload) => {
      const data = payload.payload as NewQuestionPayload;
      setCurrentQuestion(data.question);
      setCurrentQuestionIndex(data.question_index);
      setTotalQuestions(data.total_questions);
      setSubmittedAnswer('');
      setAnswerResult(null);
      setPlayerView('answering');
    });

    // 3. Listen for TIMES_UP
    channel.on('broadcast', { event: 'TIMES_UP' }, (payload) => {
      const data = payload.payload as TimesUpPayload;
      setPlayerView('result');
    });

    // 4. Listen for SHOW_LEADERBOARD
    channel.on('broadcast', { event: 'SHOW_LEADERBOARD' }, () => {
      setPlayerView('leaderboard');
    });

    // 5. Listen for GAME_OVER
    channel.on('broadcast', { event: 'GAME_OVER' }, (payload) => {
      const data = payload.payload as GameOverPayload;
      if (data.podium) {
        const foundIndex = data.podium.findIndex(p => p.id === player.id);
        if (foundIndex !== -1) {
          setPodiumRank(foundIndex + 1);
        }
      }
      setPlayerView('game_over');
    });

    // Track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: player.id,
          nickname: player.nickname,
          avatar: player.avatar
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [player, sessionId, pin, supabase]);

  // Handle Player Submitting Answer
  const handleAnswer = async (ans: string) => {
    if (!player || !sessionId || !currentQuestion) return;

    setSubmittedAnswer(ans);
    setPlayerView('answered');

    // Inform Host via Broadcast immediately
    const channel = supabase.channel(`game_sessions:${pin}`);
    channel.send({
      type: 'broadcast',
      event: 'PLAYER_SUBMITTED',
      payload: {
        player_id: player.id,
        nickname: player.nickname
      }
    });

    // Execute server action scoring
    try {
      const result = await submitPlayerAnswer(
        sessionId,
        player.id,
        currentQuestion.id,
        ans
      );

      setAnswerResult(result);
      if (result.success && result.new_score !== undefined) {
        setPlayer(prev => prev ? { ...prev, score: result.new_score, streak: result.streak } : prev);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 select-none">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* STEP 1: Enter Nickname & Pick Avatar */}
        {playerView === 'enter_nickname' && (
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold font-mono mb-2">
                MÃ PHÒNG: {pin}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Chọn Biệt Danh</h1>
              <p className="text-xs text-slate-400 mt-1">Chọn linh vật đại diện và tên của bạn để thi đấu</p>
            </div>

            {/* Avatar Selector */}
            <div className="mb-6">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2 text-center">
                Chọn Avatar
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center transition cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-purple-600 scale-110 shadow-lg shadow-purple-600/40 ring-2 ring-white'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={18}
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="Nhập tên / biệt danh của bạn..."
                  className="w-full text-center text-lg sm:text-xl font-bold py-3.5 px-4 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 outline-none transition"
                  autoFocus
                />
              </div>

              {joinError && (
                <p className="text-xs text-rose-400 font-semibold text-center">{joinError}</p>
              )}

              <button
                type="submit"
                disabled={joining || !nickname.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-98 text-white font-black text-lg shadow-xl shadow-emerald-700/30 flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang vào phòng...</span>
                  </>
                ) : (
                  <>
                    <span>Sẵn Sàng Tham Gia!</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: In Lobby Waiting */}
        {playerView === 'lobby' && player && (
          <PlayerLobby player={player} pin={pin} />
        )}

        {/* STEP 3: Get Ready Countdown */}
        {playerView === 'get_ready' && (
          <div className="text-center space-y-4 animate-pulse">
            <div className="w-24 h-24 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles className="w-12 h-12" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">Chuẩn Bị...</h2>
            <p className="text-slate-400 text-sm">Câu hỏi sắp xuất hiện trên màn hình!</p>
          </div>
        )}

        {/* STEP 4: Answering Active Question */}
        {playerView === 'answering' && currentQuestion && (
          <div className="w-full max-w-2xl flex-1 flex flex-col justify-between py-2">
            <div className="flex items-center justify-between px-4 pb-2">
              <span className="text-xs font-mono text-purple-300 font-bold">
                Câu {currentQuestionIndex + 1} / {totalQuestions}
              </span>
              <span className="text-xs font-mono font-bold text-yellow-300">
                {player?.score ?? 0} điểm
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <QuestionInput
                question={currentQuestion}
                onAnswer={handleAnswer}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Answer Submitted (Waiting for others) */}
        {playerView === 'answered' && (
          <PlayerAnsweredView submittedAnswer={submittedAnswer} />
        )}

        {/* STEP 6: Result for Question */}
        {playerView === 'result' && (
          <PlayerResultView
            result={answerResult}
            totalScore={player?.score ?? 0}
          />
        )}

        {/* STEP 7: Leaderboard Intermission */}
        {playerView === 'leaderboard' && (
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-300">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Bảng Xếp Hạng!</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Hãy quan sát màn hình Host để xem vị trí và thứ tự xếp hạng của bạn!
            </p>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Điểm số hiện tại</span>
              <span className="font-mono font-black text-3xl text-yellow-300">
                {player?.score.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* STEP 8: Game Over Podium */}
        {playerView === 'game_over' && (
          <div className="text-center space-y-4 max-w-sm animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-3xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mx-auto text-yellow-300 shadow-2xl">
              <Award className="w-12 h-12" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Trò Chơi Kết Thúc!</h1>
            {podiumRank ? (
              <div className="p-5 rounded-2xl bg-amber-500/20 border border-amber-500/40">
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block mb-1">
                  Chúc mừng bạn!
                </span>
                <p className="text-xl font-black text-white">
                  Bạn đã lọt vào <span className="text-yellow-300 font-mono">TOP {podiumRank}</span> của phòng thi!
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Bạn đã thi đấu rất xuất sắc! Hãy nhìn lên màn hình lớn của Host để xem bục vinh danh toàn thể phòng chơi.
              </p>
            )}

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Tổng điểm chung cuộc</span>
              <span className="font-mono font-black text-3xl text-yellow-300">
                {player?.score.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
