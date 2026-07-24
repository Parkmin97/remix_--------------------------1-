import React from 'react';
import { Home, Zap, Activity, MoreHorizontal } from 'lucide-react';

export type TabType = 'home' | 'mode-a' | 'mode-b' | 'more';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: '기본 홈',
      icon: Home,
    },
    {
      id: 'mode-a' as TabType,
      label: '바로 잠금(모드 a)',
      icon: Zap,
    },
    {
      id: 'mode-b' as TabType,
      label: '활동 중 잠금(모드 b)',
      icon: Activity,
    },
    {
      id: 'more' as TabType,
      label: '더보기',
      icon: MoreHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-md border-t border-amber-900/40 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 ${
                isActive
                  ? 'text-amber-400 scale-105 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all ${
                isActive ? 'bg-amber-500/20 border border-amber-500/30' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
