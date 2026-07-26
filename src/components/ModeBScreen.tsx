import React, { useState, useEffect } from 'react';
import { LockOpen, Clock, Play, ArrowRight, Target, CheckSquare } from 'lucide-react';
import { TARGET_SERVICES } from '../data/targetServices';
import { SessionData } from '../types';
import { saveActiveSession } from '../lib/storage';
import { TimeSlotPicker } from './TimeSlotPicker';
import { AppSelector } from './AppSelector';

interface ModeBScreenProps {
  onStartSession: (session: SessionData) => void;
  activeSession?: SessionData | null;
}

export const ModeBScreen: React.FC<ModeBScreenProps> = ({ onStartSession, activeSession }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (activeSession?.targetServices && activeSession.targetServices.length > 0) {
      return activeSession.targetServices.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id));
    }
    return ['instagram', 'youtube'];
  });
  const [usageLimit, setUsageLimit] = useState<number>(() => {
    return activeSession?.usageLimitMinutes ?? 15;
  });
  const [focusDuration, setFocusDuration] = useState<number>(() => {
    return activeSession?.focusDurationMinutes ?? 60;
  });
  const [focusTask, setFocusTask] = useState<string>(() => {
    return activeSession?.focusTask ?? '자기소개서 작성 및 자격증 공부';
  });

  const isModeBActive = Boolean(activeSession && activeSession.mode === 'GUIDED_USE');

  // 실행 중인 세션이 있을 경우 선택된 대상 앱 목록, 시간 설정, 목표 할 일을 세션과 동기화
  useEffect(() => {
    if (activeSession) {
      if (activeSession.targetServices && activeSession.targetServices.length > 0) {
        const activeIds = activeSession.targetServices.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id));
        setSelectedServices(activeIds);
      }
      if (activeSession.usageLimitMinutes) {
        setUsageLimit(activeSession.usageLimitMinutes);
      }
      if (activeSession.focusDurationMinutes) {
        setFocusDuration(activeSession.focusDurationMinutes);
      }
      if (activeSession.focusTask) {
        setFocusTask(activeSession.focusTask);
      }
    }
  }, [activeSession]);

  const handleToggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length <= 1) return;
      setSelectedServices(selectedServices.filter(s => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  // 활동 중 잠금 실행 버튼 클릭 시 세션 적용 및 폰 홈 화면 이동
  const handleStart = () => {
    // 이미 세션이 실행 중인 경우: 앱 선택 수정 사항을 기존 세션에 반영 후 폰 홈으로 이동
    if (activeSession) {
      const updatedSession: SessionData = {
        ...activeSession,
        targetServices: TARGET_SERVICES.filter(s => selectedServices.includes(s.id)),
      };
      saveActiveSession(updatedSession);
      onStartSession(updatedSession);
      return;
    }

    // 신규 활동 중 잠금 세션 생성
    const now = new Date();
    const ACTIVITY_SECONDS = 30;
    const focusStartsAt = new Date(now.getTime() + ACTIVITY_SECONDS * 1000);
    const focusEndsAt = new Date(focusStartsAt.getTime() + focusDuration * 60 * 1000);
    const session: SessionData = {
      id: `session-${Date.now()}`,
      mode: 'GUIDED_USE',
      state: 'GUIDED_READY',
      targetServices: TARGET_SERVICES.filter(s => selectedServices.includes(s.id)),
      usageLimitMinutes: usageLimit,
      focusDurationMinutes: focusDuration,
      focusTask,
      missionBeatType: '4/4',
      selectedPieceId: 'beethoven_5',
      createdAt: now.toISOString(),
      usageStartsAt: now.toISOString(),
      usageEndsAt: focusStartsAt.toISOString(),
      focusStartsAt: focusStartsAt.toISOString(),
      focusEndsAt: focusEndsAt.toISOString(),
      missionAttempted: false,
      missionSucceeded: false,
      extensionUsed: false,
      launchAttemptCount: 0,
    };
    onStartSession(session);
  };

  return (
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3 text-white">
      {/* Banner */}
      <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif font-bold flex items-center gap-2 break-keep">
            <LockOpen className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400">활동 중 잠금 모드</span>
            {isModeBActive && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-mono">
                실행 중 (일부 설정 비활성화)
              </span>
            )}
          </h1>
        </div>
        <p className="text-xs text-neutral-300 leading-snug break-keep">
          SNS 이용 목적과 시간을 먼저 설정해 무의식적 스크롤을 방지하고, 이용 종료 후 집중 모드로 자동 연결됩니다.
        </p>
      </div>

      <div className="bg-black/75 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-xl">
        {/* App Selector Slot Widget (항상 활성화) */}
        <AppSelector
          selectedServices={selectedServices}
          onToggleService={handleToggleService}
        />

        {/* Form Inputs (활동 중 잠금 모드 실행 중에는 비활성화) */}
        <div className="space-y-3">
          <div className={isModeBActive ? 'opacity-40 pointer-events-none select-none relative' : ''}>
            <label className="text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 break-keep">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>활동 시간 설정</span>
              <span className="text-[10px] text-neutral-400 font-normal">(최대 2시간)</span>
              {isModeBActive && <span className="text-[10px] text-rose-400 ml-auto font-normal">비활성화됨</span>}
            </label>
            <TimeSlotPicker
              value={usageLimit}
              onChange={(val) => setUsageLimit(val)}
              min={5}
              max={120}
              step={5}
            />
          </div>

          <div className={isModeBActive ? 'opacity-40 pointer-events-none select-none relative' : ''}>
            <label className="text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 break-keep">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>잠금 시간 설정</span>
              <span className="text-[10px] text-neutral-400 font-normal">(최소 30분)</span>
              {isModeBActive && <span className="text-[10px] text-rose-400 ml-auto font-normal">비활성화됨</span>}
            </label>
            <TimeSlotPicker
              value={focusDuration}
              onChange={(val) => setFocusDuration(val)}
              min={30}
              max={360}
              step={5}
            />
          </div>

          <div className={isModeBActive ? 'opacity-40 pointer-events-none select-none relative' : ''}>
            <label className="text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 break-keep">
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>오늘의 목표 할 일</span>
              {isModeBActive && <span className="text-[10px] text-rose-400 ml-auto font-normal">비활성화됨</span>}
            </label>
            <input
              type="text"
              disabled={isModeBActive}
              value={focusTask}
              onChange={e => setFocusTask(e.target.value)}
              placeholder="예: 자기소개서 작성, 포트폴리오, 자격증 공부"
              className="w-full bg-neutral-950/90 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors disabled:bg-neutral-900 disabled:text-neutral-500"
            />
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Play className="w-4 h-4 fill-current text-stone-950" />
          <span>활동 중 잠금 모드 실행</span>
        </button>
      </div>
    </div>
  );
};
