import * as XLSX from 'xlsx';
import { QuestionType } from '@/types';

export interface ParsedQuestionRow {
  rowNumber: number;
  type: QuestionType;
  prompt: string;
  options: string[];
  correct_answer: string | string[];
  time_limit: number;
  isValid: boolean;
  errors: string[];
}

export interface ParseResult {
  questions: ParsedQuestionRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

/**
 * Normalizes headers to standard keys
 */
function normalizeKey(key: string): string {
  const clean = key.toLowerCase().trim().replace(/[\s_-]+/g, '');
  if (clean.includes('type') || clean.includes('loai')) return 'type';
  if (clean.includes('question') || clean.includes('cauhoi') || clean.includes('prompt')) return 'question';
  if (clean.includes('optiona') || clean.includes('dapana') || clean === 'a') return 'option_a';
  if (clean.includes('optionb') || clean.includes('dapanb') || clean === 'b') return 'option_b';
  if (clean.includes('optionc') || clean.includes('dapanc') || clean === 'c') return 'option_c';
  if (clean.includes('optiond') || clean.includes('dapand') || clean === 'd') return 'option_d';
  if (clean.includes('correct') || clean.includes('dapandung') || clean.includes('answer')) return 'correct_answer';
  if (clean.includes('time') || clean.includes('thoigian') || clean.includes('limit')) return 'time_limit';
  return clean;
}

/**
 * Parse an Excel (.xlsx/.xls) or CSV File Buffer/ArrayBuffer
 */
export async function parseQuizFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Tệp không chứa trang tính (sheet) nào.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawData || rawData.length === 0) {
    throw new Error('Tệp rỗng hoặc không có dữ liệu hàng nào.');
  }

  const parsedQuestions: ParsedQuestionRow[] = [];

  rawData.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const normalizedRow: Record<string, string> = {};

    Object.entries(row).forEach(([key, val]) => {
      const normKey = normalizeKey(key);
      normalizedRow[normKey] = String(val ?? '').trim();
    });

    const rawType = (normalizedRow['type'] || '').toLowerCase();
    const prompt = normalizedRow['question'] || '';
    const rawTime = parseInt(normalizedRow['time_limit'] || '20', 10);
    const timeLimit = isNaN(rawTime) || rawTime < 5 ? 20 : Math.min(rawTime, 120);

    const errors: string[] = [];

    // Determine type
    let type: QuestionType = 'multiple_choice';
    if (rawType.includes('true') || rawType.includes('false') || rawType.includes('dung') || rawType.includes('sai')) {
      type = 'true_false';
    } else if (rawType.includes('blank') || rawType.includes('duc') || rawType.includes('dien') || rawType.includes('fill')) {
      type = 'fill_in_the_blank';
    } else {
      type = 'multiple_choice';
    }

    if (!prompt) {
      errors.push('Thiếu nội dung câu hỏi (Question)');
    }

    let options: string[] = [];
    let correctAnswer: string | string[] = '';

    if (type === 'multiple_choice') {
      const optA = normalizedRow['option_a'] || '';
      const optB = normalizedRow['option_b'] || '';
      const optC = normalizedRow['option_c'] || '';
      const optD = normalizedRow['option_d'] || '';

      const opts = [optA, optB, optC, optD].filter(o => o.length > 0);
      if (opts.length < 2) {
        errors.push('Trắc nghiệm cần ít nhất 2 phương án (Option A, Option B)');
      }
      options = opts;

      const rawCorrect = normalizedRow['correct_answer'] || '';
      if (!rawCorrect) {
        errors.push('Thiếu đáp án đúng (Correct Answer)');
      } else {
        // Check if letter A, B, C, D was used
        const letter = rawCorrect.toUpperCase();
        if (letter === 'A' && optA) correctAnswer = optA;
        else if (letter === 'B' && optB) correctAnswer = optB;
        else if (letter === 'C' && optC) correctAnswer = optC;
        else if (letter === 'D' && optD) correctAnswer = optD;
        else {
          // Check if matches an option text exactly or closely
          const match = options.find(o => o.toLowerCase() === rawCorrect.toLowerCase());
          if (match) {
            correctAnswer = match;
          } else {
            correctAnswer = rawCorrect;
            errors.push(`Đáp án đúng "${rawCorrect}" không trùng với phương án nào trong A, B, C, D`);
          }
        }
      }
    } else if (type === 'true_false') {
      options = ['Đúng', 'Sai'];
      const rawCorrect = (normalizedRow['correct_answer'] || '').toLowerCase();
      if (!rawCorrect) {
        errors.push('Thiếu đáp án đúng (Correct Answer: Đúng hoặc Sai / True hoặc False)');
      } else if (rawCorrect.includes('true') || rawCorrect.includes('đúng') || rawCorrect.includes('dung') || rawCorrect === '1' || rawCorrect === 't') {
        correctAnswer = 'Đúng';
      } else if (rawCorrect.includes('false') || rawCorrect.includes('sai') || rawCorrect === '0' || rawCorrect === 'f') {
        correctAnswer = 'Sai';
      } else {
        correctAnswer = rawCorrect;
        errors.push('Đáp án Đúng/Sai phải là "Đúng", "Sai", "True" hoặc "False"');
      }
    } else if (type === 'fill_in_the_blank') {
      options = [];
      const rawCorrect = normalizedRow['correct_answer'] || '';
      if (!rawCorrect) {
        errors.push('Thiếu từ khóa đáp án đúng (Correct Answer)');
      } else {
        // Split by semicolon ; and normalize
        const keywords = rawCorrect
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        if (keywords.length === 0) {
          errors.push('Không có từ khóa hợp lệ sau khi cắt khoảng trắng');
        }
        correctAnswer = keywords;
      }
    }

    parsedQuestions.push({
      rowNumber: rowNum,
      type,
      prompt,
      options,
      correct_answer: correctAnswer,
      time_limit: timeLimit,
      isValid: errors.length === 0,
      errors
    });
  });

  const validRows = parsedQuestions.filter(q => q.isValid).length;

  return {
    questions: parsedQuestions,
    totalRows: parsedQuestions.length,
    validRows,
    invalidRows: parsedQuestions.length - validRows
  };
}

/**
 * Downloads a sample Excel file template directly in the browser
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      Type: 'multiple_choice',
      Question: 'Thủ đô của Việt Nam là thành phố nào?',
      'Option A': 'Đà Nẵng',
      'Option B': 'Hà Nội',
      'Option C': 'Hồ Chí Minh',
      'Option D': 'Cần Thơ',
      'Correct Answer': 'Hà Nội',
      'Time Limit': 20
    },
    {
      Type: 'true_false',
      Question: 'Trong Next.js 14, App Router sử dụng React Server Components mặc định?',
      'Option A': '',
      'Option B': '',
      'Option C': '',
      'Option D': '',
      'Correct Answer': 'True',
      'Time Limit': 15
    },
    {
      Type: 'fill_in_the_blank',
      Question: 'Mô hình ngôn ngữ lớn trong trí tuệ nhân tạo được viết tắt là gì? (3 chữ cái)',
      'Option A': '',
      'Option B': '',
      'Option C': '',
      'Option D': '',
      'Correct Answer': 'LLM; large language model',
      'Time Limit': 20
    },
    {
      Type: 'multiple_choice',
      Question: 'HTML là viết tắt của cụm từ nào?',
      'Option A': 'Hyperlinks and Text Markup Language',
      'Option B': 'Hyper Text Markup Language',
      'Option C': 'Home Tool Markup Language',
      'Option D': 'Hyperlink Test Mark Line',
      'Correct Answer': 'Hyper Text Markup Language',
      'Time Limit': 20
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quiz Template');

  // Generate buffer and trigger download
  XLSX.writeFile(workbook, 'Kahoot_Quiz_Template.xlsx');
}
