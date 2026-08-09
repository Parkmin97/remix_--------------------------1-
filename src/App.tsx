/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { SessionData } from './types';
import { getStoredActiveSession, saveActiveSession, getOnboardingCompleted, getSoundMuted } from './lib/storage';
import { audioSynthesizer } from './lib/audioSynthesizer';
import { supabase } from './lib/supabase';
import { Header } from './components/Header';
import type { TabType } from './components/BottomTabBar';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { LandingScreen } from './components/LandingScreen';
import { MainLayout } from './components/MainLayout';
import { InterventionModal } from './components/InterventionModal';
import { ConductingMissionScreen } from './components/ConductingMissionScreen';
import { SelfReflectionScreen } from './components/SelfReflectionScreen';
import { ReportScreen } from './components/ReportScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { TutorialScreen } from './components/TutorialScreen';
import { BlockChoiceScreen } from './components/BlockChoiceScreen';
import { getBlockInfo, getInitialScreen, isBlockMode, reportMissionResult } from './lib/blockBridge';
import { Blocker, goToRealHomeScreen } from './lib/blocker';
import { loadAppCatalog } from './lib/appCatalog';
import { syncSessionFromNative } from './lib/sessionSync';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    // 차단 화면(네이티브)에서 열리면 URL 로 시작 화면이 지정된다.
    const fromUrl = getInitialScreen();
    if (fromUrl) return fromUrl;

    // 설치된 앱에서는 랜딩 페이지가 필요 없다. 이미 설치를 마친 사용자에게
    // "무료로 시작하기"를 다시 보여줄 이유가 없다. 바로 로그인/홈으로 보낸다.
    // 랜딩은 웹으로 배포할 때의 홍보 페이지로만 남긴다.
    return Capacitor.isNativePlatform() ? 'home' : 'landing';
  });
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isInterventionOpen, setIsInterventionOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [mainTab, setMainTab] = useState<TabType>('home');
  // 앱 목록은 비동기로 도착한다. 도착하면 이 값을 올려 화면을 다시 그린다.
  const [, setCatalogVersion] = useState(0);

  // Initialize on Mount
  useEffect(() => {
    const session = getStoredActiveSession();
    setActiveSession(session);

    // 차단 화면에서 열린 경우엔 온보딩을 띄우지 않는다.
    // 차단 화면 웹뷰는 메인 앱과 origin 이 달라 localStorage 가 분리되므로,
    // 이미 온보딩을 마친 사용자에게도 "처음 실행"으로 보인다.
    // 인스타를 막아놓고 안내문부터 띄우면 미션에 닿기도 전에 이탈한다.
    const onboardingDone = getOnboardingCompleted();
    if (!onboardingDone && !isBlockMode()) {
      setIsOnboardingOpen(true);
    }

    const muted = getSoundMuted();
    setIsMuted(muted);
    audioSynthesizer.setMuted(muted);

    // 기기에 설치된 앱 목록을 읽어온다. 잠글 앱 선택 화면이 이걸 쓴다.
    // 차단 화면에서는 필요 없으므로 건너뛴다(로딩만 느려진다).
    if (!isBlockMode()) {
      loadAppCatalog()
        .then(apps => {
          setCatalogVersion(v => v + 1); // 목록이 도착했으니 다시 그린다
          console.info(`[App] 설치된 앱 ${apps.length}개 로드됨`);
        })
        .catch(err => console.warn('[App] 앱 목록 로드 실패', err));
    }
  }, []);

  // 잠금 상태를 네이티브에 맞춘다.
  //
  // 차단 화면에서 미션에 성공하면 네이티브가 세션을 끝내는데,
  // 차단 화면 웹뷰는 origin 이 달라 메인 앱의 localStorage 를 고칠 수 없다.
  // 그래서 앱으로 돌아왔을 때 여기서 맞춰줘야 "잠금 중"으로 잘못 보이지 않는다.
  useEffect(() => {
    if (isBlockMode()) return; // 차단 화면 자신은 동기화 대상이 아니다

    const sync = () => {
      syncSessionFromNative(null).then(({ session, corrected }) => {
        if (corrected) setActiveSession(session);
      });
    };

    sync(); // 앱을 열었을 때

    // 다른 앱에 갔다가 돌아왔을 때도 확인한다.
    // (차단 화면에서 미션을 마치고 돌아오는 경우가 여기 해당한다)
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Supabase 인증 상태 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleStartMissionFromIntervention = () => {
    setIsInterventionOpen(false);
    setCurrentTab('mission');
  };

  const handleMissionSuccess = () => {
    // 차단 화면에서 실행 중이면 네이티브가 차단을 풀어야 하므로 결과를 넘기고 끝낸다.
    if (reportMissionResult('success')) return;
    setCurrentTab('self-reflection');
  };

  const handleMissionFail = () => {
    if (reportMissionResult('fail')) return;

    // 미션 실패를 세션에 기록 → 이번 잠금에서는 더 이상 미션을 시도할 수 없다.
    if (activeSession) {
      const updated: SessionData = { ...activeSession, missionAttempted: true, missionSucceeded: false };
      saveActiveSession(updated);
      setActiveSession(updated);
    }
    setCurrentTab('home');
  };

  // 모드 A/B에서 세션을 시작하면 저장·반영 후 실제 폰 홈 화면으로 내보낸다.
  const handleStartSession = (session: SessionData) => {
    saveActiveSession(session);
    setActiveSession(session);

    // 네이티브 차단 엔진에 세션을 넘긴다. 실제 앱 차단은 여기서부터 시작된다.
    // 웹 브라우저에서 실행 중이면 조용히 넘어간다(개발 편의).
    const packages = session.targetServices.map(s => s.id).filter(Boolean);
    if (packages.length > 0) {
      Blocker.startSession({
        sessionId: session.id,
        lockEndsAt: new Date(session.focusEndsAt).getTime(),
        // 모드 B는 "먼저 M분 사용" 구간이 있다. 그 시간까지는 차단하지 않는다.
        usageEndsAt: session.usageEndsAt ? new Date(session.usageEndsAt).getTime() : 0,
        blockedPackages: packages,
      }).catch(err => console.warn('[App] 네이티브 차단 시작 실패(웹 환경일 수 있음)', err));
    }

    // 잠금을 걸었으면 사용자를 앱에 붙잡아두지 않는다.
    // 폰을 평소처럼 쓰다가 잠근 앱을 열었을 때 차단되는 것이 이 제품의 흐름이다.
    goToRealHomeScreen().then(moved => {
      if (!moved) setCurrentTab('home'); // 웹 브라우저에서는 홈 탭으로 대체
    });
  };

  // 흐름: 랜딩 → 무료로 시작하기 → 로그인 → 기본 홈(서비스).
  // 로그인 게이트는 '기본 홈(home)' 진입 시에만 적용한다. 랜딩은 공개.
  const needsAuth = !user && currentTab === 'home';

  // 무료로 시작하기: 과거 잠금 세션을 지우고 서비스 홈으로 들어간다.
  const handleFreeStart = () => {
    saveActiveSession(null);
    setActiveSession(null);
    setCurrentTab('home');
  };

  // 리포트/튜토리얼 화면의 뒤로가기 → 기본 홈의 '더보기' 탭으로 돌아간다.
  const handleBackToMore = () => {
    setMainTab('more');
    setCurrentTab('home');
  };

  // 로그인 성공 시(어떤 상황이든) 항상 기본 홈으로 이동한다. mainTab도 'home'으로 리셋.
  const handleAuthedNavigate = (screen: string) => {
    setMainTab('home');
    setCurrentTab(screen);
  };

  // 상단 네비게이션(각 화면 바로가기 버튼) 표시 여부.
  // "상단버튼되돌려줘" 요청 시 이 값을 true로 바꾸면 지금 상태 그대로 복원된다.
  const SHOW_TOP_NAV = false;

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-neutral-950 ${currentTab === 'landing' ? 'bg-white text-neutral-900' : 'app-bg-light text-neutral-900'}`}>
      {/* Mobile-optimized status badge */}
      <div className="hidden sm:flex shrink-0 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 py-1 px-4 text-center text-[11px] text-neutral-300 items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        <span className="font-semibold">모바일 최적화 규격 (390 × 844px) 적용됨</span>
        <span className="text-neutral-400">| PWA 테스트 완료</span>
      </div>

      {/* Musical Staff Header Navigation — SHOW_TOP_NAV 로 표시 제어 */}
      {SHOW_TOP_NAV && (
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          user={user}
        />
      )}

      {/* Main Content Area — 콘텐츠가 길면 세로 스크롤로 위아래를 모두 볼 수 있게 한다 */}
      <main className="flex-1 min-h-0 animate-fade-in overflow-y-auto">
        {currentTab === 'landing' && (
          <LandingScreen onNavigateToScreen={setCurrentTab} onFreeStart={handleFreeStart} />
        )}

        {currentTab === 'login' && (
          <LoginScreen user={user} onNavigateToScreen={handleAuthedNavigate} />
        )}

        {/* 서비스 진입 게이트: 로그인 전에는 로그인/회원가입 화면을 띄운다. */}
        {needsAuth && (
          authChecked ? (
            <div className="min-h-full flex items-center justify-center">
              <LoginScreen user={user} onNavigateToScreen={handleAuthedNavigate} />
            </div>
          ) : (
            <div className="min-h-full flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          )
        )}

        {!needsAuth && (
        <>
        {currentTab === 'home' && (
          <MainLayout onStartSession={handleStartSession} onNavigateToScreen={setCurrentTab} activeTab={mainTab} onTabChange={setMainTab} activeSession={activeSession} />
        )}

        {/* 차단 화면: 잠근 앱을 열었을 때 뜨는 선택지. 네이티브 웹뷰에서만 열린다. */}
        {currentTab === 'block-choice' && (
          <BlockChoiceScreen
            blockInfo={getBlockInfo()}
            onStartMission={() => setCurrentTab('mission')}
            onKeepLocked={() => reportMissionResult('keep')}
          />
        )}

        {currentTab === 'mission' && (
          <ConductingMissionScreen
            activeSession={activeSession}
            onMissionSuccess={handleMissionSuccess}
            onMissionFail={handleMissionFail}
            onCancel={() => {
              // 차단 화면에서 미션을 포기한 경우: 시도로 치지 않아 나중에 다시 할 수 있다.
              if (reportMissionResult('cancel')) return;
              setCurrentTab('home');
            }}
          />
        )}

        {currentTab === 'tutorial' && (
          <TutorialScreen onNavigateToScreen={setCurrentTab} onBack={handleBackToMore} />
        )}

        {currentTab === 'self-reflection' && (
          <SelfReflectionScreen
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            onNavigateToScreen={setCurrentTab}
          />
        )}

        {currentTab === 'report' && (
          <ReportScreen onBack={handleBackToMore} />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        )}
        </>
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
