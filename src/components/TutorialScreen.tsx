import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, ArrowLeft, Compass } from 'lucide-react';
import { BeatType } from '../types';
import { audioSynthesizer } from '../lib/audioSynthesizer';

interface TutorialScreenProps {
  onNavigateToScreen: (tab: string) => void;
  onBack: () => void;
}

interface BeatInfo {
  type: BeatType;
  title: string;
  name: string;
  description: string;
  count: number;
  pattern: string;
  examplePiece: string;
  steps: Array<{ beat: number; name: string; direction: string; tip: string }>;
  svgPath: string;
  points: Array<{ x: number; y: number; beat: number; label: string }>;
}

const BEAT_TUTORIALS: Record<BeatType, BeatInfo> = {
  '4/4': {
    type: '4/4',
    title: '4박자 지휘법 (4/4)',
    name: '기본 4박자 (Down - In - Out - Up)',
    description: '가장 보편적인 지휘법입니다. 1박(강)은 아래로, 2박(약)은 안쪽(왼쪽), 3박(중강)은 바깥쪽(오른쪽), 4박(약)은 위로 올라갑니다.',
    count: 4,
    pattern: '아래 ➔ 안쪽 ➔ 바깥쪽 ➔ 위',
    examplePiece: '비발디 - 사계 중 여름 (BPM 128)',
    steps: [
      { beat: 1, name: '1박 (강박)', direction: '수직 하강 (Ictus)', tip: '가장 강하고 명확하게 바닥 지점을 칩니다.' },
      { beat: 2, name: '2박 (약박)', direction: '중앙 안쪽 곡선', tip: '몸 안쪽(왼쪽)으로 부드럽게 반사됩니다.' },
      { beat: 3, name: '3박 (중강박)', direction: '바깥쪽 수평 확장', tip: '오른쪽 바깥쪽으로 시원하게 펼칩니다.' },
      { beat: 4, name: '4박 (약박/예비)', direction: '상향 수직 복귀', tip: '다음 마디 1박을 준비하며 위로 끌어올립니다.' },
    ],
    svgPath: 'M 100 20 L 100 130 C 100 140, 50 120, 50 100 C 50 90, 150 90, 150 100 C 150 120, 100 50, 100 20',
    points: [
      { x: 100, y: 130, beat: 1, label: '1 (Down)' },
      { x: 50, y: 100, beat: 2, label: '2 (In)' },
      { x: 150, y: 100, beat: 3, label: '3 (Out)' },
      { x: 100, y: 20, beat: 4, label: '4 (Up)' },
    ],
  },
  '3/4': {
    type: '3/4',
    title: '3박자 지휘법 (3/4 - 왈츠/삼각 패턴)',
    name: '삼각형 3박자 (Down - Out - Up)',
    description: '왈츠와 미뉴에트에 쓰이는 지휘입니다. 1박(강)은 아래, 2박(약)은 바깥쪽, 3박(약)은 부드럽게 위로 끌어올립니다.',
    count: 3,
    pattern: '아래 ➔ 바깥쪽 ➔ 위 (삼각형 궤적)',
    examplePiece: '차이콥스키 - 꽃의 왈츠 (BPM 84)',
    steps: [
      { beat: 1, name: '1박 (강박/쿵)', direction: '수직 하강', tip: '왈츠 특유의 우아하고 깊은 강박을 찍어줍니다.' },
      { beat: 2, name: '2박 (약박/짝)', direction: '오른쪽 우아한 바깥 궤적', tip: '옆으로 물 흐르듯 가볍게 스위프합니다.' },
      { beat: 3, name: '3박 (약박/짝)', direction: '대각선 위로 상승 복귀', tip: '다음 1박의 춤사위를 위해 살포시 띄웁니다.' },
    ],
    svgPath: 'M 100 20 L 100 130 Q 130 130 160 110 L 100 20',
    points: [
      { x: 100, y: 130, beat: 1, label: '1 (Down)' },
      { x: 160, y: 110, beat: 2, label: '2 (Out)' },
      { x: 100, y: 20, beat: 3, label: '3 (Up)' },
    ],
  },
  '2/4': {
    type: '2/4',
    title: '2박자 지휘법 (2/4 - J자/2비트 패턴)',
    name: 'J자 2박자 (Down-In ➔ Up-Out)',
    description: '행진곡 및 빠른 악장에 쓰입니다. 1박(강)은 아래로 내렸다 살짝 튕기고, 2박(약)은 반대 곡선으로 올라옵니다.',
    count: 2,
    pattern: '아래 ➔ 위 (J자 곡선)',
    examplePiece: '베토벤 - 교향곡 5번 / 비제 - 카르멘',
    steps: [
      { beat: 1, name: '1박 (강박)', direction: '수직 하강 후 안쪽 살짝 반사', tip: '단호하고 빠른 반사점을 만듭니다.' },
      { beat: 2, name: '2박 (약박)', direction: '바깥쪽 곡선으로 상승', tip: '상승 에너지를 모아 원점으로 돌아옵니다.' },
    ],
    svgPath: 'M 100 20 L 100 120 Q 80 140 70 110 C 70 80, 130 80, 100 20',
    points: [
      { x: 100, y: 120, beat: 1, label: '1 (Down)' },
      { x: 100, y: 20, beat: 2, label: '2 (Up)' },
    ],
  },
  '1/4': {
    type: '1/4',
    title: '1박자 지휘법 (매우 빠른 템포)',
    name: '단일 박자 (Up-Down Pulse)',
    description: '스케르초나 매우 빠른 왈츠 등 한 마디를 한 번의 큰 맥박으로 지휘할 때 사용합니다.',
    count: 1,
    pattern: '위 ➔ 아래 (원포인트 박동)',
    examplePiece: '빠른 프레스토 악장',
    steps: [
      { beat: 1, name: '1박 (마디 맥박)', direction: '수직 점프 & 드롭', tip: '마디 첫 박만 정확한 반사점을 줍니다.' },
    ],
    svgPath: 'M 100 30 L 100 130 L 100 30',
    points: [
      { x: 100, y: 130, beat: 1, label: '1 (Pulse)' },
    ],
  },
};

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onBack }) => {
  const [selectedBeat, setSelectedBeat] = useState<BeatType>('4/4');
  const [bpm] = useState<number>(90);
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [metronomeOn, setMetronomeOn] = useState<boolean>(true);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const userTrailRef = useRef<Array<{ x: number; y: number; time: number }>>([]);

  const tutorial = BEAT_TUTORIALS[selectedBeat];

  // Metronome & Practice Beat Animation Sync
  useEffect(() => {
    if (!isPracticing) return;

    const intervalMs = (60 / bpm) * 1000;
    const timer = setInterval(() => {
      setActiveBeatIndex((prev) => {
        const next = (prev % tutorial.count) + 1;
        if (metronomeOn) {
          const isAccent = next === 1;
          audioSynthesizer.playMetronomeClick(isAccent, isAccent ? 0.38 : 0.2);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPracticing, bpm, tutorial.count, metronomeOn]);

  // Canvas Mouse/Touch Conducting Trace
  const addTrailPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    userTrailRef.current.push({ x, y, time: Date.now() });
    if (userTrailRef.current.length > 35) {
      userTrailRef.current.shift();
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    userTrailRef.current = [];
    addTrailPoint(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current) return;
    addTrailPoint(e);
    drawCanvasTrail();
  };

  const handleCanvasMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
  };

  const drawCanvasTrail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Trail
    if (userTrailRef.current.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff'; // White Trail
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(userTrailRef.current[0].x, userTrailRef.current[0].y);
      for (let i = 1; i < userTrailRef.current.length; i++) {
        ctx.lineTo(userTrailRef.current[i].x, userTrailRef.current[i].y);
      }
      ctx.stroke();

      // Glowing conductor wand tip
      const last = userTrailRef.current[userTrailRef.current.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  return (
    <div className="min-h-full text-black px-4 py-3 sm:py-4 flex flex-col relative select-none">
      <div className="w-full max-w-lg mx-auto flex flex-col gap-3.5">
        {/* 1. 상단 뒤로가기 & 서브 타이틀 */}
        <div className="flex items-center gap-3 shrink-0 pt-0.5 pb-1">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-black transition-colors active:scale-95 shadow-sm"
            title="뒤로가기"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>
          <h2 className="text-base sm:text-lg font-sans font-extrabold text-black tracking-wide">
            지휘 동작 튜토리얼
          </h2>
        </div>

        {/* 2. 박자 선택 칩 (가로 알약 4/4박자, 3/4박자, 2/4박자) */}
        <div className="shrink-0 flex items-center gap-2.5">
          {(['4/4', '3/4', '2/4'] as BeatType[]).map((beat) => {
            const isSelected = selectedBeat === beat;
            return (
              <button
                key={beat}
                onClick={() => {
                  setSelectedBeat(beat);
                  setActiveBeatIndex(1);
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

        {/* 3. 메인 지휘 연습 카드 (피그마 3번 시안 완벽 맞춤) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 shrink-0">
          {/* 카드 헤더 라인: 타이틀 + 소리 ON/OFF 버튼 */}
          <div className="flex items-center justify-between shrink-0">
            <h3 className="font-serif font-bold text-base sm:text-lg text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FE9A00]" />
              <span>{selectedBeat}박자 지휘법</span>
            </h3>

            {/* 소리 토글 버튼 */}
            <button
              onClick={() => setMetronomeOn(!metronomeOn)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                metronomeOn
                  ? 'bg-white border-slate-300 text-black shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              {metronomeOn ? <Volume2 className="w-3.5 h-3.5 text-[#FE9A00]" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>소리 {metronomeOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* 중앙 블랙 지휘 캔버스 스테이지 */}
          <div
            onClick={() => {
              if (!isPracticing) setIsPracticing(true);
            }}
            className="relative w-full aspect-[4/4.5] bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden flex items-center justify-center select-none touch-none shadow-inner cursor-pointer"
          >
            {/* SVG 점선 가이드 궤적 */}
            <svg viewBox="0 0 200 150" className="w-full h-full absolute inset-0 pointer-events-none p-5">
              <path
                d={tutorial.svgPath}
                fill="none"
                stroke="#525252"
                strokeWidth="3.5"
                strokeDasharray="5 5"
              />

              {/* 타점 포인트들 */}
              {tutorial.points.map((pt) => {
                const isActive = isPracticing && activeBeatIndex === pt.beat;
                return (
                  <g key={pt.beat}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 12 : 7}
                      className={`transition-all duration-300 ${
                        isActive
                          ? 'fill-[#FE9A00] stroke-white stroke-2'
                          : 'fill-neutral-800 stroke-neutral-600 stroke-1'
                      }`}
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 8 : 5}
                      className={isActive ? 'fill-[#FE9A00]' : 'fill-neutral-500'}
                    />
                    <text
                      x={pt.x}
                      y={pt.y + 20}
                      textAnchor="middle"
                      fill={isActive ? '#FE9A00' : '#a3a3a3'}
                      fontSize="9.5"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      className="font-mono select-none"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* 사용자 터치/제스처 캔버스 */}
            <canvas
              ref={canvasRef}
              width={400}
              height={360}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onTouchStart={handleCanvasMouseDown}
              onTouchMove={handleCanvasMouseMove}
              onTouchEnd={handleCanvasMouseUp}
              className="absolute inset-0 w-full h-full cursor-crosshair z-10"
            />

            {/* 시작 전 안내 오버레이 (화면을 터치하여 연습을 시작하세요) */}
            {!isPracticing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20 transition-opacity">
                <div className="w-14 h-14 rounded-full border-2 border-[#FE9A00] flex items-center justify-center mb-3 bg-black/40 shadow-[0_0_15px_rgba(254,154,0,0.3)]">
                  <Compass className="w-7 h-7 text-[#FE9A00]" />
                </div>
                <p className="text-white font-bold text-sm">
                  화면을 터치하여 연습을 시작하세요
                </p>
              </div>
            )}

            {/* 실시간 현재 박자 뱃지 (연습 중일 때) */}
            {isPracticing && (
              <div className="absolute top-3 left-3 bg-black/85 border border-neutral-700 rounded-xl px-3 py-1.5 flex items-center gap-2 z-20 shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FE9A00] animate-pulse" />
                <span className="text-xs font-mono font-bold text-neutral-200">
                  현재 박자: <span className="text-sm text-[#FE9A00] font-serif">{activeBeatIndex}</span> / {tutorial.count}박
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
