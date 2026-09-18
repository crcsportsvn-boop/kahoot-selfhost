'use client';

import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { Question } from '@/types';

interface QuizExportData {
  id: string;
  title: string;
  description?: string;
  questions?: Question[];
}

export async function exportQuizToExcel(quiz: QuizExportData) {
  let questions = quiz.questions;

  // If questions not provided, fetch them from Supabase
  if (!questions || questions.length === 0) {
    const supabase = createClient();
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    questions = (data as Question[]) || [];
  }

  if (questions.length === 0) {
    throw new Error('Bộ đề này chưa có câu hỏi nào để xuất Excel!');
  }

  // Format rows matching our import template
  const rows = questions.map((q) => {
    let typeName = 'Trắc nghiệm';
    if (q.type === 'true_false') typeName = 'Đúng Sai';
    if (q.type === 'fill_in_the_blank') typeName = 'Điền từ';

    const options = Array.isArray(q.options) ? q.options : [];
    let correctText = '';
    if (Array.isArray(q.correct_answer)) {
      correctText = q.correct_answer.join('; ');
    } else if (typeof q.correct_answer === 'string') {
      correctText = q.correct_answer;
    } else if (q.correct_answer !== undefined && q.correct_answer !== null) {
      correctText = String(q.correct_answer);
    }

    return {
      'Loại câu hỏi': typeName,
      'Nội dung câu hỏi': q.prompt,
      'Phương án A': options[0] || '',
      'Phương án B': options[1] || '',
      'Phương án C': options[2] || '',
      'Phương án D': options[3] || '',
      'Đáp án đúng': correctText,
      'Thời gian (giây)': q.time_limit || 20,
      'Link hình ảnh': q.media_url || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 16 }, // Loại
    { wch: 45 }, // Nội dung
    { wch: 22 }, // A
    { wch: 22 }, // B
    { wch: 22 }, // C
    { wch: 22 }, // D
    { wch: 25 }, // Đáp án đúng
    { wch: 18 }, // Thời gian
    { wch: 35 }  // Link ảnh
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CauHoi');

  // Sanitize filename
  const cleanTitle = (quiz.title || 'Bo_De_Cau_Hoi')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();

  const fileName = `${cleanTitle}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
