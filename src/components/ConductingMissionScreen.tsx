import React, { useState, useEffect, useRef } from 'react';
import { BeatType, ClassicalPiece, SessionData } from '../types';
import { CLASSICAL_PIECES } from '../data/classicalPieces';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Music, Play, CheckCircle2, AlertCircle, Activity, Smartphone, Hand } from 'lucide-react';

const TUTORIAL_SVG_GUIDES: Record<BeatType, {
  title: string;
  pattern: string;
  svgPath: string;
  points: Array<{ x: number; y: number; beat: number; label: string }>;
  steps: Array<{ beat: number; name: string; tip: string }>;
}> = {
  '4/4': {
    title: '4/4 박자 지휘 패턴 (Down - In - Out - Up)',
    pattern: '1(Down) ➔ 2(In) ➔ 3(Out) ➔ 4(Up)',
    svgPath: 'M 100 20 L 100 120 C 100 130, 50 110, 50 90 C 50 80, 150 80, 150 90 C 150 110, 100 50, 100 20',
    points: [
      { x: 100, y: 120, beat: 1, label: '1 (Down)' },
      { x: 50, y: 90, beat: 2, label: '2 (In)' },
      { x: 150, y: 90, beat: 3, label: '3 (Out)' },
      { x: 100, y: 20, beat: 4, label: '4 (Up)' },
    ],
    steps: [
      { beat: 1, name: '1박 (강)', tip: '수직으로 힘차게 하강 (Ictus)' },
      { beat: 2, name: '2박 (약)', tip: '안쪽(왼쪽)으로 부드럽게 반사' },
      { beat: 3, name: '3박 (중강)', tip: '바깥쪽(오른쪽)으로 넓게 펼침' },
      { beat: 4, name: '4박 (약)', tip: '위로 끌어올리며 다음 박자 준비' },
    ],
  },
  '3/4': {
    title: '3/4 박자 왈츠 지휘 패턴 (Down - Out - Up)',
    pattern: '1(Down) ➔ 2(Out) ➔ 3(Up) [삼각형]',
    svgPath: 'M 100 20 L 100 120 Q 130 120 160 100 L 100 20',
    points: [
      { x: 100, y: 120, beat: 1, label: '1 (Down)' },
      { x: 160, y: 100, beat: 2, label: '2 (Out)' },
      { x: 100, y: 20, beat: 3, label: '3 (Up)' },
    ],
    steps: [
      { beat: 1, name: '1박 (강/쿵)', tip: '우아하고 깊은 강박 수직 하강' },
      { beat: 2, name: '2박 (약/짝)', tip: '오른쪽 바깥 곡선 스위프' },
      { beat: 3, name: '3박 (약/짝)', tip: '위로 가볍게 띄우며 복귀' },
    ],
  },
  '2/4': {
    title: '2/4 박자 행진곡 지휘 패턴 (J자 곡선)',
    pattern: '1(Down) ➔ 2(Up) [J자]',
    svgPath: 'M 100 20 L 100 115 Q 85 130 75 105 C 75 80, 125 80, 100 20',
    points: [
      { x: 100, y: 115, beat: 1, label: '1 (Down)' },
      { x: 100, y: 20, beat: 2, label: '2 (Up)' },
    ],
    steps: [
      { beat: 1, name: '1박 (강)', tip: '단호한 하강 및 안쪽 반사' },
      { beat: 2, name: '2박 (약)', tip: '바깥쪽 곡선으로 솟아오름' },
    ],
  },
  '1/4': {
    title: '1/4 박자 빠른 스케르초 패턴 (단일 맥박)',
    pattern: '1(Up-Down Pulse)',
    svgPath: 'M 100 30 L 100 120 L 100 30',
    points: [
      { x: 100, y: 120, beat: 1, label: '1 (Pulse)' },
    ],
    steps: [
      { beat: 1, name: '1박 (마디 맥박)', tip: '마디 첫 박만 명확하게 하강 반사' },
    ],
  },
};

interface ConductingMissionScreenProps {
  activeSession: SessionData | null;
  onMissionSuccess: () => void;
  onMissionFail: () => void;
  onCancel: () => void;
}

export const ConductingMissionScreen: React.FC<ConductingMissionScreenProps> = ({
  activeSession,
  onMissionSuccess,
  onMissionFail,
  onCancel
}) => {
  // Randomly select a classical piece on screen load, with option to swap randomly
  const [currentPiece, setCurrentPiece] = useState<ClassicalPiece>(() => {
    const randomIndex = Math.floor(Math.random() * CLASSICAL_PIECES.length);
    return CLASSICAL_PIECES[randomIndex];
  });

  const selectedBeat: BeatType = currentPiece.beatType;

  const handlePickRandomPiece = () => {
    if (gameState !== 'READY') return;
    stopAudioPreview();
    let nextPiece: ClassicalPiece;
    do {
      const randomIndex = Math.floor(Math.random() * CLASSICAL_PIECES.length);
      nextPiece = CLASSICAL_PIECES[randomIndex];
    } while (nextPiece.id === currentPiece.id && CLASSICAL_PIECES.length > 1);
    setCurrentPiece(nextPiece);
  };

  const [gameState, setGameState] = useState<'READY' | 'TUTORIAL_PREVIEW' | 'COUNTDOWN' | 'CONDUCTING' | 'SUCCESS' | 'FAIL'>('READY');
  const [tutorialTimeLeft, setTutorialTimeLeft] = useState<number>(10);
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [activeTutorialBeat, setActiveTutorialBeat] = useState<number>(1);
  const tutorialTimerRef = useRef<number | null>(null);
  const tutorialMetronomeTimerRef = useRef<number | null>(null);
  
  // Rhythm Beat Tracking States (±0.25s Rule & 80% Threshold)
  const [accurateBeatCount, setAccurateBeatCount] = useState<number>(0);
  const [totalAttemptCount, setTotalAttemptCount] = useState<number>(0);
  const [timingFeedback, setTimingFeedback] = useState<{ text: string; isGood: boolean } | null>(null);
  
  // Device Motion & Permission States
  const [permissionState, setPermissionState] = useState<'UNKNOWN' | 'GRANTED' | 'DENIED' | 'NOT_SUPPORTED'>('UNKNOWN');
  const [currentAccValue, setCurrentAccValue] = useState<number>(0);
  const [isSwinging, setIsSwinging] = useState<boolean>(false);

  const [isAudioPreviewPlaying, setIsAudioPreviewPlaying] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerTrailRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const lastBeatTimeRef = useRef<number>(0);
  const musicStartTimeRef = useRef<number>(0);
  const matchedBeatIndicesRef = useRef<Set<number>>(new Set());
  const lastAccRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const isArmedForSwingRef = useRef<boolean>(false);
  const lastAccMagnitudeRef = useRef<number>(0);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  // Toggle & play preview classical orchestra audio with guaranteed Web Audio Orchestral Ensemble fallback
  const stopAudioPreview = () => {
    if (bgAudioRef.current) {
      try {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
        bgAudioRef.current.src = '';
      } catch (e) {
        console.warn('Error pausing bg audio:', e);
      }
      bgAudioRef.current = null;
    }
    if (previewTimerRef.current !== null) {
      window.clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setIsAudioPreviewPlaying(false);
  };

  const playOrchestralAudio = (primaryUrl: string, fallbackUrl?: string, volume = 1.0) => {
    stopAudioPreview();

    const audio = new Audio(primaryUrl);
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = volume;
    bgAudioRef.current = audio;

    setIsAudioPreviewPlaying(true);

    audio.play().then(() => {
      // Race condition check: if another audio took over or preview was stopped, halt immediately
      if (bgAudioRef.current !== audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      } else {
        setIsAudioPreviewPlaying(true);
      }
    }).catch(err => {
      console.warn('Primary MP3 play notice, trying fallback:', err);
      if (bgAudioRef.current !== audio) return;

      if (fallbackUrl) {
        const fallbackAudio = new Audio(fallbackUrl);
        fallbackAudio.loop = true;
        fallbackAudio.volume = volume;
        bgAudioRef.current = fallbackAudio;
        fallbackAudio.play().then(() => {
          if (bgAudioRef.current !== fallbackAudio) {
            fallbackAudio.pause();
            fallbackAudio.currentTime = 0;
            fallbackAudio.src = '';
          } else {
            setIsAudioPreviewPlaying(true);
          }
        }).catch(e => {
          console.error('Failed to play fallback audio:', e);
        });
      }
    });
  };

  const toggleAudioPreview = () => {
    if (isAudioPreviewPlaying) {
      stopAudioPreview();
    } else {
      if (currentPiece.audioUrl) {
        playOrchestralAudio(currentPiece.audioUrl, currentPiece.fallbackAudioUrl, 1.0);
      }
    }
  };

  // Calculate Total Expected Beats in 60s for current classical piece
  const beatIntervalMs = (60 / currentPiece.bpm) * 1000;
  const totalExpectedBeatsIn60s = Math.floor(60000 / beatIntervalMs);
  const requiredBeatsToPass = Math.ceil(totalExpectedBeatsIn60s * 0.8);

  // Initial check for DeviceMotionEvent support & Unmount cleanup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        setPermissionState('UNKNOWN');
      } else {
        setPermissionState('GRANTED');
      }
    } else {
      setPermissionState('NOT_SUPPORTED');
    }

    return () => {
      stopAudioPreview();
      clearTutorialTimers();
    };
  }, []);

  // Request explicit DeviceMotion Permission on iOS/Web
  const handleRequestPermission = async () => {
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (response === 'granted') {
          setPermissionState('GRANTED');
        } else {
          setPermissionState('DENIED');
        }
      } catch (err) {
        console.error('DeviceMotion permission error:', err);
        setPermissionState('DENIED');
      }
    } else {
      setPermissionState('GRANTED');
    }
  };

  const clearTutorialTimers = () => {
    if (tutorialTimerRef.current !== null) {
      clearInterval(tutorialTimerRef.current);
      tutorialTimerRef.current = null;
    }
    if (tutorialMetronomeTimerRef.current !== null) {
      clearInterval(tutorialMetronomeTimerRef.current);
      tutorialMetronomeTimerRef.current = null;
    }
  };

  // Start 3, 2, 1 Countdown after 10s Tutorial preview completes or skip clicked
  const start321Countdown = () => {
    clearTutorialTimers();

    setGameState('COUNTDOWN');
    setCountdown(3);
    setAccurateBeatCount(0);
    setTotalAttemptCount(0);
    setTimeLeft(60);
    matchedBeatIndicesRef.current.clear();

    audioSynthesizer.playCountdownBeep(false);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev > 1) {
          audioSynthesizer.playCountdownBeep(false);
          return prev - 1;
        } else {
          clearInterval(timer);
          audioSynthesizer.playCountdownBeep(true);
          setGameState('CONDUCTING');
          musicStartTimeRef.current = Date.now();
          return 0;
        }
      });
    }, beatIntervalMs);
  };

  // Start Mission Flow: 10s Beat Tutorial Preview -> 3,2,1 Countdown -> Conducting Mission
  const handleStartGame = async () => {
    stopAudioPreview();
    clearTutorialTimers();

    // Ensure Web Audio API context is fully awake on user gesture
    await audioSynthesizer.ensureAudioContext();

    if (permissionState === 'UNKNOWN') {
      await handleRequestPermission();
    }

    // Prepare audio on user gesture for autoplay policy compliance
    if (currentPiece.audioUrl) {
      const audio = new Audio(currentPiece.audioUrl);
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = 1.0;
      audio.load();
      bgAudioRef.current = audio;
    }

    setGameState('TUTORIAL_PREVIEW');
    setTutorialTimeLeft(10);
    setActiveTutorialBeat(1);

    // Number of beats per bar for this piece
    const totalBeatsInBar = selectedBeat === '4/4' ? 4 : selectedBeat === '3/4' ? 3 : selectedBeat === '2/4' ? 2 : 1;

    // Metronome beat ticker for tutorial
    let beatIdx = 1;
    const metronomeInterval = (60 / currentPiece.bpm) * 1000;
    tutorialMetronomeTimerRef.current = window.setInterval(() => {
      beatIdx = (beatIdx % totalBeatsInBar) + 1;
      setActiveTutorialBeat(beatIdx);
      const isAccent = beatIdx === 1;
      audioSynthesizer.playMetronomeClick(isAccent, isAccent ? 0.38 : 0.22);
    }, metronomeInterval);

    // 10-second countdown timer
    tutorialTimerRef.current = window.setInterval(() => {
      setTutorialTimeLeft(prev => {
        if (prev <= 1) {
          clearTutorialTimers();
          start321Countdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Evaluate Rhythm Swing Timing with Dynamic Beat-based Tolerance
  // 4/4 beat scale: 1/4 (62.5ms), 2/4 (125ms), 3/4 (187.5ms), 4/4 (250ms)
  const processUserSwingGesture = () => {
    const now = Date.now();
    const elapsedMs = now - musicStartTimeRef.current;
    if (elapsedMs < 0) return; // Not started yet

    // Debounce rapid continuous triggers (min 220ms cooldown between swings)
    if (now - lastBeatTimeRef.current < 220) return;
    lastBeatTimeRef.current = now;

    setIsSwinging(true);
    setTimeout(() => setIsSwinging(false), 200);
    audioSynthesizer.playBatonSwingSound();

    setTotalAttemptCount(prev => prev + 1);

    // Calculate nearest beat timing offset from music start
    const closestBeatIndex = Math.round(elapsedMs / beatIntervalMs);
    const expectedBeatMs = closestBeatIndex * beatIntervalMs;
    const diffMs = Math.abs(elapsedMs - expectedBeatMs);
    const diffSec = (diffMs / 1000).toFixed(2);

    // Calculate Beat Position inside 4/4 Bar (1/4, 2/4, 3/4, 4/4)
    // 1st beat = 1/4, 2nd beat = 2/4, 3rd beat = 3/4, 4th beat = 4/4
    const beatInBarNum = (closestBeatIndex % 4) + 1; // 1, 2, 3, 4
    const beatFractionLabel = `${beatInBarNum}/4`;
    
    // Dynamic Tolerance calculation: 4/4 = 0.25s (250ms), scaled proportionally
    // 1/4 = 62.5ms, 2/4 = 125ms, 3/4 = 187.5ms, 4/4 = 250ms
    const baseTolerance44Ms = 250;
    const toleranceMs = baseTolerance44Ms * (beatInBarNum / 4); // 62.5ms ~ 250ms
    const toleranceSec = (toleranceMs / 1000).toFixed(2);

    if (diffMs <= toleranceMs) {
      if (!matchedBeatIndicesRef.current.has(closestBeatIndex)) {
        matchedBeatIndicesRef.current.add(closestBeatIndex);
        setAccurateBeatCount(prev => prev + 1);
        setTimingFeedback({
          text: `PERFECT! [${beatFractionLabel}박] (오차 ±${diffSec}초 / 허용 ±${toleranceSec}초)`,
          isGood: true
        });
      } else {
        // Repeated swing on an already cleared beat -> Penalty / Duplicate
        setTimingFeedback({
          text: `중복 연사! (박자 낭비)`,
          isGood: false
        });
      }
    } else {
      // Off-beat / Random Shake Penalty
      setTimingFeedback({
        text: `MISS! [${beatFractionLabel}박 이탈] (오차 ±${diffSec}초 / 허용 ±${toleranceSec}초)`,
        isGood: false
      });
    }

    setTimeout(() => setTimingFeedback(null), 700);
  };

  // Conducting Loop & Music Playback
  useEffect(() => {
    if (gameState !== 'CONDUCTING') {
      if (gameState !== 'COUNTDOWN' && bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
      return;
    }

    // Play classical MP3 audio when CONDUCTING state actually starts
    if (bgAudioRef.current) {
      bgAudioRef.current.currentTime = 0;
      bgAudioRef.current.volume = 1.0;
      bgAudioRef.current.play().catch(err => {
        console.warn('Conducting audio play notice, retrying with fallback:', err);
        if (currentPiece.audioUrl) {
          playOrchestralAudio(currentPiece.audioUrl, currentPiece.fallbackAudioUrl, 1.0);
        }
      });
    } else if (currentPiece.audioUrl) {
      playOrchestralAudio(currentPiece.audioUrl, currentPiece.fallbackAudioUrl, 1.0);
    }

    // 60-second Timer
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          
          // Evaluate Final 80% Success Criteria
          const currentAccurate = matchedBeatIndicesRef.current.size;
          if (currentAccurate >= requiredBeatsToPass) {
            handleWin();
          } else {
            handleLose();
          }
          return 0;
        }
        return prev - 1;
      }, 1000);
    }, 1000);

    // Play Classical Melody Notes & Rhythm Metronome Clicks synchronized with BPM
    let noteIndex = 0;

    // Is the current piece Flower Waltz?
    const isWaltz = currentPiece.id === 'nutcracker' || currentPiece.title.includes('왈츠') || (currentPiece.audioUrl && currentPiece.audioUrl.includes('waltz'));
    const accentVol = isWaltz ? 0.52 : 0.35;
    const normalVol = isWaltz ? 0.34 : 0.22;

    // Immediately trigger 1st beat metronome click upon CONDUCTING start
    const initialNote = currentPiece.notesSequence[0];
    const initialAccent = initialNote ? initialNote.beatIndex === 1 : true;
    audioSynthesizer.playMetronomeClick(initialAccent, initialAccent ? accentVol : normalVol);

    const musicInterval = setInterval(() => {
      noteIndex++;
      const currentNoteObj = currentPiece.notesSequence[noteIndex % currentPiece.notesSequence.length];
      const isAccent = currentNoteObj.beatIndex === 1;

      // Always play background beat guide metronome click clearly (higher for Flower Waltz)
      audioSynthesizer.playMetronomeClick(isAccent, isAccent ? accentVol : normalVol);
    }, beatIntervalMs);

    return () => {
      clearInterval(timerInterval);
      clearInterval(musicInterval);
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
    };
  }, [gameState, currentPiece, requiredBeatsToPass]);

  // Handle Motion Detection via Mobile Accelerometer (Peak Detection Algorithm to prevent spam shaking)
  useEffect(() => {
    if (gameState !== 'CONDUCTING') return;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.acceleration || e.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const totalAccMagnitude = Math.sqrt(x * x + y * y + z * z);
      setCurrentAccValue(Math.min(100, Math.round(totalAccMagnitude * 3)));

      // Motion Swing Peak Detection Algorithm (High-Intensity Strong Motion Requirement):
      // 1. Arm only when acceleration exceeds STRONG gesture threshold (> 22 m/s²)
      // 2. Trigger gesture when acceleration starts dropping from peak (drops below 16 m/s²)
      if (totalAccMagnitude > 22) {
        isArmedForSwingRef.current = true;
      } else if (isArmedForSwingRef.current && totalAccMagnitude < 16) {
        isArmedForSwingRef.current = false;
        processUserSwingGesture();
      }

      lastAccMagnitudeRef.current = totalAccMagnitude;
      lastAccRef.current = { x, y, z };
    };

    window.addEventListener('devicemotion', handleDeviceMotion, true);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion, true);
  }, [gameState]);

  const handleWin = () => {
    setGameState('SUCCESS');
    audioSynthesizer.playFanfareSuccess();
    setTimeout(() => {
      onMissionSuccess();
    }, 2500);
  };

  const handleLose = () => {
    setGameState('FAIL');
  };

  // Touch / Pointer Baton Movement Fallback (for Desktop or Manual Mouse/Finger Swing)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'CONDUCTING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = Date.now();

    pointerTrailRef.current.push({ x, y, time: now });
    if (pointerTrailRef.current.length > 25) {
      pointerTrailRef.current.shift();
    }

    // Gesture Direction Change Detection (e.g. sharp swing inflection on PC canvas)
    if (pointerTrailRef.current.length >= 5) {
      const trail = pointerTrailRef.current;
      const dx1 = trail[trail.length - 1].x - trail[trail.length - 3].x;
      const dy1 = trail[trail.length - 1].y - trail[trail.length - 3].y;

      const dx2 = trail[trail.length - 3].x - trail[trail.length - 5].x;
      const dy2 = trail[trail.length - 3].y - trail[trail.length - 5].y;

      const dotProduct = dx1 * dx2 + dy1 * dy2;
      const speed = Math.sqrt(dx1 * dx1 + dy1 * dy1);

      // Sharp directional change at sufficient speed
      if (dotProduct < -150 && speed > 10) {
        processUserSwingGesture();
      }
    }

    // Render Baton Trajectory on Canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Staff Lines Background
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        const lineY = (canvas.height / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();
      }

      // Draw Baton Path
      const trail = pointerTrailRef.current;
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const alpha = i / trail.length;
          ctx.strokeStyle = `rgba(243, 229, 171, ${alpha})`;
          ctx.lineWidth = 2 + alpha * 4;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }

        // Draw Tip Sparkle
        const tip = trail[trail.length - 1];
        ctx.fillStyle = '#F3E5AB';
        ctx.shadowColor = '#E5C158';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  };

  const currentMatchPercent = totalExpectedBeatsIn60s > 0
    ? Math.round((accurateBeatCount / totalExpectedBeatsIn60s) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-6 text-stone-100">
      {/* Header Banner */}
      <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-stone-900 border border-amber-600/40 text-center space-y-2 relative overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-amber-400 font-serif text-lg sm:text-2xl">𝄞</span>
          <h2 className="text-base sm:text-xl font-serif font-bold text-amber-200">
            1분 클래식 리듬 지휘 미션
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] sm:text-[11px] font-bold text-amber-300 whitespace-nowrap">
            랜덤 지정: {selectedBeat} 박자
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] sm:text-xs text-amber-300/90 font-medium px-1">
          <span className="text-center leading-snug">🎵 {currentPiece.title} — {currentPiece.composer} ({currentPiece.bpm} BPM)</span>
          {gameState === 'READY' && (
            <button
              onClick={handlePickRandomPiece}
              type="button"
              className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 text-[10px] transition-colors whitespace-nowrap shrink-0"
            >
              곡 변경 🎲
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs pt-1">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-center text-[11px] sm:text-xs">
            🎯 성공 규격: 박자별 비례 오차 (0.06s~0.25s)
          </div>
          <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-center text-[11px] sm:text-xs">
            목표 일치율: <strong className="text-amber-300 font-mono">80% 이상</strong> (최소 {requiredBeatsToPass}/{totalExpectedBeatsIn60s}회)
          </div>
          <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 text-center text-[11px] sm:text-xs">
            현재 달성률: <strong className={`font-mono ${currentMatchPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentMatchPercent}% ({accurateBeatCount}회 성공)</strong>
          </div>
        </div>
      </div>

      {/* Game Stage Area */}
      <div className="bg-stone-950 border-2 border-amber-600/40 rounded-2xl sm:rounded-3xl p-3 sm:p-6 min-h-[380px] sm:min-h-[440px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        {/* Animated Background Musical Notes */}
        <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-around text-4xl text-amber-300 select-none">
          <span className="animate-bounce">♩</span>
          <span className="animate-pulse">♪</span>
          <span className="animate-bounce delay-100">♫</span>
          <span className="animate-pulse delay-200">♬</span>
        </div>

        {/* READY STATE */}
        {gameState === 'READY' && (
          <div className="text-center space-y-4 sm:space-y-6 max-w-md z-10 w-full">
            {/* Phone Shake Graphic */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 animate-ping opacity-30"></div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-900/60 to-stone-900 border-2 border-amber-500/60 flex flex-col items-center justify-center text-amber-300 shadow-xl">
                <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce text-amber-400" />
                <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 text-amber-200">지휘 모션 감지</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold font-serif text-amber-200">
                박자 위치별 오차(1/4~4/4) 및 강한 지휘 모션 판정
              </h3>
              <div className="text-xs text-stone-300 leading-relaxed bg-stone-900/90 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-800 space-y-2 text-left">
                <p>• <strong>박자별 오차 비례 적용:</strong> 4/4 박자 기준(0.25초) 비율에 맞춰 <strong>1/4박(0.06초)</strong>, <strong>2/4박(0.12초)</strong>, <strong>3/4박(0.18초)</strong>, <strong>4/4박(0.25초)</strong>로 정밀하게 다단계 계산됩니다.</p>
                <p>• <strong>강한 모션 필수:</strong> 살살 흔들면 감지되지 않으며, 스마트폰을 <strong>단호하고 크게 쳐내듯 지휘하는 강한 가속도 모션</strong>만 인식됩니다.</p>
                <p>• <strong>성공 조건:</strong> 1분간 전체 박자의 <strong>80% 이상</strong>(최소 {requiredBeatsToPass}회) 성공 시 미션 통과!</p>
              </div>
            </div>

            {/* Audio Preview & Sensor Permission */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 relative z-20">
              <button
                type="button"
                onClick={toggleAudioPreview}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isAudioPreviewPlaying
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/30'
                    : 'bg-stone-900 text-amber-300 border-amber-600/50 hover:bg-stone-800'
                }`}
              >
                <span>{isAudioPreviewPlaying ? '🔊 오케스트라 음원 재생 중 (클릭시 정지)' : '🎧 실제 음원 미리듣기 테스트'}</span>
              </button>
            </div>

            {/* Device Motion Permission Card for iOS/Mobile */}
            {permissionState === 'UNKNOWN' && (
              <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-2xl text-xs space-y-2 text-amber-200">
                <div className="flex items-center justify-center gap-1.5 font-semibold">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>아이폰 / 모바일 가속도 센서 권한이 필요합니다</span>
                </div>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="w-full py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
                >
                  지휘 동작 센서 권한 허용하기
                </button>
              </div>
            )}

            {permissionState === 'DENIED' && (
              <div className="p-3 bg-rose-950/40 border border-rose-600/40 rounded-2xl text-xs text-rose-300">
                센서 권한이 거부되었습니다. 화면 터치 및 마우스 클릭 지휘 방식으로 대체할 수 있습니다.
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full">
              <button
                onClick={handleStartGame}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-sm rounded-xl sm:rounded-2xl shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>지휘 미션 시작하기 (튜토리얼 10초 ➔ 3,2,1)</span>
              </button>
              <button
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-stone-900 text-stone-400 hover:text-amber-200 text-xs font-semibold rounded-xl sm:rounded-2xl border border-stone-800"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* TUTORIAL PREVIEW STATE (10s BEFORE 3, 2, 1 COUNTDOWN) */}
        {gameState === 'TUTORIAL_PREVIEW' && (
          <div className="text-center space-y-4 max-w-md z-10 w-full animate-fade-in p-1">
            {/* Top Status Header */}
            <div className="flex items-center justify-between gap-2 bg-amber-950/70 border border-amber-500/50 rounded-xl px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2 text-left">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-200">{selectedBeat} 지휘 동작 가이드 (10초)</div>
                  <div className="text-[10px] text-stone-300 font-mono truncate max-w-[170px] sm:max-w-[220px]">곡명: {currentPiece.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-extrabold text-amber-300 bg-amber-900/90 px-2.5 py-1 rounded-lg border border-amber-500/50">
                  {tutorialTimeLeft}초 후 카운트다운
                </span>
              </div>
            </div>

            {/* Pattern Visualizer Diagram */}
            {(() => {
              const guide = TUTORIAL_SVG_GUIDES[selectedBeat] || TUTORIAL_SVG_GUIDES['4/4'];
              return (
                <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                    <span>{guide.title}</span>
                    <span className="font-mono text-[10px] text-amber-400/90 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">{guide.pattern}</span>
                  </div>

                  {/* SVG Diagram Guide */}
                  <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl border border-stone-800/80 overflow-hidden flex items-center justify-center">
                    <svg viewBox="0 0 200 150" className="w-full h-full p-2">
                      <path d={guide.svgPath} fill="none" stroke="#525252" strokeWidth="3" strokeDasharray="4 4" />
                      {guide.points.map(pt => {
                        const isActive = activeTutorialBeat === pt.beat;
                        return (
                          <g key={pt.beat}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isActive ? 11 : 6}
                              className={isActive ? 'fill-amber-400 stroke-white stroke-2 animate-pulse' : 'fill-stone-800 stroke-amber-700/60 stroke-1'}
                            />
                            <text
                              x={pt.x}
                              y={pt.y + 20}
                              textAnchor="middle"
                              fill={isActive ? '#fef08a' : '#a8a29e'}
                              fontSize="9"
                              fontWeight={isActive ? 'bold' : 'normal'}
                            >
                              {pt.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="absolute top-2 left-2 bg-stone-900/90 border border-amber-500/30 rounded-lg px-2 py-0.5 text-[10px] font-mono text-amber-300">
                      박자: <strong className="text-white text-xs">{activeTutorialBeat}</strong> / {guide.points.length}박
                    </div>
                  </div>

                  {/* Step Tips */}
                  <div className="grid grid-cols-2 gap-1.5 text-left">
                    {guide.steps.map(step => {
                      const isActive = activeTutorialBeat === step.beat;
                      return (
                        <div
                          key={step.beat}
                          className={`p-2 rounded-lg border text-[11px] ${
                            isActive
                              ? 'bg-amber-500/20 border-amber-500 text-amber-100 font-semibold'
                              : 'bg-stone-950 border-stone-800 text-stone-400'
                          }`}
                        >
                          <div className="text-amber-300 font-bold text-[10px]">{step.name}</div>
                          <div className="text-[10px] text-stone-300 truncate">{step.tip}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Skip Button to start 3, 2, 1 Countdown immediately */}
            <button
              onClick={start321Countdown}
              type="button"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>스킵하고 바로 카운트다운 시작 (3, 2, 1) ➔</span>
            </button>
          </div>
        )}

        {/* COUNTDOWN STATE (3, 2, 1) */}
        {gameState === 'COUNTDOWN' && (
          <div className="text-center space-y-4 z-10 animate-fade-in">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              ORCHESTRA SWING COUNTDOWN ({currentPiece.bpm} BPM)
            </span>
            <div className="text-8xl font-serif font-extrabold text-amber-300 drop-shadow-[0_0_25px_rgba(243,229,171,0.6)] animate-bounce">
              {countdown}
            </div>
            <p className="text-xs text-stone-300 font-serif">
              곡 템포(<strong>{currentPiece.bpm} BPM</strong>) 박자에 맞춰 카운트다운 중! 3, 2, 1에 시작합니다.
            </p>
          </div>
        )}

        {/* CONDUCTING STATE */}
        {gameState === 'CONDUCTING' && (
          <div className="w-full h-full flex flex-col items-center justify-between z-10 space-y-3">
            {/* Top Bar: Time & Beat Counter */}
            <div className="w-full flex items-center justify-between px-2 text-xs font-mono">
              <div className="flex items-center gap-2 bg-stone-900/90 px-3 py-1.5 rounded-full border border-amber-600/40">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>남은 시간: <strong className="text-amber-300">{timeLeft}초</strong></span>
              </div>

              <div className="flex items-center gap-2 bg-stone-900/90 px-3 py-1.5 rounded-full border border-amber-600/40">
                <span>박자 일치: <strong className={`${currentMatchPercent >= 80 ? 'text-emerald-400' : 'text-amber-300'} font-bold`}>{accurateBeatCount} / {requiredBeatsToPass}회 ({currentMatchPercent}%)</strong></span>
              </div>
            </div>

            {/* Interactive Phone Shake Stage */}
            <div className="relative w-full h-60 rounded-2xl border border-amber-500/30 bg-stone-900/80 overflow-hidden flex flex-col items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                width={500}
                height={220}
                onPointerMove={handlePointerMove}
                className="absolute inset-0 w-full h-full touch-none cursor-crosshair opacity-80"
              />

              {/* Central Phone Shake Visualizer */}
              <div className="z-10 flex flex-col items-center justify-center text-center space-y-2 pointer-events-none">
                <div
                  className={`w-16 h-16 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                    isSwinging
                      ? 'bg-amber-400 border-amber-200 text-stone-950 scale-125 shadow-[0_0_35px_rgba(251,191,36,0.9)]'
                      : 'bg-amber-950/60 border-amber-500/50 text-amber-300 scale-100 shadow-xl'
                  }`}
                >
                  <Hand className={`w-7 h-7 ${isSwinging ? 'animate-bounce' : ''}`} />
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-bold font-serif text-amber-200">
                    리듬에 맞춰 스마트폰을 힘차게 흔드세요! 📱
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    🎷 실제 오케스트라 명곡 음원 & 메트로놈 정박에 맞춰 강하게 지휘하세요
                  </p>
                </div>

                {/* Motion Intensity Gauge */}
                <div className="w-48 bg-stone-950/80 rounded-full h-2 border border-stone-800 p-0.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-75"
                    style={{ width: `${Math.min(100, currentAccValue)}%` }}
                  ></div>
                </div>
              </div>

              {/* Timing Feedback Popup */}
              {timingFeedback && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className={`px-5 py-2.5 font-bold font-serif text-lg rounded-2xl shadow-2xl animate-bounce border-2 ${
                    timingFeedback.isGood
                      ? 'bg-emerald-400 text-stone-950 border-emerald-100 shadow-emerald-500/50'
                      : 'bg-rose-500 text-stone-950 border-rose-200 shadow-rose-500/50'
                  }`}>
                    {timingFeedback.text}
                  </div>
                </div>
              )}
            </div>

            {/* Laptop / PC rhythm trigger button */}
            <div className="w-full flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={processUserSwingGesture}
                className="w-full py-3 bg-gradient-to-r from-amber-600/90 to-amber-500/90 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-2xl border border-amber-300/40 shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Activity className="w-4 h-4" />
                <span>[노트북/PC/스마트폰] 리듬에 맞춰 클릭/흔들기 ♩</span>
              </button>
              <p className="text-[10px] text-stone-400 text-center">
                * 모바일에서는 스마트폰을 직접 흔들 수 있고, 노트북에서는 위 버튼 클릭 및 드래그로 미션을 진행할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {gameState === 'SUCCESS' && (
          <div className="text-center space-y-4 z-10 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-2xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold font-serif text-emerald-300">
              지휘 미션 최종 통과! 🎉
            </h3>
            <p className="text-xs text-stone-300">
              달성률 <strong className="text-emerald-400 font-mono text-sm">{currentMatchPercent}%</strong> (최소 80% 조건 통과!)<br />
              훌륭한 박자 감각이었습니다. 잠시 후 최종 자각 질문 화면으로 이동합니다.
            </p>
          </div>
        )}

        {/* FAIL STATE */}
        {gameState === 'FAIL' && (
          <div className="text-center space-y-4 z-10 animate-fade-in max-w-sm">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 shadow-2xl">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold font-serif text-rose-300">
              지휘 미션 실패 (달성률 {currentMatchPercent}%)
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              박자 일치율이 80% 미만으로 연장 기준을 충족하지 못했습니다.<br />
              원래의 집중 약속을 계속 이어나가며 도파민 중독을 줄여보세요!
            </p>
            <button
              onClick={onMissionFail}
              className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold text-xs rounded-xl border border-amber-600/40"
            >
              집중 화면으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
