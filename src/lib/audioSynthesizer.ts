/**
 * Web Audio API Classical Audio Synthesizer for "내인생 지휘자"
 * Synthesizes orchestral tones, metronome beats, countdown counts, and baton swing sound effects.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public async ensureAudioContext(): Promise<void> {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public playCountdownBeep(highPitch = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = highPitch ? 880 : 440; // A5 or A4

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Ignore audio errors
    }
  }

  public playMetronomeClick(accent = false, volume = 0.3) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp, crisp woodblock tick sound that cuts cleanly through orchestral music
      osc.type = accent ? 'triangle' : 'sine';
      osc.frequency.value = accent ? 1250 : 850;

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  public playBatonSwingSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  public playNotePitch(noteName: string, duration = 0.5) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const freqMap: Record<string, number> = {
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
      };

      const freq = freqMap[noteName] || 440;
      const now = this.ctx.currentTime;

      // Master Gain for Ensemble
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Warm Orchestral Filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      // Lead Instrument: Violin / String Ensemble (Sawtooth + Lowpass)
      const leadOsc = this.ctx.createOscillator();
      leadOsc.type = 'sawtooth';
      leadOsc.frequency.setValueAtTime(freq, now);

      // Harmony/Sub Instrument: Bass/Cello (Triangle 1 octave down)
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(freq / 2, now);

      // Flute / Woodwind Harmonics (Sine 1 octave up)
      const fluteOsc = this.ctx.createOscillator();
      fluteOsc.type = 'sine';
      fluteOsc.frequency.setValueAtTime(freq * 2, now);

      const fluteGain = this.ctx.createGain();
      fluteGain.gain.setValueAtTime(0.08, now);

      leadOsc.connect(filter);
      bassOsc.connect(filter);
      fluteOsc.connect(fluteGain);
      fluteGain.connect(filter);

      filter.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      leadOsc.start(now);
      bassOsc.start(now);
      fluteOsc.start(now);

      leadOsc.stop(now + duration);
      bassOsc.stop(now + duration);
      fluteOsc.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  public playFanfareSuccess() {
    if (this.isMuted) return;
    const notes = ['C4', 'E4', 'G4', 'C5'];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playNotePitch(n, 0.5), idx * 120);
    });
  }
}

export const audioSynthesizer = new AudioSynthesizer();
