import React from 'react';
import { SessionData } from '../types';
import { BottomTabBar, TabType } from './BottomTabBar';
import { NewHomeScreen } from './NewHomeScreen';
import { ModeAScreen } from './ModeAScreen';
import { ModeBScreen } from './ModeBScreen';
import { MoreScreen } from './MoreScreen';

interface MainLayoutProps {
  onStartSession: (session: SessionData) => void;
  onNavigateToScreen: (screen: string) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onStartSession, onNavigateToScreen, activeTab, onTabChange }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <NewHomeScreen onSelectTab={onTabChange} />;
      case 'mode-a':
        return <ModeAScreen onStartSession={onStartSession} />;
      case 'mode-b':
        return <ModeBScreen onStartSession={onStartSession} />;
      case 'more':
        return <MoreScreen onNavigateToScreen={onNavigateToScreen} />;
      default:
        return <NewHomeScreen onSelectTab={onTabChange} />;
    }
  };

  return (
    <div className="h-full bg-[url('/bg_conductor.png')] bg-cover bg-center bg-fixed text-white flex flex-col font-sans relative select-none">
      {/* Background Dark Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-neutral-950/75 to-black/90 pointer-events-none"></div>

      {/* Top Header Banner */}
      <header className="shrink-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-800 px-4 py-3 shadow-lg relative">
        <div className="max-w-2xl mx-auto flex items-center justify-center relative">
          <div className="flex items-center justify-center">
            <span className="font-sans font-extrabold text-base sm:text-lg tracking-widest text-white drop-shadow-[0_1px_8px_rgba(255,255,255,0.3)] text-center">
              CONDUCTOR OF MY LIFE
            </span>
          </div>
          <span className="absolute right-0 text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-800/90 text-neutral-200 font-semibold border border-neutral-700 shadow-sm">
            {activeTab === 'home' && '기본 홈'}
            {activeTab === 'mode-a' && '바로 잠금'}
            {activeTab === 'mode-b' && '활동 중 잠금'}
            {activeTab === 'more' && '더보기'}
          </span>
        </div>
      </header>

      {/* Main Content Area — 콘텐츠가 길면 세로 스크롤 허용 */}
      <main className="flex-1 min-h-0 overflow-y-auto animate-fade-in relative z-10">
        {renderContent()}
      </main>

      {/* 4-Tab Bottom Navigation Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default MainLayout;
