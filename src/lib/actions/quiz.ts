'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { Quiz, Question } from '@/types';

export async function getQuizzes(userId?: string): Promise<{ success: boolean; quizzes: Quiz[]; error?: string }> {
  const supabase = createAdminClient();

  try {
    let query = supabase
      .from('quizzes')
      .select(`
        *,
        questions:questions(count)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, quizzes: [], error: error.message };
    }

    return { success: true, quizzes: data as Quiz[] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách bộ câu hỏi';
    return { success: false, quizzes: [], error: msg };
  }
}

export async function getQuizWithQuestions(quizId: string): Promise<{ success: boolean; quiz?: Quiz; error?: string }> {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        questions:questions(*)
      `)
      .eq('id', quizId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Không tìm thấy bộ đề' };
    }

    if (data.questions) {
      data.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
    }

    return { success: true, quiz: data as Quiz };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi tải câu hỏi';
    return { success: false, error: msg };
  }
}

export async function createQuizWithQuestions(
  title: string,
  description: string,
  questions: Array<{
    type: 'multiple_choice' | 'true_false' | 'fill_in_the_blank';
    prompt: string;
    options: string[];
    correct_answer: string | string[];
    time_limit: number;
    order_index: number;
  }>,
  userId?: string
) {
  const supabase = createAdminClient();

  try {
    // Determine host id: given userId, or first profile, or mock id
    let effectiveHostId = userId;
    if (!effectiveHostId) {
      const { data: firstProfile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      if (firstProfile) {
        effectiveHostId = firstProfile.id;
      } else {
        effectiveHostId = '00000000-0000-0000-0000-000000000001';
        await supabase.from('profiles').upsert({
          id: effectiveHostId,
          email: 'host@kahoot.local',
          full_name: 'Host Master'
        });
      }
    }

    // 1. Insert quiz
    const { data: quiz, error: qErr } = await supabase
      .from('quizzes')
      .insert({
        user_id: effectiveHostId,
        title: title.trim() || 'Bộ câu hỏi mới',
        description: description.trim() || ''
      })
      .select('*')
      .single();

    if (qErr || !quiz) {
      return { success: false, error: qErr?.message || 'Lỗi tạo bộ đề' };
    }

    // 2. Insert questions if any
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q, idx) => ({
        quiz_id: quiz.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options || [],
        correct_answer: q.correct_answer,
        time_limit: q.time_limit || 20,
        order_index: idx
      }));

      const { error: questErr } = await supabase.from('questions').insert(questionsToInsert);
      if (questErr) {
        return { success: false, error: 'Tạo quiz thành công nhưng lỗi thêm câu hỏi: ' + questErr.message };
      }
    }

    return { success: true, quiz: quiz as Quiz };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống khi tạo quiz';
    return { success: false, error: msg };
  }
}

export async function deleteQuiz(quizId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function addQuestionsToQuiz(
  quizId: string,
  newQuestions: Array<{
    type: 'multiple_choice' | 'true_false' | 'fill_in_the_blank';
    prompt: string;
    options: string[];
    correct_answer: string | string[];
    time_limit: number;
    order_index?: number;
  }>
) {
  const supabase = createAdminClient();

  try {
    // Get highest current order_index
    const { data: current } = await supabase
      .from('questions')
      .select('order_index')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    let startIndex = (current?.order_index ?? -1) + 1;

    const payload = newQuestions.map(q => {
      const item = {
        quiz_id: quizId,
        type: q.type,
        prompt: q.prompt,
        options: q.options || [],
        correct_answer: q.correct_answer,
        time_limit: q.time_limit || 20,
        order_index: startIndex++
      };
      return item;
    });

    const { error } = await supabase.from('questions').insert(payload);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: payload.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi nhập câu hỏi';
    return { success: false, error: msg };
  }
}
