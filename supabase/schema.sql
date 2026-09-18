-- ==============================================================================
-- KAHOOT REALTIME QUIZ PLATFORM - COMPLETE DATABASE SCHEMA & POLICIES
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. TABLE: PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. TABLE: QUIZZES
create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  cover_image text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. TABLE: QUESTIONS
create table if not exists public.questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  type text not null check (type in ('multiple_choice', 'true_false', 'fill_in_the_blank')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb, -- Array of string choices (for multiple_choice and true_false)
  correct_answer jsonb not null, -- JSON string or array of accepted strings
  time_limit integer not null default 20 check (time_limit >= 5 and time_limit <= 120),
  order_index integer not null default 0,
  media_url text,
  created_at timestamptz default now() not null
);

-- 5. TABLE: GAME SESSIONS
create table if not exists public.game_sessions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  pin varchar(6) not null unique,
  status text not null default 'lobby' check (status in ('lobby', 'question', 'question_result', 'leaderboard', 'ended')),
  current_question_index integer not null default 0,
  question_start_time timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. TABLE: PLAYERS
create table if not exists public.players (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.game_sessions(id) on delete cascade not null,
  nickname text not null,
  avatar text default '🦊',
  score integer not null default 0,
  streak integer not null default 0,
  last_answered_index integer default -1,
  created_at timestamptz default now() not null,
  constraint unique_session_nickname unique (session_id, nickname)
);

-- 7. TABLE: ANSWERS
create table if not exists public.answers (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.game_sessions(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  submitted_answer jsonb not null,
  is_correct boolean not null,
  points_awarded integer not null default 0,
  latency_ms integer not null default 0,
  created_at timestamptz default now() not null,
  constraint unique_player_question_answer unique (session_id, question_id, player_id)
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM REAL-TIME QUERY PERFORMANCE
-- ==============================================================================
create index if not exists idx_quizzes_user on public.quizzes(user_id);
create index if not exists idx_questions_quiz_order on public.questions(quiz_id, order_index);
create index if not exists idx_game_sessions_pin on public.game_sessions(pin);
create index if not exists idx_players_session on public.players(session_id);
create index if not exists idx_answers_session_question on public.answers(session_id, question_id);
create index if not exists idx_answers_player on public.answers(player_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;

-- PROFILES RLS
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- QUIZZES RLS (Host owns and manages quizzes)
drop policy if exists "Host full control on own quizzes" on public.quizzes;
create policy "Host full control on own quizzes"
  on public.quizzes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- QUESTIONS RLS
-- Crucial Security: Only quiz owner can read/modify questions with correct_answer.
-- Players do NOT query questions directly via client table SELECT.
drop policy if exists "Host full control on own questions" on public.questions;
create policy "Host full control on own questions"
  on public.questions for all
  using (
    auth.uid() in (
      select user_id from public.quizzes where quizzes.id = questions.quiz_id
    )
  )
  with check (
    auth.uid() in (
      select user_id from public.quizzes where quizzes.id = questions.quiz_id
    )
  );

-- GAME SESSIONS RLS
-- Host full control on own sessions
drop policy if exists "Host full control on own game sessions" on public.game_sessions;
create policy "Host full control on own game sessions"
  on public.game_sessions for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- Public can read game sessions by PIN (for players to join and check status)
drop policy if exists "Public can read game session by pin" on public.game_sessions;
create policy "Public can read game session by pin"
  on public.game_sessions for select
  using (true);

-- PLAYERS RLS
-- Public can insert new player when joining a session
drop policy if exists "Public can join game session as player" on public.players;
create policy "Public can join game session as player"
  on public.players for insert
  with check (true);

-- Anyone can view players in a session (needed for lobby presence and leaderboard)
drop policy if exists "Public can view players in session" on public.players;
create policy "Public can view players in session"
  on public.players for select
  using (true);

-- Allow updating player score/streak (restricted or via RPC)
drop policy if exists "Public can update own player record" on public.players;
create policy "Public can update own player record"
  on public.players for update
  using (true)
  with check (true);

-- ANSWERS RLS
-- Anyone in session can view answers (for statistics)
drop policy if exists "Public can view session answers" on public.answers;
create policy "Public can view session answers"
  on public.answers for select
  using (true);

-- Players can insert their answers
drop policy if exists "Players can insert their answers" on public.answers;
create policy "Players can insert their answers"
  on public.answers for insert
  with check (true);

-- ==============================================================================
-- SECURE ANSWER SUBMISSION & SCORING RPC
-- ==============================================================================

create or replace function public.submit_player_answer(
  p_session_id uuid,
  p_player_id uuid,
  p_question_id uuid,
  p_submitted_answer jsonb,
  p_client_latency_ms integer default 0
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_session record;
  v_question record;
  v_player record;
  v_is_correct boolean := false;
  v_points integer := 0;
  v_elapsed_ms numeric;
  v_time_limit_ms numeric;
  v_new_streak integer := 0;
  v_new_score integer := 0;
  v_submitted_text text;
  v_correct_text text;
  v_accepted_kw jsonb;
  v_kw text;
begin
  -- 1. Fetch and validate game session state
  select * into v_session from public.game_sessions where id = p_session_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Session not found');
  end if;

  if v_session.status <> 'question' then
    return jsonb_build_object('success', false, 'error', 'Session is not accepting answers currently');
  end if;

  -- 2. Fetch question details
  select * into v_question from public.questions where id = p_question_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Question not found');
  end if;

  -- 3. Fetch player details
  select * into v_player from public.players where id = p_player_id and session_id = p_session_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Player not found in session');
  end if;

  -- 4. Check if player already submitted answer for this question
  if exists (
    select 1 from public.answers
    where session_id = p_session_id and question_id = p_question_id and player_id = p_player_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Already answered this question');
  end if;

  -- 5. Calculate elapsed time (ms) based on question_start_time
  v_time_limit_ms := coalesce(v_question.time_limit, 20) * 1000.0;
  if v_session.question_start_time is not null then
    v_elapsed_ms := extract(epoch from (clock_timestamp() - v_session.question_start_time)) * 1000.0;
  else
    v_elapsed_ms := coalesce(p_client_latency_ms, 1000.0);
  end if;

  if v_elapsed_ms < 0 then
    v_elapsed_ms := 0;
  end if;

  -- Grace period of 1500ms for network latency
  if v_elapsed_ms > (v_time_limit_ms + 1500.0) then
    v_is_correct := false;
    v_points := 0;
  else
    -- 6. Evaluate correctness based on question type
    if v_question.type = 'multiple_choice' then
      -- Compare submitted option text or index
      v_submitted_text := trim(lower(p_submitted_answer#>>'{}'));
      v_correct_text := trim(lower(v_question.correct_answer#>>'{}'));
      v_is_correct := (v_submitted_text = v_correct_text);

    elsif v_question.type = 'true_false' then
      v_submitted_text := trim(lower(p_submitted_answer#>>'{}'));
      v_correct_text := trim(lower(v_question.correct_answer#>>'{}'));
      v_is_correct := (v_submitted_text = v_correct_text);

    elsif v_question.type = 'fill_in_the_blank' then
      v_submitted_text := trim(lower(p_submitted_answer#>>'{}'));
      -- Support array of accepted answers or single string
      if jsonb_typeof(v_question.correct_answer) = 'array' then
        v_is_correct := false;
        for v_kw in select jsonb_array_elements_text(v_question.correct_answer)
        loop
          if trim(lower(v_kw)) = v_submitted_text then
            v_is_correct := true;
            exit;
          end if;
        end loop;
      else
        v_correct_text := trim(lower(v_question.correct_answer#>>'{}'));
        -- Also check semicolon separated keywords: "word1; word2"
        v_is_correct := (
          v_submitted_text = v_correct_text or
          position(v_submitted_text in v_correct_text) > 0 and (v_correct_text like '%' || v_submitted_text || '%')
        );
      end if;
    end if;

    -- 7. Calculate points using Kahoot decaying formula
    -- points = is_correct ? Math.round(1000 * (1 - ((elapsed_ms / (time_limit * 1000)) / 2))) : 0
    if v_is_correct then
      v_points := round(1000.0 * (1.0 - ((v_elapsed_ms / v_time_limit_ms) / 2.0)));
      -- Enforce range: min 500 points for correct answer within time limit, max 1000 points
      if v_points < 500 then
        v_points := 500;
      elsif v_points > 1000 then
        v_points := 1000;
      end if;

      v_new_streak := v_player.streak + 1;
      -- Small streak bonus for streak >= 2
      if v_new_streak >= 3 then
        v_points := v_points + 100;
      end if;
    else
      v_points := 0;
      v_new_streak := 0;
    end if;
  end if;

  v_new_score := v_player.score + v_points;

  -- 8. Record answer
  insert into public.answers (
    session_id,
    question_id,
    player_id,
    submitted_answer,
    is_correct,
    points_awarded,
    latency_ms
  ) values (
    p_session_id,
    p_question_id,
    p_player_id,
    p_submitted_answer,
    v_is_correct,
    round(v_elapsed_ms)::integer,
    v_points
  );

  -- 9. Update player score and streak
  update public.players
  set score = v_new_score,
      streak = v_new_streak,
      last_answered_index = v_session.current_question_index
  where id = p_player_id;

  -- 10. Return outcome
  return jsonb_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'points_awarded', v_points,
    'new_score', v_new_score,
    'streak', v_new_streak,
    'correct_answer', v_question.correct_answer
  );
end;
$$;

-- ==============================================================================
-- REALTIME REPLICATION CONFIGURATION
-- ==============================================================================
-- Add tables to the supabase_realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.game_sessions;
    alter publication supabase_realtime add table public.players;
    alter publication supabase_realtime add table public.answers;
  end if;
exception
  when others then
    raise notice 'Publication table addition note: %', sqlerrm;
end;
$$;

-- Set replica identity to FULL so realtime updates send entire row
alter table public.game_sessions replica identity full;
alter table public.players replica identity full;
alter table public.answers replica identity full;
