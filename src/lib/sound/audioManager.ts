// Web Audio API Synthesis Sound Engine - Zero external asset downloads needed!
class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lobbyTimer: ReturnType<typeof setInterval> | null = null;
  private isLobbyPlaying = false;
  private volume = 0.7;
  private isMuted = false;

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- 1. LOBBY BACKGROUND MUSIC (Bouncy rhythmic synth loop) ---
  public playLobbyMusic() {
    this.init();
    if (!this.ctx || !this.masterGain || this.isLobbyPlaying) return;
    this.isLobbyPlaying = true;

    // Pentatonic Kahoot-style bouncy melody sequence
    const notes = [
      261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
      392.00, 329.63, 440.00, 392.00, // G4, E4, A4, G4
      329.63, 261.63, 293.66, 329.63, // E4, C4, D4, E4
      392.00, 523.25, 659.25, 523.25  // G4, C5, E5, C5
    ];
    let step = 0;

    const tick = () => {
      if (!this.isLobbyPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const freq = notes[step % notes.length];
      step++;

      // Synth Melody Note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.25);

      // Funk Bass on downbeats
      if (step % 2 === 1) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(freq / 2, now);

        bassGain.gain.setValueAtTime(0.12, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.38);
      }
    };

    tick();
    this.lobbyTimer = setInterval(tick, 220); // ~136 BPM
  }

  public stopLobbyMusic() {
    this.isLobbyPlaying = false;
    if (this.lobbyTimer) {
      clearInterval(this.lobbyTimer);
      this.lobbyTimer = null;
    }
  }

  // --- 2. COUNTDOWN TICK-TOCK ---
  public playCountdownTick(secondsLeft: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (secondsLeft <= 5) {
      // Intense high urgency tick
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400 + (6 - secondsLeft) * 120, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else {
      // Regular gentle woodblock click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- 3. TIMES UP GONG / CHIME ---
  public playTimesUp() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  // --- 4. CORRECT CHIME ---
  public playCorrect() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 3-note ascending cheerful chime (C5 -> E5 -> G5)
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const noteTime = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  // --- 5. WRONG BUZZER ---
  public playWrong() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // --- 6. LEADERBOARD REVEAL ---
  public playLeaderboard() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Swoosh effect
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // --- 7. PODIUM TRIUMPHANT FANFARE ---
  public playPodiumFanfare() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Fanfare chord progression: C4, G4, C5, E5, G5, C6
    const chords = [
      { time: 0.00, notes: [261.63, 392.00], duration: 0.2 },
      { time: 0.22, notes: [261.63, 392.00], duration: 0.2 },
      { time: 0.44, notes: [261.63, 392.00], duration: 0.2 },
      { time: 0.66, notes: [329.63, 523.25, 659.25], duration: 0.7 },
      { time: 1.45, notes: [392.00, 523.25, 659.25, 783.99, 1046.50], duration: 1.4 }
    ];

    chords.forEach(c => {
      c.notes.forEach(freq => {
        if (!this.ctx || !this.masterGain) return;
        const noteTime = now + c.time;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + c.duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + c.duration + 0.05);
      });
    });
  }
}

export const audioManager = new AudioManager();
