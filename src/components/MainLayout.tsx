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
    <div className="h-full bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Header Banner */}
      <header className="shrink-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-amber-900/40 px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl text-amber-400 font-serif font-bold">𝄞</span>
            <span className="font-serif font-bold text-base text-amber-200 tracking-wide">
              REMIX DETOX
            </span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            {activeTab === 'home' && '기본 홈'}
            {activeTab === 'mode-a' && '바로 잠금'}
            {activeTab === 'mode-b' && '활동 중 잠금'}
            {activeTab === 'more' && '더보기'}
          </span>
        </div>
      </header>

      {/* Main Content Area — no-scroll 프레임 */}
      <main className="flex-1 min-h-0 overflow-hidden animate-fade-in">
        {renderContent()}
      </main>

      {/* 4-Tab Bottom Navigation Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

export default MainLayout;
