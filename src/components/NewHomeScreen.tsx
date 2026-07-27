import React from 'react';
import { Shield, Lock, LockOpen, ArrowRight } from 'lucide-react';
import { TabType } from './BottomTabBar';

interface NewHomeScreenProps {
  onSelectTab: (tab: TabType) => void;
}

export const NewHomeScreen: React.FC<NewHomeScreenProps> = ({ onSelectTab }) => {
  return (
    <div className="min-h-full flex flex-col justify-start max-w-2xl mx-auto w-full px-4 pt-6 pb-20 gap-5 text-neutral-900">
      {/* Header Title */}
      <div className="text-center space-y-1.5 shrink-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 shadow-sm">
          <Shield className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900 tracking-wide">
            디톡스 모드 선택
          </h1>
        </div>
        <p className="text-xs text-neutral-600 break-keep pt-1">
          모드 카드를 클릭하면 상세 설정 탭으로 이동합니다.
        </p>
      </div>

      {/* Detox Mode Selection Cards (Mode A vs Mode B only) */}
      <div className="grid grid-cols-1 gap-4">
        {/* Mode A Box (지금 잠금) */}
        <div
          onClick={() => onSelectTab('mode-a')}
          className="p-5 rounded-3xl bg-neutral-950 ring-1 ring-black/5 hover:ring-amber-400/60 hover:scale-[1.01] transition-all cursor-pointer shadow-2xl relative overflow-hidden group"
        >
          <div className="space-y-2">
            <h2 className="text-lg font-bold font-serif flex items-center gap-2 break-keep">
              <Lock className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400">지금 잠금 모드</span>
            </h2>
            <p className="text-xs text-neutral-300 leading-snug break-keep">
              지금부터 즉시 소셜미디어를 멀리하고 집중을 시작합니다. 설정한 시간 동안 몰입 환경을 조성해 드립니다.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-amber-400 font-bold">
            <span className="flex items-center gap-1.5 break-keep">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              지금 잠금 상세 설정으로 이동
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition-all">
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-stone-950 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>

        {/* Mode B Box (예약 잠금) */}
        <div
          onClick={() => onSelectTab('mode-b')}
          className="p-5 rounded-3xl bg-neutral-950 ring-1 ring-black/5 hover:ring-amber-400/60 hover:scale-[1.01] transition-all cursor-pointer shadow-2xl relative overflow-hidden group"
        >
          <div className="space-y-2">
            <h2 className="text-lg font-bold font-serif flex items-center gap-2 break-keep">
              <LockOpen className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400">예약 잠금 모드</span>
            </h2>
            <p className="text-xs text-neutral-300 leading-snug break-keep">
              SNS 이용 목적과 시간을 먼저 설정해 무의식적 스크롤을 방지하고, 이용 종료 후 집중 모드로 자동 연결됩니다.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-amber-400 font-bold">
            <span className="flex items-center gap-1.5 break-keep">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              예약 잠금 상세 설정으로 이동
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-stone-950 transition-all">
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:text-stone-950 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
