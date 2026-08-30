import React, { useState, useEffect, useRef } from 'react';
import { BeatType, ClassicalPiece, SessionData } from '../types';
import { CLASSICAL_PIECES } from '../data/classicalPieces';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import {
  StrokeTracker,
  expectedDirectionFor,
  directionArrow,
  directionLabel,
  type StrokeDirection,
  type StrokeResult,
} from '../lib/conductingMotion';
import { Music, Play, CheckCircle2, AlertCircle, Activity, Smartphone, Hand, Shuffle, Headphones, Pause, SkipForward, X, Timer, Target, VolumeX, Sparkles } from 'lucide-react';

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

/**
 * 지휘봉 + 음표 커스텀 이미지 (/baton_notes_orange.png)
 */
const ConductingBatonIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <img
    src="/baton_notes_orange.png"
    alt="지휘봉 아이콘"
    className={`object-contain ${className}`}
  />
);

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
  const [lastJudgement, setLastJudgement] = useState<'PERFECT' | 'MISS' | 'DUPLICATE' | 'WRONG_WAY' | null>(null);
  const [judgementSeq, setJudgementSeq] = useState<number>(0);

  // Device Motion & Permission States
  const [permissionState, setPermissionState] = useState<'UNKNOWN' | 'GRANTED' | 'DENIED' | 'NOT_SUPPORTED'>('UNKNOWN');
  const [currentAccValue, setCurrentAccValue] = useState<number>(0);

  // ── 방향 인식(지휘 방향 판정) ────────────────────────────────────────
  // 세기만 보던 기존 판정은 아무렇게나 흔들어도 통과됐다. 이 모드는 스윙이
  // 그어진 방향까지 보고 박자별 지휘 패턴과 맞는지 확인한다.
  // 첫 실기기 튜닝 전이라 켜고 끌 수 있게 두고, 기본값은 켜짐이다.
  const [directionModeOn, setDirectionModeOn] = useState<boolean>(true);
  // 튜닝용 표시. 마지막 스윙이 어떻게 읽혔는지 화면에서 바로 확인한다.
  const [lastStroke, setLastStroke] = useState<StrokeResult | null>(null);
  const [lastExpectedDir, setLastExpectedDir] = useState<StrokeDirection>('UNKNOWN');
  const [showMotionDebug, setShowMotionDebug] = useState<boolean>(true);
  const strokeTrackerRef = useRef<StrokeTracker>(new StrokeTracker());
  // 방향을 한 번도 못 읽었으면 센서가 못 받쳐주는 기기다. 그때는 세기 판정으로 되돌린다.
  const directionUnavailableRef = useRef<boolean>(false);
  const strokeSampleCountRef = useRef<number>(0);
  const strokeConfidentCountRef = useRef<number>(0);

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
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const guidePulseTimerRef = useRef<number | null>(null);
  const judgementFlashTimerRef = useRef<number | null>(null);

  // 판정 반응은 다음 박이 오기 전에 사라져야 박자 추적이 끊기지 않는다.
  // 그래서 유지 시간을 한 박(최소 약 440ms)보다 훨씬 짧게 잡는다.
  const flashJudgement = (kind: 'PERFECT' | 'MISS' | 'DUPLICATE' | 'WRONG_WAY') => {
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
  // 마디당 박 수. 판정·모션 훅·화면이 모두 쓰므로 훅보다 위에서 선언한다.
  const beatsPerBar = selectedBeat === '4/4' ? 4 : selectedBeat === '3/4' ? 3 : selectedBeat === '2/4' ? 2 : 1;
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

    // 방향 인식 상태도 매 시도마다 초기화한다.
    // (기기 판정까지 초기화해야 이전 시도의 결과가 다음 시도를 좌우하지 않는다.)
    setLastStroke(null);
    setLastExpectedDir('UNKNOWN');
    strokeSampleCountRef.current = 0;
    strokeConfidentCountRef.current = 0;
    directionUnavailableRef.current = false;
    strokeTrackerRef.current.reset();

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
  const processUserSwingGesture = (stroke?: StrokeResult | null) => {
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

    // ── 방향 판정 ─────────────────────────────────────────────────────
    // 이 박에 기대되는 지휘 방향(1박 하강, 2박 안쪽 …)과 실제 스윙 방향을 견준다.
    const expectedDir = expectedDirectionFor(selectedBeat, beatInBarNum);
    setLastExpectedDir(expectedDir);
    if (stroke) setLastStroke(stroke);

    // 방향을 볼 수 있는 조건일 때만 본다.
    // 센서가 방향을 못 주는 기기에서까지 막으면 잠금을 영영 못 푸는 사람이 생긴다.
    // (차단 화면은 잠금을 푸는 유일한 출구다 — 여기서는 항상 세기 판정으로 되돌린다.)
    const directionJudgeable =
      directionModeOn &&
      !directionUnavailableRef.current &&
      Boolean(stroke?.confident) &&
      expectedDir !== 'UNKNOWN';

    const directionMatches = !directionJudgeable || stroke?.direction === expectedDir;

    if (diffMs <= toleranceMs) {
      if (!directionMatches) {
        // 타이밍은 맞았지만 방향이 다르다. 흔들기만으로는 통과하지 못하는 지점이다.
        flashJudgement('WRONG_WAY');
      } else if (!matchedBeatIndicesRef.current.has(closestBeatIndex)) {
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

  // 가속도계로 스윙을 잡는다.
  // 세기의 정점(22 넘김 → 16 아래로)으로 한 번의 스윙을 구분하는 것은 그대로 두고,
  // 그 구간의 가속도를 적분해 **어느 쪽으로 그었는지**까지 함께 뽑는다. (conductingMotion.ts)
  useEffect(() => {
    if (gameState !== 'CONDUCTING') return;

    const tracker = strokeTrackerRef.current;
    tracker.reset();

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const accG = e.accelerationIncludingGravity;
      const acc = e.acceleration;
      if (!acc && !accG) return;

      const toVec = (a: DeviceMotionEventAcceleration | null) =>
        a ? { x: a.x || 0, y: a.y || 0, z: a.z || 0 } : null;

      const stroke = tracker.push(toVec(acc), toVec(accG), e.timeStamp || performance.now());

      setCurrentAccValue(Math.min(100, Math.round(tracker.magnitude * 3)));

      if (!stroke) return;

      // 방향을 읽을 수 있는 기기인지 누적해서 본다. 스윙을 여러 번 했는데
      // 한 번도 방향이 안 잡히면 센서가 못 받쳐주는 기기로 보고 세기 판정으로 되돌린다.
      strokeSampleCountRef.current += 1;
      if (stroke.confident) strokeConfidentCountRef.current += 1;
      if (strokeSampleCountRef.current >= 8 && strokeConfidentCountRef.current === 0) {
        directionUnavailableRef.current = true;
      }

      processUserSwingGesture(stroke);
    };

    window.addEventListener('devicemotion', handleDeviceMotion, true);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion, true);
  }, [gameState, directionModeOn, selectedBeat, beatIntervalMs, beatsPerBar]);

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

  // 지금 박에 그어야 할 방향. 화면 안내용이다.
  const currentGuideDirection = expectedDirectionFor(selectedBeat, guideBeat);

  const currentMatchPercent = totalExpectedBeatsIn60s > 0
    ? Math.round((accurateBeatCount / totalExpectedBeatsIn60s) * 100)
    : 0;

  /*
   * 판정 색은 초록(성공)과 빨강(실패) 두 가지뿐이다.
   *
   * 예전에는 MISS(빨강)·DUPLICATE(노랑)·WRONG_WAY(파랑)를 각각 다른 색으로 나눴다.
   * 그런데 색이 네 가지가 되면 1분 내내 박자를 좇는 중에 색을 해석할 여유가 없어,
   * "맞았나 틀렸나"라는 정작 필요한 정보가 오히려 묻힌다.
   * 무엇이 틀렸는지는 색이 아니라 방향 화살표와 안내 문구가 맡는다.
   *
   * 판정 종류 자체는 그대로 구분해 둔다(튜닝 표시와 추후 분석에 쓴다).
   * 여기서는 화면에 나가는 색만 둘로 합친다.
   */
  const isPerfectJudgement = lastJudgement === 'PERFECT';
  const isFailedJudgement =
    lastJudgement === 'MISS' || lastJudgement === 'DUPLICATE' || lastJudgement === 'WRONG_WAY';

  // 판정 색은 마커 위에 덧씌우지 않는다. 마커는 항상 곡의 현재 박만 보여주고,
  // 판정은 마커를 감싸는 링과 화면 전체 플래시로 스쳐 지나가게 해서 박자 추적을 가리지 않는다.
  const judgementAccent = isPerfectJudgement
    ? 'border-emerald-300'
    : isFailedJudgement
      ? 'border-rose-400'
      : null;

  // 화면 전체 판정 플래시. 진한 색으로 한 번 깜빡이고 즉시 사라진다.
  const judgementFlashTone = isPerfectJudgement
    ? 'bg-emerald-500/80'
    : isFailedJudgement
      ? 'bg-rose-600/80'
      : null;

  return (
    <div className="min-h-full w-full max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4 text-black relative select-none">

      {/* 판정 순간 화면 전체가 한 번 깜빡인다. 다음 박이 오기 전에 완전히 사라진다. */}
      {judgementFlashTone && (
        <div
          key={`flash-${judgementSeq}`}
          aria-hidden="true"
          className={`cm-stage-flash pointer-events-none fixed inset-0 z-50 ${judgementFlashTone}`}
        />
      )}

      {/* READY 상태일 때 상단 검정 알약 타이틀 배지 */}
      {gameState === 'READY' && (
        <div className="text-center shrink-0">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white border border-black shadow-md">
            <Music className="w-5 h-5 text-[#FE9A00]" />
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
              클래식 1분 지휘 미션
            </h1>
          </div>
        </div>
      )}

      {/* 곡 정보 카드 */}
      <div
        className={`shrink-0 rounded-3xl bg-white border border-slate-200 shadow-lg relative overflow-hidden ${
          gameState === 'READY' ? 'p-5 text-center space-y-3' : 'px-4 py-3'
        }`}
      >
        {gameState === 'READY' ? (
          <>
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-[#FE9A00] text-black text-xs sm:text-sm font-bold whitespace-nowrap inline-block shadow-sm">
                랜덤 지정: {selectedBeat} 박자
              </span>
            </div>
            <div className="px-1 space-y-2 w-full">
              <div className="flex flex-col items-center justify-center">
                <span className="block w-full text-center text-lg sm:text-xl font-bold font-serif text-black leading-snug break-keep">
                  {currentPiece.title}
                </span>
                <span className="block w-full truncate text-center text-xs sm:text-sm text-black/60 font-medium leading-tight mt-1">
                  {currentPiece.composer} · {currentPiece.bpm} BPM
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={handlePickRandomPiece}
                  type="button"
                  title="다른 곡으로 바꾸기"
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl border border-black text-xs sm:text-sm font-bold transition-colors active:translate-y-px flex items-center gap-1.5 whitespace-nowrap shadow-md"
                >
                  <Shuffle className="w-4 h-4 text-[#FE9A00]" aria-hidden="true" />
                  <span>곡 변경</span>
                </button>
                <button
                  onClick={toggleAudioPreview}
                  type="button"
                  title={isAudioPreviewPlaying ? '미리듣기 정지' : '미리듣기 재생'}
                  className={`px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-colors active:translate-y-px flex items-center gap-1.5 whitespace-nowrap shadow-md ${
                    isAudioPreviewPlaying
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
      <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">

        {/* READY STATE */}
        {gameState === 'READY' && (
          <div className="text-center space-y-4 max-w-md z-10 w-full">
            {/* 조작 방식 안내 아이콘 (지휘봉 + 음표 모티프) */}
            <div className="w-14 h-14 mx-auto rounded-2xl border border-slate-200 bg-white flex items-center justify-center shadow-sm">
              <ConductingBatonIcon className="w-9 h-9" />
            </div>

            {/* 통과 조건 요약 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left space-y-2.5">
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
                  <span className="text-black/80">±0.25초</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-black pt-1 border-t border-slate-200">
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

            {/*
              방향 인식 테스트 스위치 — 실기기 튜닝 중에만 둔다.
              끄면 기존 세기 판정(흔들기만 해도 통과)으로 돌아가므로 둘을 바로 비교할 수 있다.
            */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-xs font-bold text-black break-keep">
                  방향 인식 판정 <span className="text-slate-500 font-medium">(테스트)</span>
                </span>
                <input
                  type="checkbox"
                  checked={directionModeOn}
                  onChange={e => setDirectionModeOn(e.target.checked)}
                  className="w-4 h-4 accent-[#FE9A00]"
                />
              </label>
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-xs font-bold text-black break-keep">
                  센서 값 표시 <span className="text-slate-500 font-medium">(튜닝용)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMotionDebug}
                  onChange={e => setShowMotionDebug(e.target.checked)}
                  className="w-4 h-4 accent-[#FE9A00]"
                />
              </label>
              <p className="text-[11px] text-slate-500 leading-snug break-keep">
                켜면 박자마다 정해진 방향(1박 아래, 2박 안쪽…)으로 그어야 타점으로 인정됩니다.
              </p>
            </div>

            {/* 가로 2열 버튼 (튜토리얼 후 시작 vs 취소) */}
            <div className="pt-2 grid grid-cols-[1.6fr_1fr] items-stretch gap-2.5 w-full">
              <button
                onClick={handleStartGame}
                className="py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-colors active:translate-y-px"
              >
                <Play className="w-4 h-4 fill-[#FE9A00] text-[#FE9A00]" aria-hidden="true" />
                <span>튜토리얼 후 시작</span>
              </button>
              <button
                onClick={onCancel}
                className="py-3.5 bg-slate-100 text-black hover:bg-slate-200 text-sm font-bold rounded-2xl border border-slate-200 transition-colors active:translate-y-px shadow-sm flex items-center justify-center"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* TUTORIAL PREVIEW STATE (10s BEFORE 3, 2, 1 COUNTDOWN) */}
        {gameState === 'TUTORIAL_PREVIEW' && (
          <div className="text-center space-y-4 max-w-md z-10 w-full animate-fade-in flex flex-col items-center">
            {/* Top Status Header (검은색 알약 배지) */}
            <div className="inline-flex items-center gap-2 bg-black border border-black rounded-full px-5 py-2 shadow-md">
              <Music className="w-4 h-4 text-[#FE9A00] shrink-0" aria-hidden="true" />
              <div className="text-xs font-bold text-white">{selectedBeat} 지휘 동작 가이드</div>
            </div>

            {/* 소리가 안 들리는 두 가지 원인(앱 음소거, 브라우저 오디오 잠금)을 구분해 알린다. */}
            {isAppMuted ? (
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left">
                <VolumeX className="w-4 h-4 shrink-0 text-[#FE9A00]" aria-hidden="true" />
                <span className="min-w-0 text-[11px] leading-snug text-black break-keep">
                  앱 음소거가 켜져 있어 박자 소리가 나지 않습니다. 상단 스피커 버튼으로 해제해 주세요.
                </span>
              </div>
            ) : isAudioBlocked ? (
              <button
                type="button"
                onClick={handleUnlockAudio}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100 active:translate-y-px"
              >
                <VolumeX className="w-4 h-4 shrink-0 text-[#FE9A00]" aria-hidden="true" />
                <span className="min-w-0 text-[11px] leading-snug text-black break-keep">
                  박자 소리가 차단되어 있습니다. 여기를 눌러 소리를 켜고, 기기의 무음 스위치도 확인해 주세요.
                </span>
              </button>
            ) : null}

            {/* Pattern Visualizer Fullsize Diagram (피그마 2번 시안 맞춤) */}
            {(() => {
              const guide = TUTORIAL_SVG_GUIDES[selectedBeat] || TUTORIAL_SVG_GUIDES['4/4'];
              const isSuccessDemo = tutorialDemoMode === 'SUCCESS';
              const activePoint = guide.points.find(pt => pt.beat === activeTutorialBeat) ?? guide.points[0];
              return (
                <div
                  className={`relative w-full h-[290px] sm:h-[330px] rounded-2xl border overflow-hidden flex items-center justify-center shadow-inner ${
                    isSuccessDemo
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-rose-50/40 border-rose-300'
                  }`}
                >
                  <svg viewBox="0 0 200 150" className="w-full h-full p-4">
                    <path d={guide.svgPath} fill="none" stroke="#94a3b8" strokeWidth="3.5" strokeDasharray="5 5" />
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
                            r={isActive ? 12 : 7}
                            className={isActive ? activeFill : 'fill-slate-300 stroke-slate-400 stroke-1'}
                          />
                          <text
                            x={pt.x}
                            y={pt.y + 20}
                            textAnchor="middle"
                            fill={isActive ? (isSuccessDemo ? '#059669' : '#e11d48') : '#64748b'}
                            fontSize="9.5"
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
                        r={18}
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.5"
                        opacity="0.85"
                      />
                    ) : (
                      <g>
                        <circle
                          cx={activePoint.x + 20}
                          cy={activePoint.y + 14}
                          r={9}
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

                  {/* 좌측 상단 박자 카운터 배지 */}
                  <div className="absolute top-3 left-3 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-black tabular-nums shadow-sm">
                    <span className={`font-bold ${isSuccessDemo ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {activeTutorialBeat}
                    </span>{' '}
                    / {guide.points.length}박
                  </div>

                  {/* 우측 상단 성공/실패 예시 배지 */}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border shadow-sm ${
                      isSuccessDemo
                        ? 'bg-emerald-100/90 border-emerald-300 text-emerald-800'
                        : 'bg-rose-100/90 border-rose-300 text-rose-800'
                    }`}
                  >
                    {isSuccessDemo ? '성공 예시 (정확한 타점)' : '실패 예시 (벗어난 궤적)'}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Buttons: Skip & Timer (가로 2열 배치) */}
            <div className="pt-2 grid grid-cols-[1.6fr_1fr] items-stretch gap-2.5 w-full">
              <button
                onClick={start321Countdown}
                type="button"
                className="py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-colors active:translate-y-px"
              >
                <SkipForward className="w-4 h-4 text-[#FE9A00]" aria-hidden="true" />
                <span>건너뛰고 바로 시작</span>
              </button>
              <div className="py-3.5 bg-[#FE9A00] text-black font-bold text-sm sm:text-base rounded-2xl shadow-md flex items-center justify-center tabular-nums">
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

        {/* CONDUCTING STATE (피그마 2번 시안 완벽 맞춤) */}
        {gameState === 'CONDUCTING' && (
          <div className="w-full h-full flex flex-col justify-between items-center z-10 py-1 sm:py-3">
            {/* 1. 상단 대형 타점 스코어보드 & 실시간 달성률 게이지 바 */}
            <div className="w-full flex flex-col items-center pt-2">
              <div className="flex items-center justify-center gap-3">
                <Activity className="w-11 h-11 sm:w-12 sm:h-12 text-[#FE9A00] stroke-[3]" aria-hidden="true" />
                <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-black flex items-baseline">
                  <span className="tabular-nums">{accurateBeatCount}</span>
                  <span className="text-slate-400 font-light">/{requiredBeatsToPass}</span>
                </div>
              </div>

              {/* 실시간 달성률 로딩 게이지 바: 70% 미만 빨간색, 70% 이상 초록색 */}
              <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentMatchPercent >= 70
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, currentMatchPercent))}%` }}
                />
              </div>
            </div>

            {/* 2. 중앙 인터랙티브 지휘 스테이지 (원형 링 및 방향 가이드 제거, 순수 음표 4개만 배치) */}
            <div className="relative w-full flex-1 flex flex-col items-center justify-center my-3 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={260}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
              />

              {/* 중앙 은은한 음표 4개 */}
              <div className="w-full flex items-center justify-around text-4xl sm:text-5xl text-slate-200 pointer-events-none select-none px-4">
                <span className={`transition-all duration-150 ${guideBeat === 1 ? 'text-[#FE9A00] scale-125 font-bold' : ''}`}>♩</span>
                <span className={`transition-all duration-150 ${guideBeat === 2 ? 'text-[#FE9A00] scale-125 font-bold' : ''}`}>♪</span>
                <span className={`transition-all duration-150 ${guideBeat === 3 ? 'text-[#FE9A00] scale-125 font-bold' : ''}`}>♫</span>
                <span className={`transition-all duration-150 ${guideBeat === 4 ? 'text-[#FE9A00] scale-125 font-bold' : ''}`}>♬</span>
              </div>
            </div>

            {/* 3. 하단 대형 남은 시간 타이머 */}
            <div className="w-full flex items-center justify-center gap-3 my-2">
              <Timer className="w-11 h-11 sm:w-12 sm:h-12 text-[#FE9A00] stroke-[2.5]" aria-hidden="true" />
              <span className="font-mono text-5xl sm:text-6xl font-extrabold text-black tabular-nums tracking-tight">
                {timeLeft}
              </span>
            </div>

            {/* 4. 최하단 안내 바 & 닫기(X) 버튼 */}
            <div className="w-full shrink-0 grid grid-cols-[1fr_auto] items-stretch gap-2.5 pt-2">
              <div className="rounded-2xl bg-stone-800 border border-stone-700 text-stone-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 py-3.5 px-4 text-center break-keep shadow-md">
                <Smartphone className="w-4 h-4 text-[#FE9A00] shrink-0" aria-hidden="true" />
                <span>스마트폰을 움직여 박자를 맞추세요</span>
              </div>
              <button
                type="button"
                onClick={handleLose}
                title="미션 포기"
                aria-label="미션 포기"
                className="w-14 rounded-2xl bg-black border border-black text-white hover:text-rose-400 active:translate-y-px transition-colors flex items-center justify-center shadow-md"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
