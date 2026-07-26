import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Camera, Sparkles, Volume2, VolumeX, CheckCircle, ArrowRight, ArrowLeft, HelpCircle, Music, Award, Compass, Zap } from 'lucide-react';
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

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onNavigateToScreen, onBack }) => {
  const [selectedBeat, setSelectedBeat] = useState<BeatType>('4/4');
  const [bpm, setBpm] = useState<number>(90);
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [metronomeOn, setMetronomeOn] = useState<boolean>(true);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(1);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('지휘 시작 버튼을 눌러 연습해보세요!');

  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  // Handle Camera Enable for Gesture Practice
  const toggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } catch (e) {
        alert('카메라 접근 권한을 확인해주세요. 마우스/터치로도 연습할 수 있습니다!');
      }
    }
  };

  // Canvas Mouse/Touch Conducting Trace
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

    // Evaluate trace against active beat timing
    if (userTrailRef.current.length > 5) {
      setScore((prev) => Math.min(100, prev + 10));
      setFeedback('좋은 궤적입니다! 반사점(Ictus)을 리드미컬하게 이어나가세요.');
    }
  };

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
    <div className="min-h-full bg-[url('/bg_conductor.png')] bg-cover bg-center bg-fixed text-white px-3 sm:px-6 py-3 flex flex-col relative select-none">
      {/* Background Dark Scrim */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-neutral-950/75 to-black/90 pointer-events-none -z-10"></div>

      <div className="max-w-5xl w-full mx-auto flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 overflow-hidden relative z-10">

        {/* Header Title Banner */}
        <div className="shrink-0 space-y-2">
          <div className="flex flex-row items-center justify-between gap-3 border-b border-neutral-800 pb-3 shrink-0">
            <button
              onClick={onBack}
              className="shrink-0 p-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors active:scale-95 shadow-sm"
              title="뒤로가기"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <h1 className="font-sans font-extrabold text-base sm:text-lg tracking-widest text-white text-center">
              MY LIFE MAESTRO
            </h1>

            <div className="w-8 shrink-0" />
          </div>

          {/* Sub Title Below Line */}
          <div className="space-y-0.5 pt-0.5 pb-1 shrink-0">
            <h2 className="text-lg sm:text-xl font-sans font-extrabold text-amber-400 tracking-wide">
              지휘 동작 튜토리얼
            </h2>
            <p className="text-xs text-white font-medium break-keep">
              올바른 지휘 궤적(Pattern)과 타점(Ictus)을 익히고, 메트로놈과 함께 손짓을 연습해보세요.
            </p>
          </div>
        </div>

        {/* Beat Selector Tabs */}
        <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['4/4', '3/4', '2/4', '1/4'] as BeatType[]).map((beat) => {
            const info = BEAT_TUTORIALS[beat];
            const isSelected = selectedBeat === beat;
            return (
              <button
                key={beat}
                onClick={() => {
                  setSelectedBeat(beat);
                  setActiveBeatIndex(1);
                }}
                className={`px-3 py-2 rounded-xl border text-left transition-all shrink-0 min-w-[112px] ${
                  isSelected
                    ? 'bg-white text-black border-white font-extrabold shadow-md'
                    : 'bg-black/75 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className={`text-xs font-mono font-bold ${isSelected ? 'text-black' : 'text-white'}`}>{info.type}</div>
                <div className={`text-sm font-semibold mt-0.5 ${isSelected ? 'text-black' : 'text-neutral-300'}`}>{info.count}박자 궤적</div>
              </button>
            );
          })}
        </div>

        {/* Main Tutorial Interactive Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:overflow-hidden">

          {/* Left Column: Pattern Diagram & Interactive Practice Canvas */}
          <div className="lg:col-span-7 space-y-3 lg:min-h-0 lg:flex lg:flex-col">
            <div className="bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl relative overflow-hidden lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
              <div className="flex items-center justify-between mb-2 shrink-0 gap-2">
                <h2 className="font-serif font-bold text-lg text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{tutorial.title}</span>
                </h2>
              </div>

              {/* SVG Pattern Guide Visualizer & Practice Canvas */}
              <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:flex-1 lg:min-h-0 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden flex items-center justify-center select-none touch-none">
                
                {/* Background Camera Feed (Optional) */}
                {cameraActive && (
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 transform -scale-x-100"
                    playsInline
                    muted
                  />
                )}

                {/* SVG Guide Path */}
                <svg viewBox="0 0 200 150" className="w-full h-full absolute inset-0 pointer-events-none p-4">
                  {/* Dashed Guide Track */}
                  <path
                    d={tutorial.svgPath}
                    fill="none"
                    stroke="#525252"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />

                  {/* Beat Target Points */}
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
                              ? 'fill-white stroke-neutral-400 stroke-2 animate-ping'
                              : 'fill-neutral-800 stroke-neutral-600 stroke-1'
                          }`}
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isActive ? 9 : 6}
                          className={isActive ? 'fill-white' : 'fill-neutral-700'}
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 22}
                          textAnchor="middle"
                          fill={isActive ? '#ffffff' : '#a3a3a3'}
                          fontSize="10"
                          fontWeight={isActive ? 'bold' : 'normal'}
                          className="font-mono select-none"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Draw Canvas overlay for user gesture tracking */}
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onTouchStart={handleCanvasMouseDown}
                  onTouchMove={handleCanvasMouseMove}
                  onTouchEnd={handleCanvasMouseUp}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                />

                {/* Overlay Prompt Instruction */}
                {!isPracticing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                    <Compass className="w-10 h-10 text-white mb-2 animate-bounce" />
                    <p className="text-white font-semibold text-sm">연습 시작 버튼을 누르거나 마우스/터치로 궤적을 그리세요</p>
                    <p className="text-xs text-neutral-300 mt-1">
                      메트로놈 구령에 맞춰 화면 상의 박자 번호(1➔2➔3➔4) 순서대로 손을 움직입니다.
                    </p>
                  </div>
                )}

                {/* Live Active Beat Indicator Badge */}
                {isPracticing && (
                  <div className="absolute top-3 left-3 bg-black/90 border border-neutral-700 rounded-lg px-3 py-1.5 flex items-center gap-2 z-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-mono font-bold text-neutral-200">
                      현재 박자: <span className="text-base text-white font-serif">{activeBeatIndex}</span> / {tutorial.count}박
                    </span>
                  </div>
                )}
              </div>

              {/* Controls Toolbar: BPM, Metronome, Camera */}
              <div className="mt-3 space-y-2 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-black/80 p-2.5 rounded-xl border border-neutral-800">
                  
                  {/* Play/Stop Button */}
                  <button
                    onClick={() => setIsPracticing(!isPracticing)}
                    className="px-4 py-2 rounded-xl bg-black border border-amber-400 text-amber-400 font-extrabold text-xs flex items-center gap-2 hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    {isPracticing ? <Square className="w-3.5 h-3.5 fill-current text-amber-400" /> : <Play className="w-3.5 h-3.5 fill-current text-amber-400" />}
                    <span>{isPracticing ? '연습 정지' : '지휘 연습 시작'}</span>
                  </button>

                  {/* BPM Slider */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-neutral-400">속도:</span>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-24 accent-white"
                    />
                    <span className="text-xs font-mono font-bold text-white w-12">{bpm} BPM</span>
                  </div>

                  {/* Metronome Sound Toggle */}
                  <button
                    onClick={() => setMetronomeOn(!metronomeOn)}
                    className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                      metronomeOn
                        ? 'bg-neutral-800 border-neutral-600 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                    }`}
                    title="메트로놈 소리"
                  >
                    {metronomeOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>소리 {metronomeOn ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Beat Step-by-Step Guide & Tips */}
          <div className="lg:col-span-5 space-y-3 lg:min-h-0">

            {/* Step-by-Step Beat Breakdown List */}
            <div className="bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-2">
              <h3 className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>박자별 동작 포인트</span>
              </h3>

              <div className="space-y-1.5">
                {tutorial.steps.map((step) => {
                  const isActive = isPracticing && activeBeatIndex === step.beat;
                  return (
                    <div
                      key={step.beat}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-neutral-800 border-white text-white font-semibold shadow-md'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            isActive ? 'bg-white text-black' : 'bg-neutral-800 text-white'
                          }`}>
                            {step.beat}
                          </span>
                          {step.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">{step.direction}</span>
                      </div>
                      <p className="text-xs text-neutral-300 pl-6">{step.tip}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Conducting Pro Tips */}
            <div className="bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1.5 break-keep">
                <HelpCircle className="w-4 h-4 text-white shrink-0" />
                <span>지휘자 핵심 꿀팁 (Ictus & Preparatory Beat)</span>
              </div>
              <ul className="text-[11px] sm:text-xs text-neutral-300 space-y-1 list-disc pl-4 leading-snug break-keep">
                <li><strong className="text-white">예비박(Preparatory Beat):</strong> 첫 박을 내리치기 직전, 1초 전에 위로 손을 올리는 동작으로 연주자들에게 템포와 숨을 미리 알려줍니다.</li>
                <li><strong className="text-white">반사점(Ictus):</strong> 공이 바닥에 튕기듯 정점에 부딪히는 지점입니다. 손끝에 가벼운 탄성을 유지하세요.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
