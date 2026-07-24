import React from 'react';
import { Music, Shield, Smartphone, PlaySquare, Award, Settings, HelpCircle, Volume2, VolumeX, Compass } from 'lucide-react';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { getSoundMuted, setSoundMuted } from '../lib/storage';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenOnboarding: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenOnboarding,
  isMuted,
  setIsMuted
}) => {
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
    audioSynthesizer.setMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-amber-900/30 text-amber-50">
      {/* Musical Staff Line Decorative Background Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden flex flex-col justify-between py-1">
        <div className="w-full h-px bg-amber-400"></div>
        <div className="w-full h-px bg-amber-400"></div>
        <div className="w-full h-px bg-amber-400"></div>
        <div className="w-full h-px bg-amber-400"></div>
        <div className="w-full h-px bg-amber-400"></div>
      </div>

      <div className="max-w-6xl mx-auto px-3 py-2 sm:py-3 relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        {/* Top Bar for Mobile: Logo on Left, Action Controls on Right */}
        <div className="flex items-center justify-between w-full md:w-auto shrink-0">
          {/* Logo Brand */}
          <button
            onClick={() => onTabChange('landing')}
            className="flex items-center gap-2.5 group text-left transition-transform active:scale-95 shrink-0 whitespace-nowrap"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 p-0.5 shadow-lg shadow-amber-950/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-stone-900 rounded-[10px] flex items-center justify-center border border-amber-500/30">
                <span className="text-lg text-amber-400 font-serif leading-none select-none">𝄞</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <h1 className="font-serif font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent whitespace-nowrap">
                내인생 지휘자
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/50 text-amber-300 border border-amber-700/40 font-mono shrink-0">
                PWA
              </span>
            </div>
          </button>

          {/* Quick Controls (Sound & Help) on Mobile */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-stone-900/80 border border-stone-800 text-amber-300 active:scale-95 transition-all"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={onOpenOnboarding}
              className="p-1.5 rounded-lg bg-stone-900/80 border border-stone-800 text-amber-300 active:scale-95 transition-all"
              title="작동 방식 및 안내"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Screen Switcher Nav Bar: Scrollable on Mobile, Inline on Desktop */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-0.5 px-0.5">
            <button
              onClick={() => onTabChange('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                currentTab === 'landing'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                  : 'bg-stone-900/60 text-amber-200/80 border border-stone-800 hover:bg-stone-800/80 hover:text-amber-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>서비스 소개</span>
            </button>

            <button
              onClick={() => onTabChange('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                currentTab === 'home'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                  : 'bg-stone-900/60 text-amber-200/80 border border-stone-800 hover:bg-stone-800/80 hover:text-amber-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>기본 홈</span>
            </button>

            <button
              onClick={() => onTabChange('phone-home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                currentTab === 'phone-home'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                  : 'bg-stone-900/60 text-amber-200/80 border border-stone-800 hover:bg-stone-800/80 hover:text-amber-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>잠금 홈</span>
            </button>

            <button
              onClick={() => onTabChange('shorts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                currentTab === 'shorts'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                  : 'bg-stone-900/60 text-amber-200/80 border border-stone-800 hover:bg-stone-800/80 hover:text-amber-100'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5 shrink-0" />
              <span>숏폼 피드</span>
            </button>

            <button
              onClick={() => onTabChange('mission')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                currentTab === 'mission'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-600/40 hover:bg-amber-900/80'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-semibold">지휘 미션</span>
            </button>

            <button
              onClick={() => onTabChange('tutorial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                currentTab === 'tutorial'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                  : 'bg-stone-900/60 text-amber-200/80 border border-stone-800 hover:bg-stone-800/80 hover:text-amber-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>지휘 튜토리얼</span>
            </button>

            <button
              onClick={() => onTabChange('report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
                currentTab === 'report'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-semibold'
                  : 'bg-stone-900/60 text-amber-200/80 border border-stone-800 hover:bg-stone-800/80 hover:text-amber-100'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>디톡스 리포트</span>
            </button>
          </nav>

          {/* Quick Controls (Sound & Help) on Desktop */}
          <div className="hidden md:flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg text-amber-300 hover:bg-stone-800/80 transition-colors"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={onOpenOnboarding}
              className="p-1.5 rounded-lg text-amber-300 hover:bg-stone-800/80 transition-colors"
              title="작동 방식 및 안내"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
