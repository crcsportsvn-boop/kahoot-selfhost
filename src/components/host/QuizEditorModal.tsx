'use client';

import React, { useState } from 'react';
import { Plus, Trash2, X, Check, HelpCircle, Loader2 } from 'lucide-react';
import { QuestionType } from '@/types';
import { createQuizWithQuestions } from '@/lib/actions/quiz';

interface QuizEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface QuestionDraft {
  type: QuestionType;
  prompt: string;
  options: string[];
  correct_answer: string | string[];
  time_limit: number;
}

export default function QuizEditorModal({ isOpen, onClose, onSuccess }: QuizEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      type: 'multiple_choice',
      prompt: '',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correct_answer: 'Phương án A',
      time_limit: 20
    }
  ]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        type: 'multiple_choice',
        prompt: '',
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correct_answer: 'Phương án A',
        time_limit: 20
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      const oldVal = q.options[optIndex];
      q.options = [...q.options];
      q.options[optIndex] = val;
      // If this option was selected as correct answer, update it too
      if (q.correct_answer === oldVal) {
        q.correct_answer = val;
      }
      copy[qIndex] = q;
      return copy;
    });
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề cho bộ đề');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setError(`Câu hỏi số ${i + 1} chưa có nội dung`);
        return;
      }
      if (q.type === 'multiple_choice') {
        const nonEmpty = q.options.filter(o => o.trim().length > 0);
        if (nonEmpty.length < 2) {
          setError(`Câu hỏi số ${i + 1} cần có ít nhất 2 phương án trả lời`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    try {
      const payload = questions.map((q, idx) => ({
        type: q.type,
        prompt: q.prompt.trim(),
        options: q.type === 'multiple_choice' ? q.options : q.type === 'true_false' ? ['Đúng (True)', 'Sai (False)'] : [],
        correct_answer: q.correct_answer,
        time_limit: q.time_limit || 20,
        order_index: idx
      }));

      const res = await createQuizWithQuestions(title, description, payload);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Lỗi khi lưu bộ đề');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tạo Bộ Câu Hỏi Trắc Nghiệm Mới</h2>
              <p className="text-xs text-slate-400">Thiết lập các câu hỏi, thời gian và đáp án chuẩn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Quiz metadata */}
          <div className="grid grid-cols-1 gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tiêu đề bộ đề *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Đấu trí Lập Trình & Công Nghệ 2026..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mô tả ngắn
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="VD: Cuộc thi trắc nghiệm vui dành cho các lập trình viên..."
                rows={2}
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200">
                Danh sách câu hỏi ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi</span>
              </button>
            </div>

            {questions.map((q, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Câu hỏi #{idx + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                      title="Xóa câu hỏi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Type */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Loại câu hỏi</label>
                    <select
                      value={q.type}
                      onChange={e => {
                        const newType = e.target.value as QuestionType;
                        handleUpdateQuestion(idx, {
                          type: newType,
                          correct_answer:
                            newType === 'true_false'
                              ? 'Đúng (True)'
                              : newType === 'fill_in_the_blank'
                              ? ''
                              : q.options[0] || ''
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="multiple_choice">Trắc nghiệm 4 đáp án</option>
                      <option value="true_false">Đúng / Sai</option>
                      <option value="fill_in_the_blank">Điền từ vào chỗ trống</option>
                    </select>
                  </div>

                  {/* Time limit */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Thời gian: {q.time_limit}s
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={120}
                      step={5}
                      value={q.time_limit}
                      onChange={e => handleUpdateQuestion(idx, { time_limit: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                    />
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nội dung câu hỏi</label>
                  <input
                    type="text"
                    value={q.prompt}
                    onChange={e => handleUpdateQuestion(idx, { prompt: e.target.value })}
                    placeholder="VD: Ai là người phát minh ra World Wide Web?"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Options based on type */}
                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-400">
                      Các phương án (Tích chọn nút tròn để đặt làm đáp án đúng)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correct_answer === opt;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              isCorrect
                                ? 'border-emerald-500/60 bg-emerald-950/20'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(idx, { correct_answer: opt })}
                              className={`w-6 h-6 rounded-full flex items-center justify-center border transition shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-500 border-emerald-400 text-white'
                                  : 'border-slate-600 hover:border-slate-400 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => handleOptionChange(idx, optIdx, e.target.value)}
                              placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}`}
                              className="w-full bg-transparent border-none outline-none text-white text-xs sm:text-sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="flex gap-4">
                    {['Đúng (True)', 'Sai (False)'].map(tf => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => handleUpdateQuestion(idx, { correct_answer: tf })}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition cursor-pointer ${
                          q.correct_answer === tf
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {tf} {q.correct_answer === tf && '✓ (Đáp án đúng)'}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'fill_in_the_blank' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Từ khóa đáp án đúng (có thể cách nhau bằng dấu chấm phẩy &quot;;&quot; nếu có nhiều từ đồng nghĩa)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(q.correct_answer) ? q.correct_answer.join('; ') : String(q.correct_answer)}
                      onChange={e => handleUpdateQuestion(idx, { correct_answer: e.target.value })}
                      placeholder="VD: H2O; nước; nước tinh khiết"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveQuiz}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Hoàn tất & Lưu bộ đề</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
