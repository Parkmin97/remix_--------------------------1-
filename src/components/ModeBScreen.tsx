import React, { useState, useEffect } from 'react';
import { LockOpen, Clock, Play, ArrowRight, Target, CheckSquare } from 'lucide-react';
import { getAppCatalog } from '../lib/appCatalog';
import { SessionData } from '../types';
import { saveActiveSession } from '../lib/storage';
import { isModeRunning, isSessionRunning } from '../lib/sessionState';
import { TimeSlotPicker, TEST_EXTRA_MINUTES } from './TimeSlotPicker';
import { AppSelector } from './AppSelector';
import { PermissionNotice } from './PermissionSetup';
import { useBlockerPermissions } from '../lib/blockerPermissions';

interface ModeBScreenProps {
  onStartSession: (session: SessionData) => void;
  activeSession?: SessionData | null;
}

export const ModeBScreen: React.FC<ModeBScreenProps> = ({ onStartSession, activeSession }) => {
  // 진행 중인 세션만 폼에 되살린다 — 사유는 ModeAScreen 의 같은 자리 주석 참고.
  const runningSession = isSessionRunning(activeSession) ? activeSession : null;

  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (runningSession?.targetServices && runningSession.targetServices.length > 0) {
      return runningSession.targetServices.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id));
    }
    // 기본 선택 없음 — 사유는 ModeAScreen 의 같은 자리 주석 참고.
    return [];
  });
  const [usageLimit, setUsageLimit] = useState<number>(() => {
    return runningSession?.usageLimitMinutes ?? 15;
  });
  const [focusDuration, setFocusDuration] = useState<number>(() => {
    return runningSession?.focusDurationMinutes ?? 60;
  });
  const [focusTask, setFocusTask] = useState<string>(() => {
    return runningSession?.focusTask ?? '자기소개서 작성 및 자격증 공부';
  });

  // 진행 중인 예약 잠금 세션이 있을 때만 폼을 잠근다.
  // mode 만 보면 이미 끝난(COMPLETED) 세션에도 폼이 잠긴 채로 남는다.
  const isModeBActive = isModeRunning(activeSession, 'GUIDED_USE');

  // 잠금이 실행 중일 때만 폼을 세션에 맞춘다.
  // 끝난 세션까지 반영하면 지난번 설정이 계속 되살아난다.
  useEffect(() => {
    if (!isSessionRunning(activeSession) || !activeSession) return;

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
  }, [activeSession]);

  // 직전 값을 받는 형태로 갱신해야 '전체 선택'이 제대로 동작한다.
  // 사유는 ModeAScreen 의 같은 자리 주석 참고.
  const handleToggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // 실제로 잠글 수 있는 앱이 있는지 — 사유는 ModeAScreen 의 같은 자리 주석 참고.
  const hasSelectableApp = getAppCatalog().some(s => selectedServices.includes(s.id));

  // 필수 권한이 없으면 잠금이 실제로 걸리지 않는다 — 사유는 ModeAScreen 의 같은 자리 주석 참고.
  const { canBlock } = useBlockerPermissions();

  const canStart = hasSelectableApp && canBlock;

  // 예약 잠금 실행 버튼 클릭 시 세션 적용 및 폰 홈 화면 이동
  const handleStart = () => {
    if (!canStart) return;

    // 이미 세션이 **실행 중인** 경우만 기존 세션 갱신 — 사유는 ModeAScreen 의 같은 자리 주석 참고.
    if (isSessionRunning(activeSession)) {
      const updatedSession: SessionData = {
        ...activeSession,
        targetServices: getAppCatalog().filter(s => selectedServices.includes(s.id)),
      };
      saveActiveSession(updatedSession);
      onStartSession(updatedSession);
      return;
    }

    // 신규 예약 잠금 세션 생성
    //
    // ⚠️ 사용 가능 시간은 사용자가 "예약 시간 설정"에서 고른 값(usageLimit) 그대로다.
    //    예전에는 여기가 30초로 고정되어 있어서, 몇 분을 고르든 30초 뒤에 잠겼다.
    //    개발 중 테스트 편의로 넣어둔 값이 그대로 남아 있던 것이다.
    //    짧게 시험해보고 싶으면 TimeSlotPicker 의 테스트용 1분 옵션을 쓴다.
    const now = new Date();
    const focusStartsAt = new Date(now.getTime() + usageLimit * 60 * 1000);
    const focusEndsAt = new Date(focusStartsAt.getTime() + focusDuration * 60 * 1000);
    const session: SessionData = {
      id: `session-${Date.now()}`,
      mode: 'GUIDED_USE',
      state: 'GUIDED_READY',
      targetServices: getAppCatalog().filter(s => selectedServices.includes(s.id)),
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
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3 text-black">
      {/* Banner (검은색 배경, 흰색 텍스트, #FE9A00 아이콘) */}
      <div className="p-3.5 rounded-3xl bg-black text-white border border-black shadow-xl space-y-1 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif font-bold flex items-center gap-2 break-keep">
            <LockOpen className="w-5 h-5 text-[#FE9A00]" />
            <span className="text-white">예약 잠금 모드</span>
          </h1>
        </div>
        <p className="text-xs text-neutral-300 leading-snug break-keep">
          {isModeBActive
            ? '시간 설정 및 오늘의 목표 할 일은 변경 불가하며 잠금할 앱 추가 선택만 가능합니다.'
            : 'SNS 이용 목적과 시간을 먼저 설정해 무의식적 스크롤을 방지하고, 이용 종료 후 집중 모드로 자동 연결됩니다.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-xl">
        {/* App Selector Slot Widget (항상 활성화) */}
        <AppSelector
          selectedServices={selectedServices}
          onToggleService={handleToggleService}
          lockedServices={isModeBActive ? activeSession?.targetServices?.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id)) : []}
        />

        {/* Form Inputs (예약 잠금 모드 실행 중에는 비활성화) */}
        <div className="space-y-3">
          <div className={isModeBActive ? 'opacity-40 pointer-events-none select-none relative' : ''}>
            <label className="text-xs font-semibold text-black mb-1.5 flex items-center gap-1.5 break-keep">
              <Clock className="w-3.5 h-3.5 text-[#FE9A00]" />
              <span>예약 시간 설정</span>
              <span className="text-[10px] text-black/60 font-normal">
                (최대 2시간{TEST_EXTRA_MINUTES.length > 0 ? ' · 테스트용 1분' : ''})
              </span>
              {isModeBActive && <span className="text-[10px] text-rose-500 ml-auto font-normal">비활성화됨</span>}
            </label>
            <TimeSlotPicker
              value={usageLimit}
              onChange={(val) => setUsageLimit(val)}
              min={5}
              max={120}
              step={5}
              extraOptions={TEST_EXTRA_MINUTES}
            />
          </div>

          <div className={isModeBActive ? 'opacity-40 pointer-events-none select-none relative' : ''}>
            <label className="text-xs font-semibold text-black mb-1.5 flex items-center gap-1.5 break-keep">
              <Target className="w-3.5 h-3.5 text-[#FE9A00]" />
              <span>잠금 시간 설정</span>
              <span className="text-[10px] text-black/60 font-normal">
                (최소 15분{TEST_EXTRA_MINUTES.length > 0 ? ' · 테스트용 1분' : ''})
              </span>
              {isModeBActive && <span className="text-[10px] text-rose-500 ml-auto font-normal">비활성화됨</span>}
            </label>
            <TimeSlotPicker
              value={focusDuration}
              onChange={(val) => setFocusDuration(val)}
              min={15}
              max={360}
              step={5}
              extraOptions={TEST_EXTRA_MINUTES}
            />
          </div>

          <div className={isModeBActive ? 'opacity-40 pointer-events-none select-none relative' : ''}>
            <label className="text-xs font-semibold text-black mb-1.5 flex items-center gap-1.5 break-keep">
              <CheckSquare className="w-3.5 h-3.5 text-[#FE9A00]" />
              <span>오늘의 목표 할 일</span>
              {isModeBActive && <span className="text-[10px] text-rose-500 ml-auto font-normal">비활성화됨</span>}
            </label>
            <input
              type="text"
              disabled={isModeBActive}
              value={focusTask}
              onChange={e => setFocusTask(e.target.value)}
              placeholder="예: 자기소개서 작성, 포트폴리오, 자격증 공부"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-black placeholder-slate-400 focus:outline-none focus:border-[#FE9A00] transition-colors disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        </div>

        {/* 차단 권한이 빠져 있을 때만 뜨는 안내 */}
        <PermissionNotice />

        {/* Start Button (검은색 배경, 흰색 텍스트, #FE9A00 아이콘) */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-3.5 bg-black hover:bg-neutral-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Play className="w-4 h-4 fill-[#FE9A00] text-[#FE9A00]" />
          <span>
            {!hasSelectableApp ? '잠글 앱을 먼저 선택하세요'
              : !canBlock ? '잠금 권한을 먼저 켜주세요'
              : '예약 잠금 모드 실행'}
          </span>
        </button>
      </div>
    </div>
  );
};
