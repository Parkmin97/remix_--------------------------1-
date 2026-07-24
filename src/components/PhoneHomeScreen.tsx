import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { SessionData } from '../types';
import { TARGET_SERVICES } from '../data/targetServices';
import { saveActiveSession } from '../lib/storage';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Lock, Unlock, Sparkles, Clock, Music, ArrowRight } from 'lucide-react';

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
    // 로그인하지 않았으면 먼저 로그인 화면으로 보낸다.
    if (!user) {
      onNavigateToScreen('login');
      return;
    }

    setIsLaunchingApp(true);
    audioSynthesizer.playBatonSwingSound();

    // Auto transition to 'home' (약속 설정) screen after splash animation
    setTimeout(() => {
      setIsLaunchingApp(false);
      onNavigateToScreen('home');
    }, 1800);
  };

  const handleAppIconClick = (serviceId: string) => {
    if (isLocked) {
      // Trigger intervention screen for soft-locked mode
      onOpenIntervention();
      return;
    }

    if (isGuidedReady && activeSession) {
      // Mode B: User clicks social app in unlocked home screen -> Start usage timer countdown now & launch shorts! (Fixed to 30s for testing)
      const now = new Date();
      const TEST_USAGE_SECONDS = 30; // 테스트용 30초 사용 고정
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

    // General access or usage active mode
    onNavigateToScreen('shorts');
  };

  return (
    <div className="max-w-md mx-auto w-full px-2">
      {/* Mobile Screen Container - Clean Native Mobile View */}
      <div className="bg-stone-950 rounded-3xl border border-stone-800/80 shadow-2xl overflow-hidden relative text-white min-h-[640px] flex flex-col justify-between">
        
        {/* Top Mobile Status Header Bar */}
        <div className="bg-stone-950/90 backdrop-blur-md pt-3 pb-2 px-5 flex items-center justify-between text-[11px] text-stone-300 select-none z-20 border-b border-stone-800/50">
          <span className="font-semibold">{currentTime || '09:41'}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-amber-400 font-medium">모바일 홈 Screen</span>
            <div className="flex items-center gap-1 text-[10px]">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Status Banner Overlay */}
        <div className="p-3 bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/90 border-b border-amber-600/30 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
              isGuidedReady
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isUsageActive
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : isLocked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">
                {isGuidedReady
                  ? '모드 B: 소셜 어플 선택 대기 중 (잠금 해제)'
                  : isUsageActive
                  ? '약속 사용 시간 카운트다운 진행 중'
                  : isLocked
                  ? '소프트 앱 잠금 가동 중'
                  : '자유 이용 가능'}
              </div>
              <div className="text-[10px] text-amber-400 font-mono">
                {isGuidedReady && `클릭 시 30초 타이머 시작 (테스트 고정)`}
                {isUsageActive && `남은 사용 시간: ${timeRemaining}`}
                {isLocked && `남은 집중 약속: ${timeRemaining}`}
                {!activeSession && '활성 세션 없음'}
              </div>
            </div>
          </div>

          <button
            onClick={isLocked ? onOpenIntervention : handleLaunchConductorApp}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-[10px] transition-all"
          >
            {isLocked ? '잠금 해제 미션' : '약속 설정'}
          </button>
        </div>

        {/* Smartphone Wallpaper & Widgets Canvas */}
        <div className="relative p-6 flex-1 bg-gradient-to-b from-stone-900 via-amber-950/30 to-stone-950 flex flex-col justify-between min-h-[500px]">
          {/* Musical Staff Background watermark */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col justify-around py-8">
            <div className="w-full h-px bg-amber-400"></div>
            <div className="w-full h-px bg-amber-400"></div>
            <div className="w-full h-px bg-amber-400"></div>
            <div className="w-full h-px bg-amber-400"></div>
            <div className="w-full h-px bg-amber-400"></div>
          </div>

          {/* Clock & Mission Widget */}
          <div className="text-center py-2 space-y-1 relative z-10">
            <div className="text-4xl font-serif font-bold tracking-tight text-amber-100">
              {currentTime || '09:41'}
            </div>
            <div className="text-xs text-amber-300/80 font-medium">
              2026년 7월 23일 목요일
            </div>

            {/* Guided Ready Banner Widget */}
            {isGuidedReady && (
              <div className="mt-3 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl text-left text-xs text-emerald-200 space-y-1.5 shadow-xl animate-fade-in">
                <div className="font-bold text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>의도 기반 자율 이용 (잠금 해제 상태)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-mono border border-emerald-400/40">
                    테스트 30초 고정 (원래 약속: {activeSession?.usageLimitMinutes || 15}분)
                  </span>
                </div>
                <p className="text-[11px] text-stone-200 leading-relaxed">
                  원하는 <strong>소셜 어플 아이콘을 클릭</strong>하는 순간 <strong>테스트용 30초 카운트다운</strong>이 시작되고 피드로 연결됩니다!
                </p>
                {activeSession?.usageIntent && (
                  <div className="text-[10px] text-emerald-300/80 pt-1 border-t border-emerald-800/40">
                    🎯 선언한 이용 목적: "{activeSession.usageIntent}"
                  </div>
                )}
              </div>
            )}

            {/* Usage Active Banner Widget */}
            {isUsageActive && (
              <div className="mt-3 p-3 bg-amber-950/70 border border-amber-500/50 rounded-2xl text-left text-xs text-amber-200 space-y-1 animate-fade-in">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>사용 시간 카운트다운 진행 중</span>
                </div>
                <div className="text-[11px] text-stone-300">
                  약속한 {activeSession?.usageLimitMinutes}분이 만료되면 자동으로 소프트 앱 잠금이 활성화됩니다.
                </div>
              </div>
            )}

            {/* Focus Active Banner Widget */}
            {isLocked && (
              <div className="mt-3 p-3 bg-amber-950/60 border border-amber-500/40 rounded-2xl text-left text-xs text-amber-200 space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" />
                  <span>오늘의 집중 약속: {activeSession?.focusTask}</span>
                </div>
                <div className="text-[11px] text-stone-300">
                  어플을 터치하면 오케스트라 1분 지휘 미션이 실행됩니다.
                </div>
              </div>
            )}
          </div>

          {/* App Icons Grid */}
          <div className="grid grid-cols-4 gap-4 my-auto relative z-10 py-6">
            {/* Target Social Apps */}
            {TARGET_SERVICES.map(app => {
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppIconClick(app.id)}
                  className="flex flex-col items-center gap-1.5 group relative"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${app.color} p-0.5 shadow-lg relative flex items-center justify-center transition-all group-active:scale-90 ${
                    isGuidedReady ? 'ring-2 ring-emerald-400/80 shadow-emerald-500/20' : ''
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

                    {/* Guided Ready Start Badge */}
                    {isGuidedReady && (
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-stone-950 font-extrabold text-[8px] shadow-lg animate-bounce">
                        START
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-amber-100 truncate w-14 text-center">
                    {app.name}
                  </span>
                </button>
              );
            })}

            {/* General Utility Apps */}
            <div className="flex flex-col items-center gap-1.5 opacity-80">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-stone-700 to-stone-800 p-0.5 shadow-lg flex items-center justify-center text-amber-300 font-serif text-2xl">
                📷
              </div>
              <span className="text-[11px] font-medium text-stone-300">카메라</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 opacity-80">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-stone-700 to-stone-800 p-0.5 shadow-lg flex items-center justify-center text-amber-300 font-serif text-2xl">
                🎵
              </div>
              <span className="text-[11px] font-medium text-stone-300">음악</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 opacity-80">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-stone-700 to-stone-800 p-0.5 shadow-lg flex items-center justify-center text-amber-300 font-serif text-2xl">
                📝
              </div>
              <span className="text-[11px] font-medium text-stone-300">메모</span>
            </div>

            {/* PRIMARY APP: "내인생지휘자" Application Icon */}
            <button
              onClick={handleLaunchConductorApp}
              className="flex flex-col items-center gap-1.5 group relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-stone-900 p-0.5 shadow-xl flex items-center justify-center relative ring-2 ring-amber-400/80 shadow-amber-500/30 transition-all group-hover:scale-105 group-active:scale-95">
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

          <div className="py-2 text-center text-[11px] text-amber-400/60 font-serif">
            💡 '내인생지휘자' 어플을 터치하여 디톡스 약속을 실행하세요
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
            {/* Dramatic Orchestra Spotlight Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/30 via-amber-950/40 to-stone-950 pointer-events-none"></div>

            {/* Glowing Orchestra Stage Rays */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

            {/* Floating Musical Elements Watermark */}
            <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-around text-amber-300 font-serif text-6xl">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>♩</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>𝄞</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>♪</span>
            </div>

            <div className="pt-8 z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CONDUCTOR OF MY LIFE</span>
              </div>
            </div>

            {/* Center Orchestra Conductor Visual */}
            <div className="z-10 my-auto flex flex-col items-center space-y-6">
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-b from-amber-500/30 to-amber-950/60 p-1 border-2 border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center">
                {/* Conductor Graphic SVG */}
                <svg className="w-24 h-24 text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="2.5" />
                  <path d="M8 21v-5a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v5" />
                  <path d="M8 12L4 8" />
                  <path d="M16 12l5-5" />
                  <line x1="21" y1="7" x2="23" y2="5" stroke="#fef08a" strokeWidth="2.5" />
                </svg>

                {/* Sparkling Baton Ring */}
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-300 animate-ping opacity-75"></div>
              </div>

              {/* Title Typography */}
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
