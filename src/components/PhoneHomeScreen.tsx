import React, { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { SessionData } from '../types';
import { TARGET_SERVICES } from '../data/targetServices';
import { saveActiveSession } from '../lib/storage';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Sparkles, Clock, Lock, ArrowRight, Search, Phone, MessageCircle, Compass, Sun, AppWindow, ShieldCheck } from 'lucide-react';

// 요일별(0=일 … 6=토) 오늘의 한마디 — 지휘·시간·삶을 아우르는 명언
const CONDUCTOR_QUOTES: Array<{ en: string; ko: string; author: string }> = [
  { // 일요일
    en: 'The art of conducting is the art of knowing when to stop.',
    ko: '지휘의 예술은 언제 멈춰야 하는지를 아는 예술이다.',
    author: '헤르베르트 폰 카라얀',
  },
  { // 월요일
    en: 'Either you run the day, or the day runs you.',
    ko: '당신이 하루를 이끌든지, 하루가 당신을 끌고 다니든지 둘 중 하나다.',
    author: '짐 론',
  },
  { // 화요일
    en: 'The future depends on what you do today.',
    ko: '미래는 오늘 무엇을 하는가에 달려 있다.',
    author: '마하트마 간디',
  },
  { // 수요일
    en: 'It is not that we have a short time to live, but that we waste much of it.',
    ko: '우리에게 주어진 시간이 짧은 것이 아니라, 그 시간을 너무 많이 낭비하고 있을 뿐이다.',
    author: '세네카',
  },
  { // 목요일
    en: 'Your time is limited, so don’t waste it living someone else’s life.',
    ko: '당신의 시간은 한정되어 있다. 그러니 다른 사람의 삶을 사느라 낭비하지 마라.',
    author: '스티브 잡스',
  },
  { // 금요일
    en: 'To achieve great things, two things are needed: a plan, and not quite enough time.',
    ko: '위대한 일을 이루기 위해서는 두 가지가 필요하다. 계획과, 넉넉하지 않은 시간이다.',
    author: '레너드 번스타인',
  },
  { // 토요일
    en: 'Music has the power to transform lives.',
    ko: '음악은 사람의 삶을 변화시키는 힘이 있다.',
    author: '구스타보 두다멜',
  },
];

interface PhoneHomeScreenProps {
  activeSession: SessionData | null;
  setActiveSession?: (session: SessionData | null) => void;
  onOpenIntervention: () => void;
  onNavigateToScreen: (screen: string) => void;
  user: User | null;
}

export const PhoneHomeScreen: React.FC<PhoneHomeScreenProps> = ({
  activeSession,
  setActiveSession,
  onOpenIntervention,
  onNavigateToScreen,
  user
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLaunchingApp, setIsLaunchingApp] = useState<boolean>(false);
  const [showLockedNotice, setShowLockedNotice] = useState<boolean>(false);
  const lockedNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 알림 타이머 정리
  useEffect(() => () => {
    if (lockedNoticeTimer.current) clearTimeout(lockedNoticeTimer.current);
  }, []);

  const isGuidedReady = Boolean(activeSession && activeSession.state === 'GUIDED_READY');
  const isUsageActive = Boolean(activeSession && (activeSession.state === 'USAGE_ACTIVE' || activeSession.state === 'EXTENSION_ACTIVE'));
  const isLocked = Boolean(activeSession && (activeSession.state === 'FOCUS_ACTIVE' || activeSession.state === 'MISSION_ACTIVE' || activeSession.state === 'INTERVENTION'));

  // 세션에서 선택한 대상 앱 id 집합. targetServices는 객체/문자열 모두 방어적으로 처리.
  const sessionServiceIds = new Set(
    (activeSession?.targetServices ?? []).map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id))
  );
  const isServiceLocked = (serviceId: string) => isLocked && sessionServiceIds.has(serviceId);
  // 모드 B(활동 중 잠금) 세션이 진행 중인지
  const isModeBActive = Boolean(
    activeSession &&
    activeSession.mode === 'GUIDED_USE' &&
    (activeSession.state === 'GUIDED_READY' || activeSession.state === 'USAGE_ACTIVE' || activeSession.state === 'EXTENSION_ACTIVE')
  );

  // 오늘 요일(0=일 … 6=토)에 맞는 명언
  const todayQuote = CONDUCTOR_QUOTES[new Date().getDay()];

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

      if (activeSession) {
        const nowMs = now.getTime();
        const focusStartsMs = activeSession.focusStartsAt ? new Date(activeSession.focusStartsAt).getTime() : 0;
        const focusEndsMs = activeSession.focusEndsAt ? new Date(activeSession.focusEndsAt).getTime() : 0;

        // 활동 중 잠금 모드(GUIDED_USE)이고 아직 활동 시간(focusStartsAt 전)인 경우
        if (activeSession.mode === 'GUIDED_USE' && focusStartsMs > 0 && nowMs < focusStartsMs) {
          const diff = Math.max(0, focusStartsMs - nowMs);
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeRemaining(
            `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
          );
        } else if (focusEndsMs > 0 && nowMs < focusEndsMs) {
          // 활동 시간이 끝났거나 바로 잠금 모드인 경우 -> 잠금 시간 타이머 진행
          // 활동 시간 종료 시 자동으로 state를 FOCUS_ACTIVE로 업데이트
          if (activeSession.mode === 'GUIDED_USE' && activeSession.state !== 'FOCUS_ACTIVE' && activeSession.state !== 'MISSION_ACTIVE') {
            const updatedSession: SessionData = {
              ...activeSession,
              state: 'FOCUS_ACTIVE',
            };
            saveActiveSession(updatedSession);
            setActiveSession(updatedSession);
          }

          const diff = Math.max(0, focusEndsMs - nowMs);
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeRemaining(
            `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
          );
        } else {
          setTimeRemaining('00:00:00');
        }
      } else {
        setTimeRemaining('00:00:00');
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isGuidedReady, isUsageActive, isLocked, setActiveSession]);

  // Launch Conductor App with Splash Screen Transition
  const handleLaunchConductorApp = () => {
    setIsLaunchingApp(true);
    audioSynthesizer.playBatonSwingSound();

    setTimeout(() => {
      setIsLaunchingApp(false);
      if (activeSession?.mode === 'FOCUS_NOW' && isLocked) {
        onNavigateToScreen('home:mode-a');
      } else if (activeSession?.mode === 'GUIDED_USE') {
        onNavigateToScreen('home:mode-b');
      } else {
        onNavigateToScreen('home');
      }
    }, 800);
  };

  const handleAppIconClick = (serviceId: string) => {
    // 모드 A/B 잠금 기간 중: '잠금할 앱 선택'에서 선택했던 대상 앱일 때만 개입/미션으로 진입
    if (isLocked) {
      if (sessionServiceIds.has(serviceId)) {
        audioSynthesizer.playBatonSwingSound();
        onOpenIntervention();
        return;
      }
    }

    // 세션에 현재 클릭한 서비스 ID 저장 후 숏폼 진입
    if (activeSession) {
      const updatedSession: SessionData = {
        ...activeSession,
        activeUsageServiceId: serviceId,
      };
      saveActiveSession(updatedSession);
      if (setActiveSession) {
        setActiveSession(updatedSession);
      }
    }

    // 정상 진입 (숏폼 화면)
    audioSynthesizer.playBatonSwingSound();
    onNavigateToScreen('shorts');
  };

  return (
    <div className="min-h-full flex flex-col max-w-md mx-auto w-full px-2 py-2">
      {/* Smartphone Outer Container */}
      <div className="bg-stone-950 rounded-[2.5rem] border-4 border-stone-800 shadow-2xl overflow-hidden relative text-white flex-1 min-h-0 flex flex-col justify-between select-none">
        
        {/* Top Status Bar (Native Smartphone Look) */}
        <div className="pt-3 pb-1 px-6 flex items-center justify-between text-xs text-stone-300 z-20">
          <span className="font-semibold tracking-tight">{currentTime || '09:41'}</span>
          <div className="w-16 h-4 bg-stone-900 rounded-full border border-stone-800 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-stone-700"></span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Smartphone Home Screen Wallpaper Content */}
        <div className="relative px-5 pt-2 pb-3 flex-1 min-h-0 bg-gradient-to-b from-stone-900 via-amber-950/20 to-stone-950 flex flex-col justify-between">

          {/* Top Home Widget: Weather & Date */}
          <div className="space-y-2 relative z-10">
            <div className="bg-stone-900/80 backdrop-blur-md border border-stone-800/80 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] font-medium text-amber-300/90 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>오늘의 스마트폰 홈</span>
                </div>
                <div className="text-xs text-stone-300 font-semibold">
                  {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-serif font-bold text-amber-100">{currentTime || '09:41'}</div>
                <div className="text-[10px] text-stone-400">서울 24°C</div>
              </div>
            </div>

            {/* Quick Search Widget */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-full px-4 py-2 flex items-center gap-2 text-stone-400 text-xs shadow-inner">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px]">어플 및 웹 검색...</span>
            </div>
          </div>

          {/* Active Session Badge Notification Toast (If active) */}
          {activeSession && (
            <div className="my-2 p-3 bg-amber-950/80 border border-amber-500/50 rounded-2xl text-xs text-amber-200 shadow-xl z-10 space-y-1">
              <div className="font-bold text-amber-300 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {activeSession.mode === 'FOCUS_NOW'
                      ? '바로 잠금 모드 실행 중'
                      : isLocked
                      ? '잠금 모드 실행 중'
                      : '활동 모드 실행 중'}
                  </span>
                </span>
                <span className="font-mono text-amber-400">{timeRemaining}</span>
              </div>
              <p className="text-[10px] text-stone-300">
                {activeSession.focusTask}
              </p>
            </div>
          )}

          {/* Smartphone Apps Grid (3 Rows x 4 Columns) */}
          <div className="grid grid-cols-4 gap-y-3 gap-x-3 my-auto relative z-10 py-2">
            
            {/* Target Social Apps */}
            {TARGET_SERVICES.map(app => (
              <button
                key={app.id}
                onClick={() => handleAppIconClick(app.id)}
                className="flex flex-col items-center gap-1.5 group relative"
              >
                <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${app.color} p-0.5 shadow-lg relative flex items-center justify-center transition-transform group-active:scale-90 ${
                  isGuidedReady ? 'ring-2 ring-emerald-400 shadow-emerald-500/20' : ''
                }`}>
                  <div className="w-full h-full bg-stone-900/40 rounded-[14px] flex items-center justify-center text-white font-bold text-lg">
                    {app.name[0]}
                  </div>

                  {/* Lock Overlay Badge — 선택된 대상 앱만 */}
                  {isServiceLocked(app.id) && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl backdrop-blur-[1px] flex flex-col items-center justify-center border border-amber-500/50">
                      <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-[8px] font-bold text-amber-300 mt-0.5">잠김</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium text-stone-200 truncate w-14 text-center">
                  {app.name}
                </span>
              </button>
            ))}

            {/* Smartphone Utility Apps */}
            <div className="flex flex-col items-center gap-1.5 opacity-80 cursor-pointer">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-stone-700 to-stone-800 p-0.5 shadow-md flex items-center justify-center text-amber-300 text-xl">
                📷
              </div>
              <span className="text-[11px] font-medium text-stone-300">카메라</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 opacity-80 cursor-pointer">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-stone-700 to-stone-800 p-0.5 shadow-md flex items-center justify-center text-amber-300 text-xl">
                🎵
              </div>
              <span className="text-[11px] font-medium text-stone-300">음악</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 opacity-80 cursor-pointer">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-stone-700 to-stone-800 p-0.5 shadow-md flex items-center justify-center text-amber-300 text-xl">
                📝
              </div>
              <span className="text-[11px] font-medium text-stone-300">메모</span>
            </div>

            {/* OUR PRIMARY APP ICON: "내인생지휘자" */}
            <button
              onClick={handleLaunchConductorApp}
              className="flex flex-col items-center gap-1.5 group relative"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 relative transition-all group-hover:scale-105 group-active:scale-95">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl shadow-amber-500/40">
                  <img src="/app_icon.png" alt="내인생지휘자 앱" className="w-full h-full object-cover" draggable={false} />
                </div>
                <div className="absolute -top-1.5 -right-1 z-10 px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[8px] shadow animate-pulse">
                  APP
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-300 truncate w-16 text-center">
                내인생지휘자
              </span>
            </button>
          </div>

          {/* Hint Footer Toast */}
          <div className="mt-auto py-1.5 text-center text-[10px] text-amber-300/80 bg-stone-900/60 border border-amber-900/40 rounded-xl px-3 font-medium break-keep leading-snug">
            💡 <strong>'내인생지휘자'</strong> 어플 아이콘을 터치하여 디톡스 홈 화면으로 들어가세요
          </div>

          {/* Smartphone Bottom Fixed App Dock */}
          <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center justify-around bg-stone-900/80 backdrop-blur-md rounded-2xl px-2 py-1.5 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow">
              <Phone className="w-5 h-5" />
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center text-white text-lg shadow">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-600 flex items-center justify-center text-white text-lg shadow">
              <Compass className="w-5 h-5" />
            </div>
            <button
              onClick={handleLaunchConductorApp}
              className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-amber-500/30 ring-1 ring-amber-500/40 animate-pulse"
              title="내인생지휘자 앱 열기"
            >
              <img src="/app_icon.png" alt="내인생지휘자 앱" className="w-full h-full object-cover" draggable={false} />
            </button>
          </div>

        </div>

        {/* Locked (Detox mode) Notice — 3초간 떴다 사라짐. 앱 실행 대신 안내 */}
        {showLockedNotice && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in select-none touch-none px-6">
            <div className="w-full max-w-[15rem] rounded-3xl border border-neutral-700 bg-neutral-900/95 p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-neutral-800 text-white animate-pulse">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-serif text-lg font-bold text-white break-keep">
                {activeSession?.mode === 'FOCUS_NOW'
                  ? '바로 잠금 모드 실행 중'
                  : '잠금 모드 실행 중'}
              </h2>
              <p className="mt-1.5 text-xs leading-snug text-neutral-300 break-keep">
                지금은 집중 약속 시간이에요.<br />잠금이 끝난 뒤 앱을 실행할 수 있어요.
              </p>
              {timeRemaining !== '00:00:00' && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-black/80 px-3 py-1 text-xs font-mono font-bold text-white">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{timeRemaining}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* App Opening / Splash Animation Overlay Screen */}
        {isLaunchingApp && (
          <div
            className="absolute inset-0 z-50 bg-black bg-cover bg-center flex flex-col items-center justify-between p-8 text-center animate-fade-in select-none overflow-hidden touch-none"
            style={{ backgroundImage: "url('/bg_conductor.png')" }}
          >
            {/* Legibility scrim over the background image */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/85 pointer-events-none"></div>
            {/* Center vignette so the title/logo lift off the image */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.6)_0%,_rgba(0,0,0,0.2)_45%,_transparent_75%)] pointer-events-none"></div>

            {/* Glowing Orchestra Stage Rays */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            {/* Top Title Card: MY LIFE MAESTRO */}
            <div className="pt-8 z-10 w-full max-w-xs">
              <div className="space-y-2 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-700 px-6 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.65)] text-center">
                <h1 className="text-lg sm:text-xl font-sans font-extrabold tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-center">
                  MY LIFE MAESTRO
                </h1>
                <p className="text-xs text-neutral-300 font-serif leading-relaxed px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  디지털 도파민 피드에서 벗어나,<br />
                  당신의 라이프 스타일을 품격 있게 연주하세요.
                </p>
              </div>
            </div>

            {/* Daily Quote — 프레임 없이 화면을 채우는 오늘의 한마디 */}
            <div className="z-10 w-full px-2 text-center">
              <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-amber-300 drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
                <span className="text-base text-amber-400">𝄞</span>
                <span>오늘의 한마디</span>
              </div>
              <span className="pointer-events-none block select-none font-serif text-6xl leading-none text-amber-400/40 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">“</span>
              <p className="-mt-2 font-serif text-lg sm:text-2xl italic font-semibold leading-snug text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.98)]">
                {todayQuote.en}
              </p>
              <p className="mt-4 text-base sm:text-xl font-medium leading-relaxed text-amber-100 break-keep drop-shadow-[0_2px_10px_rgba(0,0,0,0.98)]">
                {todayQuote.ko}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2.5">
                <span className="h-px w-8 bg-amber-400/60"></span>
                <span className="text-sm font-bold text-amber-300 break-keep drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">{todayQuote.author}</span>
                <span className="h-px w-8 bg-amber-400/60"></span>
              </div>
            </div>

            {/* Bottom Progress Loading Bar */}
            <div className="pb-8 z-10 w-full max-w-xs">
              <div className="rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-700 px-5 py-3.5 space-y-3 shadow-[0_8px_40px_rgba(0,0,0,0.65)]">
                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-700">
                  <div className="bg-gradient-to-r from-neutral-400 via-white to-neutral-400 h-full w-full animate-pulse rounded-full"></div>
                </div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-white font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  <span>클래식 오케스트라 약속 세션 진입 중...</span>
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
