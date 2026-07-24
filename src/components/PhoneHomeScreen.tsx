import React, { useState, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { SessionData } from '../types';
import { TARGET_SERVICES } from '../data/targetServices';
import { saveActiveSession } from '../lib/storage';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Sparkles, Clock, Lock, ArrowRight, Search, Phone, MessageCircle, Compass, Sun, AppWindow, ShieldCheck } from 'lucide-react';

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

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

      if (activeSession) {
        let targetEndMs = 0;
        if (isUsageActive && activeSession.usageEndsAt) {
          targetEndMs = new Date(activeSession.usageEndsAt).getTime();
        } else if (isLocked && activeSession.focusEndsAt) {
          targetEndMs = new Date(activeSession.focusEndsAt).getTime();
        }

        if (targetEndMs > 0) {
          const diff = Math.max(0, targetEndMs - now.getTime());
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
  }, [activeSession, isGuidedReady, isUsageActive, isLocked]);

  // Launch Conductor App with Splash Screen Transition
  const handleLaunchConductorApp = () => {
    // 디톡스 진행 중(모드 A 잠금 또는 모드 B 활동 중 잠금)에는 앱을 실행하지 않고, 안내 알림을 3초간 띄운다.
    if (isLocked || isModeBActive) {
      audioSynthesizer.playBatonSwingSound();
      setShowLockedNotice(true);
      if (lockedNoticeTimer.current) clearTimeout(lockedNoticeTimer.current);
      lockedNoticeTimer.current = setTimeout(() => setShowLockedNotice(false), 3000);
      return;
    }

    setIsLaunchingApp(true);
    audioSynthesizer.playBatonSwingSound();

    // Auto transition to 'home' (우리 어플의 기본 홈 탭) screen after splash animation
    setTimeout(() => {
      setIsLaunchingApp(false);
      onNavigateToScreen('home');
    }, 1800);
  };

  // 클릭한 그 SNS에 대해 30초 이용 카운트를 (재)시작한다.
  const startUsageForService = (serviceId: string) => {
    if (!activeSession) return;
    const now = new Date();
    const TEST_USAGE_SECONDS = 30;
    const usageEndsAtIso = new Date(now.getTime() + TEST_USAGE_SECONDS * 1000).toISOString();
    const focusEndsAtIso = new Date(now.getTime() + (TEST_USAGE_SECONDS * 1000) + (activeSession.focusDurationMinutes * 60 * 1000)).toISOString();

    const updatedSession: SessionData = {
      ...activeSession,
      state: 'USAGE_ACTIVE',
      activeUsageServiceId: serviceId,
      usageStartsAt: now.toISOString(),
      usageEndsAt: usageEndsAtIso,
      focusStartsAt: usageEndsAtIso,
      focusEndsAt: focusEndsAtIso
    };

    saveActiveSession(updatedSession);
    if (setActiveSession) {
      setActiveSession(updatedSession);
    }
    audioSynthesizer.playBatonSwingSound();
    onNavigateToScreen('shorts');
  };

  const handleAppIconClick = (serviceId: string) => {
    // 모드 A: 선택되어 잠긴 앱을 다시 실행하려 하면 개입 → 지휘 미션으로 이어진다.
    if (isServiceLocked(serviceId)) {
      audioSynthesizer.playBatonSwingSound();
      onOpenIntervention();
      return;
    }

    // 모드 B: 세션이 진행 중일 때 클릭한 '그 소셜 SNS'에 대해 30초 이용 카운트를 시작한다.
    if (isModeBActive) {
      startUsageForService(serviceId);
      return;
    }

    // 그 외(모드 B 세션이 아님) → 카운트 없이 숏폼만 표시.
    onNavigateToScreen('shorts');
  };

  return (
    <div className="h-full flex flex-col max-w-md mx-auto w-full px-2 py-2">
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
                  7월 24일 금요일
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
                  <span>디톡스 모드 가동 중</span>
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
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-stone-900 p-0.5 shadow-xl flex items-center justify-center relative ring-2 ring-amber-400 shadow-amber-500/40 transition-all group-hover:scale-105 group-active:scale-95">
                <div className="w-full h-full bg-stone-950/80 rounded-[14px] flex items-center justify-center text-amber-300 font-serif text-2xl">
                  𝄞
                </div>
                <div className="absolute -top-1.5 -right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[8px] shadow animate-pulse">
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
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-400/60 flex items-center justify-center text-stone-950 text-xl font-serif font-bold shadow-lg animate-pulse"
              title="내인생지휘자 앱 열기"
            >
              𝄞
            </button>
          </div>

        </div>

        {/* Locked (Detox mode) Notice — 3초간 떴다 사라짐. 앱 실행 대신 안내 */}
        {showLockedNotice && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm animate-fade-in select-none touch-none px-6">
            <div className="w-full max-w-[15rem] rounded-3xl border border-amber-500/40 bg-stone-900/95 p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-400 animate-pulse">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-serif text-lg font-bold text-amber-100 break-keep">디톡스 모드 가동 중</h2>
              <p className="mt-1.5 text-xs leading-snug text-stone-300 break-keep">
                지금은 집중 약속 시간이에요.<br />잠금이 끝난 뒤 앱을 실행할 수 있어요.
              </p>
              {timeRemaining !== '00:00:00' && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-stone-950/80 px-3 py-1 text-xs font-mono font-bold text-amber-300">
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
            className="absolute inset-0 z-50 bg-stone-950 bg-cover bg-center flex flex-col items-center justify-between p-8 text-center animate-fade-in select-none overflow-hidden touch-none"
            style={{ backgroundImage: "url('/bg_conductor.png')" }}
          >
            {/* Legibility scrim over the background image */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/45 to-stone-950/85 pointer-events-none"></div>
            {/* Center vignette so the title/logo lift off the image */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.55)_0%,_rgba(0,0,0,0.15)_45%,_transparent_75%)] pointer-events-none"></div>

            {/* Glowing Orchestra Stage Rays */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            <div className="pt-8 z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-950/50 backdrop-blur-md border border-amber-500/40 text-[11px] font-mono text-amber-200 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CONDUCTOR OF MY LIFE</span>
              </div>
            </div>

            {/* Center Orchestra Conductor Visual */}
            <div className="z-10 my-auto flex flex-col items-center space-y-6">
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-b from-amber-500/30 to-amber-950/60 p-1 border-2 border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center">
                <svg className="w-24 h-24 text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="2.5" />
                  <path d="M8 21v-5a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v5" />
                  <path d="M8 12L4 8" />
                  <path d="M16 12l5-5" />
                  <line x1="21" y1="7" x2="23" y2="5" stroke="#fef08a" strokeWidth="2.5" />
                </svg>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-300 animate-ping opacity-75"></div>
              </div>

              <div className="space-y-2 rounded-2xl bg-stone-950/55 backdrop-blur-md border border-amber-500/20 px-6 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
                <h1 className="text-3xl font-serif font-black tracking-tight text-amber-50 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  내 인생 지휘자
                </h1>
                <p className="text-xs text-amber-100/90 font-serif leading-relaxed px-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                  디지털 도파민 피드에서 벗어나,<br />
                  당신의 라이프 스타일을 품격 있게 연주하세요.
                </p>
              </div>
            </div>

            {/* Bottom Progress Loading Bar */}
            <div className="pb-8 z-10 w-full max-w-xs">
              <div className="rounded-2xl bg-stone-950/55 backdrop-blur-md border border-amber-500/20 px-5 py-3.5 space-y-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
                <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-amber-900/50">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-full animate-pulse rounded-full"></div>
                </div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-amber-200 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
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
