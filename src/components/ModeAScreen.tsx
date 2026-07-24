import React, { useState } from 'react';
import { Zap, Clock, Play, ArrowRight, ShieldCheck } from 'lucide-react';
import { TARGET_SERVICES } from '../data/targetServices';

export const ModeAScreen: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['instagram', 'youtube']);
  const [focusDuration, setFocusDuration] = useState<number>(60);
  const [focusTask, setFocusTask] = useState<string>('자기소개서 작성 및 자격증 공부');
  const [isStarted, setIsStarted] = useState<boolean>(false);

  const handleToggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleStart = () => {
    setIsStarted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-stone-100 pb-24">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
            모드 a
          </span>
          <h1 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>바로 잠금 (상세 설정)</span>
          </h1>
        </div>
        <p className="text-xs text-stone-300">
          지금 즉시 소셜미디어 이용을 차단하고 집중 약속 세션을 시작합니다.
        </p>
      </div>

      {isStarted ? (
        <div className="p-8 rounded-3xl bg-stone-900/90 border border-emerald-500/40 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif text-emerald-200">바로 잠금 세션이 시작되었습니다!</h2>
          <p className="text-xs text-stone-300">
            약속 시간: <strong className="text-emerald-400 font-semibold">{focusDuration}분</strong> | 목표: {focusTask}
          </p>
          <button
            onClick={() => setIsStarted(false)}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 transition-all"
          >
            설정 다시 변경하기
          </button>
        </div>
      ) : (
        <div className="bg-stone-900/90 border border-amber-900/40 rounded-3xl p-6 space-y-6 shadow-xl">
          {/* Target Apps Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              관리할 소셜미디어 대상 선택 (최소 1개 이상)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TARGET_SERVICES.map(service => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleToggleService(service.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                        : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:bg-stone-800/80'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {service.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{service.name}</div>
                      <div className="text-[10px] text-stone-400">{service.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>집중 약속 시간</span>
              </label>
              <select
                value={focusDuration}
                onChange={e => setFocusDuration(Number(e.target.value))}
                className="w-full bg-stone-950 border border-amber-800/50 rounded-xl px-3 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
              >
                <option value={30}>30분 집중</option>
                <option value={45}>45분 집중</option>
                <option value={60}>60분 (1시간 집중)</option>
                <option value={120}>120분 (2시간 집중)</option>
                <option value={180}>180분 (3시간 집중)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                오늘의 목표 할 일
              </label>
              <input
                type="text"
                value={focusTask}
                onChange={e => setFocusTask(e.target.value)}
                placeholder="예: 자기소개서 작성, 포트폴리오, 자격증 공부"
                className="w-full bg-stone-950 border border-amber-800/50 rounded-xl px-3 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-sm rounded-2xl shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{focusDuration}분 바로 잠금 시작하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
