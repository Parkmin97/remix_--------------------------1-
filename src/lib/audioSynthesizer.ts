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
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    // 컨텍스트가 잠겨 있으면 재개를 시도한다. 여기서는 결과를 기다리지 않는다.
    // (타이머에서 호출되는 경로는 동기 실행이어야 하므로)
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => { /* 제스처 밖 호출은 실패할 수 있다 */ });
    }
  }

  /**
   * 사용자 제스처 안에서 호출해 오디오 잠금을 확실히 해제한다.
   *
   * iOS 사파리와 일부 모바일 브라우저는 제스처 밖에서 만든 AudioContext를
   * suspended로 유지한다. 이 상태에서 setInterval로 클릭음을 내면 소리가
   * 전혀 나지 않는다. 그래서 resume 완료를 기다리고, 무음 버퍼를 한 번
   * 재생해 컨텍스트를 실제로 깨운 뒤 성공 여부를 돌려준다.
   */
  public async ensureAudioContext(): Promise<boolean> {
    this.initCtx();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume error:', e);
      }
    }

    // 무음 버퍼 재생으로 잠금을 확실히 푼다. iOS는 resume만으로는
    // 첫 소리가 나오지 않는 경우가 있다.
    try {
      const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
    } catch {
      // 무음 워밍업 실패는 치명적이지 않다.
    }

    return this.ctx.state === 'running';
  }

  /** 오디오가 실제로 재생 가능한 상태인지. UI 경고 표시에 쓴다. */
  public isAudioReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /** 앱 내 음소거 설정 상태. 소리가 안 들리는 원인 구분에 쓴다. */
  public getMuted(): boolean {
    return this.isMuted;
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
