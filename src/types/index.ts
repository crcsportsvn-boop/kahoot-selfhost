export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_in_the_blank';

export type SessionStatus = 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'ended';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correct_answer: string | string[];
  time_limit: number;
  order_index: number;
  media_url?: string;
  created_at?: string;
}

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  time_limit: number;
  order_index: number;
  media_url?: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_image?: string;
  created_at: string;
  updated_at?: string;
  questions?: Question[];
}

export interface GameSession {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  status: SessionStatus;
  current_question_index: number;
  question_start_time: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Player {
  id: string;
  session_id: string;
  nickname: string;
  avatar?: string;
  score: number;
  streak: number;
  last_answered_index?: number;
  created_at?: string;
  rank?: number;
}

export interface Answer {
  id: string;
  session_id: string;
  question_id: string;
  player_id: string;
  submitted_answer: string;
  is_correct: boolean;
  points_awarded: number;
  latency_ms: number;
  created_at?: string;
}

export interface AnswerSubmissionResult {
  success: boolean;
  is_correct: boolean;
  points_awarded: number;
  new_score: number;
  streak: number;
  correct_answer?: string | string[];
  error?: string;
}

// Realtime Broadcast Event Types
export interface GameStartPayload {
  total_questions: number;
}

export interface NewQuestionPayload {
  question_index: number;
  total_questions: number;
  question: PublicQuestion;
  start_time: string;
}

export interface TimesUpPayload {
  question_id: string;
  correct_answer: string | string[];
  answer_distribution: Record<string, number>;
}

export interface ShowLeaderboardPayload {
  top_players: Player[];
}

export interface GameOverPayload {
  podium: Player[];
}

export interface PlayerAnsweredPayload {
  player_id: string;
  nickname: string;
}
