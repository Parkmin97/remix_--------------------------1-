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
  activeSession?: SessionData | null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onStartSession, onNavigateToScreen, activeTab, onTabChange, activeSession }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <NewHomeScreen onSelectTab={onTabChange} activeSession={activeSession} />;
      case 'mode-a':
        return <ModeAScreen onStartSession={onStartSession} activeSession={activeSession} />;
      case 'mode-b':
        return <ModeBScreen onStartSession={onStartSession} activeSession={activeSession} />;
      case 'more':
        return <MoreScreen onNavigateToScreen={onNavigateToScreen} />;
      default:
        return <NewHomeScreen onSelectTab={onTabChange} />;
    }
  };

  return (
    <div className="h-full app-bg-light text-neutral-900 flex flex-col font-sans relative select-none">
      {/* Top Header Banner — 랜딩과 동일한 블랙 블록 */}
      <header className="shrink-0 z-40 bg-neutral-950 px-4 py-3 shadow-lg relative">
        <div className="max-w-2xl mx-auto flex items-center justify-center relative">
          <div className="flex items-center justify-center">
            <span className="font-sans font-extrabold text-base sm:text-lg tracking-widest text-white drop-shadow-[0_1px_8px_rgba(255,255,255,0.3)] text-center">
              MY LIFE MAESTRO
            </span>
          </div>
        </div>
      </header>

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
