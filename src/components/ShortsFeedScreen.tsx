import React, { useState, useEffect } from 'react';
import { SIMULATED_SHORTS } from '../data/targetServices';
import { SessionData } from '../types';
import { saveActiveSession } from '../lib/storage';
import { Heart, MessageCircle, Share2, Music, Clock, AlertCircle, ArrowLeft, Volume2, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ShortsFeedScreenProps {
  activeSession: SessionData | null;
  setActiveSession: (session: SessionData | null) => void;
  onNavigateToScreen: (screen: string) => void;
}

export const ShortsFeedScreen: React.FC<ShortsFeedScreenProps> = ({
  activeSession,
  setActiveSession,
  onNavigateToScreen
}) => {
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // 30초 카운트는 모드 B에서 SNS를 클릭해 만들어진 USAGE_ACTIVE 세션에서만 진행한다.
  // (숏폼 화면에 들어왔다는 이유만으로 자동 세션을 만들지 않는다.)
  const isUsageCounting = Boolean(activeSession && activeSession.state === 'USAGE_ACTIVE' && activeSession.usageEndsAt);

  // Countdown timer for Mode B active session (30s physical timer based on focusStartsAt)
  useEffect(() => {
    if (!activeSession) return;
    const targetEndIso = activeSession.focusStartsAt || activeSession.usageEndsAt;
    if (!targetEndIso) return;

    const sessionServiceIds = new Set(
      (activeSession.targetServices ?? []).map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id))
    );
    const isCurrentAppSelected = Boolean(activeSession.activeUsageServiceId && sessionServiceIds.has(activeSession.activeUsageServiceId));

    const updateTimer = () => {
      const now = Date.now();
      const endMs = new Date(targetEndIso).getTime();
      const diffSecs = Math.max(0, Math.ceil((endMs - now) / 1000));
      setSecondsLeft(diffSecs);

      if (diffSecs <= 0) {
        // 이용 시간(30초) 종료 -> 세션 state를 FOCUS_ACTIVE로 전환
        if (activeSession.state !== 'FOCUS_ACTIVE' && activeSession.state !== 'MISSION_ACTIVE') {
          const updatedSession: SessionData = {
            ...activeSession,
            state: 'FOCUS_ACTIVE',
          };
          saveActiveSession(updatedSession);
          setActiveSession(updatedSession);
        }

        // 설정한 (통제 대상) 앱을 이용 중이었다면 시간이 끝나는 즉시 홈 화면으로 튕겨나온다.
        if (isCurrentAppSelected) {
          onNavigateToScreen('phone-home');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeSession, setActiveSession, onNavigateToScreen]);

  // Scroll & Gesture States
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const lastScrollTimeRef = React.useRef<number>(0);

  const currentShort = SIMULATED_SHORTS[currentShortIndex];

  const handleNextShort = () => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 350) return;
    lastScrollTimeRef.current = now;

    setLiked(false);
    setIsSwiping(true);
    setTimeout(() => setIsSwiping(false), 250);
    setCurrentShortIndex((prev) => (prev + 1) % SIMULATED_SHORTS.length);
  };

  const handlePrevShort = () => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 350) return;
    lastScrollTimeRef.current = now;

    setLiked(false);
    setIsSwiping(true);
    setTimeout(() => setIsSwiping(false), 250);
    setCurrentShortIndex((prev) => (prev - 1 + SIMULATED_SHORTS.length) % SIMULATED_SHORTS.length);
  };

  // Wheel Scroll Event Handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) < 15) return;
    if (e.deltaY > 0) {
      handleNextShort(); // Scroll down -> Next video
    } else {
      handlePrevShort(); // Scroll up -> Previous video
    }
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;

    // Minimum swipe distance threshold (35px)
    if (diffY > 35) {
      handleNextShort(); // Swiped up -> Next
    } else if (diffY < -35) {
      handlePrevShort(); // Swiped down -> Previous
    }
    setTouchStartY(null);
  };

  // Keyboard Navigation (Up / Down Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        handleNextShort();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        handlePrevShort();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full flex flex-col max-w-md mx-auto w-full relative p-2">
      {/* Short-form Feed Container with Wheel and Touch Scroll */}
      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-1 min-h-0 rounded-3xl overflow-y-auto overflow-x-hidden shadow-2xl text-white ${currentShort.bgColor} border border-stone-800/80 flex flex-col justify-between select-none cursor-grab active:cursor-grabbing`}
      >
        {/* Animated Background Canvas Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${currentShort.gradient} pointer-events-none opacity-60 animate-pulse`}></div>

        {/* Top Header & Planned Timer Bar */}
        <div className="relative z-20 bg-black/80 backdrop-blur-md border-b border-amber-500/30 pointer-events-auto">
          {/* Real-time Countdown Progress Bar Gauge — 카운트 중일 때만 */}
          {isUsageCounting && (
            <div className="w-full bg-stone-900 h-2.5 relative overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  (secondsLeft ?? 30) <= 5
                    ? 'bg-rose-500 animate-pulse'
                    : (secondsLeft ?? 30) <= 10
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, ((secondsLeft ?? 30) / 30) * 100))}%`
                }}
              />
            </div>
          )}

          <div className="p-2.5 sm:p-3.5 flex items-center justify-between gap-1.5">
            <button
              onClick={() => onNavigateToScreen('phone-home')}
              className="p-1.5 sm:p-2 rounded-full bg-stone-800/80 text-stone-200 hover:bg-stone-700 transition-colors flex items-center gap-1 text-xs font-medium shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>나가기</span>
            </button>

            {/* Persistent Status Toast Bar in App Header (활동 시간 30초 진행 중에만 표시, 0초 종료 시 숨김) */}
            {activeSession && secondsLeft !== null && secondsLeft > 0 && (
              <div className="flex items-center justify-between gap-2 bg-amber-950/90 border border-amber-500/50 px-3 py-1.5 rounded-full shadow-lg shrink-0 text-xs">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] truncate">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                  <span>활동 모드 실행 중</span>
                </span>
                <span className="font-mono font-bold text-amber-400 shrink-0 text-[11px]">
                  {`${secondsLeft}초`}
                </span>
              </div>
            )}

            <div className="w-4 sm:w-8 shrink-0" />
          </div>
        </div>

        {/* Center Short-form Video Graphic Visualizer */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className={`w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-300 font-serif text-4xl shadow-2xl transition-transform duration-300 ${
            isSwiping ? 'scale-110 rotate-12' : 'animate-spin-slow'
          }`}>
            ♩
          </div>

          <div className="space-y-1 max-w-xs">
            <span className="text-xs px-2.5 py-1 rounded-full bg-black/60 text-amber-300 border border-amber-500/30">
              {currentShort.serviceId.toUpperCase()} SHORTS REEL #{currentShortIndex + 1}
            </span>
            <p className="text-sm font-semibold text-stone-200 px-4 leading-snug">
              {currentShort.caption}
            </p>
          </div>

          {/* Swipe / Wheel Scroll Hint Cue */}
          <div className="pt-2 flex flex-col items-center gap-1 opacity-80 animate-bounce text-amber-300 text-xs">
            <div className="px-3 py-1 bg-black/70 rounded-full border border-amber-500/30 text-[11px] font-medium flex items-center gap-1.5">
              <span>↕ 위아래 스와이프 및 휠 스크롤</span>
            </div>
          </div>
        </div>

        {/* Right Side Engagement Buttons */}
        <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-5">
          <button
            onClick={() => setLiked(!liked)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              liked ? 'bg-rose-600 text-white' : 'bg-black/50 text-stone-200 hover:bg-black/70'
            }`}>
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-semibold">{currentShort.likes}</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-stone-200 hover:bg-black/70">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold">{currentShort.comments}</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-stone-200 hover:bg-black/70">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold">공유</span>
          </button>
        </div>

        {/* Bottom Creator Info Bar */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center">
              {currentShort.creator[0]}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">{currentShort.creator}</div>
              <div className="text-[10px] text-stone-400">{currentShort.handle}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300/90 font-serif">
            <Music className="w-3.5 h-3.5" />
            <span className="truncate">{currentShort.musicTitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
