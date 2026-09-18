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
  Search,
  FolderPlus,
  X,
  Tag
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import HostAuthGate from '@/components/host/HostAuthGate';
import ImportQuestionsModal from '@/components/host/ImportQuestionsModal';
import QuizEditorModal from '@/components/host/QuizEditorModal';
import { getQuizzes, deleteQuiz, getQuizWithQuestions } from '@/lib/actions/quiz';
import { createGameSession } from '@/lib/actions/game';
import { downloadSampleExcelTemplate } from '@/lib/excel/parseQuizFile';
import { exportQuizToExcel } from '@/lib/excel/exportQuizFile';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Quiz } from '@/types';

export default function HostDashboardPage() {
  const { t, lang } = useLanguage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSessionId, setCreatingSessionId] = useState<string | null>(null);
  const [exportingQuizId, setExportingQuizId] = useState<string | null>(null);

  // Search and Folder state
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<string[]>(['Công Nghệ', 'Sự Kiện']);
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [folderMap, setFolderMap] = useState<Record<string, string>>({});

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  const router = useRouter();

  // Load folders from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFolders = localStorage.getItem('quiz_host_folders');
      if (savedFolders) {
        try {
          setFolders(JSON.parse(savedFolders));
        } catch {
          // ignore
        }
      }
      const savedMap = localStorage.getItem('quiz_folder_assignments');
      if (savedMap) {
        try {
          setFolderMap(JSON.parse(savedMap));
        } catch {
          // ignore
        }
      }
    }
  }, []);

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

  // Folder Actions
  const handleCreateFolder = () => {
    const name = window.prompt(t.newFolderPrompt);
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (folders.includes(cleanName)) {
      alert(lang === 'vi' ? 'Thư mục này đã tồn tại!' : 'Folder already exists!');
      return;
    }
    const nextFolders = [...folders, cleanName];
    setFolders(nextFolders);
    setSelectedFolder(cleanName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_host_folders', JSON.stringify(nextFolders));
    }
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t.confirmDeleteFolder)) {
      const nextFolders = folders.filter(f => f !== folderName);
      setFolders(nextFolders);
      if (selectedFolder === folderName) {
        setSelectedFolder('ALL');
      }
      const nextMap = { ...folderMap };
      Object.keys(nextMap).forEach(key => {
        if (nextMap[key] === folderName) delete nextMap[key];
      });
      setFolderMap(nextMap);
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiz_host_folders', JSON.stringify(nextFolders));
        localStorage.setItem('quiz_folder_assignments', JSON.stringify(nextMap));
      }
    }
  };

  const handleAssignFolder = (quizId: string, folderName: string) => {
    const nextMap = { ...folderMap };
    if (!folderName) {
      delete nextMap[quizId];
    } else {
      nextMap[quizId] = folderName;
    }
    setFolderMap(nextMap);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_folder_assignments', JSON.stringify(nextMap));
    }
  };

  // Export Quiz to Excel
  const handleExportExcel = async (quiz: Quiz) => {
    setExportingQuizId(quiz.id);
    try {
      await exportQuizToExcel(quiz);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error exporting Excel';
      alert(msg);
    } finally {
      setExportingQuizId(null);
    }
  };

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
    if (confirm(t.confirmDeleteQuiz)) {
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

  // Filter quizzes based on search query and selected folder
  const filteredQuizzes = quizzes.filter((quiz) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      quiz.title.toLowerCase().includes(q) ||
      (quiz.description && quiz.description.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if (selectedFolder === 'ALL') return true;
    return folderMap[quiz.id] === selectedFolder;
  });

  return (
    <HostAuthGate>
      <div className="min-h-[100dvh] flex flex-col bg-slate-950 text-slate-100 overflow-x-hidden">
        {/* Navbar with Lock button and without live audio control */}
        <Navbar
          showHostLink={true}
          showAudioControl={false}
          showLockButton={true}
          onLock={handleLockDashboard}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Top Header & Toolbar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
                <Sparkles className="w-4 h-4" />
                <span>{t.dashboardBadge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{t.dashboardTitle}</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.dashboardSubtitle}
              </p>
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* 1. Download Excel Sample */}
              <button
                type="button"
                onClick={downloadSampleExcelTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition cursor-pointer shadow-sm"
                title="Tải bảng tính mẫu để nhập câu hỏi"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadSampleBtn}</span>
              </button>

              {/* 2. Direct Import Excel / CSV to create Quiz */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-teal-300 bg-teal-500/15 border border-teal-500/30 rounded-xl hover:bg-teal-500/25 transition cursor-pointer shadow-sm"
                title="Tải tệp Excel hoặc CSV từ máy tính để tự động tạo bộ đề"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                <span>{t.importExcelBtn}</span>
              </button>

              {/* 3. Create Quiz Button */}
              <button
                type="button"
                onClick={() => {
                  setQuizToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.createQuizBtn}</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Folder Navigation */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Folders Filter & Management */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {/* All Folder Pill */}
              <button
                type="button"
                onClick={() => setSelectedFolder('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedFolder === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>📁 {t.allFolders}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                  {quizzes.length}
                </span>
              </button>

              {/* Custom Folders */}
              {folders.map((folder) => {
                const count = quizzes.filter(q => folderMap[q.id] === folder).length;
                const isSelected = selectedFolder === folder;
                return (
                  <div
                    key={folder}
                    className={`inline-flex items-center rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFolder(folder)}
                      className="px-2.5 py-1.5 flex items-center gap-1 cursor-pointer"
                    >
                      <span>📁 {folder}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                        {count}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteFolder(folder, e)}
                      title={lang === 'vi' ? 'Xóa thư mục này' : 'Delete this folder'}
                      className="pr-2 pl-0.5 py-1.5 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Add Folder Button */}
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                title="Tạo thư mục mới để phân loại bộ đề"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{t.createFolderBtn}</span>
              </button>
            </div>
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span className="text-sm text-slate-400">{t.loadingQuizzes}</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredQuizzes.length === 0 && (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                <FolderOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {quizzes.length === 0 ? t.noQuizzesTitle : (lang === 'vi' ? 'Không tìm thấy bộ đề phù hợp' : 'No matching quizzes')}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {quizzes.length === 0
                    ? t.noQuizzesDesc
                    : (lang === 'vi' ? 'Thử tìm kiếm với từ khóa khác hoặc chuyển sang thư mục "Tất Cả".' : 'Try searching with different keywords or switch to "All".')}
                </p>
              </div>
              {quizzes.length === 0 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs sm:text-sm border border-slate-700 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                    <span>{t.importExcelBtn}</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuizToEdit(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.createFirstQuiz}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quizzes Grid */}
          {!loading && filteredQuizzes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => {
                const questionCount = Array.isArray(quiz.questions)
                  ? (quiz.questions[0] as unknown as { count: number })?.count ?? quiz.questions.length
                  : 0;

                const assignedFolder = folderMap[quiz.id];

                return (
                  <div
                    key={quiz.id}
                    className="rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-3">
                      {/* Top badges & actions */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{questionCount} {t.questionsCount}</span>
                          </span>

                          {assignedFolder && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                              <span>📁 {assignedFolder}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Folder Selector Dropdown */}
                          <select
                            value={assignedFolder || ''}
                            onChange={(e) => handleAssignFolder(quiz.id, e.target.value)}
                            className="px-2 py-1 text-[11px] font-bold bg-slate-800/90 border border-slate-700 rounded-lg text-slate-300 hover:text-white outline-none cursor-pointer"
                            title={t.moveToFolder}
                          >
                            <option value="">📁 {t.noFolder}</option>
                            {folders.map(f => (
                              <option key={f} value={f}>📁 {f}</option>
                            ))}
                          </select>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditQuiz(quiz.id)}
                            disabled={loadingEditId === quiz.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/15 transition cursor-pointer"
                            title={t.editQuizTooltip}
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                            title={t.deleteQuizTooltip}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h2 className="text-xl font-black text-white leading-snug">{quiz.title}</h2>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {quiz.description || '—'}
                      </p>
                    </div>

                    {/* Bottom Action: Export Excel + Play Live */}
                    <div className="pt-5 mt-5 border-t border-slate-800 flex items-center gap-2">
                      {/* Export Excel Button */}
                      <button
                        type="button"
                        onClick={() => handleExportExcel(quiz)}
                        disabled={exportingQuizId === quiz.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer shrink-0"
                        title={lang === 'vi' ? 'Tải bộ câu hỏi về máy dưới dạng Excel (.xlsx)' : 'Export quiz questions to Excel (.xlsx)'}
                      >
                        {exportingQuizId === quiz.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{t.exportExcelBtn}</span>
                      </button>

                      {/* Play Live Button */}
                      <button
                        type="button"
                        onClick={() => handleStartGame(quiz.id)}
                        disabled={creatingSessionId === quiz.id}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-700/20 disabled:opacity-50 transition cursor-pointer"
                      >
                        {creatingSessionId === quiz.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                        <span>{t.playLiveBtn}</span>
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

        <ImportQuestionsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={loadQuizzes}
        />
      </div>
    </HostAuthGate>
  );
}
