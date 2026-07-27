import React, { useState } from 'react';
import { getDailyReports, clearAllData } from '../lib/storage';
import { CheckCircle2, Sparkles, Clock, Trash2, ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface ReportScreenProps {
  onBack: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

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

  const totalFocusMinutes = weekReports.reduce((acc, r) => acc + r.completedFocusMinutes, 0);
  const totalSnsMinutes = weekReports.reduce((acc, r) => acc + (r.totalSnsMinutes ?? 0), 0);

  // 날짜별 리포트 맵
  const reportByDateMap = new Map(reports.map((r) => [r.date, r]));

  const goPrevWeek = () => setWeekOffset((prev) => prev - 1);
  const goNextWeek = () => { if (weekOffset < 0) setWeekOffset((prev) => prev + 1); };

  const handleClearData = () => {
    if (confirm('모든 리포트 및 지휘 세션 기록을 삭제하시겠습니까?')) {
      clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto px-4 py-4 gap-3.5 text-white relative select-none">
      {/* Background Dark Scrim */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-neutral-950/75 to-black/90 pointer-events-none -z-10"></div>

      {/* Title Header */}
      <div className="flex flex-row items-center justify-between gap-3 border-b border-neutral-800 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="shrink-0 p-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors active:scale-95 shadow-sm"
          title="뒤로가기"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h1 className="font-sans font-extrabold text-base sm:text-lg tracking-widest text-white text-center">
          MY LIFE MAESTRO
        </h1>

        <button
          onClick={handleClearData}
          className="px-2.5 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs rounded-xl border border-neutral-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">기록 초기화</span>
        </button>
      </div>

      {/* Sub Title (Below Header Line, Above Summary Cards) */}
      <div className="pt-1 pb-1 shrink-0 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-sans font-extrabold text-amber-400 tracking-widest">
          REPORT
        </h2>
        {/* 주간 이동 네비게이션 */}
        <div className="flex items-center gap-2 bg-black/60 border border-neutral-800 rounded-xl px-2 py-1">
          <button
            onClick={goPrevWeek}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors active:scale-95"
            title="이전 주"
            aria-label="이전 주"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-neutral-200">
            {startDateStr} ~ {endDateStr}
          </span>
          <button
            onClick={goNextWeek}
            disabled={weekOffset >= 0}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            title="다음 주"
            aria-label="다음 주"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
            <span className="break-keep">지켜낸 시간</span>
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-white">
            {totalFocusMinutes}분
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
            <span className="break-keep">SNS 이용 시간</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-white">
            {totalSnsMinutes}분
          </div>
        </div>
      </div>

      {/* Weekly Visual Chart Bar */}
      <div className="p-4.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-3 shrink-0 flex flex-col">
        <h3 className="text-sm font-bold font-serif text-amber-400 flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>지휘 약속 달성 기록 (주간)</span>
        </h3>

        <div className="space-y-2.5 pt-1">
          {weekDays.map((w, idx) => {
            const r = reportByDateMap.get(w.dateStr);
            const focusMins = r?.completedFocusMinutes ?? 0;
            const maxVal = 240;
            const percentage = Math.min(100, Math.round((focusMins / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-neutral-300 flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${w.dayName === '일' ? 'bg-rose-950 text-rose-300 border border-rose-800' : w.dayName === '토' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-neutral-800 text-neutral-300'}`}>{w.dayName}</span>
                    <span>{w.dateStr}</span>
                  </span>
                  <span className="font-semibold text-white break-keep">{focusMins}분 완료</span>
                </div>

                <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-neutral-400 via-white to-neutral-200 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(focusMins > 0 ? 5 : 0, percentage)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Detox Grid (월화수목금토일) */}
      <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-2 shrink-0 max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-serif text-amber-400 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-400" />
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
                <span className={`text-[11px] font-bold ${w.dayName === '일' ? 'text-rose-400' : w.dayName === '토' ? 'text-sky-400' : 'text-neutral-400'}`}>
                  {w.dayName}
                </span>
                <div
                  className={`w-full h-9 rounded-xl flex items-center justify-center text-xs font-semibold border transition-all ${
                    used
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-extrabold shadow-md scale-105'
                      : 'bg-neutral-900/80 text-neutral-500 border-neutral-800'
                  } ${w.isToday ? 'ring-2 ring-white' : ''}`}
                  title={used ? `${w.dateStr} · 잠금 사용` : `${w.dateStr} · 미사용`}
                >
                  {w.dayNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400 pt-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 border border-amber-400"></span>
            <span className="break-keep">잠금 사용한 날</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-neutral-900 border border-neutral-800"></span>
            <span className="break-keep">미사용 날</span>
          </div>
        </div>
      </div>

    </div>
  );
};
