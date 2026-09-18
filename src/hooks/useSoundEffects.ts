'use client';

import { useState, useCallback, useEffect } from 'react';
import { audioManager } from '@/lib/sound/audioManager';

export function useSoundEffects() {
  const [volume, setVolumeState] = useState<number>(0.7);
  const [isMuted, setIsMutedState] = useState<boolean>(false);

  useEffect(() => {
    setVolumeState(audioManager.getVolume());
    setIsMutedState(audioManager.getIsMuted());
  }, []);

  const changeVolume = useCallback((val: number) => {
    audioManager.setVolume(val);
    setVolumeState(val);
  }, []);

  const toggleMute = useCallback(() => {
    const muted = audioManager.toggleMute();
    setIsMutedState(muted);
    return muted;
  }, []);

  const playLobbyMusic = useCallback(() => {
    audioManager.playLobbyMusic();
  }, []);

  const stopLobbyMusic = useCallback(() => {
    audioManager.stopLobbyMusic();
  }, []);

  const playCountdownTick = useCallback((secondsLeft: number) => {
    audioManager.playCountdownTick(secondsLeft);
  }, []);

  const playTimesUp = useCallback(() => {
    audioManager.playTimesUp();
  }, []);

  const playCorrect = useCallback(() => {
    audioManager.playCorrect();
  }, []);

  const playWrong = useCallback(() => {
    audioManager.playWrong();
  }, []);

  const playLeaderboard = useCallback(() => {
    audioManager.playLeaderboard();
  }, []);

  const playPodiumFanfare = useCallback(() => {
    audioManager.playPodiumFanfare();
  }, []);

  return {
    volume,
    isMuted,
    changeVolume,
    toggleMute,
    playLobbyMusic,
    stopLobbyMusic,
    playCountdownTick,
    playTimesUp,
    playCorrect,
    playWrong,
    playLeaderboard,
    playPodiumFanfare
  };
}
