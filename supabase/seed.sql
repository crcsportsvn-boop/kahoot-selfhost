-- ==============================================================================
-- SAMPLE SEED DATA FOR KAHOOT REALTIME QUIZ PLATFORM
-- ==============================================================================

-- Note: We insert a demo host profile if needed or attach to first auth user.
-- Here we provide a helper to create demo quiz and questions.

do $$
declare
  v_host_id uuid;
  v_quiz_id uuid;
begin
  -- Look for an existing user in auth.users
  select id into v_host_id from auth.users order by created_at asc limit 1;

  if v_host_id is null then
    v_host_id := '00000000-0000-0000-0000-000000000001'::uuid;

    -- Create user in auth.users first to satisfy foreign key constraint
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      v_host_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      'demo.host@kahoot.local',
      crypt('kahoot123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Kahoot Master","avatar_url":"👑"}'::jsonb,
      now(),
      now()
    ) on conflict (id) do nothing;
  end if;

  -- Ensure profile exists in public.profiles
  insert into public.profiles (id, email, full_name, avatar_url)
  values (v_host_id, 'demo.host@kahoot.local', 'Kahoot Master', '👑')
  on conflict (id) do update set
    full_name = coalesce(profiles.full_name, excluded.full_name);

  -- 1. Create Quiz: Đấu Trí Công Nghệ & Khoa Học
  insert into public.quizzes (id, user_id, title, description, created_at)
  values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    v_host_id,
    'Đấu Trí Công Nghệ & Lập Trình 2026',
    'Bộ câu hỏi thú vị về JavaScript, Next.js, AI và Kiến thức Công nghệ toàn cầu!',
    now()
  )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description;

  -- Delete existing questions for this quiz to avoid duplicate seeds
  delete from public.questions where quiz_id = '11111111-1111-1111-1111-111111111111'::uuid;

  -- Question 1: Multiple Choice
  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'multiple_choice',
    'Ai là người sáng lập ra ngôn ngữ lập trình JavaScript vào năm 1995?',
    '["Brendan Eich", "Guido van Rossum", "James Gosling", "Bjarne Stroustrup"]'::jsonb,
    '"Brendan Eich"'::jsonb,
    20,
    0
  );

  -- Question 2: True / False
  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'true_false',
    'Trong Next.js App Router, tất cả các component bên trong thư mục app/ mặc định là React Server Components (RSC)?',
    '["Đúng (True)", "Sai (False)"]'::jsonb,
    '"Đúng (True)"'::jsonb,
    15,
    1
  );

  -- Question 3: Multiple Choice
  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'multiple_choice',
    'Cơ chế nào của Supabase cho phép lắng nghe sự thay đổi dữ liệu bảng PostgreSQL theo thời gian thực?',
    '["Supabase Realtime (CDC / Publication)", "Postgres Cron", "pg_dump stream", "Edge Functions Polling"]'::jsonb,
    '"Supabase Realtime (CDC / Publication)"'::jsonb,
    20,
    2
  );

  -- Question 4: Fill in the blank
  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'fill_in_the_blank',
    'Thuật ngữ chỉ mô hình trí tuệ nhân tạo lớn như GPT-4, Claude, Gemini được viết tắt là gì? (3 chữ cái)',
    '[]'::jsonb,
    '["LLM", "large language model"]'::jsonb,
    20,
    3
  );

  -- Question 5: Multiple Choice
  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'multiple_choice',
    'Cổng (Port) mặc định của cơ sở dữ liệu PostgreSQL là gì?',
    '["5432", "3306", "27017", "6379"]'::jsonb,
    '"5432"'::jsonb,
    15,
    4
  );

  -- Question 6: True / False
  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'true_false',
    'HTML là một ngôn ngữ lập trình hoàn chỉnh có khả năng giải thuật toán Turing-complete.',
    '["Đúng (True)", "Sai (False)"]'::jsonb,
    '"Sai (False)"'::jsonb,
    15,
    5
  );

  -- 2. Create Second Quiz: Khám Phá Thế Giới & Khoa Học Vui
  insert into public.quizzes (id, user_id, title, description, created_at)
  values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    v_host_id,
    'Khám Phá Thế Giới & Khoa Học Tự Nhiên',
    'Thử tài hiểu biết về vũ trụ, hành tinh và các kỳ quan thiên nhiên!',
    now()
  )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description;

  delete from public.questions where quiz_id = '22222222-2222-2222-2222-222222222222'::uuid;

  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'multiple_choice',
    'Hành tinh nào có kích thước lớn nhất trong Hệ Mặt Trời của chúng ta?',
    '["Sao Mộc (Jupiter)", "Sao Thổ (Saturn)", "Sao Hỏa (Mars)", "Sao Hải Vương (Neptune)"]'::jsonb,
    '"Sao Mộc (Jupiter)"'::jsonb,
    20,
    0
  );

  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'true_false',
    'Ánh sáng từ Mặt Trời mất khoảng 8 phút 20 giây để truyền đến Trái Đất.',
    '["Đúng (True)", "Sai (False)"]'::jsonb,
    '"Đúng (True)"'::jsonb,
    15,
    1
  );

  insert into public.questions (quiz_id, type, prompt, options, correct_answer, time_limit, order_index)
  values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'fill_in_the_blank',
    'Công thức hóa học của nước gồm hydro và oxy là gì?',
    '[]'::jsonb,
    '["H2O", "h2o", "H20"]'::jsonb,
    20,
    2
  );

end;
$$;
