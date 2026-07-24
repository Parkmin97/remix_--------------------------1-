import React, { useState } from 'react';
import { Zap, Clock, Play, ArrowRight } from 'lucide-react';
import { TARGET_SERVICES } from '../data/targetServices';
import { SessionData } from '../types';
import { TimeSlotPicker } from './TimeSlotPicker';

interface ModeAScreenProps {
  onStartSession: (session: SessionData) => void;
}

export const ModeAScreen: React.FC<ModeAScreenProps> = ({ onStartSession }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['instagram', 'youtube']);
  const [focusDuration, setFocusDuration] = useState<number>(60);
  const [focusTask, setFocusTask] = useState<string>('자기소개서 작성 및 자격증 공부');

  const handleToggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  // 바로 잠금: 즉시 잠금(FOCUS_ACTIVE) 세션을 만들고 폰 홈 화면으로 이동한다.
  // 선택한 소셜 앱은 잠긴 것처럼 보이고, 다시 실행하려 하면 지휘 미션으로 이어진다.
  const handleStart = () => {
    const now = new Date();
    const focusEndsAt = new Date(now.getTime() + focusDuration * 60 * 1000);
    const session: SessionData = {
      id: `session-${Date.now()}`,
      mode: 'FOCUS_NOW',
      state: 'FOCUS_ACTIVE',
      targetServices: TARGET_SERVICES.filter(s => selectedServices.includes(s.id)),
      focusDurationMinutes: focusDuration,
      focusTask,
      missionBeatType: '4/4',
      selectedPieceId: 'beethoven_5',
      createdAt: now.toISOString(),
      focusStartsAt: now.toISOString(),
      focusEndsAt: focusEndsAt.toISOString(),
      missionAttempted: false,
      missionSucceeded: false,
      extensionUsed: false,
      launchAttemptCount: 0,
    };
    onStartSession(session);
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3.5 text-stone-100">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 border border-amber-500/40 shadow-xl space-y-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40">
            모드 a
          </span>
          <h1 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2 break-keep">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>바로 잠금 (상세 설정)</span>
          </h1>
        </div>
        <p className="text-xs text-stone-300 leading-snug break-keep">
          지금 즉시 소셜미디어 이용을 차단하고 집중 약속 세션을 시작합니다.
        </p>
      </div>

      <div className="bg-stone-900/90 border border-amber-900/40 rounded-2xl p-4 space-y-4 shadow-xl">
          {/* Target Apps Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 break-keep">
              관리할 소셜미디어 대상 선택 (최소 1개 이상)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGET_SERVICES.map(service => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleToggleService(service.id)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                        : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:bg-stone-800/80'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {service.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{service.name}</div>
                      <div className="text-[10px] text-stone-400 truncate">{service.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5 break-keep">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>집중 약속 시간 (5분 단위 슬롯 선택)</span>
              </label>
              <TimeSlotPicker
                value={focusDuration}
                onChange={(val) => setFocusDuration(val)}
                min={5}
                max={300}
                step={5}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1 break-keep">
                오늘의 목표 할 일
              </label>
              <input
                type="text"
                value={focusTask}
                onChange={e => setFocusTask(e.target.value)}
                placeholder="예: 자기소개서 작성, 포트폴리오, 자격증 공부"
                className="w-full bg-stone-950 border border-amber-800/50 rounded-xl px-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-sm rounded-xl shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{focusDuration}분 바로 잠금 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};
