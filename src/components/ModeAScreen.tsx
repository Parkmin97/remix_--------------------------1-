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
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3.5 text-white">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white text-black text-[11px] font-extrabold shadow-sm">
            모드 a
          </span>
          <h1 className="text-lg font-serif font-bold flex items-center gap-2 break-keep">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400">바로 잠금</span>
            <span className="text-xs font-normal text-neutral-300 font-sans">(집중 약속 모드)</span>
          </h1>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed break-keep">
          약속한 시간 동안 SNS 앱 접속 시 지휘 미션(안스마트 인터벤션)을 거쳐야만 앱이 열립니다.
        </p>
      </div>

      {/* Main Settings Form Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-2xl space-y-4 flex-1">
          {/* Target App Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
              <span className="break-keep">통제 대상 서비스 선택</span>
              <span className="text-[10px] text-neutral-400 font-normal">여러 개 선택 가능</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGET_SERVICES.map(service => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleToggleService(service.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-white text-black font-extrabold border-white shadow-md'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {service.name[0]}
                    </div>
                    <span className="text-xs truncate">{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 break-keep">
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
              <label className="block text-xs font-semibold text-neutral-200 mb-1 break-keep">
                오늘의 목표 할 일
              </label>
              <input
                type="text"
                value={focusTask}
                onChange={e => setFocusTask(e.target.value)}
                placeholder="예: 자기소개서 작성, 포트폴리오, 자격증 공부"
                className="w-full bg-neutral-950/90 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current text-stone-950" />
            <span>{focusDuration}분 바로 잠금 시작하기</span>
            <ArrowRight className="w-4 h-4 text-stone-950" />
          </button>
      </div>
    </div>
  );
};
