import React, { useState, useEffect, useRef } from 'react';
import { BeatType, ClassicalPiece, SessionData } from '../types';
import { CLASSICAL_PIECES } from '../data/classicalPieces';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Music, Play, CheckCircle2, AlertCircle, Activity, Smartphone, Hand, Shuffle, Headphones, Pause, SkipForward, X, Timer, Target, VolumeX } from 'lucide-react';

// 미션 통과 기준(정확 타점 비율 %). 화면 안내 문구와 판정 로직이 이 값 하나를 공유한다.
const PASS_THRESHOLD_PERCENT = 70;

// 미션 시작 전 지휘 동작 튜토리얼을 유지하는 시간(초).
const TUTORIAL_PREVIEW_SECONDS = 15;

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
    title: '3/4 박자 지휘 패턴 (Down - Out - Up)',
    pattern: '1(Down) ➔ 2(Out) ➔ 3(Up) [삼각형]',
    svgPath: 'M 100 20 L 100 120 Q 130 120 160 100 L 100 20',
    points: [
      { x: 100, y: 120, beat: 1, label: '1 (Down)' },
      { x: 160, y: 100, beat: 2, label: '2 (Out)' },
      { x: 100, y: 20, beat: 3, label: '3 (Up)' },
    ],
    steps: [
      { beat: 1, name: '1박 (강)', tip: '깊고 단호한 강박 수직 하강' },
      { beat: 2, name: '2박 (약)', tip: '오른쪽 바깥으로 곡선 스위프' },
      { beat: 3, name: '3박 (약)', tip: '위로 띄우며 다음 마디 준비' },
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
    const currentIndex = CLASSICAL_PIECES.findIndex(p => p.id === currentPiece.id);
    const nextIndex = (currentIndex + 1) % CLASSICAL_PIECES.length;
    setCurrentPiece(CLASSICAL_PIECES[nextIndex]);
  };

  const [gameState, setGameState] = useState<'READY' | 'TUTORIAL_PREVIEW' | 'COUNTDOWN' | 'CONDUCTING' | 'SUCCESS' | 'FAIL'>('READY');
  const [tutorialTimeLeft, setTutorialTimeLeft] = useState<number>(TUTORIAL_PREVIEW_SECONDS);
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [activeTutorialBeat, setActiveTutorialBeat] = useState<number>(1);
  // 튜토리얼은 한 루프(한 마디)마다 성공 예시 ↔ 실패 예시를 번갈아 보여준다.
  const [tutorialDemoMode, setTutorialDemoMode] = useState<'SUCCESS' | 'FAIL'>('SUCCESS');
  const tutorialTimerRef = useRef<number | null>(null);
  const tutorialMetronomeTimerRef = useRef<number | null>(null);

  // Rhythm Beat Tracking States (±0.25s Rule & 70% Threshold)
  const [accurateBeatCount, setAccurateBeatCount] = useState<number>(0);
  const [totalAttemptCount, setTotalAttemptCount] = useState<number>(0);
  const [guideBeat, setGuideBeat] = useState<number>(1);
  const [isGuidePulsing, setIsGuidePulsing] = useState<boolean>(false);
  // 마지막 판정. 토스트가 문장을 맡고, 무대는 이 값으로 색과 모션을 반응한다.
  // seq는 같은 판정이 연속으로 나와도 CSS 애니메이션을 다시 재생시키기 위한 키다.
  const [lastJudgement, setLastJudgement] = useState<'PERFECT' | 'MISS' | 'DUPLICATE' | null>(null);
  const [judgementSeq, setJudgementSeq] = useState<number>(0);

  // Device Motion & Permission States
  const [permissionState, setPermissionState] = useState<'UNKNOWN' | 'GRANTED' | 'DENIED' | 'NOT_SUPPORTED'>('UNKNOWN');
  const [currentAccValue, setCurrentAccValue] = useState<number>(0);

  const [isAudioPreviewPlaying, setIsAudioPreviewPlaying] = useState<boolean>(false);
  // 브라우저 정책으로 오디오가 잠긴 상태. 튜토리얼에서 박자 소리가 안 들릴 때 알린다.
  const [isAudioBlocked, setIsAudioBlocked] = useState<boolean>(false);
  // 앱 내 음소거 설정. 이 경우 잠금 해제로는 소리가 나지 않아 안내를 다르게 해야 한다.
  const [isAppMuted, setIsAppMuted] = useState<boolean>(false);

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
  const guidePulseTimerRef = useRef<number | null>(null);
  const judgementFlashTimerRef = useRef<number | null>(null);

  // 판정 반응은 다음 박이 오기 전에 사라져야 박자 추적이 끊기지 않는다.
  // 그래서 유지 시간을 한 박(최소 약 440ms)보다 훨씬 짧게 잡는다.
  const flashJudgement = (kind: 'PERFECT' | 'MISS' | 'DUPLICATE') => {
    setLastJudgement(kind);
    setJudgementSeq(prev => prev + 1);
    if (judgementFlashTimerRef.current !== null) {
      window.clearTimeout(judgementFlashTimerRef.current);
    }
    judgementFlashTimerRef.current = window.setTimeout(() => {
      setLastJudgement(null);
      judgementFlashTimerRef.current = null;
    }, 200);
  };

  const triggerVisualBeat = (beat: number) => {
    setGuideBeat(beat);
    setIsGuidePulsing(true);

    if (guidePulseTimerRef.current !== null) {
      window.clearTimeout(guidePulseTimerRef.current);
    }
    guidePulseTimerRef.current = window.setTimeout(() => {
      setIsGuidePulsing(false);
      guidePulseTimerRef.current = null;
    }, 200);
  };

  // 오디오가 잠긴 기기에서 사용자가 직접 해제할 수 있는 경로.
  // 이 호출 자체가 사용자 제스처 안에 있으므로 iOS에서도 잠금이 풀린다.
  const handleUnlockAudio = async () => {
    const ready = await audioSynthesizer.ensureAudioContext();
    setIsAudioBlocked(!ready);
    if (ready) {
      // 실제로 소리가 나는지 사용자가 바로 확인할 수 있게 한 번 울린다.
      audioSynthesizer.playMetronomeClick(true, 0.38);
    }
  };

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
  const requiredBeatsToPass = Math.ceil(totalExpectedBeatsIn60s * (PASS_THRESHOLD_PERCENT / 100));

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
      if (guidePulseTimerRef.current !== null) {
        window.clearTimeout(guidePulseTimerRef.current);
      }
      if (judgementFlashTimerRef.current !== null) {
        window.clearTimeout(judgementFlashTimerRef.current);
      }
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
    setLastJudgement(null);
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

    // 오디오 잠금 해제는 사용자 제스처 직후 가장 먼저 끝낸다.
    // 권한 요청(await) 뒤로 밀리면 제스처 컨텍스트가 끊겨 iOS에서 잠금이 풀리지 않는다.
    const audioReady = await audioSynthesizer.ensureAudioContext();
    setIsAudioBlocked(!audioReady);
    setIsAppMuted(audioSynthesizer.getMuted());

    // 자동재생 정책 대응: 사용자 제스처 안에서 즉시 mp3를 '무음'으로 재생 시작해 오디오 잠금을 해제한다.
    // (튜토리얼/카운트다운 동안 무음으로 계속 재생되다가, CONDUCTING에서 음소거만 해제하면 확실히 소리가 난다.)
    if (currentPiece.audioUrl) {
      const audio = new Audio(currentPiece.audioUrl);
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = 1.0;
      audio.muted = true;
      bgAudioRef.current = audio;
      audio.play().catch(() => { /* 무음 재생 실패 시 CONDUCTING 진입 때 재시도 */ });
    }

    if (permissionState === 'UNKNOWN') {
      await handleRequestPermission();
    }

    setGameState('TUTORIAL_PREVIEW');
    setTutorialTimeLeft(TUTORIAL_PREVIEW_SECONDS);
    setActiveTutorialBeat(1);
    setTutorialDemoMode('SUCCESS');

    // Number of beats per bar for this piece
    const totalBeatsInBar = selectedBeat === '4/4' ? 4 : selectedBeat === '3/4' ? 3 : selectedBeat === '2/4' ? 2 : 1;

    // Metronome beat ticker for tutorial
    let beatIdx = 1;
    const metronomeInterval = (60 / currentPiece.bpm) * 1000;
    tutorialMetronomeTimerRef.current = window.setInterval(() => {
      beatIdx = (beatIdx % totalBeatsInBar) + 1;
      // 한 마디(루프)가 끝나 1박으로 돌아올 때마다 성공/실패 예시를 전환한다.
      if (beatIdx === 1) {
        setTutorialDemoMode(prev => (prev === 'SUCCESS' ? 'FAIL' : 'SUCCESS'));
      }
      setActiveTutorialBeat(beatIdx);
      const isAccent = beatIdx === 1;
      audioSynthesizer.playMetronomeClick(isAccent, isAccent ? 0.38 : 0.22);
      // 잠금이 뒤늦게 풀리는 기기가 있어, 튜토리얼 중 상태를 계속 반영한다.
      setIsAudioBlocked(!audioSynthesizer.isAudioReady());
      setIsAppMuted(audioSynthesizer.getMuted());
    }, metronomeInterval);

    // 튜토리얼 유지 시간 카운트다운
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

    audioSynthesizer.playBatonSwingSound();

    setTotalAttemptCount(prev => prev + 1);

    // Calculate nearest beat timing offset from music start
    const closestBeatIndex = Math.round(elapsedMs / beatIntervalMs);
    const expectedBeatMs = closestBeatIndex * beatIntervalMs;
    const diffMs = Math.abs(elapsedMs - expectedBeatMs);

    // 마디 안 박자 위치. 곡의 박자표(3/4, 2/4 등)를 그대로 따른다.
    const beatInBarNum = (closestBeatIndex % beatsPerBar) + 1;

    // 허용 오차: 강박(1박)은 정확도를 요구하고 뒤로 갈수록 넉넉해진다.
    // 마디 길이에 비례해 나누면 2/4 곡의 1박이 4/4 곡보다 더 좁아지는 역전이 생겨,
    // 박자표와 무관하게 같은 폭(150ms ~ 250ms)을 쓰도록 고정한다.
    const minToleranceMs = 150;
    const maxToleranceMs = 250;
    const beatSpread = beatsPerBar > 1 ? (beatInBarNum - 1) / (beatsPerBar - 1) : 1;
    const toleranceMs = minToleranceMs + (maxToleranceMs - minToleranceMs) * beatSpread;

    if (diffMs <= toleranceMs) {
      if (!matchedBeatIndicesRef.current.has(closestBeatIndex)) {
        matchedBeatIndicesRef.current.add(closestBeatIndex);
        setAccurateBeatCount(prev => prev + 1);
        flashJudgement('PERFECT');
      } else {
        // Repeated swing on an already cleared beat -> Penalty / Duplicate
        flashJudgement('DUPLICATE');
      }
    } else {
      // Off-beat / Random Shake Penalty
      flashJudgement('MISS');
    }
  };

  // Conducting Loop & Music Playback
  useEffect(() => {
    if (gameState !== 'CONDUCTING') {
      // 튜토리얼/카운트다운 동안엔 미리 재생 중인(무음) 오디오를 보존한다. (그 외 상태에서만 정리)
      if (gameState !== 'COUNTDOWN' && gameState !== 'TUTORIAL_PREVIEW' && bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
      return;
    }

    // Play classical MP3 audio when CONDUCTING state actually starts
    if (bgAudioRef.current) {
      // 이미 무음으로 재생 중 → 음소거만 해제하고 처음부터 들려준다.
      bgAudioRef.current.currentTime = 0;
      bgAudioRef.current.muted = false;
      bgAudioRef.current.volume = 1.0;
      const playPromise = bgAudioRef.current.play();
      if (playPromise) {
        playPromise.catch(err => {
          console.warn('Conducting audio play notice, retrying with fallback:', err);
          if (currentPiece.audioUrl) {
            playOrchestralAudio(currentPiece.audioUrl, currentPiece.fallbackAudioUrl, 1.0);
          }
        });
      }
    } else if (currentPiece.audioUrl) {
      playOrchestralAudio(currentPiece.audioUrl, currentPiece.fallbackAudioUrl, 1.0);
    }

    // 60-second Timer
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);

          // Evaluate Final 70% Success Criteria
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
    triggerVisualBeat(initialNote?.beatIndex ?? 1);
    audioSynthesizer.playMetronomeClick(initialAccent, initialAccent ? accentVol : normalVol);

    const musicInterval = setInterval(() => {
      noteIndex++;
      const currentNoteObj = currentPiece.notesSequence[noteIndex % currentPiece.notesSequence.length];
      const isAccent = currentNoteObj.beatIndex === 1;

      // Keep the visual hand guide and metronome on the same beat.
      // The visual cue remains usable when audio is muted or unavailable.
      triggerVisualBeat(currentNoteObj.beatIndex);
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

  const beatsPerBar = selectedBeat === '4/4' ? 4 : selectedBeat === '3/4' ? 3 : selectedBeat === '2/4' ? 2 : 1;

  // 판정 색은 마커 위에 덧씌우지 않는다. 마커는 항상 곡의 현재 박만 보여주고,
  // 판정은 마커를 감싸는 링과 화면 전체 플래시로 스쳐 지나가게 해서 박자 추적을 가리지 않는다.
  const judgementAccent =
    lastJudgement === 'PERFECT'
      ? 'border-emerald-300'
      : lastJudgement === 'MISS'
        ? 'border-rose-400'
        : lastJudgement === 'DUPLICATE'
          ? 'border-amber-400'
          : null;

  // 화면 전체 판정 플래시. 진한 색으로 한 번 깜빡이고 즉시 사라진다.
  const judgementFlashTone =
    lastJudgement === 'PERFECT'
      ? 'bg-emerald-500/80'
      : lastJudgement === 'MISS'
        ? 'bg-rose-600/80'
        : null;

  return (
    <div className="min-h-full w-full max-w-2xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3 text-black relative select-none bg-slate-100">

      {/* 판정 순간 화면 전체가 한 번 깜빡인다. 다음 박이 오기 전에 완전히 사라진다. */}
      {judgementFlashTone && (
        <div
          key={`flash-${judgementSeq}`}
          aria-hidden="true"
          className={`cm-stage-flash pointer-events-none fixed inset-0 z-50 ${judgementFlashTone}`}
        />
      )}

      {/* 준비 화면은 곡 선택을 강조하고, 진행 중에는 무대 확보를 위해 압축한다. */}
      <div
        className={`shrink-0 rounded-2xl bg-white border border-slate-200 shadow-xl relative overflow-hidden ${gameState === 'READY' ? 'p-4 sm:p-5 text-center space-y-3' : 'px-3.5 py-2.5'
          }`}
      >
        {gameState === 'READY' ? (
          <>
            <div className="flex flex-col items-center justify-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-[#FE9A00] tracking-wide">
                클래식 1분 지휘 미션
              </h2>
              <span className="px-3.5 py-1 rounded-full bg-[#FE9A00] text-black text-xs sm:text-sm font-bold whitespace-nowrap inline-block">
                랜덤 지정: {selectedBeat} 박자
              </span>
            </div>
            <div className="px-1 space-y-2.5 w-full">
              <div className="flex flex-col items-center justify-center">
                <span className="block w-full line-clamp-2 text-center text-sm sm:text-lg font-bold text-black leading-snug break-keep">
                  {currentPiece.title}
                </span>
                <span className="block w-full truncate text-center text-xs sm:text-sm text-black/60 font-medium leading-tight mt-1">
                  {currentPiece.composer} · {currentPiece.bpm} BPM
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2.5">
                <button
                  onClick={handlePickRandomPiece}
                  type="button"
                  title="다른 곡으로 바꾸기"
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl border border-black text-xs sm:text-sm font-bold transition-colors active:translate-y-px flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                >
                  <Shuffle className="w-4 h-4 text-[#FE9A00]" aria-hidden="true" />
                  <span>곡 변경</span>
                </button>
                <button
                  onClick={toggleAudioPreview}
                  type="button"
                  title={isAudioPreviewPlaying ? '미리듣기 정지' : '미리듣기 재생'}
                  className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors active:translate-y-px flex items-center gap-1.5 whitespace-nowrap shadow-sm ${isAudioPreviewPlaying
                    ? 'bg-black text-white border-black ring-2 ring-[#FE9A00]'
                    : 'bg-black hover:bg-neutral-800 text-white border-black'
                    }`}
                >
                  {isAudioPreviewPlaying ? (
                    <Pause className="w-4 h-4 text-[#FE9A00]" aria-hidden="true" />
                  ) : (
                    <Headphones className="w-4 h-4 text-[#FE9A00]" aria-hidden="true" />
                  )}
                  <span>{isAudioPreviewPlaying ? '정지' : '미리듣기'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold text-black leading-tight">{currentPiece.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-black/60 leading-tight">{currentPiece.composer}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-xs font-bold tabular-nums">
              <span className="rounded-md bg-black px-2.5 py-1 text-white border border-black">{selectedBeat}</span>
              <span className="text-black/80">{currentPiece.bpm} BPM</span>
            </div>
          </div>
        )}
      </div>

      {/* Game Stage Area */}
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
        {/* Animated Background Musical Notes */}
        <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-around text-4xl text-black select-none">
          <span className="animate-bounce">♩</span>
          <span className="animate-pulse">♪</span>
          <span className="animate-bounce delay-100">♫</span>
          <span className="animate-pulse delay-200">♬</span>
        </div>

        {/* READY STATE */}
        {gameState === 'READY' && (
          <div className="text-center space-y-3.5 max-w-md z-10 w-full">
            {/* 조작 방식 안내 아이콘 */}
            <div className="w-12 h-12 mx-auto rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
              <Smartphone className="w-6 h-6 text-[#FE9A00]" aria-hidden="true" />
            </div>

            {/* 통과 조건 요약 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-black">
                <Target className="w-4 h-4 text-[#FE9A00] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="leading-snug break-keep">
                  <strong className="text-black font-bold">통과 기준: </strong>
                  <span className="text-black/80">60초 동안 {requiredBeatsToPass}회 이상 정확히 ({PASS_THRESHOLD_PERCENT}%)</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-black">
                <Timer className="w-4 h-4 text-[#FE9A00] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="leading-snug break-keep">
                  <strong className="text-black font-bold">허용 오차: </strong>
                  <span className="text-black/80">0.25초 (강박에서 0.15초까지 좁아짐)</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-black pt-0.5 border-t border-slate-200">
                <Activity className="w-4 h-4 text-[#FE9A00] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="leading-snug break-keep">
                  <strong className="text-black font-bold">강한 모션 필수: </strong>
                  <span className="text-black/80">살살 흔들면 인식되지 않습니다. 지휘봉을 내리치듯 크고 단호하게 움직여 주세요.</span>
                </div>
              </div>
            </div>

            {/* Device Motion Permission Card for iOS/Mobile */}
            {permissionState === 'UNKNOWN' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-black">
                <div className="flex items-center justify-center gap-1.5 font-semibold">
                  <Activity className="w-4 h-4 text-[#FE9A00]" />
                  <span>모바일 동작 센서 권한이 필요합니다</span>
                </div>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="w-full py-2 bg-black text-white font-bold rounded-xl text-xs hover:bg-neutral-800 active:translate-y-px transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-[#FE9A00]" />
                  <span>센서 권한 허용</span>
                </button>
              </div>
            )}

            {permissionState === 'DENIED' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black/80 break-keep">
                센서 권한이 거부되었습니다. 지휘 미션은 스마트폰을 흔드는 동작으로만 진행되니, 설정에서 동작 센서 권한을 허용해주세요.
              </div>
            )}

            <div className="pt-1 grid grid-cols-1 sm:grid-cols-[1fr_auto] items-stretch gap-2 w-full">
              <button
                onClick={handleStartGame}
                className="px-7 py-3.5 bg-black hover:bg-neutral-800 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors active:translate-y-px"
              >
                <Play className="w-4 h-4 fill-[#FE9A00] text-[#FE9A00]" aria-hidden="true" />
                <span>튜토리얼 후 시작</span>
              </button>
              <button
                onClick={onCancel}
                className="px-5 py-2.5 bg-slate-100 text-black hover:bg-slate-200 text-xs font-semibold rounded-xl border border-slate-200 transition-colors active:translate-y-px shadow-sm"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* TUTORIAL PREVIEW STATE (10s BEFORE 3, 2, 1 COUNTDOWN) */}
        {gameState === 'TUTORIAL_PREVIEW' && (
          <div className="text-center space-y-4 max-w-md z-10 w-full animate-fade-in p-1">
            {/* Top Status Header (검은색 배경) */}
            <div className="flex items-center justify-between gap-2 bg-black border border-black rounded-xl px-3.5 py-2.5 shadow-md">
              <div className="flex items-center gap-2 text-left">
                <Music className="w-4 h-4 text-[#FE9A00] shrink-0" aria-hidden="true" />
                <div className="text-xs font-bold text-white">{selectedBeat} 지휘 동작 가이드</div>
              </div>
            </div>

            {/* 소리가 안 들리는 두 가지 원인(앱 음소거, 브라우저 오디오 잠금)을 구분해 알린다. */}
            {isAppMuted ? (
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
                <VolumeX className="w-4 h-4 shrink-0 text-[#FE9A00]" aria-hidden="true" />
                <span className="min-w-0 text-[11px] leading-snug text-black break-keep">
                  앱 음소거가 켜져 있어 박자 소리가 나지 않습니다. 상단 스피커 버튼으로 해제해 주세요.
                </span>
              </div>
            ) : isAudioBlocked ? (
              <button
                type="button"
                onClick={handleUnlockAudio}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 active:translate-y-px"
              >
                <VolumeX className="w-4 h-4 shrink-0 text-[#FE9A00]" aria-hidden="true" />
                <span className="min-w-0 text-[11px] leading-snug text-black break-keep">
                  박자 소리가 차단되어 있습니다. 여기를 눌러 소리를 켜고, 기기의 무음 스위치도 확인해 주세요.
                </span>
              </button>
            ) : null}

            {/* Pattern Visualizer Diagram */}
            {(() => {
              const guide = TUTORIAL_SVG_GUIDES[selectedBeat] || TUTORIAL_SVG_GUIDES['4/4'];
              const isSuccessDemo = tutorialDemoMode === 'SUCCESS';
              const activePoint = guide.points.find(pt => pt.beat === activeTutorialBeat) ?? guide.points[0];
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-left shadow-sm">
                  <div className="flex flex-col gap-1.5 text-xs font-semibold text-black sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <span className="font-bold break-keep">{guide.title.replace(/\s*\(.*\)\s*$/, '')}</span>
                    <span className="font-mono text-[10px] text-black/70 border border-slate-200 bg-white px-2 py-0.5 rounded self-start sm:self-auto sm:shrink-0">{guide.pattern}</span>
                  </div>

                  {/* SVG Diagram Guide */}
                  <div
                    className={`relative w-full aspect-[16/9] rounded-xl border overflow-hidden flex items-center justify-center ${isSuccessDemo
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-rose-50 border-rose-300'
                      }`}
                  >
                    <svg viewBox="0 0 200 150" className="w-full h-full p-2">
                      <path d={guide.svgPath} fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="4 4" />
                      {guide.points.map(pt => {
                        const isActive = activeTutorialBeat === pt.beat;
                        const activeFill = isSuccessDemo
                          ? 'fill-emerald-500 stroke-emerald-200 stroke-2'
                          : 'fill-rose-500 stroke-rose-300 stroke-2';
                        return (
                          <g key={pt.beat}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isActive ? 11 : 6}
                              className={isActive ? activeFill : 'fill-slate-300 stroke-slate-400 stroke-1'}
                            />
                            <text
                              x={pt.x}
                              y={pt.y + 20}
                              textAnchor="middle"
                              fill={isActive ? (isSuccessDemo ? '#059669' : '#e11d48') : '#64748b'}
                              fontSize="9"
                              fontWeight={isActive ? 'bold' : 'normal'}
                              className="font-mono"
                            >
                              {pt.label}
                            </text>
                          </g>
                        );
                      })}

                      {isSuccessDemo ? (
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r={17}
                          fill="none"
                          stroke="#059669"
                          strokeWidth="2"
                          opacity="0.85"
                        />
                      ) : (
                        <g>
                          <circle
                            cx={activePoint.x + 20}
                            cy={activePoint.y + 14}
                            r={8}
                            fill="none"
                            stroke="#e11d48"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                          />
                          <line
                            x1={activePoint.x}
                            y1={activePoint.y}
                            x2={activePoint.x + 20}
                            y2={activePoint.y + 14}
                            stroke="#e11d48"
                            strokeWidth="1.5"
                            strokeDasharray="2 3"
                            opacity="0.8"
                          />
                        </g>
                      )}
                    </svg>

                    <div className="absolute top-2 left-2 bg-white/90 border border-slate-200 px-2 py-1 rounded text-[10px] font-mono text-black tabular-nums shadow-xs">
                      <span className={`font-bold ${isSuccessDemo ? 'text-emerald-600' : 'text-rose-600'}`}>{activeTutorialBeat}</span> / {guide.points.length}박
                    </div>

                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold tracking-wide border ${isSuccessDemo
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-rose-100 border-rose-300 text-rose-700'
                        }`}
                    >
                      {isSuccessDemo ? '성공 예시 (정확한 타점)' : '실패 예시 (벗어난 궤적)'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {guide.steps.map(s => {
                      const isActive = activeTutorialBeat === s.beat;
                      return (
                        <div
                          key={s.beat}
                          className={`p-2 rounded-xl border text-[11px] transition-colors ${isActive
                            ? 'bg-black text-white border-black font-bold shadow-sm'
                            : 'bg-white text-black/80 border-slate-200'
                            }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className={isActive ? 'text-white' : 'text-black'}>{s.name}</span>
                          </div>
                          <div className={`text-[10px] mt-0.5 break-keep ${isActive ? 'text-neutral-300' : 'text-black/60'}`}>{s.tip}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Buttons: Skip & Timer */}
            <div className="flex items-center gap-2">
              <button
                onClick={start321Countdown}
                type="button"
                className="flex-1 py-2.5 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs rounded-xl transition-colors active:translate-y-px flex items-center justify-center gap-1.5 shadow-md"
              >
                <SkipForward className="w-4 h-4 text-[#FE9A00]" aria-hidden="true" />
                <span>건너뛰고 바로 시작</span>
              </button>
              <div className="shrink-0 text-xs font-mono font-bold text-black bg-[#FE9A00] px-3 py-2.5 rounded-xl tabular-nums shadow-sm">
                {tutorialTimeLeft}초 후 시작
              </div>
            </div>
          </div>
        )}

        {/* COUNTDOWN STATE (3, 2, 1) */}
        {gameState === 'COUNTDOWN' && (
          <div className="text-center space-y-4 z-10 animate-fade-in">
            <div className="text-7xl font-serif font-extrabold text-[#FE9A00] tabular-nums leading-none">
              {countdown}
            </div>
            <p className="text-xs text-black/70 break-keep">
              {currentPiece.bpm} BPM 템포로 세는 중입니다. 이 박자를 그대로 이어받으세요.
            </p>
          </div>
        )}

        {/* CONDUCTING STATE */}
        {gameState === 'CONDUCTING' && (
          <div className="w-full h-full flex flex-col items-center justify-between z-10 gap-2 sm:gap-3">
            {/* 상단 계기판: 남은 시간과 목표 달성률 */}
            <div className="w-full shrink-0 grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#FE9A00] shrink-0" aria-hidden="true" />
                <span className="font-mono text-xl font-bold tabular-nums text-black leading-none w-[3.2rem]">
                  {timeLeft}
                </span>
                <span className="text-[10px] font-semibold text-black/60">초 남음</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="text-[10px] font-semibold text-black/60">정확한 박</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-black">
                    {accurateBeatCount}
                    <span className="text-black/40">/{requiredBeatsToPass}</span>
                  </span>
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${currentMatchPercent >= PASS_THRESHOLD_PERCENT ? 'text-emerald-600' : 'text-[#FE9A00]'
                      }`}
                  >
                    {currentMatchPercent}%
                  </span>
                </div>
                {/* 목표 통과 기준까지의 진행률 */}
                <div
                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-valuenow={currentMatchPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="박자 일치율"
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-150 ${currentMatchPercent >= PASS_THRESHOLD_PERCENT ? 'bg-emerald-500' : 'bg-[#FE9A00]'
                      }`}
                    style={{ width: `${Math.min(100, currentMatchPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 지휘 무대 */}
            <div className="relative w-full flex-1 min-h-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-3 sm:p-4 shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={220}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
              />

              {/* 마디 위치 표시 */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 pointer-events-none">
                {Array.from({ length: beatsPerBar }, (_, i) => i + 1).map(beat => (
                  <span
                    key={beat}
                    className={`h-1.5 rounded-full transition-all duration-150 ${guideBeat === beat
                      ? 'w-7 bg-[#FE9A00]'
                      : beat === 1
                        ? 'w-3 bg-slate-400'
                        : 'w-3 bg-slate-300'
                      }`}
                  />
                ))}
              </div>

              {/* 시각 메트로놈 */}
              <div className="z-10 w-full h-full min-h-0 flex flex-col items-center justify-center text-center gap-3 pointer-events-none">
                <div className="relative flex items-center justify-center">
                  {judgementAccent && (
                    <span
                      key={`judge-${judgementSeq}`}
                      aria-hidden="true"
                      className={`cm-hit-ring pointer-events-none absolute w-[4.5rem] h-[4.5rem] rounded-full border-4 ${judgementAccent}`}
                    />
                  )}
                  <div
                    className={`relative w-[4.5rem] h-[4.5rem] rounded-full border-2 flex items-center justify-center transition-[background-color,border-color,box-shadow,transform] duration-100 ease-out ${isGuidePulsing
                      ? 'bg-[#FE9A00] border-[#e08800] text-black scale-110 shadow-[0_0_20px_rgba(254,154,0,0.6)]'
                      : 'bg-white border-slate-300 text-[#FE9A00] scale-100 shadow-sm'
                      }`}
                    role="img"
                    aria-label={`${guideBeat}박 시각 안내`}
                  >
                    <img
                      src={isGuidePulsing ? '/baton_icon_black.png' : '/baton_icon.png'}
                      alt="지휘봉 아이콘"
                      className="w-8 h-8 object-contain"
                      draggable={false}
                      aria-hidden="true"
                    />
                    <span className="absolute -right-1.5 -top-1.5 min-w-6 h-6 px-1 rounded-full bg-black text-white text-[11px] font-mono font-bold flex items-center justify-center tabular-nums shadow-sm">
                      {guideBeat}
                    </span>
                  </div>
                </div>

                {/* 흔드는 세기 게이지 */}
                <div className="w-44">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-[width] duration-75 ${currentAccValue >= 66 ? 'bg-emerald-500' : 'bg-[#FE9A00]'
                        }`}
                      style={{ width: `${Math.min(100, currentAccValue)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 조작부: 지휘는 오직 스마트폰을 흔드는 동작 센서로만 진행된다(터치/클릭 불가). */}
            <div className="w-full shrink-0 grid grid-cols-[1fr_auto] items-stretch gap-2">
              <div className="rounded-xl border border-amber-500/30 bg-stone-900/70 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 py-3.5 px-3 text-center break-keep">
                <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>스마트폰을 힘차게 흔들어 박자를 맞추세요</span>
              </div>
              <button
                type="button"
                onClick={handleLose}
                title="미션 포기"
                aria-label="미션 포기"
                className="rounded-xl border border-stone-700 bg-stone-900 px-4 text-stone-400 hover:text-rose-300 hover:border-rose-800 active:translate-y-px transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {gameState === 'SUCCESS' && (
          <div className="text-center space-y-4 z-10 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold font-serif text-black">
              지휘 미션 통과
            </h3>
            <p className="text-xs text-black/70 break-keep leading-relaxed">
              달성률 <strong className="text-emerald-600 font-mono text-sm tabular-nums">{currentMatchPercent}%</strong>로 {PASS_THRESHOLD_PERCENT}% 기준을 넘겼습니다.
            </p>
          </div>
        )}

        {/* FAIL STATE */}
        {gameState === 'FAIL' && (
          <div className="text-center space-y-4 z-10 animate-fade-in max-w-sm">
            <div className="w-16 h-16 mx-auto rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-500 shadow-sm">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold font-serif text-black">
              지휘 미션 실패
            </h3>
            <p className="text-xs text-black/70 leading-relaxed break-keep">
              달성률 <strong className="text-rose-500 font-mono text-sm tabular-nums">{currentMatchPercent}%</strong>로 연장 기준({PASS_THRESHOLD_PERCENT}%)에 닿지 못했습니다.
              <br />앱을 닫고 내 인생을 지휘하러 떠나보세요.
            </p>
            <button
              onClick={onMissionFail}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors active:translate-y-px"
            >
              미션 종료하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
