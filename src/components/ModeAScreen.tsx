import React, { useState, useEffect } from 'react';
import { Lock, Clock, Play, ArrowRight, CheckSquare } from 'lucide-react';
import { getAppCatalog } from '../lib/appCatalog';
import { SessionData } from '../types';
import { saveActiveSession } from '../lib/storage';
import { isSessionRunning } from '../lib/sessionState';
import { TimeSlotPicker } from './TimeSlotPicker';
import { AppSelector } from './AppSelector';
import { PermissionNotice } from './PermissionSetup';
import { useBlockerPermissions } from '../lib/blockerPermissions';

interface ModeAScreenProps {
  onStartSession: (session: SessionData) => void;
  activeSession?: SessionData | null;
}

export const ModeAScreen: React.FC<ModeAScreenProps> = ({ onStartSession, activeSession }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    if (activeSession?.targetServices && activeSession.targetServices.length > 0) {
      return activeSession.targetServices.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id));
    }
    // 기본 선택은 없다. 예전에는 'instagram','youtube' 를 미리 넣어뒀는데,
    // 앱 id 가 실제 패키지명('com.instagram.android')으로 바뀌면서 어디에도 매칭되지 않게 됐다.
    // 그러면 targetServices 가 빈 배열이 되어 네이티브로 아무것도 넘어가지 않고,
    // 화면에는 "잠금 중"이라 뜨는데 실제로는 한 개도 안 막히는 상태가 된다.
    return [];
  });
  const [focusDuration, setFocusDuration] = useState<number>(() => {
    return activeSession?.focusDurationMinutes ?? 60;
  });
  const [focusTask, setFocusTask] = useState<string>(() => {
    return activeSession?.focusTask ?? '자기소개서 작성 및 자격증 공부';
  });

  // 진행 중인 세션이 있으면 설정을 잠근다.
  // 예전에는 상태 3개(FOCUS_ACTIVE/MISSION_ACTIVE/INTERVENTION)만 나열했는데,
  // 그러면 DECISION_PENDING·EXTENSION_ACTIVE 처럼 아직 안 끝난 상태에서 폼이 풀려버린다.
  // 판단 기준은 sessionState 한 곳에서만 관리한다.
  const isLocked = isSessionRunning(activeSession);

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

  /**
   * 앱 하나를 켜고 끈다.
   *
   * ⚠️ 반드시 **직전 값을 인자로 받는 형태**로 갱신해야 한다.
   *    '전체 선택'은 앱 개수만큼 이 함수를 연달아 부르는데,
   *    setSelectedServices([...selectedServices, id]) 처럼 바깥 값을 쓰면
   *    호출마다 똑같은 옛 배열을 보게 되어 마지막 하나만 남는다.
   *    (전체 선택을 눌러도 한 개만 켜지던 원인)
   */
  const handleToggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  /**
   * 실제로 잠글 수 있는 앱이 하나라도 있는지.
   *
   * 고른 개수가 아니라 **설치 목록과 실제로 매칭된 개수**를 본다.
   * 저장된 옛 세션에 지금은 없는 id 가 들어 있으면 개수만으로는 걸러지지 않고,
   * 아무것도 안 막히는 잠금이 시작돼 버린다.
   */
  const hasSelectableApp = getAppCatalog().some(s => selectedServices.includes(s.id));

  /**
   * 필수 권한(사용 정보 접근 + 다른 앱 위에 표시)이 있는지.
   * 없으면 잠금을 걸어도 실제로는 아무 앱도 막히지 않는다 — 시작 자체를 막는다.
   * 배터리 최적화는 권장이라 여기서 막지 않고 [PermissionNotice] 로 경고만 한다.
   */
  const { canBlock } = useBlockerPermissions();

  const canStart = hasSelectableApp && canBlock;

  // 지금 잠금 실행 버튼 클릭 시 세션 적용 및 폰 홈 화면 이동
  const handleStart = () => {
    if (!canStart) return;

    // 이미 세션이 **실행 중인** 경우: 앱 선택 수정 사항을 기존 세션에 반영 후 폰 홈으로 이동.
    // 끝난 세션까지 여기로 들어오면 새 잠금이 시작되지 않고, 이미 지나간 종료 시각을
    // 그대로 다시 넘겨 잠금이 곧바로 만료돼 버린다.
    if (isSessionRunning(activeSession)) {
      const updatedSession: SessionData = {
        ...activeSession,
        targetServices: getAppCatalog().filter(s => selectedServices.includes(s.id)),
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
      targetServices: getAppCatalog().filter(s => selectedServices.includes(s.id)),
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
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3.5 text-black">
      {/* Banner (검은색 배경, 흰색 텍스트, #FE9A00 아이콘) */}
      <div className="p-4 rounded-3xl bg-black text-white border border-black shadow-xl space-y-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif font-bold flex items-center gap-2 break-keep">
            <Lock className="w-5 h-5 text-[#FE9A00]" />
            <span className="text-white">지금 잠금 모드</span>
          </h1>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed break-keep">
          {isLocked
            ? '시간 설정 및 오늘의 목표 할 일은 변경 불가하며 잠금할 앱 추가 선택만 가능합니다.'
            : '지금부터 즉시 소셜미디어를 멀리하고 집중을 시작합니다. 설정한 시간 동안 몰입 환경을 조성해 드립니다.'}
        </p>
      </div>

      {/* Main Settings Form Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4 flex-1">
          {/* 잠금 대상 앱 선택 컴포넌트 */}
          <AppSelector
            selectedServices={selectedServices}
            onToggleService={handleToggleService}
            lockedServices={isLocked ? activeSession?.targetServices?.map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id)) : []}
          />

          {/* Form Inputs (잠금 모드 실행 중에는 비활성화) */}
          <div className="space-y-3">
            <div className={isLocked ? 'opacity-40 pointer-events-none select-none relative' : ''}>
              <label className="text-xs font-semibold text-black mb-1.5 flex items-center gap-1.5 break-keep">
                <Clock className="w-3.5 h-3.5 text-[#FE9A00]" />
                <span>잠금 시간 설정</span>
                <span className="text-[10px] text-black/60 font-normal">(최소 15분)</span>
                {isLocked && <span className="text-[10px] text-rose-500 ml-auto font-normal">비활성화됨</span>}
              </label>
              <TimeSlotPicker
                value={focusDuration}
                onChange={(val) => setFocusDuration(val)}
                min={15}
                max={360}
                step={5}
              />
            </div>

            <div className={isLocked ? 'opacity-40 pointer-events-none select-none relative' : ''}>
              <label className="text-xs font-semibold text-black mb-1.5 flex items-center gap-1.5 break-keep">
                <CheckSquare className="w-3.5 h-3.5 text-[#FE9A00]" />
                <span>오늘의 목표 할 일</span>
                {isLocked && <span className="text-[10px] text-rose-500 ml-auto font-normal">비활성화됨</span>}
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={focusTask}
                onChange={e => setFocusTask(e.target.value)}
                placeholder="예: 자기소개서 작성, 포트폴리오, 자격증 공부"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-black placeholder-slate-400 focus:outline-none focus:border-[#FE9A00] transition-colors disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* 차단 권한이 빠져 있을 때만 뜨는 안내 (웹/모두 허용이면 아무것도 그리지 않는다) */}
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
                : '지금 잠금 모드 실행'}
            </span>
          </button>
      </div>
    </div>
  );
};
