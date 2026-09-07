import React from 'react';
import { Shield, Lock, LockOpen, ArrowRight } from 'lucide-react';
import { TabType } from './BottomTabBar';
import { SessionData } from '../types';
import { isModeRunning } from '../lib/sessionState';

interface NewHomeScreenProps {
  onSelectTab: (tab: TabType) => void;
  activeSession?: SessionData | null;
}

export const NewHomeScreen: React.FC<NewHomeScreenProps> = ({ onSelectTab, activeSession }) => {
  // 진행 중인 세션만 반대쪽 모드를 막는다 (BottomTabBar 와 같은 기준).
  const isModeAActive = isModeRunning(activeSession, 'FOCUS_NOW');
  const isModeBActive = isModeRunning(activeSession, 'GUIDED_USE');

  return (
    <div className="min-h-full flex flex-col justify-start max-w-2xl mx-auto w-full px-4 pt-6 pb-20 gap-6 sm:gap-7 text-black">
      {/* Header Title */}
      <div className="text-center space-y-2 shrink-0">
        <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-black text-white border border-black shadow-md">
          <Shield className="w-6 h-6 text-[#FE9A00]" />
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
            디톡스 모드 선택
          </h1>
        </div>
      </div>

      {/* Detox Mode Selection Cards (Mode A vs Mode B only) */}
      <div className="grid grid-cols-1 gap-6 w-full">
        {/* Mode A Box (지금 잠금 모드) */}
        <div
          onClick={() => {
            if (!isModeBActive) onSelectTab('mode-a');
          }}
          className={`p-7 sm:p-8 min-h-[220px] sm:min-h-[240px] rounded-3xl border transition-all relative overflow-hidden group flex flex-col justify-between ${isModeBActive
            ? 'bg-slate-100 border-slate-200 text-black/40 cursor-not-allowed opacity-40 shadow-none'
            : 'bg-white hover:bg-black text-black hover:text-white border-slate-200 hover:border-black cursor-pointer shadow-xl hover:shadow-2xl active:bg-black active:text-white'
            }`}
        >
          <div className="space-y-3">
            <h2 className={`text-2xl sm:text-3xl font-extrabold font-serif flex items-center justify-between break-keep ${isModeBActive ? 'text-black/40' : 'text-black group-hover:text-white group-active:text-white'
              } transition-colors`}>
              <span className="flex items-center gap-3">
                <Lock className="w-7 h-7 text-[#FE9A00]" />
                <span>지금 잠금 모드</span>
              </span>
            </h2>
            <p className={`text-sm sm:text-base ${isModeBActive ? 'text-black/40' : 'text-black/80 group-hover:text-neutral-300 group-active:text-neutral-300'} leading-relaxed break-keep transition-colors`}>
              지금부터 즉시 소셜미디어를 멀리하고 집중을 시작합니다. 설정한 시간 동안 몰입 환경을 조성해 드립니다.
            </p>
          </div>

          <div className={`mt-6 pt-4 border-t ${isModeBActive ? 'border-slate-200' : 'border-slate-100 group-hover:border-neutral-800 group-active:border-neutral-800'} flex items-center justify-between text-xs sm:text-sm font-bold transition-colors`}>
            <span className={`flex items-center gap-2 break-keep ${isModeBActive ? 'text-black/40' : 'text-black group-hover:text-white group-active:text-white'}`}>
              <span className="w-2 h-2 rounded-full bg-[#FE9A00] animate-pulse"></span>
              {isModeBActive ? '예약 잠금 실행 중에는 진입할 수 없습니다' : '지금 잠금 상세 설정으로 이동'}
            </span>
            <div className="w-9 h-9 rounded-full bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center group-hover:bg-[#FE9A00] group-active:bg-[#FE9A00] transition-all shrink-0">
              <ArrowRight className="w-5 h-5 text-[#FE9A00] group-hover:text-black group-active:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>

        {/* Mode B Box (예약 잠금 모드) */}
        <div
          onClick={() => {
            if (!isModeAActive) onSelectTab('mode-b');
          }}
          className={`p-7 sm:p-8 min-h-[220px] sm:min-h-[240px] rounded-3xl border transition-all relative overflow-hidden group flex flex-col justify-between ${isModeAActive
            ? 'bg-slate-100 border-slate-200 text-black/40 cursor-not-allowed opacity-40 shadow-none'
            : 'bg-white hover:bg-black text-black hover:text-white border-slate-200 hover:border-black cursor-pointer shadow-xl hover:shadow-2xl active:bg-black active:text-white'
            }`}
        >
          <div className="space-y-3">
            <h2 className={`text-2xl sm:text-3xl font-extrabold font-serif flex items-center justify-between break-keep ${isModeAActive ? 'text-black/40' : 'text-black group-hover:text-white group-active:text-white'
              } transition-colors`}>
              <span className="flex items-center gap-3">
                <LockOpen className="w-7 h-7 text-[#FE9A00]" />
                <span>예약 잠금 모드</span>
              </span>
            </h2>
            <p className={`text-sm sm:text-base ${isModeAActive ? 'text-black/40' : 'text-black/80 group-hover:text-neutral-300 group-active:text-neutral-300'} leading-relaxed break-keep transition-colors`}>
              SNS 이용 목적과 시간을 먼저 설정해 무의식적 스크롤을 방지하고, 이용 종료 후 집중 모드로 자동 연결됩니다.
            </p>
          </div>

          <div className={`mt-6 pt-4 border-t ${isModeAActive ? 'border-slate-200' : 'border-slate-100 group-hover:border-neutral-800 group-active:border-neutral-800'} flex items-center justify-between text-xs sm:text-sm font-bold transition-colors`}>
            <span className={`flex items-center gap-2 break-keep ${isModeAActive ? 'text-black/40' : 'text-black group-hover:text-white group-active:text-white'}`}>
              <span className="w-2 h-2 rounded-full bg-[#FE9A00] animate-pulse"></span>
              {isModeAActive ? '지금 잠금 실행 중에는 진입할 수 없습니다' : '예약 잠금 상세 설정으로 이동'}
            </span>
            <div className="w-9 h-9 rounded-full bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center group-hover:bg-[#FE9A00] group-active:bg-[#FE9A00] transition-all shrink-0">
              <ArrowRight className="w-5 h-5 text-[#FE9A00] group-hover:text-black group-active:text-black group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
