import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { SessionData } from '../types';
import { TARGET_SERVICES } from '../data/targetServices';
import { saveActiveSession } from '../lib/storage';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Sparkles, Clock, Lock, ArrowRight, Search, Phone, MessageCircle, Compass, Sun, AppWindow } from 'lucide-react';

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

  const isGuidedReady = Boolean(activeSession && activeSession.state === 'GUIDED_READY');
  const isUsageActive = Boolean(activeSession && (activeSession.state === 'USAGE_ACTIVE' || activeSession.state === 'EXTENSION_ACTIVE'));
  const isLocked = Boolean(activeSession && (activeSession.state === 'FOCUS_ACTIVE' || activeSession.state === 'MISSION_ACTIVE' || activeSession.state === 'INTERVENTION'));

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
    setIsLaunchingApp(true);
    audioSynthesizer.playBatonSwingSound();

    // Auto transition to 'home' (우리 어플의 기본 홈 탭) screen after splash animation
    setTimeout(() => {
      setIsLaunchingApp(false);
      onNavigateToScreen('home');
    }, 1800);
  };

  const handleAppIconClick = (serviceId: string) => {
    if (isLocked) {
      onOpenIntervention();
      return;
    }

    if (isGuidedReady && activeSession) {
      const now = new Date();
      const TEST_USAGE_SECONDS = 30;
      const usageEndsAtIso = new Date(now.getTime() + TEST_USAGE_SECONDS * 1000).toISOString();
      const focusEndsAtIso = new Date(now.getTime() + (TEST_USAGE_SECONDS * 1000) + (activeSession.focusDurationMinutes * 60 * 1000)).toISOString();

      const updatedSession: SessionData = {
        ...activeSession,
        state: 'USAGE_ACTIVE',
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
      return;
    }

    onNavigateToScreen('shorts');
  };

  return (
    <div className="max-w-md mx-auto w-full px-2 py-4">
      {/* Smartphone Outer Container */}
      <div className="bg-stone-950 rounded-[2.5rem] border-4 border-stone-800 shadow-2xl overflow-hidden relative text-white min-h-[680px] flex flex-col justify-between select-none">
        
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
        <div className="relative px-5 pt-3 pb-4 flex-1 bg-gradient-to-b from-stone-900 via-amber-950/20 to-stone-950 flex flex-col justify-between">
          
          {/* Top Home Widget: Weather & Date */}
          <div className="space-y-3 relative z-10">
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
          <div className="grid grid-cols-4 gap-y-5 gap-x-3 my-auto relative z-10 py-4">
            
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

                  {/* Lock Overlay Badge */}
                  {isLocked && (
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
          <div className="mt-auto py-2 text-center text-[11px] text-amber-300/80 bg-stone-900/60 border border-amber-900/40 rounded-xl px-3 font-medium">
            💡 <strong>'내인생지휘자'</strong> 어플 아이콘을 터치하여 디톡스 홈 화면으로 들어가세요
          </div>

          {/* Smartphone Bottom Fixed App Dock */}
          <div className="mt-4 pt-3 border-t border-stone-800/60 flex items-center justify-around bg-stone-900/80 backdrop-blur-md rounded-2xl px-2 py-2 shadow-xl">
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

        {/* App Opening / Splash Animation Overlay Screen */}
        {isLaunchingApp && (
          <div
            onClick={() => {
              setIsLaunchingApp(false);
              onNavigateToScreen('home');
            }}
            className="absolute inset-0 z-50 bg-stone-950 flex flex-col items-center justify-between p-8 text-center animate-fade-in cursor-pointer select-none overflow-hidden"
          >
            {/* Dramatic Orchestra Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/30 via-amber-950/40 to-stone-950 pointer-events-none"></div>

            {/* Glowing Orchestra Stage Rays */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            <div className="pt-8 z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono text-amber-300">
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

              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-black tracking-tight text-amber-100 drop-shadow-md">
                  내 인생 지휘자
                </h1>
                <p className="text-xs text-amber-300/80 font-serif leading-relaxed px-4">
                  디지털 도파민 피드에서 벗어나,<br />
                  당신의 라이프 스타일을 품격 있게 연주하세요.
                </p>
              </div>
            </div>

            {/* Bottom Progress Loading Bar */}
            <div className="pb-8 z-10 w-full max-w-xs space-y-3">
              <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-amber-900/50">
                <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-full animate-pulse rounded-full"></div>
              </div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 font-medium">
                <span>클래식 오케스트라 약속 세션 진입 중...</span>
                <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
