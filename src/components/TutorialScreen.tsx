import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, ArrowLeft, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { BeatType } from '../types';
import { audioSynthesizer } from '../lib/audioSynthesizer';

interface TutorialScreenProps {
  onNavigateToScreen?: (tab: string) => void;
  onBack?: () => void;
  isMissionMode?: boolean;
  presetBeat?: BeatType;
  missionTimeLeft?: number;
  onSkipMissionTutorial?: () => void;
}

interface BeatInfo {
  type: BeatType;
  title: string;
  count: number;
  patternName: string;
  description: string;
  bpm: number;
  svgPath: string;
  points: Array<{ x: number; y: number; beat: number; label: string; progress: number }>;
}

const BEAT_TUTORIALS: Record<BeatType, BeatInfo> = {
  '4/4': {
    type: '4/4',
    title: '4박자 지휘법',
    count: 4,
    patternName: '아래 ➔ 안쪽 ➔ 바깥쪽 ➔ 위',
    description: '1박(강)은 수직으로 내리치고, 2박은 안쪽(왼쪽), 3박은 바깥쪽(오른쪽), 4박은 위로 끌어올립니다.',
    bpm: 80,
    // 정통 4/4박자 독일/프랑스 지휘법의 유려한 베지에 곡선
    svgPath: 'M 100 25 C 100 65, 98 115, 100 135 C 102 142, 85 125, 75 115 C 55 95, 45 85, 45 95 C 45 110, 75 110, 100 105 C 130 100, 155 85, 155 95 C 155 115, 125 125, 115 115 C 105 85, 100 50, 100 25',
    points: [
      { x: 100, y: 135, beat: 1, label: '1 (Down)', progress: 0.25 },
      { x: 45, y: 95, beat: 2, label: '2 (In)', progress: 0.50 },
      { x: 155, y: 95, beat: 3, label: '3 (Out)', progress: 0.75 },
      { x: 100, y: 25, beat: 4, label: '4 (Up)', progress: 1.0 },
    ],
  },
  '3/4': {
    type: '3/4',
    title: '3박자 지휘법 (왈츠)',
    count: 3,
    patternName: '아래 ➔ 바깥쪽 ➔ 위',
    description: '왈츠 특유의 3박자입니다. 1박(강)은 깊게 떨어지고, 2박은 우아한 바깥 곡선, 3박은 위로 떠오릅니다.',
    bpm: 84,
    // 둥근 부채꼴 형태의 유려한 곡선 삼각 왈츠 궤적
    svgPath: 'M 100 25 C 100 70, 98 115, 100 135 C 102 142, 120 135, 138 122 C 158 108, 162 95, 160 105 C 152 125, 122 75, 100 25',
    points: [
      { x: 100, y: 135, beat: 1, label: '1 (Down)', progress: 0.33 },
      { x: 160, y: 105, beat: 2, label: '2 (Out)', progress: 0.66 },
      { x: 100, y: 25, beat: 3, label: '3 (Up)', progress: 1.0 },
    ],
  },
  '2/4': {
    type: '2/4',
    title: '2박자 지휘법 (행진곡)',
    count: 2,
    patternName: '아래 ➔ 위 (J자 곡선)',
    description: '행진곡에 쓰이는 지휘입니다. 1박(강)은 아래로 내렸다 안쪽으로 튕기고, 2박은 바깥쪽으로 상승합니다.',
    bpm: 96,
    // 완벽한 J자 곡선 루프
    svgPath: 'M 100 25 C 100 70, 98 118, 95 135 C 92 145, 68 135, 68 105 C 68 75, 115 75, 100 25',
    points: [
      { x: 95, y: 135, beat: 1, label: '1 (Down)', progress: 0.50 },
      { x: 100, y: 25, beat: 2, label: '2 (Up)', progress: 1.0 },
    ],
  },
  '1/4': {
    type: '1/4',
    title: '1박자 지휘법 (원포인트)',
    count: 1,
    patternName: '위 ➔ 아래 맥박',
    description: '빠른 악장에서 한 마디를 하나의 큰 맥박으로 지휘합니다.',
    bpm: 120,
    svgPath: 'M 100 25 C 100 60, 98 115, 100 135 C 102 140, 102 60, 100 25',
    points: [
      { x: 100, y: 135, beat: 1, label: '1 (Pulse)', progress: 1.0 },
    ],
  },
};

export const TutorialScreen: React.FC<TutorialScreenProps> = ({
  onBack,
  isMissionMode = false,
  presetBeat = '4/4',
  missionTimeLeft = 10,
  onSkipMissionTutorial,
}) => {
  const [selectedBeat, setSelectedBeat] = useState<BeatType>(presetBeat);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [activeBeat, setActiveBeat] = useState<number>(1);
  const [pathLength, setPathLength] = useState<number>(0);
  const [dashOffset, setDashOffset] = useState<number>(0);
  const [showVideoIntro, setShowVideoIntro] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<boolean>(false);

  const pathRef = useRef<SVGPathElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const lastTriggeredBeatRef = useRef<number>(0);

  const tutorial = BEAT_TUTORIALS[selectedBeat];

  // 박자 변경 시 경로 길이 측정 및 초기화
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLength(len);
      progressRef.current = 0;
      lastTriggeredBeatRef.current = 0;
      setActiveBeat(1);
    }
  }, [selectedBeat]);

  // 실시간 60fps 애니메이션 루프: 곡선을 따라 흐르는 빛의 궤적 & 지휘봉 포인터 이동
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // 1마디를 도는 데 걸리는 시간 (초) = (60 / BPM) * 마디 박자수
      const barDurationSec = (60 / tutorial.bpm) * tutorial.count;
      const progressDelta = delta / barDurationSec;

      progressRef.current = (progressRef.current + progressDelta) % 1;

      if (pathRef.current && pathLength > 0) {
        const currentDist = progressRef.current * pathLength;

        // 흐르는 혜성 꼬리(Moving Trail) 오프셋 업데이트
        setDashOffset(-currentDist);

        // 현재 박자(타점) 도달 시 사운드 및 뱃지 업데이트
        const beatFraction = 1 / tutorial.count;
        const currentBeatIndex = Math.min(
          tutorial.count,
          Math.floor(progressRef.current / beatFraction) + 1
        );

        if (currentBeatIndex !== lastTriggeredBeatRef.current) {
          lastTriggeredBeatRef.current = currentBeatIndex;
          setActiveBeat(currentBeatIndex);

          if (soundOn) {
            const isDownBeat = currentBeatIndex === 1;
            audioSynthesizer.playMetronomeClick(isDownBeat, isDownBeat ? 0.4 : 0.2);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, pathLength, tutorial.bpm, tutorial.count, soundOn]);

  const handleReset = () => {
    progressRef.current = 0;
    lastTriggeredBeatRef.current = 0;
    setActiveBeat(1);
  };

  const trailLength = pathLength > 0 ? pathLength * 0.38 : 100;

  return (
    <div className="min-h-full text-black px-4 py-3 sm:py-4 flex flex-col relative select-none">
      {/* 0. 지휘 시연 MP4 비디오 비주얼 오버레이 (튜토리얼 시작 시 1차 노출) */}
      {showVideoIntro && (
        <div
          onClick={() => setShowVideoIntro(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-between p-6 sm:p-8 cursor-pointer select-none animate-fade-in"
        >
          {/* 상단 닫기/안내 헤더 */}
          <div className="w-full max-w-sm flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <Sparkles className="w-4 h-4 text-[#FE9A00]" />
              <span className="text-xs font-bold text-white tracking-wide">지휘 동작 시연 가이드</span>
            </div>
            <span className="text-xs font-medium text-white/60">화면 아무 데나 터치하여 닫기 ✕</span>
          </div>

          {/* MP4 비디오 비주얼 프레임 */}
          <div className="relative my-auto flex flex-col items-center justify-center max-w-sm w-full">
            <div className="relative w-full max-w-[260px] sm:max-w-[300px] aspect-[9/16] max-h-[55vh] rounded-3xl overflow-hidden border-2 border-[#FE9A00]/70 shadow-[0_0_35px_rgba(254,154,0,0.4)] bg-black flex items-center justify-center">
              {!videoError ? (
                <video
                  src="/conducting_demo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white/80 gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#FE9A00]/20 flex items-center justify-center border border-[#FE9A00]/40 animate-pulse">
                    <Sparkles className="w-8 h-8 text-[#FE9A00]" />
                  </div>
                  <p className="text-sm font-bold">지휘 시연 영상을 준비 중입니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 하단 가이드 멘트 및 탭 유도 */}
          <div className="w-full max-w-sm flex flex-col items-center text-center gap-3 pb-4">
            <div className="bg-[#FE9A00] text-black font-extrabold text-base sm:text-lg px-6 py-3 rounded-2xl shadow-xl border border-yellow-300 transform transition-transform hover:scale-105 active:scale-95">
              "영상처럼 핸드폰을 움직여보세요"
            </div>
            <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium animate-bounce pt-1">
              <span>터치하면 튜토리얼이 시작됩니다</span>
              <span className="text-base">👆</span>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-3.5">
        {/* 1. 상단 헤더 (더보기 탭 전용) */}
        {!isMissionMode && (
          <div className="flex items-center gap-3 shrink-0 pt-0.5 pb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-black transition-colors active:scale-95 shadow-sm cursor-pointer"
                title="뒤로가기"
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-4 h-4 text-black" />
              </button>
            )}
            <h2 className="text-base sm:text-lg font-sans font-extrabold text-black tracking-wide">
              지휘 동작 튜토리얼
            </h2>
          </div>
        )}

        {/* 2. 박자 선택 칩 (미션 모드 시 숨김) */}
        {!isMissionMode && (
          <div className="shrink-0 flex items-center gap-2.5">
            {(['4/4', '3/4', '2/4'] as BeatType[]).map((beat) => {
              const isSelected = selectedBeat === beat;
              return (
                <button
                  key={beat}
                  onClick={() => {
                    setSelectedBeat(beat);
                  }}
                  className={`px-5 py-2.5 rounded-2xl border text-sm font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-md'
                      : 'bg-white border-slate-200 text-black hover:border-slate-300'
                  }`}
                >
                  {beat}박자
                </button>
              );
            })}
          </div>
        )}

        {/* 3. 메인 지휘 튜토리얼 시연 카드 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 shrink-0">
          {/* 카드 헤더 라인: 타이틀 + 컨트롤 버튼들 */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FE9A00]" />
              <h3 className="font-serif font-bold text-base sm:text-lg text-black">
                {selectedBeat}박자 곡선 지휘법
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {/* 소리 토글 버튼 */}
              <button
                onClick={() => setSoundOn(!soundOn)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  soundOn
                    ? 'bg-white border-slate-300 text-black shadow-xs'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
                title={soundOn ? '소리 끄기' : '소리 켜기'}
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5 text-[#FE9A00]" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundOn ? 'ON' : 'OFF'}</span>
              </button>

              {/* 일시정지 / 재생 버튼 */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-black text-white hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer active:scale-95"
                title={isPlaying ? '일시정지' : '재생'}
                aria-label={isPlaying ? '일시정지' : '재생'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#FE9A00]" /> : <Play className="w-3.5 h-3.5 fill-[#FE9A00] text-[#FE9A00]" />}
              </button>

              {/* 처음부터 다시보기 버튼 */}
              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer active:scale-95"
                title="처음부터 재생"
                aria-label="처음부터 재생"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 중앙 블랙 지휘 캔버스 스테이지 (터치 제거 & 유려한 곡선 궤적 애니메이션) */}
          <div className="relative w-full aspect-[4/4.5] bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden flex items-center justify-center select-none shadow-inner">
            {/* SVG 곡선 궤적 및 애니메이션 */}
            <svg viewBox="0 0 200 160" className="w-full h-full p-4">
              <defs>
                {/* 혜성처럼 흐르는 주황빛 그라데이션 */}
                <linearGradient id="wandTrailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FE9A00" stopOpacity="0.1" />
                  <stop offset="60%" stopColor="#FE9A00" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFF" stopOpacity="1" />
                </linearGradient>
                {/* 글로우 필터 */}
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. 배경 가이드 정적 곡선 (우아한 어두운 곡선) */}
              <path
                ref={pathRef}
                d={tutorial.svgPath}
                fill="none"
                stroke="#404040"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                className="opacity-70"
              />

              {/* 2. 살아 움직이는 빛나는 지휘 궤적 선 (Moving Flow Trail) */}
              {pathLength > 0 && (
                <path
                  d={tutorial.svgPath}
                  fill="none"
                  stroke="url(#wandTrailGradient)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={`${trailLength} ${pathLength}`}
                  strokeDashoffset={dashOffset}
                  filter="url(#glowEffect)"
                />
              )}

              {/* 3. 각 박자 타점 포인트 (Ictus Points) */}
              {tutorial.points.map((pt) => {
                const isCurrent = activeBeat === pt.beat;
                return (
                  <g key={pt.beat}>
                    {/* 본체 원 */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isCurrent ? 12 : 7}
                      className={`transition-all duration-300 ${
                        isCurrent
                          ? 'fill-[#FE9A00] stroke-white stroke-2 shadow-lg'
                          : 'fill-neutral-900 stroke-neutral-700 stroke-1'
                      }`}
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isCurrent ? 8 : 4}
                      className={isCurrent ? 'fill-white' : 'fill-neutral-600'}
                    />
                    {/* 박자 텍스트 라벨 */}
                    <text
                      x={pt.x}
                      y={pt.y + 21}
                      textAnchor="middle"
                      fill={isCurrent ? '#FE9A00' : '#737373'}
                      fontSize="9.5"
                      fontWeight={isCurrent ? 'bold' : 'normal'}
                      className="font-mono select-none"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* 좌측 상단 실시간 현재 박자 뱃지 */}
            <div className="absolute top-3 left-3 bg-black/85 border border-neutral-800 rounded-xl px-3 py-1.5 flex items-center gap-2 z-20 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FE9A00] animate-pulse" />
              <span className="text-xs font-mono font-bold text-neutral-200">
                현재 박자: <span className="text-sm text-[#FE9A00] font-serif">{activeBeat}</span> / {tutorial.count}박
              </span>
            </div>

            {/* 우측 하단 궤적 안내 캡션 */}
            <div className="absolute bottom-3 right-3 bg-black/75 border border-neutral-800/80 rounded-xl px-2.5 py-1 text-[10px] font-medium text-neutral-400 z-20">
              {tutorial.patternName}
            </div>
          </div>

          {/* 하단 심플한 설명 가이드 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed break-keep">
            💡 <strong className="text-black">{tutorial.title} 핵심: </strong>
            {tutorial.description}
          </div>

          {/* 하단 미션 전용 건너뛰기 & 타이머 컨트롤 박스 */}
          {isMissionMode && (
            <div className="pt-1 grid grid-cols-[1.6fr_1fr] items-stretch gap-2.5 w-full shrink-0">
              <button
                type="button"
                onClick={onSkipMissionTutorial}
                className="py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-colors active:translate-y-px cursor-pointer"
              >
                <SkipForward className="w-4 h-4 text-[#FE9A00]" aria-hidden="true" />
                <span>건너뛰고 바로 시작</span>
              </button>
              <div className="py-3.5 bg-[#FE9A00] text-black font-bold text-sm sm:text-base rounded-2xl shadow-md flex items-center justify-center tabular-nums font-mono">
                {missionTimeLeft}초 후 시작
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
