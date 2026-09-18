'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { parseQuizFile, downloadSampleExcelTemplate, ParsedQuestionRow } from '@/lib/excel/parseQuizFile';
import { addQuestionsToQuiz, createQuizWithQuestions } from '@/lib/actions/quiz';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId?: string | null;
  onSuccess: () => void;
}

export default function ImportQuestionsModal({ isOpen, onClose, quizId, onSuccess }: ImportQuestionsModalProps) {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedQuestionRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setParsing(true);

    // Auto generate quiz title from filename if not set
    if (!quizTitle && !quizId) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setQuizTitle(cleanName);
    }

    try {
      const result = await parseQuizFile(selectedFile);
      setParsedRows(result.questions);
      if (result.questions.length === 0) {
        setErrorMessage(lang === 'vi' ? 'Không tìm thấy dữ liệu câu hỏi trong tệp.' : 'No question data found in the spreadsheet.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'vi' ? 'Lỗi khi đọc tệp Excel/CSV' : 'Error reading Excel/CSV file');
      setErrorMessage(msg);
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    const validQuestions = parsedRows.filter(r => r.isValid);
    if (validQuestions.length === 0) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = validQuestions.map((q, idx) => ({
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correct_answer: q.correct_answer,
        time_limit: q.time_limit,
        order_index: idx
      }));

      if (quizId) {
        // Append to existing quiz
        const res = await addQuestionsToQuiz(quizId, payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMessage(res.error || (lang === 'vi' ? 'Lỗi khi lưu câu hỏi vào cơ sở dữ liệu' : 'Error saving questions'));
        }
      } else {
        // Direct creation of a new quiz
        const finalTitle = quizTitle.trim() || (lang === 'vi' ? 'Bộ đề tải lên từ bảng tính' : 'Spreadsheet Imported Quiz');
        const finalDesc = lang === 'vi' 
          ? `Tự động tạo từ tệp ${file?.name || 'Excel/CSV'} với ${validQuestions.length} câu hỏi.`
          : `Created automatically from ${file?.name || 'Excel/CSV'} with ${validQuestions.length} questions.`;

        const res = await createQuizWithQuestions(finalTitle, finalDesc, payload);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMessage(res.error || (lang === 'vi' ? 'Lỗi khi tạo bộ đề mới từ file' : 'Error creating quiz'));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'System error';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.importModalTitle}</h2>
              <p className="text-xs text-slate-400">{t.importModalDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quiz Title field if creating new quiz */}
          {!quizId && (
            <div className="space-y-1.5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                {t.quizNamePrompt}
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập tên bộ đề (VD: Đố vui công nghệ 2026...)' : 'Enter quiz title (e.g. 2026 Tech Trivia...)'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none text-white text-sm"
              />
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-sm text-slate-300">
              {t.downloadSamplePrompt}
            </div>
            <button
              onClick={downloadSampleExcelTemplate}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {t.downloadSampleBtn} (.xlsx)
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              file
                ? 'border-indigo-500/50 bg-indigo-950/20'
                : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800/40 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="p-4 rounded-full bg-slate-800 text-indigo-400 shadow-inner">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <p className="font-semibold text-slate-200">
                {file ? `${lang === 'vi' ? 'Đã chọn' : 'Selected'}: ${file.name}` : t.dragDropText}
              </p>
              <p className="text-xs text-slate-400 mt-1">{t.orClickToPick}</p>
            </div>
          </div>

          {/* Parsing Spinner */}
          {parsing && (
            <div className="flex items-center justify-center gap-3 py-6 text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{t.parsingText}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{lang === 'vi' ? 'Lỗi xử lý:' : 'Error:'}</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  <span>{t.previewTitle}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {parsedRows.length} {t.questionsCount}
                  </span>
                </h3>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> {t.validText}: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                      <AlertCircle className="w-4 h-4" /> {t.invalidText}: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800/80 sticky top-0 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">{t.rowCol}</th>
                      <th className="p-3">{t.typeCol}</th>
                      <th className="p-3 min-w-[200px]">{t.questionCol}</th>
                      <th className="p-3 min-w-[160px]">{t.optionsCol}</th>
                      <th className="p-3 min-w-[120px]">{t.correctCol}</th>
                      <th className="p-3">{t.timeCol}</th>
                      <th className="p-3">{t.statusCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`transition ${
                          row.isValid ? 'hover:bg-slate-800/40' : 'bg-rose-950/20 hover:bg-rose-950/30'
                        }`}
                      >
                        <td className="p-3 font-mono text-slate-400">#{row.rowNumber}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                              row.type === 'multiple_choice'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : row.type === 'true_false'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {row.type === 'multiple_choice'
                              ? t.typeMultipleChoice.split(' ')[0]
                              : row.type === 'true_false'
                              ? t.typeTrueFalse
                              : t.typeFillBlank.split(' ')[0]}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200 font-medium">{row.prompt}</td>
                        <td className="p-3 text-slate-400">
                          {row.options.length > 0 ? row.options.join(' • ') : '—'}
                        </td>
                        <td className="p-3 text-emerald-400 font-semibold">
                          {Array.isArray(row.correct_answer)
                            ? row.correct_answer.join(', ')
                            : String(row.correct_answer)}
                        </td>
                        <td className="p-3 text-slate-300 font-mono">{row.time_limit}s</td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> OK
                            </span>
                          ) : (
                            <div className="text-rose-400 font-medium">
                              {row.errors.map((err, i) => (
                                <p key={i}>• {err}</p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            {t.cancelBtn}
          </button>

          <button
            type="button"
            disabled={validCount === 0 || saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.savingText}</span>
              </>
            ) : (
              <span>{t.saveImportBtn} {validCount} {t.questionsCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
