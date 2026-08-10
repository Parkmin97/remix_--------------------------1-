import React from 'react';
import { Home, Lock, LockOpen, MoreHorizontal } from 'lucide-react';
import { SessionData } from '../types';
import { isModeRunning } from '../lib/sessionState';

export type TabType = 'home' | 'mode-a' | 'mode-b' | 'more';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeSession?: SessionData | null;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange, activeSession }) => {
  // 한쪽 모드가 **진행 중일 때만** 반대쪽 탭을 잠근다.
  // 예전에는 mode 만 봤더니, 잠금이 끝나 COMPLETED 가 된 세션이 남아 있는 동안
  // 반대쪽 탭이 계속 비활성으로 잠겨 있었다.
  const isModeAActive = isModeRunning(activeSession, 'FOCUS_NOW');
  const isModeBActive = isModeRunning(activeSession, 'GUIDED_USE');

  const tabs = [
    {
      id: 'home' as TabType,
      label: '기본 홈',
      icon: Home,
      disabled: false,
    },
    {
      id: 'mode-a' as TabType,
      label: '지금 잠금',
      icon: Lock,
      disabled: Boolean(isModeBActive),
    },
    {
      id: 'mode-b' as TabType,
      label: '예약 잠금',
      icon: LockOpen,
      disabled: Boolean(isModeAActive),
    },
    {
      id: 'more' as TabType,
      label: '더보기',
      icon: MoreHorizontal,
      disabled: false,
    },
  ];

  return (
    <nav className="shrink-0 w-full z-50 bg-neutral-950 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              disabled={isDisabled}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 ${
                isDisabled
                  ? 'opacity-30 cursor-not-allowed pointer-events-none'
                  : isActive
                  ? 'text-white scale-105 font-extrabold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-[#FE9A00] text-black shadow-md' : 'text-neutral-400'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
              </div>
              <span className={`text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap ${
                isActive ? 'text-[#FE9A00] font-extrabold' : 'text-neutral-400'
              }`}>
                {tab.label} {isDisabled && '(비활성)'}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
