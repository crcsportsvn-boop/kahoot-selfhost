'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Sliders } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export default function AudioControl() {
  const { volume, isMuted, changeVolume, toggleMute } = useSoundEffects();
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={toggleMute}
        title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition cursor-pointer"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5 text-rose-400" />
        ) : (
          <Volume2 className="w-5 h-5 text-indigo-400" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setShowSlider(!showSlider)}
        title="Điều chỉnh âm lượng"
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-400 hover:text-white transition cursor-pointer"
      >
        <Sliders className="w-4 h-4" />
      </button>

      {showSlider && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-50 flex items-center gap-3 w-48 animate-in fade-in slide-in-from-top-2">
          <VolumeX className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <Volume2 className="w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  );
}
