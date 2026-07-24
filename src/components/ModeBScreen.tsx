import React, { useState } from 'react';
import { Activity, Clock, Play, ArrowRight, Target } from 'lucide-react';
import { TARGET_SERVICES } from '../data/targetServices';
import { SessionData } from '../types';
import { TimeSlotPicker } from './TimeSlotPicker';

interface ModeBScreenProps {
  onStartSession: (session: SessionData) => void;
}

export const ModeBScreen: React.FC<ModeBScreenProps> = ({ onStartSession }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['instagram', 'youtube']);
  const [usageLimit, setUsageLimit] = useState<number>(15);
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

  // 활동 중 잠금: 앱이 잠기지 않은(GUIDED_READY) 세션을 만들고 폰 홈 화면으로 이동한다.
  // 소셜 앱을 클릭하면 이용(숏폼) 화면으로 진입한다.
  const handleStart = () => {
    const now = new Date();
    const focusStartsAt = new Date(now.getTime() + usageLimit * 60 * 1000);
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
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3 text-stone-100">
      {/* Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 border border-amber-500/40 shadow-xl space-y-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40">
            모드 b
          </span>
          <h1 className="text-lg font-serif font-bold text-amber-100 flex items-center gap-2 break-keep">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>활동 중 잠금 (상세 설정)</span>
          </h1>
        </div>
        <p className="text-xs text-stone-300 leading-snug break-keep">
          계획된 목적과 시간만큼 소셜미디어를 이용한 후, 몰입을 위해 지정된 집중 약속 세션으로 자동 전환됩니다.
        </p>
      </div>

      <div className="bg-stone-900/90 border border-amber-900/40 rounded-2xl p-4 space-y-3 shadow-xl">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5 break-keep">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>계획 이용 시간 (SNS 허용)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 10, 15, 30, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setUsageLimit(m)}
                      className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors break-keep ${
                        usageLimit === m
                          ? 'bg-amber-500 text-stone-950 border-amber-400'
                          : 'bg-stone-950 text-stone-300 border-amber-800/50 hover:bg-stone-800'
                      }`}
                    >
                      {m}분
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-stone-500 break-keep">15분 이용을 권장합니다.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5 break-keep">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>이용 후 집중 약속 시간 (5분 단위)</span>
                </label>
                <TimeSlotPicker
                  value={focusDuration}
                  onChange={(val) => setFocusDuration(val)}
                  min={5}
                  max={300}
                  step={5}
                  heightPx={120}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1 break-keep">
                종료 후 수행할 목표 할 일
              </label>
              <input
                type="text"
                value={focusTask}
                onChange={e => setFocusTask(e.target.value)}
                placeholder="예: 자기소개서, 자격증 공부"
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
            <span>{usageLimit}분 활동 중 잠금 이용 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};
