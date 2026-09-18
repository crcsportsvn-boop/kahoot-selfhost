'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Check, HelpCircle, Loader2, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { QuestionType, Quiz, Question } from '@/types';
import { createQuizWithQuestions, updateQuizWithQuestions } from '@/lib/actions/quiz';
import { compressImageFile } from '@/lib/image/compressImage';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface QuizEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quizToEdit?: Quiz | null;
}

interface QuestionDraft {
  id?: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correct_answer: string | string[];
  time_limit: number;
  media_url?: string;
}

const SAMPLE_IMAGES = [
  { label: 'Công nghệ', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80' },
  { label: 'Vũ trụ', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80' },
  { label: 'Khoa học', url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80' },
  { label: 'Lập trình', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80' },
];

export default function QuizEditorModal({ isOpen, onClose, onSuccess, quizToEdit }: QuizEditorModalProps) {
  const { t, lang } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImgIdx, setUploadingImgIdx] = useState<number | null>(null);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const defaultTrueLabel = lang === 'vi' ? 'Đúng' : 'True';
  const defaultFalseLabel = lang === 'vi' ? 'Sai' : 'False';

  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      type: 'multiple_choice',
      prompt: '',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correct_answer: 'Phương án A',
      time_limit: 20,
      media_url: ''
    }
  ]);

  // Load existing quiz data when quizToEdit changes
  useEffect(() => {
    if (quizToEdit) {
      setTitle(quizToEdit.title || '');
      setDescription(quizToEdit.description || '');

      if (quizToEdit.questions && quizToEdit.questions.length > 0) {
        setQuestions(
          quizToEdit.questions.map((q: Question) => {
            // Clean up any legacy "Đúng (True)" in existing questions
            let cleanCorrect = q.correct_answer;
            if (q.type === 'true_false') {
              const str = String(q.correct_answer).toLowerCase();
              cleanCorrect = (str.includes('đúng') || str.includes('true')) ? defaultTrueLabel : defaultFalseLabel;
            }

            return {
              id: q.id,
              type: q.type,
              prompt: q.prompt,
              options: q.type === 'true_false' ? [defaultTrueLabel, defaultFalseLabel] : (q.options || []),
              correct_answer: cleanCorrect,
              time_limit: q.time_limit || 20,
              media_url: q.media_url || ''
            };
          })
        );
      }
    } else {
      setTitle('');
      setDescription('');
      setQuestions([
        {
          type: 'multiple_choice',
          prompt: '',
          options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
          correct_answer: 'Phương án A',
          time_limit: 20,
          media_url: ''
        }
      ]);
    }
    setError(null);
  }, [quizToEdit, isOpen, defaultTrueLabel, defaultFalseLabel]);

  if (!isOpen) return null;

  const isEditMode = Boolean(quizToEdit);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        type: 'multiple_choice',
        prompt: '',
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correct_answer: 'Phương án A',
        time_limit: 20,
        media_url: ''
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
      if (q.correct_answer === oldVal) {
        q.correct_answer = val;
      }
      copy[qIndex] = q;
      return copy;
    });
  };

  const handleLocalImageUpload = async (index: number, file: File) => {
    setUploadingImgIdx(index);
    try {
      const base64Url = await compressImageFile(file, 900, 0.82);
      handleUpdateQuestion(index, { media_url: base64Url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xử lý ảnh';
      setError(msg);
    } finally {
      setUploadingImgIdx(null);
    }
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      setError(lang === 'vi' ? 'Vui lòng nhập tiêu đề cho bộ đề' : 'Please enter a quiz title');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setError(lang === 'vi' ? `Câu hỏi số ${i + 1} chưa có nội dung` : `Question #${i + 1} has no prompt`);
        return;
      }
      if (q.type === 'multiple_choice') {
        const nonEmpty = q.options.filter(o => o.trim().length > 0);
        if (nonEmpty.length < 2) {
          setError(lang === 'vi' ? `Câu hỏi số ${i + 1} cần có ít nhất 2 phương án trả lời` : `Question #${i + 1} needs at least 2 options`);
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
        options: q.type === 'multiple_choice' 
          ? q.options 
          : q.type === 'true_false' 
          ? [defaultTrueLabel, defaultFalseLabel] 
          : [],
        correct_answer: q.correct_answer,
        time_limit: q.time_limit || 20,
        order_index: idx,
        media_url: q.media_url?.trim() || undefined
      }));

      let res;
      if (isEditMode && quizToEdit) {
        res = await updateQuizWithQuestions(quizToEdit.id, title, description, payload);
      } else {
        res = await createQuizWithQuestions(title, description, payload);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || (lang === 'vi' ? 'Lỗi khi lưu bộ đề' : 'Error saving quiz'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'System error';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? t.editQuizTitle : t.createQuizTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'vi' ? 'Thiết lập câu hỏi, tải ảnh minh họa và đáp án chuẩn' : 'Configure questions, upload images and set correct answers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Quiz metadata */}
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.quizTitleLabel}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t.quizTitlePlaceholder}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.quizDescLabel}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.quizDescPlaceholder}
                rows={2}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200">
                {t.questionsList} ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addQuestionBtn}</span>
              </button>
            </div>

            {questions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    {t.questionNum} #{idx + 1}
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
                    <label className="block text-xs text-slate-400 mb-1">{t.questionTypeLabel}</label>
                    <select
                      value={q.type}
                      onChange={e => {
                        const newType = e.target.value as QuestionType;
                        handleUpdateQuestion(idx, {
                          type: newType,
                          correct_answer:
                            newType === 'true_false'
                              ? defaultTrueLabel
                              : newType === 'fill_in_the_blank'
                              ? ''
                              : q.options[0] || ''
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="multiple_choice">{t.typeMultipleChoice}</option>
                      <option value="true_false">{t.typeTrueFalse}</option>
                      <option value="fill_in_the_blank">{t.typeFillBlank}</option>
                    </select>
                  </div>

                  {/* Time limit */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t.timeLimitLabel}: {q.time_limit}s
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
                  <label className="block text-xs text-slate-400 mb-1">{t.promptLabel}</label>
                  <input
                    type="text"
                    value={q.prompt}
                    onChange={e => handleUpdateQuestion(idx, { prompt: e.target.value })}
                    placeholder={t.promptPlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Local Image Upload & URL input (User Request 1) */}
                <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.imageUploadLabel}</span>
                    </label>

                    {/* Local File Picker Button */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={el => { fileInputRefs.current[idx] = el; }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLocalImageUpload(idx, e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        disabled={uploadingImgIdx === idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition cursor-pointer"
                      >
                        {uploadingImgIdx === idx ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang nén...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{t.uploadFromComputer}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={q.media_url?.startsWith('data:') ? `[Ảnh tải lên từ máy tính - ${(q.media_url.length / 1024).toFixed(0)} KB]` : (q.media_url || '')}
                      onChange={e => {
                        if (!e.target.value.startsWith('[')) {
                          handleUpdateQuestion(idx, { media_url: e.target.value });
                        }
                      }}
                      placeholder={t.orPasteUrl}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    {q.media_url && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(idx, { media_url: '' })}
                        className="px-2.5 py-2 text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 rounded-lg transition shrink-0 cursor-pointer"
                        title="Xóa hình ảnh"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>

                  {/* Sample presets */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                    <span>{t.sampleImages}</span>
                    {SAMPLE_IMAGES.map((s, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleUpdateQuestion(idx, { media_url: s.url })}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Image Preview */}
                  {q.media_url && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={q.media_url}
                        alt="Preview"
                        className="w-24 h-16 object-cover rounded-lg border border-slate-700 shadow"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'vi' ? 'Hình ảnh sẵn sàng hiển thị' : 'Image ready to present'}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Options based on type */}
                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-400">
                      {t.optionsLabel}
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
                                : 'border-slate-700 bg-slate-950'
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

                {/* User Request 2: Pure True / False without mixed language */}
                {q.type === 'true_false' && (
                  <div className="flex gap-4">
                    {[defaultTrueLabel, defaultFalseLabel].map(tf => {
                      const isSelected = 
                        q.correct_answer === tf || 
                        (tf === defaultTrueLabel && (String(q.correct_answer).toLowerCase().includes('đúng') || String(q.correct_answer).toLowerCase().includes('true'))) ||
                        (tf === defaultFalseLabel && (String(q.correct_answer).toLowerCase().includes('sai') || String(q.correct_answer).toLowerCase().includes('false')));

                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, { correct_answer: tf })}
                          className={`flex-1 py-3 rounded-xl border text-sm font-black transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-900/30'
                              : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span>{tf}</span> {isSelected && <span className="text-xs ml-1 font-semibold text-emerald-400">{t.correctAnswerBadge}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'fill_in_the_blank' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {t.keywordsLabel}
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(q.correct_answer) ? q.correct_answer.join('; ') : String(q.correct_answer)}
                      onChange={e => handleUpdateQuestion(idx, { correct_answer: e.target.value })}
                      placeholder={t.keywordsPlaceholder}
                      className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
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
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            {t.cancelBtn}
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
                <span>{t.savingText}</span>
              </>
            ) : (
              <span>{isEditMode ? t.saveChangesBtn : t.saveNewBtn}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
