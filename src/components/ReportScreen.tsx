import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getDailyReports, clearAllData } from '../lib/storage';
import { Blocker, ScreenTimeDay } from '../lib/blocker';
import { getCategoryForPackage } from '../data/appCategories';
import { ShieldCheck, Smartphone, Trash2, ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface ReportScreenProps {
  onBack: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 스크린타임 조회 상태. 실패해도 기존 리포트는 그대로 보여야 하므로 화면을 막지 않는다. */
type ScreenTimeState = 'loading' | 'ready' | 'unsupported' | 'failed';

/**
 * 'SNS 이용 시간'으로 셀 카테고리.
 * 폰 전체 사용 시간과 따로 세는 이유는 비율이 곧 판단 기준이기 때문이다.
 * "3시간 중 SNS 2시간"과 "3시간 중 SNS 20분"은 전혀 다른 이야기다.
 */
const SNS_CATEGORY_IDS = new Set<string>(['SHORTFORM', 'SOCIAL', 'STREAMING', 'COMMUNITY']);

export const ReportScreen: React.FC<ReportScreenProps> = ({ onBack }) => {
  const reports = getDailyReports();

  // 현재 날짜 기준 주간(월요일~일요일) 범위 계산
  // weekOffset: 0(이번 주), -1(저번 주), +1(다음 주) 등
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const getWeekRange = (offset: number) => {
    const now = new Date();
    // 일요일=0 -> 7로 변경하여 월요일=1 기준 계산
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    // 이번 주 월요일
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const weekDays: Array<{ dayName: string; dateStr: string; dayNum: number; isToday: boolean }> = [];
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      weekDays.push({
        dayName: dayNames[i],
        dateStr,
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { monday, sunday, weekDays };
  };

  const { monday, sunday, weekDays } = getWeekRange(weekOffset);
  const startDateStr = `${monday.getFullYear()}.${pad2(monday.getMonth() + 1)}.${pad2(monday.getDate())}`;
  const endDateStr = `${sunday.getFullYear()}.${pad2(sunday.getMonth() + 1)}.${pad2(sunday.getDate())}`;

  // 선택된 주간에 속하는 리포트 데이터만 필터링
  const weekDateSet = new Set(weekDays.map((w) => w.dateStr));
  const weekReports = reports.filter((r) => weekDateSet.has(r.date));

  // ── 폰이 기록한 실제 스크린타임 ─────────────────────────────
  // 앱이 꺼져 있는 동안은 우리가 셀 수 없으므로, 가능하면 안드로이드 집계값으로 대체한다.
  const [screenTimeState, setScreenTimeState] = useState<ScreenTimeState>('loading');
  const [screenTimeDays, setScreenTimeDays] = useState<ScreenTimeDay[]>([]);
  // 이미 가져온 조회 범위(일). 지난 주로 이동해 더 긴 범위가 필요할 때만 다시 부른다.
  const loadedDaysRef = useRef(0);

  // 선택된 주의 월요일부터 오늘까지를 덮는 최소 일수
  const mondayTime = monday.getTime();
  const requiredDays = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const diff = Math.round((todayStart.getTime() - mondayTime) / MS_PER_DAY);
    return Math.max(7, diff + 1);
  }, [mondayTime]);

  /** 마지막으로 실제 조회한 시각. 복귀할 때마다 다시 부르지 않도록 막는 데 쓴다. */
  const lastLoadedAtRef = useRef(0);

  /** force 면 이미 가져온 범위여도 다시 조회한다(권한을 나중에 허용한 경우). */
  const loadScreenTime = useCallback(async (days: number, force: boolean) => {
    // 웹 브라우저에는 네이티브가 없다. 호출하지 않고 기존 값으로 간다.
    if (!Capacitor.isNativePlatform()) {
      setScreenTimeState('unsupported');
      return;
    }
    if (!force && days <= loadedDaysRef.current) return;

    // 조회는 수십 일치 사용 이벤트를 훑는 작업이라 가볍지 않다.
    // 앱을 들락날락할 때마다 부르면 낭비이므로 최소 간격을 둔다.
    // 사용 시간은 초 단위로 달라지는 값이 아니라 30초 늦어도 문제없다.
    const now = Date.now();
    if (force && now - lastLoadedAtRef.current < 30_000) return;
    lastLoadedAtRef.current = now;

    try {
      const result = await Blocker.getScreenTime({ days });
      loadedDaysRef.current = days;
      setScreenTimeDays(Array.isArray(result?.days) ? result.days : []);
      setScreenTimeState('ready');
    } catch {
      // 권한 없음 / 미구현 / 조회 실패 — 기존 리포트 값으로 대체한다.
      setScreenTimeState('failed');
    }
  }, []);

  useEffect(() => {
    loadScreenTime(requiredDays, false);
  }, [requiredDays, loadScreenTime]);

  // 권한 설정 화면에 다녀와 이 화면이 다시 보이면 자동으로 재조회한다.
  // 리스너 안에서 requiredDays 를 직접 읽으면 처음 값에 묶이므로 ref 로 최신값을 본다.
  const requiredDaysRef = useRef(requiredDays);
  requiredDaysRef.current = requiredDays;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadScreenTime(requiredDaysRef.current, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadScreenTime]);

  const screenTimeByDateMap = useMemo(
    () => new Map(screenTimeDays.map((d) => [d.date, d])),
    [screenTimeDays]
  );

  // 날짜별 SNS·숏폼 사용 시간. 앱별 사용 시간을 카테고리로 걸러 합산한다.
  const snsMinutesByDateMap = useMemo(() => {
    const map = new Map<string, number>();
    screenTimeDays.forEach((day) => {
      const minutes = day.apps.reduce(
        (acc, app) =>
          acc + (SNS_CATEGORY_IDS.has(getCategoryForPackage(app.packageName).id) ? app.minutes : 0),
        0
      );
      map.set(day.date, minutes);
    });
    return map;
  }, [screenTimeDays]);

  // 실제 스크린타임을 쓸 수 있는지. 아니면 앱이 직접 센 totalSnsMinutes 로 대체한다.
  const hasRealScreenTime = screenTimeState === 'ready' && screenTimeDays.length > 0;

  // 날짜별 리포트 맵
  const reportByDateMap = new Map(reports.map((r) => [r.date, r]));

  /** 그날 폰 전체 사용 시간(분). 실제 스크린타임이 없으면 알 수 없으므로 0. */
  const getTotalUsageMinutes = (dateStr: string) =>
    hasRealScreenTime ? screenTimeByDateMap.get(dateStr)?.totalMinutes ?? 0 : 0;

  /** 그날 SNS·숏폼 사용 시간(분). 실제값이 없으면 앱이 직접 센 값으로 대체한다. */
  const getSnsMinutes = (dateStr: string) =>
    hasRealScreenTime
      ? snsMinutesByDateMap.get(dateStr) ?? 0
      : reportByDateMap.get(dateStr)?.totalSnsMinutes ?? 0;

  const totalFocusMinutes = weekReports.reduce((acc, r) => acc + r.completedFocusMinutes, 0);
  const totalSnsMinutes = weekDays.reduce((acc, w) => acc + getSnsMinutes(w.dateStr), 0);
  const totalUsageMinutes = weekDays.reduce((acc, w) => acc + getTotalUsageMinutes(w.dateStr), 0);
  // 전체 사용 시간 중 SNS·숏폼이 차지한 비율
  const snsSharePercent =
    totalUsageMinutes > 0 ? Math.round((totalSnsMinutes / totalUsageMinutes) * 100) : 0;

  // 이번 주에 가장 오래 쓴 앱 5개 (실제 스크린타임이 있을 때만)
  const topApps = useMemo(() => {
    if (!hasRealScreenTime) return [];

    const totals = new Map<string, { appName: string; minutes: number }>();
    weekDays.forEach((w) => {
      const day = screenTimeByDateMap.get(w.dateStr);
      day?.apps.forEach((app) => {
        const prev = totals.get(app.packageName);
        totals.set(app.packageName, {
          appName: app.appName || app.packageName,
          minutes: (prev?.minutes ?? 0) + app.minutes,
        });
      });
    });

    return Array.from(totals.entries())
      .map(([packageName, v]) => ({
        packageName,
        appName: v.appName,
        minutes: v.minutes,
        categoryLabel: getCategoryForPackage(packageName).label,
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }, [hasRealScreenTime, screenTimeByDateMap, weekOffset]);

  // 사용 시간 막대의 눈금 상한. 실제 스크린타임은 4시간을 쉽게 넘기므로 그 주의 최댓값까지 늘린다.
  // 전체/SNS 를 한 막대에 겹쳐 그리므로 기준은 더 큰 쪽(전체)에 맞춘다.
  const usageChartMaxMinutes = Math.max(
    240,
    ...weekDays.map((w) => Math.max(getTotalUsageMinutes(w.dateStr), getSnsMinutes(w.dateStr)))
  );

  const goPrevWeek = () => setWeekOffset((prev) => prev - 1);
  const goNextWeek = () => { if (weekOffset < 0) setWeekOffset((prev) => prev + 1); };

  const handleClearData = () => {
    if (confirm('모든 리포트 및 지휘 세션 기록을 삭제하시겠습니까?')) {
      clearAllData();
      window.location.reload();
    }
  };

  // 선택된 카드 state: 'focus' (지켜낸 시간) | 'sns' (SNS 이용 시간)
  const [activeTab, setActiveTab] = useState<'focus' | 'sns'>('focus');

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto px-4 py-4 gap-3.5 text-black relative select-none">
      {/* Title Header */}
      <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-200 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="shrink-0 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black transition-colors active:scale-95 shadow-sm"
          title="뒤로가기"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-4 h-4 text-black" />
        </button>

        <h1 className="font-sans font-extrabold text-base sm:text-lg tracking-widest text-black text-center">
          MY LIFE MAESTRO
        </h1>

        <button
          onClick={handleClearData}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-black text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">기록 초기화</span>
        </button>
      </div>

      {/* Sub Title (Below Header Line, Above Summary Cards) */}
      <div className="pt-1 pb-1 shrink-0 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-sans font-extrabold text-black tracking-widest">
          REPORT
        </h2>
        {/* 주간 이동 네비게이션 */}
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-2 py-1">
          <button
            onClick={goPrevWeek}
            className="p-1 rounded-lg bg-white hover:bg-slate-200 text-black transition-colors active:scale-95 shadow-sm"
            title="이전 주"
            aria-label="이전 주"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-black">
            {startDateStr} ~ {endDateStr}
          </span>
          <button
            onClick={goNextWeek}
            disabled={weekOffset >= 0}
            className="p-1 rounded-lg bg-white hover:bg-slate-200 text-black transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
            title="다음 주"
            aria-label="다음 주"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('focus')}
          className={`p-3.5 rounded-3xl border shadow-xl space-y-1 text-left transition-all cursor-pointer ${
            activeTab === 'focus'
              ? 'bg-black text-white border-black ring-2 ring-black'
              : 'bg-white text-black border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="break-keep">지켜낸 시간</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#FE9A00] shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold">
            {totalFocusMinutes}분
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sns')}
          className={`p-3.5 rounded-3xl border shadow-xl space-y-1 text-left transition-all cursor-pointer ${
            activeTab === 'sns'
              ? 'bg-black text-white border-black ring-2 ring-black'
              : 'bg-white text-black border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="break-keep">SNS 이용 시간</span>
            <Smartphone className="w-3.5 h-3.5 text-[#FE9A00] shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold">
            {totalSnsMinutes}분
          </div>
          {/* 전체 사용 시간 대비 비율. 같은 시간도 전체가 얼마냐에 따라 의미가 달라진다 */}
          {hasRealScreenTime && (
            <div className="text-[10px] font-semibold opacity-60 break-keep">
              전체 {totalUsageMinutes}분 중 {snsSharePercent}%
            </div>
          )}
        </button>
      </div>

      {/* Weekly Visual Chart Bar */}
      <div className="p-4.5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3 shrink-0 flex flex-col">
        <h3 className="text-sm font-bold font-serif text-black flex items-center gap-2 shrink-0">
          {activeTab === 'focus' ? (
            <ShieldCheck className="w-4 h-4 text-[#FE9A00]" />
          ) : (
            <Smartphone className="w-4 h-4 text-[#FE9A00]" />
          )}
          <span>
            {activeTab === 'focus' ? '지켜낸 시간 주간 기록' : 'SNS 이용시간 주간 기록'}
          </span>
        </h3>

        {/* 스크린타임 출처 안내 — 실제 값인지, 앱이 직접 센 값인지 알려준다 */}
        {activeTab === 'sns' && (
          <p className="text-[11px] text-slate-500 break-keep -mt-1">
            {hasRealScreenTime
              ? '휴대폰이 기록한 실제 사용 시간입니다. SNS·숏폼은 숏폼/소셜/OTT/커뮤니티 앱을 합산한 값입니다.'
              : screenTimeState === 'loading'
              ? '실제 사용 시간을 불러오는 중입니다.'
              : screenTimeState === 'failed'
              ? '앱에서 측정한 값입니다. 실제 사용 시간을 보려면 사용 정보 접근 권한이 필요합니다.'
              : screenTimeState === 'ready'
              ? '아직 기록된 사용 시간이 없습니다. 하루 이상 사용하면 표시됩니다.'
              : '앱에서 측정한 값입니다.'}
          </p>
        )}

        <div className="space-y-2.5 pt-1">
          {weekDays.map((w, idx) => {
            const r = reportByDateMap.get(w.dateStr);
            const isFocusTab = activeTab === 'focus';
            const minutes = isFocusTab ? (r?.completedFocusMinutes ?? 0) : getSnsMinutes(w.dateStr);
            const maxVal = isFocusTab ? 240 : usageChartMaxMinutes;
            const percentage = Math.min(100, Math.round((minutes / maxVal) * 100));

            // SNS 탭에서는 같은 막대 위에 그날 전체 사용 시간을 옅게 깔아 비율을 보여준다
            const showTotalUsage = !isFocusTab && hasRealScreenTime;
            const totalMinutes = showTotalUsage ? getTotalUsageMinutes(w.dateStr) : 0;
            const totalPercentage = Math.min(100, Math.round((totalMinutes / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-black/70 flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${w.dayName === '일' ? 'bg-rose-100 text-rose-600 border border-rose-200' : w.dayName === '토' ? 'bg-sky-100 text-sky-600 border border-sky-200' : 'bg-slate-100 text-slate-700'}`}>{w.dayName}</span>
                    <span>{w.dateStr}</span>
                  </span>
                  <span className="font-semibold text-black break-keep">
                    {minutes}분
                    {showTotalUsage && (
                      <span className="font-normal text-slate-400"> / {totalMinutes}분</span>
                    )}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                  {showTotalUsage && (
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-300 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(totalMinutes > 0 ? 5 : 0, totalPercentage)}%` }}
                    ></div>
                  )}
                  <div
                    className="relative h-full bg-black rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(minutes > 0 ? 5 : 0, percentage)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend — 두 색이 각각 무엇인지 (주간 잠금 달성 현황 카드와 같은 형식) */}
        {activeTab === 'sns' && hasRealScreenTime && (
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-black border border-black"></span>
              <span className="break-keep">SNS·숏폼</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 border border-slate-300"></span>
              <span className="break-keep">전체 사용</span>
            </div>
          </div>
        )}
      </div>

      {/* Top Apps (실제 스크린타임이 있을 때만) */}
      {activeTab === 'sns' && topApps.length > 0 && (
        <div className="p-4.5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3 shrink-0 flex flex-col">
          <h3 className="text-sm font-bold font-serif text-black flex items-center gap-2 shrink-0">
            <Smartphone className="w-4 h-4 text-[#FE9A00]" />
            <span>가장 오래 쓴 앱</span>
          </h3>

          <div className="space-y-2.5 pt-1">
            {topApps.map((app, idx) => {
              const percentage = Math.min(100, Math.round((app.minutes / Math.max(1, topApps[0].minutes)) * 100));

              return (
                <div key={app.packageName} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-black/70 flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-black truncate">{app.appName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 shrink-0 break-keep">
                        {app.categoryLabel}
                      </span>
                    </span>
                    <span className="font-semibold text-black break-keep shrink-0">{app.minutes}분</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(app.minutes > 0 ? 5 : 0, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Detox Grid (월화수목금토일) */}
      <div className="p-3.5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-2 shrink-0 max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-serif text-black flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#FE9A00]" />
            <span>주간 잠금 달성 현황</span>
          </h3>
        </div>

        {/* Day grid: 월 화 수 목 금 토 일 */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {weekDays.map((w, idx) => {
            const r = reportByDateMap.get(w.dateStr);
            const used = Boolean(r && (r.completedFocusMinutes > 0 || r.confirmedCount > 0 || r.missionSuccessCount > 0));

            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className={`text-[11px] font-bold ${w.dayName === '일' ? 'text-rose-500' : w.dayName === '토' ? 'text-sky-500' : 'text-slate-600'}`}>
                  {w.dayName}
                </span>
                <div
                  className={`w-full h-9 rounded-xl flex items-center justify-center text-xs font-semibold border transition-all ${
                    used
                      ? 'bg-black text-white border-black font-extrabold shadow-md scale-105'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  } ${w.isToday ? 'ring-2 ring-black' : ''}`}
                  title={used ? `${w.dateStr} · 잠금 사용` : `${w.dateStr} · 미사용`}
                >
                  {w.dayNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 pt-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-black border border-black"></span>
            <span className="break-keep">잠금 사용한 날</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></span>
            <span className="break-keep">미사용 날</span>
          </div>
        </div>
      </div>

    </div>
  );
};
