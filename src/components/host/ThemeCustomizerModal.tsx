'use client';

import React, { useState, useRef } from 'react';
import { Palette, UploadCloud, X, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import { compressImageFile } from '@/lib/image/compressImage';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface ThemeSettings {
  bgPreset: string;
  logoUrl?: string;
}

export const THEME_PRESETS = [
  {
    id: 'deep-space',
    nameVi: 'Không Gian Sâu (Mặc định)',
    nameEn: 'Deep Space (Default)',
    gradient: 'from-indigo-950 via-purple-950 to-slate-950',
    primaryColor: '#6366f1',
    previewBadge: 'bg-indigo-600'
  },
  {
    id: 'cyberpunk',
    nameVi: 'Cyberpunk Neon',
    nameEn: 'Cyberpunk Neon',
    gradient: 'from-slate-950 via-fuchsia-950 to-emerald-950',
    primaryColor: '#ec4899',
    previewBadge: 'bg-fuchsia-600'
  },
  {
    id: 'ocean-tech',
    nameVi: 'Đại Dương Công Nghệ',
    nameEn: 'Ocean Blue',
    gradient: 'from-slate-950 via-blue-950 to-cyan-950',
    primaryColor: '#06b6d4',
    previewBadge: 'bg-cyan-600'
  },
  {
    id: 'sunset-glory',
    nameVi: 'Hoàng Hôn Rực Rỡ',
    nameEn: 'Sunset Glory',
    gradient: 'from-slate-950 via-rose-950 to-amber-950',
    primaryColor: '#f59e0b',
    previewBadge: 'bg-amber-600'
  }
];

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeSettings;
  onUpdateTheme: (newTheme: ThemeSettings) => void;
}

export default function ThemeCustomizerModal({
  isOpen,
  onClose,
  theme,
  onUpdateTheme
}: ThemeCustomizerModalProps) {
  const { lang } = useLanguage();
  const [selectedBg, setSelectedBg] = useState(theme.bgPreset);
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl || '');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setCompressing(true);
    try {
      const dataUrl = await compressImageFile(file, 600, 0.85);
      setLogoUrl(dataUrl);
    } catch {
      alert(lang === 'vi' ? 'Lỗi khi xử lý file logo' : 'Error compressing logo');
    } finally {
      setCompressing(false);
    }
  };

  const handleApply = () => {
    const updated = {
      bgPreset: selectedBg,
      logoUrl: logoUrl.trim() || undefined
    };
    onUpdateTheme(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_theme_settings', JSON.stringify(updated));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {lang === 'vi' ? 'Tùy Biến Giao Diện Phòng Đấu' : 'Customize Presentation Theme'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'vi' ? 'Màu nền máy chiếu & Logo thương hiệu / doanh nghiệp' : 'Screen background & Company / Event logo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Background Preset */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              {lang === 'vi' ? '1. Chọn tông màu nền chủ đạo' : '1. Select Color Theme'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = selectedBg === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedBg(preset.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-6 h-6 rounded-full ${preset.previewBadge} border border-white/20 shadow-sm`} />
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <span className="text-xs font-bold text-white">
                      {lang === 'vi' ? preset.nameVi : preset.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              {lang === 'vi' ? '2. Logo Công Ty / Tổ Chức (Hiển thị góc màn hình)' : '2. Company / Organization Logo'}
            </label>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{compressing ? (lang === 'vi' ? 'Đang nén...' : 'Compressing...') : (lang === 'vi' ? 'Tải logo từ máy' : 'Upload Logo File')}</span>
              </button>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 rounded-xl transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Xóa logo' : 'Remove Logo'}</span>
                </button>
              )}
            </div>

            {/* URL Fallback */}
            <input
              type="url"
              value={logoUrl.startsWith('data:') ? `[Logo tải từ máy tính - ${(logoUrl.length / 1024).toFixed(0)} KB]` : logoUrl}
              onChange={(e) => {
                if (!e.target.value.startsWith('[')) {
                  setLogoUrl(e.target.value);
                }
              }}
              placeholder={lang === 'vi' ? 'hoặc dán link logo https://...' : 'or paste logo URL https://...'}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            />

            {/* Logo Preview */}
            {logoUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <img
                  src={logoUrl}
                  alt="Company Logo Preview"
                  className="h-10 max-w-[140px] object-contain rounded bg-white/5 p-1 border border-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Logo sẵn sàng hiển thị khi trình chiếu' : 'Logo ready for presentation'}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            {lang === 'vi' ? 'Hủy' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            {lang === 'vi' ? 'Áp Dụng Giao Diện' : 'Apply Theme'}
          </button>
        </div>
      </div>
    </div>
  );
}
