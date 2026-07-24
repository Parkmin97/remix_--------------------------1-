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

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-amber-500 selection:text-stone-950 ${currentTab === 'landing' ? 'bg-white text-neutral-900' : 'bg-stone-950 text-stone-100 pb-12'}`}>
      {/* Mobile-optimized status badge */}
      <div className="hidden sm:flex bg-amber-950/60 border-b border-amber-800/40 py-1 px-4 text-center text-[11px] text-amber-300 items-center justify-center gap-2">
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

      {/* Main Content Area */}
      <main className="animate-fade-in pt-4">
        {currentTab === 'landing' && (
          <LandingScreen onNavigateToScreen={setCurrentTab} />
        )}

        {currentTab === 'login' && (
          <LoginScreen user={user} onNavigateToScreen={setCurrentTab} />
        )}

        {currentTab === 'home' && (
          <HomeScreen
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            onNavigateToScreen={setCurrentTab}
            onOpenIntervention={() => setIsInterventionOpen(true)}
          />
        )}

        {currentTab === 'phone-home' && (
          <PhoneHomeScreen
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            onOpenIntervention={() => setIsInterventionOpen(true)}
            onNavigateToScreen={setCurrentTab}
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
