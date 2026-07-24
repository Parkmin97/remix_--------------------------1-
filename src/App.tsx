/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { SessionData } from './types';
import { getStoredActiveSession, saveActiveSession, getOnboardingCompleted, getSoundMuted } from './lib/storage';
import { audioSynthesizer } from './lib/audioSynthesizer';
import { supabase } from './lib/supabase';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { LandingScreen } from './components/LandingScreen';
import { HomeScreen } from './components/HomeScreen';
import { MainLayout } from './components/MainLayout';
import { PhoneHomeScreen } from './components/PhoneHomeScreen';
import { ShortsFeedScreen } from './components/ShortsFeedScreen';
import { InterventionModal } from './components/InterventionModal';
import { ConductingMissionScreen } from './components/ConductingMissionScreen';
import { SelfReflectionScreen } from './components/SelfReflectionScreen';
import { ReportScreen } from './components/ReportScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { TutorialScreen } from './components/TutorialScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isInterventionOpen, setIsInterventionOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Initialize on Mount
  useEffect(() => {
    const session = getStoredActiveSession();
    setActiveSession(session);

    const onboardingDone = getOnboardingCompleted();
    if (!onboardingDone) {
      setIsOnboardingOpen(true);
    }

    const muted = getSoundMuted();
    setIsMuted(muted);
    audioSynthesizer.setMuted(muted);
  }, []);

  // Supabase 인증 상태 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleStartMissionFromIntervention = () => {
    setIsInterventionOpen(false);
    setCurrentTab('mission');
  };

  const handleMissionSuccess = () => {
    setCurrentTab('self-reflection');
  };

  const handleMissionFail = () => {
    setCurrentTab('phone-home');
  };

  // 모드 A/B에서 세션을 시작하면 저장·반영 후 폰 홈 화면으로 이동한다.
  const handleStartSession = (session: SessionData) => {
    saveActiveSession(session);
    setActiveSession(session);
    setCurrentTab('phone-home');
  };

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-stone-950 ${currentTab === 'landing' ? 'bg-white text-neutral-900' : 'bg-stone-950 text-stone-100'}`}>
      {/* Mobile-optimized status badge */}
      <div className="hidden sm:flex shrink-0 bg-amber-950/60 border-b border-amber-800/40 py-1 px-4 text-center text-[11px] text-amber-300 items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="font-semibold">모바일 최적화 규격 (390 × 844px) 적용됨</span>
        <span className="text-amber-400/70">| PWA 테스트 완료</span>
      </div>

      {/* Musical Staff Header Navigation */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        user={user}
      />

      {/* Main Content Area — no-scroll 프레임. 숏폼/랜딩만 내부 스크롤 허용 */}
      <main className={`flex-1 min-h-0 animate-fade-in ${currentTab === 'shorts' || currentTab === 'landing' ? 'overflow-y-auto no-scrollbar' : 'overflow-hidden'}`}>
        {currentTab === 'landing' && (
          <LandingScreen onNavigateToScreen={setCurrentTab} />
        )}

        {currentTab === 'login' && (
          <LoginScreen user={user} onNavigateToScreen={setCurrentTab} />
        )}

        {currentTab === 'home' && (
          <MainLayout onStartSession={handleStartSession} />
        )}

        {currentTab === 'phone-home' && (
          <PhoneHomeScreen
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            onOpenIntervention={() => setIsInterventionOpen(true)}
            onNavigateToScreen={setCurrentTab}
            user={user}
          />
        )}

        {currentTab === 'shorts' && (
          <ShortsFeedScreen
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            onNavigateToScreen={setCurrentTab}
            onOpenIntervention={() => setIsInterventionOpen(true)}
          />
        )}

        {currentTab === 'mission' && (
          <ConductingMissionScreen
            activeSession={activeSession}
            onMissionSuccess={handleMissionSuccess}
            onMissionFail={handleMissionFail}
            onCancel={() => setCurrentTab('phone-home')}
          />
        )}

        {currentTab === 'tutorial' && (
          <TutorialScreen onNavigateToScreen={setCurrentTab} />
        )}

        {currentTab === 'self-reflection' && (
          <SelfReflectionScreen
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            onNavigateToScreen={setCurrentTab}
          />
        )}

        {currentTab === 'report' && (
          <ReportScreen onNavigateToScreen={setCurrentTab} />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        )}
      </main>

      {/* Onboarding Guidance Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Soft Lock Intervention Modal */}
      <InterventionModal
        isOpen={isInterventionOpen}
        onClose={() => setIsInterventionOpen(false)}
        onStartMission={handleStartMissionFromIntervention}
        focusTask={activeSession?.focusTask}
      />
    </div>
  );
}
