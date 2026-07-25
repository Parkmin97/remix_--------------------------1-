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
    <nav className="shrink-0 w-full z-50 bg-black/90 backdrop-blur-md border-t border-neutral-800 shadow-2xl">
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
                  ? 'text-white scale-105 font-extrabold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-white text-black border border-white shadow-md' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-black fill-current' : ''}`} />
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
