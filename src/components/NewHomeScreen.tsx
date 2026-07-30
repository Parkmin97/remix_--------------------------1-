import React from 'react';
import { Shield, Lock, LockOpen, ArrowRight } from 'lucide-react';
import { TabType } from './BottomTabBar';

interface NewHomeScreenProps {
  onSelectTab: (tab: TabType) => void;
}

export const NewHomeScreen: React.FC<NewHomeScreenProps> = ({ onSelectTab }) => {
  return (
    <div className="min-h-full flex flex-col justify-start max-w-2xl mx-auto w-full px-4 pt-6 pb-20 gap-5 text-black">
      {/* Header Title */}
      <div className="text-center space-y-1.5 shrink-0">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white border border-black shadow-md">
          <Shield className="w-5 h-5 text-[#FE9A00]" />
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            디톡스 모드 선택
          </h1>
        </div>
        <p className="text-xs text-black/70 break-keep pt-1">
          모드 카드를 클릭하면 상세 설정 탭으로 이동합니다.
        </p>
      </div>

      {/* Detox Mode Selection Cards (Mode A vs Mode B only) */}
      <div className="grid grid-cols-1 gap-4">
        {/* Mode A Box (지금 잠금 - 선택/클릭 시 검은색 배경으로 활성화) */}
        <div
          onClick={() => onSelectTab('mode-a')}
          className="p-5 rounded-3xl bg-white hover:bg-black text-black hover:text-white border border-slate-200 hover:border-black transition-all cursor-pointer shadow-lg hover:shadow-2xl relative overflow-hidden group active:bg-black active:text-white"
        >
          <div className="space-y-2">
            <h2 className="text-lg font-bold font-serif flex items-center gap-2 break-keep text-black group-hover:text-white transition-colors">
              <Lock className="w-5 h-5 text-[#FE9A00]" />
              <span>지금 잠금 모드</span>
            </h2>
            <p className="text-xs text-black/80 group-hover:text-neutral-300 leading-snug break-keep transition-colors">
              지금부터 즉시 소셜미디어를 멀리하고 집중을 시작합니다. 설정한 시간 동안 몰입 환경을 조성해 드립니다.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-neutral-800 flex items-center justify-between text-[11px] font-bold transition-colors">
            <span className="flex items-center gap-1.5 break-keep text-black group-hover:text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FE9A00] animate-pulse"></span>
              지금 잠금 상세 설정으로 이동
            </span>
            <div className="w-7 h-7 rounded-full bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center group-hover:bg-[#FE9A00] transition-all">
              <ArrowRight className="w-4 h-4 text-[#FE9A00] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>

        {/* Mode B Box (예약 잠금 - 선택/클릭 시 검은색 배경으로 활성화) */}
        <div
          onClick={() => onSelectTab('mode-b')}
          className="p-5 rounded-3xl bg-white hover:bg-black text-black hover:text-white border border-slate-200 hover:border-black transition-all cursor-pointer shadow-lg hover:shadow-2xl relative overflow-hidden group active:bg-black active:text-white"
        >
          <div className="space-y-2">
            <h2 className="text-lg font-bold font-serif flex items-center gap-2 break-keep text-black group-hover:text-white transition-colors">
              <LockOpen className="w-5 h-5 text-[#FE9A00]" />
              <span>예약 잠금 모드</span>
            </h2>
            <p className="text-xs text-black/80 group-hover:text-neutral-300 leading-snug break-keep transition-colors">
              SNS 이용 목적과 시간을 먼저 설정해 무의식적 스크롤을 방지하고, 이용 종료 후 집중 모드로 자동 연결됩니다.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-neutral-800 flex items-center justify-between text-[11px] font-bold transition-colors">
            <span className="flex items-center gap-1.5 break-keep text-black group-hover:text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FE9A00] animate-pulse"></span>
              예약 잠금 상세 설정으로 이동
            </span>
            <div className="w-7 h-7 rounded-full bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center group-hover:bg-[#FE9A00] transition-all">
              <ArrowRight className="w-4 h-4 text-[#FE9A00] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
