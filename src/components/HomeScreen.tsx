import React, { useState } from 'react';
import { ModeType, SessionData, TargetService } from '../types';
import { TARGET_SERVICES } from '../data/targetServices';
import { CLASSICAL_PIECES, DAILY_QUOTES } from '../data/classicalPieces';
import { getDailyReports, saveActiveSession } from '../lib/storage';
import { Shield, Clock, Sparkles, CheckCircle2, Play, ExternalLink, ArrowRight, Calendar, Compass } from 'lucide-react';

interface HomeScreenProps {
  activeSession: SessionData | null;
  setActiveSession: (session: SessionData | null) => void;
  onNavigateToScreen: (screen: string) => void;
  onOpenIntervention: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeSession,
  setActiveSession,
  onNavigateToScreen,
  onOpenIntervention
}) => {
  const [selectedMode, setSelectedMode] = useState<ModeType>('FOCUS_NOW');
  const [selectedServices, setSelectedServices] = useState<string[]>(['instagram', 'youtube']);
  const [focusDuration, setFocusDuration] = useState<number>(60); // minutes
  const [usageLimit, setUsageLimit] = useState<number>(15); // minutes for Mode B
  const [focusTask, setFocusTask] = useState<string>('자기소개서 및 자격증 공부');
  const [usageIntent, setUsageIntent] = useState<string>('업무 정보 탐색 및 잠깐의 휴식');

  const dailyReports = getDailyReports();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReport = dailyReports.find(r => r.date === todayStr) || {
    completedFocusMinutes: 0,
    confirmedCount: 0,
    conductorRank: '신예 지휘자'
  };

  const todayQuote = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];

  const handleToggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s !== id));
      }
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleStartSession = () => {
    const now = new Date();
    const nowIso = now.toISOString();

    const targets = TARGET_SERVICES.filter(s => selectedServices.includes(s.id));
    const randomPiece = CLASSICAL_PIECES[Math.floor(Math.random() * CLASSICAL_PIECES.length)];

    let usageEndsAtIso: string | undefined = undefined;
    let focusStartsAtIso = nowIso;
    let focusEndsAtIso = new Date(now.getTime() + focusDuration * 60 * 1000).toISOString();

    let initialState: SessionData['state'] = 'FOCUS_ACTIVE';

    if (selectedMode === 'GUIDED_USE') {
      // Mode B starts in GUIDED_READY state awaiting social app launch from phone-home
      initialState = 'GUIDED_READY';
      usageEndsAtIso = undefined;
      focusStartsAtIso = nowIso;
      focusEndsAtIso = new Date(now.getTime() + focusDuration * 60 * 1000).toISOString();
    }

    const newSession: SessionData = {
      id: `session-${Date.now()}`,
      mode: selectedMode,
      targetServices: targets,
      usageLimitMinutes: selectedMode === 'GUIDED_USE' ? usageLimit : undefined,
      focusDurationMinutes: focusDuration,
      focusTask: focusTask || '자기소개서 작성 및 개인 학습',
      usageIntent: selectedMode === 'GUIDED_USE' ? usageIntent : undefined,
      createdAt: nowIso,
      usageStartsAt: undefined,
      usageEndsAt: usageEndsAtIso,
      focusStartsAt: focusStartsAtIso,
      focusEndsAt: focusEndsAtIso,
      state: initialState,
      missionBeatType: randomPiece.beatType,
      selectedPieceId: randomPiece.id,
      missionAttempted: false,
      missionSucceeded: false,
      extensionUsed: false,
      launchAttemptCount: 0
    };

    saveActiveSession(newSession);
    setActiveSession(newSession);

    // Both modes go to unlocked or lock-aware phone-home screen
    onNavigateToScreen('phone-home');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8 text-stone-100">
      {/* Musical Banner Title */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 p-6 sm:p-8 border border-amber-600/30 shadow-2xl shadow-amber-950/40">
        {/* Background Musical Staff Decor */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none flex flex-col justify-around py-4">
          <div className="w-full h-px bg-amber-400"></div>
          <div className="w-full h-px bg-amber-400"></div>
          <div className="w-full h-px bg-amber-400"></div>
          <div className="w-full h-px bg-amber-400"></div>
          <div className="w-full h-px bg-amber-400"></div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl text-amber-400 font-serif">𝄞</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 font-mono">
              오늘의 한마디 (Daily Conductor Quote)
            </span>
          </div>

          <blockquote className="text-lg sm:text-2xl font-serif font-medium text-amber-100 leading-snug italic border-l-2 border-amber-500/80 pl-4 py-1">
            "{todayQuote}"
          </blockquote>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-amber-200/80 border-t border-amber-900/40">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>오늘 완료 약속: <strong className="text-amber-300 font-semibold">{todayReport.completedFocusMinutes}분</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>지킨 세션: <strong className="text-emerald-300 font-semibold">{todayReport.confirmedCount}회</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>현재 지휘자 칭호: <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">{todayReport.conductorRank}</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Conducting Practice Tutorial Quick Banner */}
      <section className="bg-stone-900/90 border border-amber-800/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-amber-200">지휘 동작 연습 튜토리얼</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">NEW</span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">2박자, 3박자(왈츠), 4박자 지휘 패턴과 Ictus 타점을 시각화 및 오디오로 연습해보세요!</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToScreen('tutorial')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 transition-all active:scale-95"
        >
          <span>지휘 연습장 열기</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Active Session Status Banner if Running */}
      {activeSession && activeSession.state !== 'COMPLETED' && activeSession.state !== 'CANCELLED' && (
        <section className="p-5 rounded-2xl bg-amber-950/60 border-2 border-amber-500/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 font-serif text-2xl font-bold flex items-center justify-center animate-pulse">
              ♩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40">
                  {activeSession.mode === 'FOCUS_NOW' ? '집중 약속 모드 작동 중' : '의도적 SNS 이용 세션'}
                </span>
                <span className="text-xs text-stone-300">
                  지휘 곡: {CLASSICAL_PIECES.find(p => p.id === activeSession.selectedPieceId)?.title}
                </span>
              </div>
              <p className="text-sm font-semibold text-amber-100 mt-0.5">
                할 일: {activeSession.focusTask} ({activeSession.focusDurationMinutes}분 세션)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToScreen('phone-home')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>잠금 홈 바로가기</span>
            </button>
            <button
              onClick={onOpenIntervention}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold rounded-xl text-xs border border-amber-600/40 transition-all"
            >
              <span>개입/지휘 미션</span>
            </button>
          </div>
        </section>
      )}

      {/* Mode Selection Cards (Mode A vs Mode B) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif text-amber-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>디톡스 모드 선택</span>
          </h2>
          <span className="text-xs text-stone-400">원하는 행동 의도에 맞는 세션을 선택하세요</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mode A Card */}
          <div
            onClick={() => setSelectedMode('FOCUS_NOW')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              selectedMode === 'FOCUS_NOW'
                ? 'bg-gradient-to-b from-stone-900 to-amber-950/80 border-amber-500 shadow-xl shadow-amber-950/50 ring-2 ring-amber-500/30'
                : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                  모드 A
                </span>
                <h3 className="text-lg font-bold font-serif text-amber-100 mt-2">집중 약속 모드</h3>
                <p className="text-xs text-stone-300 mt-1">
                  지금부터 바로 집중을 시작하며, 설정한 시간 동안 소셜미디어를 멀리하도록 자기 약속을 만듭니다.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-xl shrink-0">
                𝄢
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 text-xs text-stone-400 space-y-1">
              <div>• 즉시 30분~480분 집중 약속 세션 생성</div>
              <div>• 인앱 소프트 잠금 및 지휘 미션 자각 개입 제공</div>
            </div>
          </div>

          {/* Mode B Card */}
          <div
            onClick={() => setSelectedMode('GUIDED_USE')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              selectedMode === 'GUIDED_USE'
                ? 'bg-gradient-to-b from-stone-900 to-amber-950/80 border-amber-500 shadow-xl shadow-amber-950/50 ring-2 ring-amber-500/30'
                : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                  모드 B
                </span>
                <h3 className="text-lg font-bold font-serif text-amber-100 mt-2">의도적 SNS 이용 모드</h3>
                <p className="text-xs text-stone-300 mt-1">
                  SNS를 열기 전 목적과 이용할 시간을 먼저 정하고 타이머를 시작하여 무의식적 스크롤을 방지합니다.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-xl shrink-0">
                ♫
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 text-xs text-stone-400 space-y-1">
              <div>• 계획 이용 시간 (5~120분) 후 5초 정리 유예 노출</div>
              <div>• 정리 유예 후 집중 약속 구간 자동 연결</div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Apps & Configuration Form */}
      <section className="bg-stone-900/90 border border-amber-900/40 rounded-3xl p-6 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold font-serif text-amber-300 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>세션 상세 설정 ({selectedMode === 'FOCUS_NOW' ? '집중 약속 모드' : '의도적 이용 모드'})</span>
        </h3>

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

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedMode === 'GUIDED_USE' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-300">
                  계획 이용 시간 (SNS를 사용할 시간)
                </label>
                <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  테스트용 30초 고정
                </span>
              </div>
              <select
                value={usageLimit}
                onChange={e => setUsageLimit(Number(e.target.value))}
                className="w-full bg-stone-950 border border-amber-800/50 rounded-xl px-3 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
              >
                <option value={5}>5분 이용</option>
                <option value={10}>10분 이용</option>
                <option value={15}>15분 이용 (권장)</option>
                <option value={20}>20분 이용</option>
                <option value={30}>30분 이용</option>
                <option value={60}>60분 이용</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              집중 약속 시간 (SNS를 멀리할 시간)
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
              <option value={240}>240분 (4시간 집중)</option>
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

          {selectedMode === 'GUIDED_USE' && (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                SNS 이용 목적
              </label>
              <input
                type="text"
                value={usageIntent}
                onChange={e => setUsageIntent(e.target.value)}
                placeholder="예: 중요한 메시지 답장 및 디자인 정보 확인"
                className="w-full bg-stone-950 border border-amber-800/50 rounded-xl px-3 py-2.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartSession}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-base rounded-2xl shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>
            {selectedMode === 'FOCUS_NOW'
              ? `${focusDuration}분 집중 약속 시작하기`
              : `${usageLimit}분 SNS 약속 사용 시작하기`}
          </span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </section>
    </div>
  );
};
