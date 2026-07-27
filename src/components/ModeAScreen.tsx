import React, { useState, useEffect } from 'react';
import { Lock, Clock, Play, ArrowRight, CheckSquare } from 'lucide-react';
import { TARGET_SERVICES } from '../data/targetServices';
import { SessionData } from '../types';
import { saveActiveSession } from '../lib/storage';
import { TimeSlotPicker } from './TimeSlotPicker';
import { AppSelector } from './AppSelector';

interface ModeAScreenProps {
  onStartSession: (session: SessionData) => void;
  activeSession?: SessionData | null;
}

export const ModeAScreen: React.FC<ModeAScreenProps> = ({ onStartSession, activeSession }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (activeSession?.targetServices && activeSession.targetServices.length > 0) {
      return activeSession.targetServices.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id));
    }
    return ['instagram', 'youtube'];
  });
  const [focusDuration, setFocusDuration] = useState<number>(() => {
    return activeSession?.focusDurationMinutes ?? 60;
  });
  const [focusTask, setFocusTask] = useState<string>(() => {
    return activeSession?.focusTask ?? '자기소개서 작성 및 자격증 공부';
  });

  const isLocked = Boolean(
    activeSession &&
    (activeSession.state === 'FOCUS_ACTIVE' || activeSession.state === 'MISSION_ACTIVE' || activeSession.state === 'INTERVENTION')
  );

  // 실행 중인 세션이 있을 경우 선택된 대상 앱 목록, 시간 설정, 목표 할 일을 세션과 동기화
  useEffect(() => {
    if (activeSession) {
      if (activeSession.targetServices && activeSession.targetServices.length > 0) {
        const activeIds = activeSession.targetServices.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id));
        setSelectedServices(activeIds);
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

  // 지금 잠금 실행 버튼 클릭 시 세션 적용 및 폰 홈 화면 이동
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

    // 신규 지금 잠금 세션 생성
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
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3.5 text-neutral-900">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-neutral-950 ring-1 ring-black/5 shadow-xl space-y-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif font-bold flex items-center gap-2 break-keep">
            <Lock className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400">지금 잠금 모드</span>
            {isLocked && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-mono">
                실행 중 (일부 설정 비활성화)
              </span>
            )}
          </h1>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed break-keep">
          지금부터 즉시 소셜미디어를 멀리하고 집중을 시작합니다. 설정한 시간 동안 몰입 환경을 조성해 드립니다.
        </p>
      </div>

      {/* Main Settings Form Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-neutral-950 ring-1 ring-black/5 shadow-2xl space-y-4 flex-1">
          {/* App Selector Slot Widget (항상 활성화) */}
          <AppSelector
            selectedServices={selectedServices}
            onToggleService={handleToggleService}
          />

          {/* Form Inputs (잠금 모드 실행 중에는 비활성화) */}
          <div className="space-y-3">
            <div className={isLocked ? 'opacity-40 pointer-events-none select-none relative' : ''}>
              <label className="text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 break-keep">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>잠금 시간 설정</span>
                <span className="text-[10px] text-neutral-400 font-normal">(최소 30분)</span>
                {isLocked && <span className="text-[10px] text-rose-400 ml-auto font-normal">비활성화됨</span>}
              </label>
              <TimeSlotPicker
                value={focusDuration}
                onChange={(val) => setFocusDuration(val)}
                min={30}
                max={360}
                step={5}
              />
            </div>

            <div className={isLocked ? 'opacity-40 pointer-events-none select-none relative' : ''}>
              <label className="text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5 break-keep">
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>오늘의 목표 할 일</span>
                {isLocked && <span className="text-[10px] text-rose-400 ml-auto font-normal">비활성화됨</span>}
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={focusTask}
                onChange={e => setFocusTask(e.target.value)}
                placeholder="예: 자기소개서 작성, 포트폴리오, 자격증 공부"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors disabled:bg-neutral-900 disabled:text-neutral-500"
              />
            </div>
          </div>

          {/* Start Button (항상 활성화) */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current text-stone-950" />
            <span>지금 잠금 모드 실행</span>
          </button>
      </div>
    </div>
  );
};
