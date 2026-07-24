import React from 'react';
import { Shield, Zap, Activity, ArrowRight } from 'lucide-react';
import { TabType } from './BottomTabBar';

interface NewHomeScreenProps {
  onSelectTab: (tab: TabType) => void;
}

export const NewHomeScreen: React.FC<NewHomeScreenProps> = ({ onSelectTab }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 text-stone-100 pb-24">
      {/* Header Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>디톡스 모드 선택</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
          원하는 디톡스 모드를 선택하세요
        </h1>
        <p className="text-xs sm:text-sm text-stone-400">
          모드 카드를 클릭하면 해당 모드의 상세 설정 탭으로 이동합니다.
        </p>
      </div>

      {/* Detox Mode Selection Cards (Mode A vs Mode B only) */}
      <div className="grid grid-cols-1 gap-6">
        {/* Mode A Box (바로 잠금) */}
        <div
          onClick={() => onSelectTab('mode-a')}
          className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/70 border-2 border-amber-500/50 hover:border-amber-400 hover:scale-[1.01] transition-all cursor-pointer shadow-2xl shadow-amber-950/60 relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                모드 a
              </span>
              <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
                <span>바로 잠금</span>
                <span className="text-xs font-normal text-stone-400 font-sans">(집중 약속 모드)</span>
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed max-w-md">
                지금부터 즉시 소셜미디어를 멀리하고 집중을 시작합니다. 설정한 시간 동안 몰입 환경을 조성해 드립니다.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500 group-hover:text-stone-950 transition-all">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-900/40 flex items-center justify-between text-xs text-amber-300/90 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              클릭 시 바로 잠금 상세 설정 탭으로 이동
            </span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Mode B Box (활동 중 잠금) */}
        <div
          onClick={() => onSelectTab('mode-b')}
          className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/70 border-2 border-amber-500/50 hover:border-amber-400 hover:scale-[1.01] transition-all cursor-pointer shadow-2xl shadow-amber-950/60 relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
                모드 b
              </span>
              <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
                <span>활동 중 잠금</span>
                <span className="text-xs font-normal text-stone-400 font-sans">(의도적 SNS 이용 모드)</span>
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed max-w-md">
                SNS 이용 목적과 이용 시간을 먼저 설정하여 무의식적 스크롤을 방지하고, 이용 종료 후 집중 모드로 자동 연결됩니다.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500 group-hover:text-stone-950 transition-all">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-900/40 flex items-center justify-between text-xs text-amber-300/90 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              클릭 시 활동 중 잠금 상세 설정 탭으로 이동
            </span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
