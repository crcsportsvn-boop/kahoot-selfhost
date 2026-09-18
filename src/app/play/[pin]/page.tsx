'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AudioControl from '@/components/common/AudioControl';
import LanguageToggle from '@/components/common/LanguageToggle';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import QuestionInput from '@/components/player/QuestionInput';
import PlayerLobby from '@/components/player/PlayerLobby';
import PlayerAnsweredView from '@/components/player/PlayerAnsweredView';
import PlayerResultView from '@/components/player/PlayerResultView';
import AvatarPickerModal from '@/components/player/AvatarPickerModal';
import { joinGameSession, submitPlayerAnswer, getSessionCurrentQuestion } from '@/lib/actions/game';
import {
  Player,
  PublicQuestion,
  AnswerSubmissionResult,
  NewQuestionPayload,
  TimesUpPayload,
  GameOverPayload
} from '@/types';
import { Sparkles, ArrowRight, Loader2, Trophy, Award, MoreHorizontal } from 'lucide-react';

interface PlayPageProps {
  params: Promise<{ pin: string }>;
}

const AVATARS = ['🦊', '🐯', '🐼', '🦁', '🚀', '⚡', '🦄', '🎮', '🦉', '🐱'];

export default function PlayPage({ params }: PlayPageProps) {
  const { pin } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { t, lang } = useLanguage();

  // Player state
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Game cycle state
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
      setJoinError(t.nicknameRequired);
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
        setJoinError(res.error || t.joinRoomError);
      }
    } catch {
      setJoinError(t.serverError);
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
        broadcast: { ack: true },
        presence: {
          key: player.id
        }
      }
    });

    // 1. Listen for GAME_START
    channel.on('broadcast', { event: 'GAME_START' }, (payload) => {
      const data = payload.payload as { total_questions: number };
      setTotalQuestions(data.total_questions);
      setPlayerView(prev => (prev === 'lobby' ? 'get_ready' : prev));
    });

    // 2. Listen for NEW_QUESTION
    channel.on('broadcast', { event: 'NEW_QUESTION' }, (payload) => {
      const data = payload.payload as NewQuestionPayload;
      if (data && data.question) {
        setCurrentQuestion(data.question);
        setCurrentQuestionIndex(data.question_index);
        setTotalQuestions(data.total_questions);
        setSubmittedAnswer('');
        setAnswerResult(null);
        setPlayerView('answering');
      }
    });

    // 3. Listen for TIMES_UP (triggers immediately when all players answer or time runs out!)
    channel.on('broadcast', { event: 'TIMES_UP' }, () => {
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

    // 6. Robust Fallback: Listen for Postgres database changes on game_sessions
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`
      },
      async (payload) => {
        const newSession = payload.new as { status: string; current_question_index: number };
        if (newSession.status === 'question') {
          const res = await getSessionCurrentQuestion(sessionId);
          if (res.success && res.question) {
            setCurrentQuestion(res.question);
            setCurrentQuestionIndex(res.questionIndex ?? newSession.current_question_index);
            setTotalQuestions(res.totalQuestions ?? 0);
            setPlayerView(prev => (prev === 'answered' ? 'answered' : 'answering'));
          }
        } else if (newSession.status === 'question_result') {
          setPlayerView('result');
        } else if (newSession.status === 'leaderboard') {
          setPlayerView('leaderboard');
        } else if (newSession.status === 'ended') {
          setPlayerView('game_over');
        }
      }
    );

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
    <div className="min-h-[100dvh] w-full max-w-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-x-hidden">
      {/* Compact dedicated Player Game Header */}
      <header className="w-full max-w-full px-3 sm:px-4 h-12 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow">
            K!
          </div>
          <span className="font-mono text-xs font-bold text-slate-300">
            PIN: <span className="text-yellow-300 font-extrabold">{pin}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle variant="compact" />
          <AudioControl />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 w-full max-w-full">
        {/* STEP 1: Enter Nickname & Pick Avatar */}
        {playerView === 'enter_nickname' && (
          <div className="w-full max-w-md p-5 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold font-mono mb-2">
                PIN: {pin}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{t.chooseNicknameTitle}</h1>
              <p className="text-xs text-slate-400 mt-1">{t.chooseNicknameDesc}</p>
            </div>

            {/* Avatar Selector */}
            <div className="mb-5">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2 text-center">
                {t.chooseAvatar}
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-xl sm:text-2xl flex items-center justify-center transition cursor-pointer ${
                      selectedAvatar === av
                        ? 'bg-purple-600 scale-110 shadow-lg shadow-purple-600/40 ring-2 ring-white'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}

                {/* If selected avatar is not in quick list, show it */}
                {!AVATARS.includes(selectedAvatar) && (
                  <button
                    type="button"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-xl sm:text-2xl flex items-center justify-center bg-purple-600 scale-110 shadow-lg shadow-purple-600/40 ring-2 ring-white transition"
                  >
                    {selectedAvatar}
                  </button>
                )}

                {/* More Avatars Button (...) */}
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  title={lang === 'vi' ? 'Thêm linh vật khác...' : 'More avatars...'}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 flex items-center justify-center transition cursor-pointer"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <AvatarPickerModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSelect={(av) => setSelectedAvatar(av)}
                selectedAvatar={selectedAvatar}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={18}
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder={t.nicknameInputPlaceholder}
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
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-98 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-700/30 flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.joiningText}</span>
                  </>
                ) : (
                  <>
                    <span>{t.readyToJoinBtn}</span>
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white">{t.getReadyTitle}</h2>
            <p className="text-slate-400 text-xs sm:text-sm">{t.questionComing}</p>
          </div>
        )}

        {/* STEP 4: Answering Active Question */}
        {playerView === 'answering' && currentQuestion && (
          <div className="w-full max-w-2xl flex-1 flex flex-col justify-between py-1 sm:py-2">
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-xs font-mono text-purple-300 font-bold">
                {t.questionWord} {currentQuestionIndex + 1} / {totalQuestions}
              </span>
              <span className="text-xs font-mono font-bold text-yellow-300">
                {player?.score ?? 0} {t.pointsWord}
              </span>
            </div>

            {/* If question has image */}
            {currentQuestion.media_url && (
              <div className="max-h-36 sm:max-h-48 mb-2 flex justify-center">
                <img
                  src={currentQuestion.media_url}
                  alt="Question Image"
                  className="max-h-32 sm:max-h-44 rounded-xl object-contain border border-slate-700 shadow"
                />
              </div>
            )}

            <div className="flex-1 flex items-center justify-center w-full">
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
          <div className="text-center space-y-4 max-w-sm w-full px-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-300">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{t.leaderboardTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t.watchHostLeaderboard}
            </p>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">{t.currentScore}</span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-yellow-300">
                {player?.score.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* STEP 8: Game Over Podium */}
        {playerView === 'game_over' && (
          <div className="text-center space-y-4 max-w-sm w-full px-2 animate-in zoom-in-95">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mx-auto text-yellow-300 shadow-2xl">
              <Award className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">{t.gameOverTitle}</h1>
            {podiumRank ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/20 border border-amber-500/40">
                <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block mb-1">
                  {t.congratsTop}
                </span>
                <p className="text-lg sm:text-xl font-black text-white">
                  {t.topPodiumMessage} <span className="text-yellow-300 font-mono">TOP {podiumRank}</span>!
                </p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-400">
                {t.greatJobPodium}
              </p>
            )}

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">{t.finalScoreLabel}</span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-yellow-300">
                {player?.score.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
