import React from 'react';
import { SessionData } from '../types';
import { BottomTabBar, TabType } from './BottomTabBar';
import { NewHomeScreen } from './NewHomeScreen';
import { ModeAScreen } from './ModeAScreen';
import { ModeBScreen } from './ModeBScreen';
import { MoreScreen } from './MoreScreen';
import { UsageCountdownBar } from './UsageCountdownBar';

interface MainLayoutProps {
  onStartSession: (session: SessionData) => void;
  onNavigateToScreen: (screen: string) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeSession?: SessionData | null;
  /** 잠금이 지금 돌고 있는지 — 사유는 MoreScreen 의 같은 이름 주석 참고. */
  lockRunning?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onStartSession, onNavigateToScreen, activeTab, onTabChange, activeSession, lockRunning }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <NewHomeScreen onSelectTab={onTabChange} activeSession={activeSession} />;
      case 'mode-a':
        return <ModeAScreen onStartSession={onStartSession} activeSession={activeSession} />;
      case 'mode-b':
        return <ModeBScreen onStartSession={onStartSession} activeSession={activeSession} />;
      case 'more':
        return <MoreScreen onNavigateToScreen={onNavigateToScreen} lockRunning={lockRunning} />;
      default:
        return <NewHomeScreen onSelectTab={onTabChange} />;
    }
  };

  return (
    <div className="h-full app-bg-light text-neutral-900 flex flex-col font-sans relative select-none">
      {/* 예약 잠금 진행 중이면 어느 탭에 있든 남은 시간이 보인다 */}
      <UsageCountdownBar activeSession={activeSession} />

      {/* Main Content Area — 콘텐츠가 길면 세로 스크롤 허용 */}
      <main className="flex-1 min-h-0 overflow-y-auto animate-fade-in relative z-10">
        {renderContent()}
      </main>

      {/* 4-Tab Bottom Navigation Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} activeSession={activeSession} />
    </div>
  );
};

export default MainLayout;
