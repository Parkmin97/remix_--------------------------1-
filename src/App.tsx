/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { SessionData } from './types';
import { getStoredActiveSession, saveActiveSession, getOnboardingCompleted, getSoundMuted, syncReportsFromSupabase } from './lib/storage';
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
import { loadAppCatalog, resolveLockedCategories } from './lib/appCatalog';
import { syncSessionFromNative } from './lib/sessionSync';
import { BlockerPermissionsProvider, useBlockerPermissions } from './lib/blockerPermissions';
import { PermissionSetupScreen } from './components/PermissionSetup';
import { SplashQuoteScreen } from './components/SplashQuoteScreen';
import { isLockActive, isSessionRunning } from './lib/sessionState';

export default function App() {
  return (
    <BlockerPermissionsProvider>
      <AppContent />
    </BlockerPermissionsProvider>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    // 차단 화면(네이티브)에서 열리면 URL 로 시작 화면이 지정된다.
    const fromUrl = getInitialScreen();
    if (fromUrl) return fromUrl;

    // 설치된 앱에서는 랜딩 페이지가 필요 없다. 이미 설치를 마친 사용자에게
    // "무료로 시작하기"를 다시 보여줄 이유가 없다. 바로 로그인/홈으로 보낸다.
    // 랜딩은 웹으로 배포할 때의 홍보 페이지로만 남긴다.
    return Capacitor.isNativePlatform() ? 'home' : 'landing';
  });
  // 진입 화면(오늘의 한마디). 앱을 켤 때마다 한 번 지나간다.
  //
  // ⚠️ 차단 화면 웹뷰에서는 띄우지 않는다.
  //    잠근 앱을 열어 차단 화면이 뜨는 순간에 명언부터 보여주면
  //    사용자는 미션에 닿기까지 2.5초를 더 기다려야 한다. 그 자리에 낄 화면이 아니다.
  const [showSplash, setShowSplash] = useState<boolean>(() => !isBlockMode());
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isInterventionOpen, setIsInterventionOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [mainTab, setMainTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab') as TabType;
      if (tabParam && ['home', 'mode-a', 'mode-b', 'more'].includes(tabParam)) return tabParam;
    }
    return 'home';
  });
  // 앱 목록은 비동기로 도착한다. 도착하면 이 값을 올려 화면을 다시 그린다.
  const [, setCatalogVersion] = useState(0);
  // 잠금 종료 시각을 넘겼는지 스스로 알아차리기 위한 시계.
  // 세션이 살아 있는 동안에만 돈다 (아래 useEffect 참고).
  const [lockClock, setLockClock] = useState<number>(() => Date.now());

  // 차단 권한 상태. 필수 권한이 없으면 잠금을 걸어도 아무 일도 일어나지 않으므로
  // 홈에 들어가기 전에 안내 화면을 세운다. '나중에 하기'로 넘긴 경우만 통과시킨다.
  // (넘겨도 잠금 실행 버튼은 모드 A/B 에서 따로 막는다)
  const { env: permissionEnv, canBlock } = useBlockerPermissions();
  const [permissionSkipped, setPermissionSkipped] = useState<boolean>(false);

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

    /*
     * corrected 플래그만 믿지 않는다.
     *
     * corrected 는 "네이티브에는 세션이 없는데 웹에만 살아 있어서 고쳤다" 는
     * 경우에만 true 다. 그런데 잠금 시간이 지나 만료된 경우에는
     * syncSessionFromNative 안에서 getStoredActiveSession() 이 이미
     * COMPLETED 로 고쳐놓은 뒤라 그 분기에 걸리지 않아 corrected 가 false 다.
     * 그래서 저장소는 끝났는데 화면만 "잠금 중"으로 남았다.
     *
     * 저장소가 늘 먼저 갱신되므로(handleStartSession 도 저장 후 상태를 바꾼다),
     * 돌려받은 세션과 지금 상태가 다르면 그대로 맞춘다.
     */
    const sync = () => {
      syncSessionFromNative(null).then(({ session }) => {
        setActiveSession(prev => {
          if (prev?.id === session?.id && prev?.state === session?.state) return prev;
          return session;
        });
      });
    };

    sync(); // 앱을 열었을 때

    // 다른 앱에 갔다가 돌아왔을 때도 확인한다.
    // (차단 화면에서 미션을 마치고 돌아오는 경우가 여기 해당한다)
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);

    /*
     * 앱을 켜둔 채로 잠금 시간이 끝나는 경우가 있다.
     *
     * 예전에는 '앱을 열 때'와 '다른 앱에서 돌아올 때'만 확인했다.
     * 그래서 사용자가 앱을 계속 보고 있으면 아무 계기도 생기지 않아
     * 잠금이 이미 끝났는데도 화면은 계속 "잠금 중"이었다.
     * 로그아웃을 잠금 중에 막게 되면서 이 틈이 실제로 사용자를 가둔다
     * — 잠금은 끝났는데 로그아웃 버튼은 여전히 잠긴 채로 남는다.
     */
    const timer = setInterval(sync, 15_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  // 세션이 살아 있는 동안에는 시계를 돌려 잠금 종료 시각을 스스로 넘긴다.
  // 세션이 없으면 돌릴 이유가 없으니 멈춘다.
  useEffect(() => {
    if (!isSessionRunning(activeSession)) return;
    const timer = setInterval(() => setLockClock(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, [activeSession]);

  /*
   * 잠금 시간이 끝나면 화면이 들고 있는 세션도 끝난 것으로 바꾼다.
   *
   * ■ 무엇이 잘못됐었나
   *   getStoredActiveSession() 은 읽을 때마다 시계를 보고, 종료 시각을 지난 세션을
   *   COMPLETED 로 고쳐 저장한다. 그런데 그건 localStorage 쪽 이야기다.
   *   화면이 실제로 쓰는 것은 메모리에 있는 이 activeSession 상태다.
   *
   *   그래서 앱을 켜둔 채 잠금 시간이 끝나면 저장소만 COMPLETED 가 되고
   *   화면은 계속 "잠금 중"으로 남았다. 앱을 완전히 종료했다 다시 켜야만
   *   풀렸던 이유가 이것이다 — 다시 켤 때 mount 훅이
   *   getStoredActiveSession() 을 읽어 그제서야 메모리와 저장소가 맞춰진다.
   *
   * ■ 왜 setInterval 이 아니라 setTimeout 인가
   *   종료 시각에 정확히 한 번 깨우면 되는 일이다. 5초 간격 시계에 얹으면
   *   최대 5초 늦게 풀려 "끝났는데 아직 잠겨 있다"는 체감이 그대로 남는다.
   */
  useEffect(() => {
    if (!isSessionRunning(activeSession) || !activeSession?.focusEndsAt) return;

    const endsAt = new Date(activeSession.focusEndsAt).getTime();
    if (!Number.isFinite(endsAt)) return;

    const finishNow = () => {
      const finished: SessionData = { ...activeSession, state: 'COMPLETED' };
      saveActiveSession(finished);
      setActiveSession(finished);
    };

    const remainingMs = endsAt - Date.now();
    if (remainingMs <= 0) {
      finishNow();
      return;
    }

    const timer = window.setTimeout(finishNow, remainingMs);
    return () => window.clearTimeout(timer);
  }, [activeSession]);

  // Supabase 인증 상태 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      setAuthChecked(true);
      if (currentUser) {
        syncReportsFromSupabase();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthChecked(true);
      if (currentUser) {
        syncReportsFromSupabase();
      }
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
      // 통째로 잠근 카테고리를 함께 넘긴다.
      // 이러면 잠금 도중에 새 숏폼 앱을 깔아 빠져나가는 길이 막힌다.
      const { categoryIds, packageCategories } = resolveLockedCategories(packages);

      Blocker.startSession({
        sessionId: session.id,
        lockEndsAt: new Date(session.focusEndsAt).getTime(),
        // 모드 B는 "먼저 M분 사용" 구간이 있다. 그 시간까지는 차단하지 않는다.
        usageEndsAt: session.usageEndsAt ? new Date(session.usageEndsAt).getTime() : 0,
        blockedPackages: packages,
        blockedCategories: categoryIds,
        packageCategories,
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

  // 권한 안내를 홈 자리에 대신 세운다.
  // 미션·차단 화면(block-choice)까지 가로막으면 잠긴 앱을 열었을 때 미션에 닿지 못하므로
  // 홈에서만 띄운다. 웹 브라우저(permissionEnv === 'web')에서는 아예 뜨지 않는다.
  const needsPermissionSetup =
    permissionEnv === 'native' && !canBlock && !permissionSkipped && !isBlockMode();

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

  // 잠금이 도는 동안에는 로그아웃을 막는다 — 사유는 MoreScreen 의 lockRunning 주석 참고.
  // 시계까지 보는 isLockActive 를 쓴다. 잠금 시간이 지났는데 버튼이 계속 잠겨 있으면
  // 사용자는 나갈 방법이 없다고 느낀다.
  const lockRunning = isLockActive(activeSession, lockClock);

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-neutral-950 ${currentTab === 'landing' ? 'bg-white text-neutral-900' : 'app-bg-light text-neutral-900'}`}>
      {/* Mobile-optimized status badge */}
      <div className="hidden sm:flex shrink-0 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 py-1 px-4 text-center text-[11px] text-neutral-300 items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
        <span className="font-semibold">모바일 최적화 규격 (390 × 844px) 적용됨</span>
        <span className="text-neutral-400">| PWA 테스트 완료</span>
      </div>

      {/* Top Header Banner — 모든 화면(홈, 지휘 미션, 차단, 튜토리얼, 리포트, 설정 등) 상단에 고정되는 공통 블랙 헤더 */}
      {currentTab !== 'landing' && (
        <header className="shrink-0 z-40 bg-neutral-950 px-4 py-3 shadow-lg relative border-b border-neutral-900">
          <div className="max-w-2xl mx-auto flex items-center justify-center relative">
            <div className="flex items-center justify-center">
              <span className="font-sans font-extrabold text-base sm:text-lg tracking-widest text-white drop-shadow-[0_1px_8px_rgba(255,255,255,0.3)] text-center">
                MY LIFE MAESTRO
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area — 콘텐츠가 길면 세로 스크롤로 위아래를 모두 볼 수 있게 한다 */}
      <main className="flex-1 min-h-0 animate-fade-in overflow-y-auto">
        {currentTab === 'landing' && (
          <LandingScreen onNavigateToScreen={setCurrentTab} onFreeStart={handleFreeStart} />
        )}

        {currentTab === 'login' && (
          <LoginScreen user={user} onNavigateToScreen={handleAuthedNavigate} lockRunning={lockRunning} />
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
          needsPermissionSetup ? (
            <PermissionSetupScreen
              onSkip={() => setPermissionSkipped(true)}
              onDone={() => setPermissionSkipped(true)}
            />
          ) : (
            <MainLayout onStartSession={handleStartSession} onNavigateToScreen={setCurrentTab} activeTab={mainTab} onTabChange={setMainTab} activeSession={activeSession} lockRunning={lockRunning} />
          )
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
            onBack={handleBackToMore}
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

      {/* 진입 화면 — 모든 것 위에 덮이고, 2.5초 뒤 또는 탭하면 사라진다 */}
      {showSplash && <SplashQuoteScreen onDone={() => setShowSplash(false)} />}
    </div>
  );
}
