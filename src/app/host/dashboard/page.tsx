'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Play,
  FileSpreadsheet,
  Trash2,
  HelpCircle,
  Clock,
  Sparkles,
  Download,
  Loader2,
  FolderOpen
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import ImportQuestionsModal from '@/components/host/ImportQuestionsModal';
import QuizEditorModal from '@/components/host/QuizEditorModal';
import { getQuizzes, deleteQuiz } from '@/lib/actions/quiz';
import { createGameSession } from '@/lib/actions/game';
import { downloadSampleExcelTemplate } from '@/lib/excel/parseQuizFile';
import { Quiz } from '@/types';

export default function HostDashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSessionId, setCreatingSessionId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [importQuizId, setImportQuizId] = useState<string | null>(null);

  const router = useRouter();

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuizzes();
      if (res.success) {
        setQuizzes(res.quizzes);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleStartGame = async (quizId: string) => {
    setCreatingSessionId(quizId);
    try {
      const res = await createGameSession(quizId);
      if (res.success && res.session) {
        router.push(`/host/game/${res.session.pin}`);
      } else {
        alert(res.error || 'Không thể tạo phòng chơi');
      }
    } catch {
      alert('Lỗi khi kết nối máy chủ');
    } finally {
      setCreatingSessionId(null);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bộ đề này cùng toàn bộ câu hỏi?')) {
      await deleteQuiz(quizId);
      loadQuizzes();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Khu Vực Quản Lý & Điều Hành</span>
            </div>
            <h1 className="text-3xl font-black text-white">Bộ Đề Trắc Nghiệm Của Bạn</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Tạo mới, nhập dữ liệu từ bảng tính Excel/CSV và tổ chức thi đấu trực tiếp
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải Mẫu Excel</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bộ Đề Mới</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-indigo-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <span className="text-sm text-slate-400">Đang tải danh sách bộ đề từ Supabase...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && quizzes.length === 0 && (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Chưa Có Bộ Đề Nào</h3>
              <p className="text-xs text-slate-400 mt-1">
                Hãy bấm nút &quot;Tạo Bộ Đề Mới&quot; hoặc chạy script seed trong Supabase Studio để tải các bộ đề mẫu sẵn có!
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bộ Đề Đầu Tiên</span>
            </button>
          </div>
        )}

        {/* Quizzes Grid */}
        {!loading && quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const questionCount = Array.isArray(quiz.questions)
                ? (quiz.questions[0] as unknown as { count: number })?.count ?? quiz.questions.length
                : 0;

              return (
                <div
                  key={quiz.id}
                  className="rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm transition-all hover:scale-[1.01]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{questionCount} câu hỏi</span>
                      </span>

                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Xóa bộ đề này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h2 className="text-xl font-black text-white leading-snug">{quiz.title}</h2>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {quiz.description || 'Chưa có mô tả chi tiết cho bộ câu hỏi này.'}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setImportQuizId(quiz.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                      title="Nhập thêm câu hỏi từ file Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Nhập Excel</span>
                    </button>

                    <button
                      onClick={() => handleStartGame(quiz.id)}
                      disabled={creatingSessionId === quiz.id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-700/20 disabled:opacity-50 transition cursor-pointer"
                    >
                      {creatingSessionId === quiz.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                      <span>Phát Trực Tiếp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <QuizEditorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadQuizzes}
      />

      {importQuizId && (
        <ImportQuestionsModal
          isOpen={Boolean(importQuizId)}
          quizId={importQuizId}
          onClose={() => setImportQuizId(null)}
          onSuccess={loadQuizzes}
        />
      )}
    </div>
  );
}
