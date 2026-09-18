'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { parseQuizFile, downloadSampleExcelTemplate, ParsedQuestionRow } from '@/lib/excel/parseQuizFile';
import { addQuestionsToQuiz } from '@/lib/actions/quiz';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  onSuccess: () => void;
}

export default function ImportQuestionsModal({ isOpen, onClose, quizId, onSuccess }: ImportQuestionsModalProps) {
  const [file, setFile] = useState<File | null>(null);
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

    try {
      const result = await parseQuizFile(selectedFile);
      setParsedRows(result.questions);
      if (result.questions.length === 0) {
        setErrorMessage('Không tìm thấy dữ liệu câu hỏi trong tệp.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi đọc tệp Excel/CSV';
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
      const payload = validQuestions.map(q => ({
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correct_answer: q.correct_answer,
        time_limit: q.time_limit
      }));

      const res = await addQuestionsToQuiz(quizId, payload);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Lỗi khi lưu câu hỏi vào cơ sở dữ liệu');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
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
              <h2 className="text-xl font-bold">Nhập Câu Hỏi từ Excel / CSV</h2>
              <p className="text-xs text-slate-400">Tự động nhận diện cấu trúc, kiểm tra hợp lệ và tải vào bộ đề</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="text-sm text-slate-300">
              Chưa có file mẫu? Tải tệp mẫu chuẩn để điền câu hỏi dễ dàng:
            </div>
            <button
              onClick={downloadSampleExcelTemplate}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Tải file mẫu Excel (.xlsx)
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
                {file ? `Đã chọn: ${file.name}` : 'Kéo thả tệp Excel (.xlsx, .xls) hoặc CSV vào đây'}
              </p>
              <p className="text-xs text-slate-400 mt-1">hoặc nhấn để chọn tệp từ máy tính của bạn</p>
            </div>
          </div>

          {/* Parsing Spinner */}
          {parsing && (
            <div className="flex items-center justify-center gap-3 py-6 text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Đang phân tích và kiểm tra dữ liệu bảng tính...</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Lỗi xử lý:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  <span>Bản xem trước dữ liệu</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {parsedRows.length} câu hỏi
                  </span>
                </h3>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Hợp lệ: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                      <AlertCircle className="w-4 h-4" /> Không hợp lệ: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800/80 sticky top-0 text-slate-300 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Hàng</th>
                      <th className="p-3">Loại</th>
                      <th className="p-3 min-w-[200px]">Câu hỏi</th>
                      <th className="p-3 min-w-[160px]">Phương án</th>
                      <th className="p-3 min-w-[120px]">Đáp án đúng</th>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3">Trạng thái</th>
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
                              ? 'Trắc nghiệm'
                              : row.type === 'true_false'
                              ? 'Đúng / Sai'
                              : 'Điền từ'}
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
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={validCount === 0 || saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu vào bộ đề...</span>
              </>
            ) : (
              <span>Nhập {validCount} câu hỏi hợp lệ</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
