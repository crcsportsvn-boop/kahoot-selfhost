'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Play,
  FileSpreadsheet,
  Trash2,
  HelpCircle,
  Sparkles,
  Download,
  Loader2,
  FolderOpen,
  Pencil,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import HostAuthGate from '@/components/host/HostAuthGate';
import ImportQuestionsModal from '@/components/host/ImportQuestionsModal';
import QuizEditorModal from '@/components/host/QuizEditorModal';
import { getQuizzes, deleteQuiz, getQuizWithQuestions } from '@/lib/actions/quiz';
import { createGameSession } from '@/lib/actions/game';
import { downloadSampleExcelTemplate } from '@/lib/excel/parseQuizFile';
import { Quiz } from '@/types';

export default function HostDashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSessionId, setCreatingSessionId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);
  const [importQuizId, setImportQuizId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

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

  const handleEditQuiz = async (quizId: string) => {
    setLoadingEditId(quizId);
    try {
      const res = await getQuizWithQuestions(quizId);
      if (res.success && res.quiz) {
        setQuizToEdit(res.quiz);
        setIsCreateModalOpen(true);
      } else {
        alert('Không thể tải dữ liệu bộ đề');
      }
    } catch {
      alert('Lỗi khi tải bộ đề');
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bộ đề này cùng toàn bộ câu hỏi?')) {
      await deleteQuiz(quizId);
      loadQuizzes();
    }
  };

  const handleLockDashboard = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('host_unlocked');
      window.location.reload();
    }
  };

  return (
    <HostAuthGate>
      <div className="min-h-[100dvh] flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
        <Navbar showHostLink={true} />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Khu Vực Quản Lý & Điều Hành</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Bộ Đề Trắc Nghiệm Của Bạn</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Tạo mới, chỉnh sửa, đính kèm hình ảnh và nhập từ file Excel/CSV
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={downloadSampleExcelTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition cursor-pointer"
                title="Tải bảng tính mẫu để nhập câu hỏi"
              >
                <Download className="w-4 h-4" />
                <span>Tải Mẫu Excel</span>
              </button>

              <button
                onClick={() => {
                  setQuizToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Bộ Đề Mới</span>
              </button>

              <button
                onClick={handleLockDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
                title="Khóa Dashboard (Đăng xuất quyền Host)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khóa</span>
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
                  Hãy bấm nút &quot;Tạo Bộ Đề Mới&quot; hoặc nạp seed data để bắt đầu tổ chức thi đấu!
                </p>
              </div>
              <button
                onClick={() => {
                  setQuizToEdit(null);
                  setIsCreateModalOpen(true);
                }}
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

                        <div className="flex items-center gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditQuiz(quiz.id)}
                            disabled={loadingEditId === quiz.id}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/15 transition cursor-pointer"
                            title="Chỉnh sửa bộ đề và các câu hỏi"
                          >
                            {loadingEditId === quiz.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            ) : (
                              <Pencil className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                            title="Xóa bộ đề này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          quizToEdit={quizToEdit}
          onClose={() => {
            setIsCreateModalOpen(false);
            setQuizToEdit(null);
          }}
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
    </HostAuthGate>
  );
}
