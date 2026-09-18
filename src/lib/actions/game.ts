'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { GameSession, Player, AnswerSubmissionResult, SessionStatus, Question } from '@/types';

// Generate random 6-digit numeric PIN
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates a new Game Session with a unique 6-digit PIN
 */
export async function createGameSession(quizId: string, hostId?: string) {
  const supabase = createAdminClient();

  try {
    // 1. Verify quiz exists and fetch question count
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, user_id, title')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return { success: false, error: 'Không tìm thấy bộ câu hỏi này' };
    }

    const effectiveHostId = hostId || quiz.user_id;

    // 2. Generate unique PIN
    let pin = generatePin();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('pin', pin)
        .neq('status', 'ended')
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        pin = generatePin();
        attempts++;
      }
    }

    // 3. Create game session in database
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        quiz_id: quizId,
        host_id: effectiveHostId,
        pin: pin,
        status: 'lobby',
        current_question_index: 0,
        question_start_time: null
      })
      .select('*')
      .single();

    if (sessionError || !session) {
      return { success: false, error: sessionError?.message || 'Lỗi khi tạo phòng chơi' };
    }

    return { success: true, session: session as GameSession };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return { success: false, error: message };
  }
}

/**
 * Get Session details by PIN
 */
export async function getGameSessionByPin(pin: string) {
  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select(`
      *,
      quizzes:quiz_id (
        id,
        title,
        description,
        questions:questions (
          id,
          type,
          prompt,
          options,
          correct_answer,
          time_limit,
          order_index
        )
      )
    `)
    .eq('pin', pin)
    .single();

  if (sessionError || !session) {
    return { success: false, error: 'Không tìm thấy phòng chơi với mã PIN này' };
  }

  // Sort questions by order_index
  if (session.quizzes?.questions) {
    session.quizzes.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
  }

  return { success: true, session };
}

/**
 * Join Game Session as Player
 */
export async function joinGameSession(pin: string, nickname: string, avatar: string = '🦊') {
  const supabase = createAdminClient();

  try {
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      return { success: false, error: 'Vui lòng nhập biệt danh (nickname)' };
    }

    // 1. Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('id, status, pin')
      .eq('pin', pin)
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Không tìm thấy phòng chơi với mã PIN này' };
    }

    if (session.status !== 'lobby') {
      return { success: false, error: 'Phòng chơi đã bắt đầu hoặc đã kết thúc' };
    }

    // 2. Check if nickname is taken in this session
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('session_id', session.id)
      .ilike('nickname', cleanNick)
      .maybeSingle();

    if (existingPlayer) {
      return { success: false, error: 'Biệt danh này đã có người sử dụng trong phòng!' };
    }

    // 3. Create player record
    const { data: newPlayer, error: playerError } = await supabase
      .from('players')
      .insert({
        session_id: session.id,
        nickname: cleanNick,
        avatar: avatar,
        score: 0,
        streak: 0
      })
      .select('*')
      .single();

    if (playerError || !newPlayer) {
      return { success: false, error: playerError?.message || 'Lỗi khi tham gia phòng' };
    }

    return {
      success: true,
      player: newPlayer as Player,
      sessionId: session.id
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return { success: false, error: message };
  }
}

/**
 * Host updates session state (e.g. startGame, nextQuestion, showResult, showLeaderboard, endGame)
 */
export async function updateSessionState(
  sessionId: string,
  updates: {
    status?: SessionStatus;
    current_question_index?: number;
    question_start_time?: string | null;
  }
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('game_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data as GameSession };
}

/**
 * Secure Player Answer Submission with Kahoot Decay Algorithm
 */
export async function submitPlayerAnswer(
  sessionId: string,
  playerId: string,
  questionId: string,
  submittedAnswer: string,
  clientLatencyMs: number = 500
): Promise<AnswerSubmissionResult> {
  const supabase = createAdminClient();

  try {
    // Attempt RPC first if migration has been executed
    const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_player_answer', {
      p_session_id: sessionId,
      p_player_id: playerId,
      p_question_id: questionId,
      p_submitted_answer: submittedAnswer,
      p_client_latency_ms: clientLatencyMs
    });

    if (!rpcError && rpcResult && typeof rpcResult === 'object') {
      const res = rpcResult as Record<string, unknown>;
      if (res.success) {
        return {
          success: true,
          is_correct: Boolean(res.is_correct),
          points_awarded: Number(res.points_awarded || 0),
          new_score: Number(res.new_score || 0),
          streak: Number(res.streak || 0),
          correct_answer: (res.correct_answer as string | string[]) || undefined
        };
      }
    }

    // Fallback: Perform atomic server-side evaluation with service_role client
    // 1. Fetch Session
    const { data: session, error: sessErr } = await supabase
      .from('game_sessions')
      .select('status, question_start_time, current_question_index')
      .eq('id', sessionId)
      .single();

    if (sessErr || !session || session.status !== 'question') {
      return {
        success: false,
        is_correct: false,
        points_awarded: 0,
        new_score: 0,
        streak: 0,
        error: 'Phòng chơi hiện không nhận câu trả lời'
      };
    }

    // 2. Fetch Question
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('type, correct_answer, time_limit')
      .eq('id', questionId)
      .single();

    if (qErr || !question) {
      return {
        success: false,
        is_correct: false,
        points_awarded: 0,
        new_score: 0,
        streak: 0,
        error: 'Không tìm thấy câu hỏi'
      };
    }

    // 3. Fetch Player
    const { data: player, error: pErr } = await supabase
      .from('players')
      .select('id, score, streak')
      .eq('id', playerId)
      .single();

    if (pErr || !player) {
      return {
        success: false,
        is_correct: false,
        points_awarded: 0,
        new_score: 0,
        streak: 0,
        error: 'Không tìm thấy người chơi'
      };
    }

    // 4. Check already answered
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (existingAnswer) {
      return {
        success: false,
        is_correct: false,
        points_awarded: 0,
        new_score: player.score,
        streak: player.streak,
        error: 'Bạn đã trả lời câu hỏi này rồi'
      };
    }

    // 5. Calculate elapsed time in ms
    const timeLimitMs = (question.time_limit || 20) * 1000;
    let elapsedMs = clientLatencyMs;
    if (session.question_start_time) {
      const startTime = new Date(session.question_start_time).getTime();
      elapsedMs = Math.max(0, Date.now() - startTime);
    }

    let isCorrect = false;
    const cleanSubmitted = submittedAnswer.trim().toLowerCase();

    // Check correctness by type
    if (question.type === 'true_false') {
      const target = String(question.correct_answer).trim().toLowerCase();
      const isTargetTrue = target.includes('đúng') || target.includes('true');
      const isTargetFalse = target.includes('sai') || target.includes('false');

      const isSubmittedTrue = cleanSubmitted.includes('đúng') || cleanSubmitted.includes('true');
      const isSubmittedFalse = cleanSubmitted.includes('sai') || cleanSubmitted.includes('false');

      if (isTargetTrue && isSubmittedTrue) {
        isCorrect = true;
      } else if (isTargetFalse && isSubmittedFalse) {
        isCorrect = true;
      } else {
        isCorrect = cleanSubmitted === target;
      }
    } else if (question.type === 'multiple_choice') {
      const target = String(question.correct_answer).trim().toLowerCase();
      isCorrect = cleanSubmitted === target;
    } else if (question.type === 'fill_in_the_blank') {
      if (Array.isArray(question.correct_answer)) {
        isCorrect = question.correct_answer.some(
          (ans: string) => String(ans).trim().toLowerCase() === cleanSubmitted
        );
      } else {
        const acceptable = String(question.correct_answer)
          .split(';')
          .map((s: string) => s.trim().toLowerCase());
        isCorrect = acceptable.includes(cleanSubmitted);
      }
    }

    // 6. Calculate Points with Latency Decay
    // points = is_correct ? Math.round(1000 * (1 - ((elapsed_ms / (time_limit * 1000)) / 2))) : 0
    let points = 0;
    let newStreak = 0;

    // 1500ms network grace period
    if (isCorrect && elapsedMs <= timeLimitMs + 1500) {
      const decayFraction = (elapsedMs / timeLimitMs) / 2.0;
      points = Math.round(1000 * (1 - decayFraction));
      if (points < 500) points = 500;
      if (points > 1000) points = 1000;

      newStreak = player.streak + 1;
      if (newStreak >= 3) {
        points += 100; // Streak bonus
      }
    } else {
      points = 0;
      newStreak = 0;
    }

    const newScore = player.score + points;

    // 7. Save answer
    await supabase.from('answers').insert({
      session_id: sessionId,
      question_id: questionId,
      player_id: playerId,
      submitted_answer: submittedAnswer,
      is_correct: isCorrect,
      points_awarded: points,
      latency_ms: Math.round(elapsedMs)
    });

    // 8. Update player
    await supabase
      .from('players')
      .update({
        score: newScore,
        streak: newStreak,
        last_answered_index: session.current_question_index
      })
      .eq('id', playerId);

    return {
      success: true,
      is_correct: isCorrect,
      points_awarded: points,
      new_score: newScore,
      streak: newStreak,
      correct_answer: question.correct_answer
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi gửi câu trả lời';
    return {
      success: false,
      is_correct: false,
      points_awarded: 0,
      new_score: 0,
      streak: 0,
      error: message
    };
  }
}

/**
 * Aggregates Answer Distribution for a question in a session
 */
export async function getAnswerDistribution(sessionId: string, questionId: string) {
  const supabase = createAdminClient();

  const { data: answers, error } = await supabase
    .from('answers')
    .select('submitted_answer, is_correct, points_awarded')
    .eq('session_id', sessionId)
    .eq('question_id', questionId);

  if (error || !answers) {
    return { distribution: {}, totalAnswers: 0 };
  }

  const distribution: Record<string, number> = {};
  answers.forEach(a => {
    const key = typeof a.submitted_answer === 'string' ? a.submitted_answer : JSON.stringify(a.submitted_answer);
    distribution[key] = (distribution[key] || 0) + 1;
  });

  return {
    distribution,
    totalAnswers: answers.length
  };
}

/**
 * Fetch Leaderboard for Session
 */
export async function getSessionLeaderboard(sessionId: string, limit: number = 10) {
  const supabase = createAdminClient();

  const { data: players, error } = await supabase
    .from('players')
    .select('id, session_id, nickname, avatar, score, streak')
    .eq('session_id', sessionId)
    .order('score', { ascending: false })
    .limit(limit);

  if (error || !players) {
    return [];
  }

  return players.map((p, index) => ({
    ...p,
    rank: index + 1
  }));
}
