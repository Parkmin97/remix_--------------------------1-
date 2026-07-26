import React, { useState } from 'react';
import { getDailyReports, clearAllData } from '../lib/storage';
import { CheckCircle2, Sparkles, Clock, Trash2, ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface ReportScreenProps {
  onBack: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export const ReportScreen: React.FC<ReportScreenProps> = ({ onBack }) => {
  const reports = getDailyReports();
  const totalFocusMinutes = reports.reduce((acc, r) => acc + r.completedFocusMinutes, 0);
  const totalConfirmed = reports.reduce((acc, r) => acc + r.confirmedCount, 0);

  // 잠금 기능을 사용한(활동 기록이 있는) 날짜 집합
  const usedDates = new Set(
    reports
      .filter((r) => r.completedFocusMinutes > 0 || r.confirmedCount > 0 || r.missionSuccessCount > 0 || r.missionFailCount > 0)
      .map((r) => r.date)
  );

  // 달력: 표시 중인 달(해당 월 1일 기준). 이전/다음 월 이동 가능(미래 월은 제한).
  const today = new Date();
  const [viewDate, setViewDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const dateKey = (d: number) => `${year}-${pad2(month + 1)}-${pad2(d)}`;
  const isUsed = (d: number) => usedDates.has(dateKey(d));
  const isToday = (d: number) => year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => { if (!atCurrentMonth) setViewDate(new Date(year, month + 1, 1)); };

  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

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
      <div className="pt-1 pb-1 shrink-0">
        <h2 className="text-base sm:text-lg font-sans font-extrabold text-amber-400 tracking-widest">
          REPORT
        </h2>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
            <span className="break-keep">총 집중 시간</span>
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-white">
            {totalFocusMinutes}분
          </div>
          <p className="text-[10px] text-neutral-400 break-keep">지켜낸 총 시간</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
            <span className="break-keep">확인 세션</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-white">
            {totalConfirmed}회
          </div>
          <p className="text-[10px] text-neutral-400 break-keep">명시적 확인 수</p>
        </div>
      </div>

      {/* Weekly Visual Chart Bar */}
      <div className="p-4.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-3 shrink-0 flex flex-col">
        <h3 className="text-sm font-bold font-serif text-amber-400 flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>최근 지휘 약속 달성 기록</span>
        </h3>

        <div className="space-y-2.5 pt-1">
          {reports.map((r, idx) => {
            const maxVal = 240;
            const percentage = Math.min(100, Math.round((r.completedFocusMinutes / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-neutral-300">{r.date}</span>
                  <span className="font-semibold text-white break-keep">{r.completedFocusMinutes}분 완료 ({r.confirmedCount}회 성공)</span>
                </div>

                <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-gradient-to-r from-neutral-400 via-white to-neutral-200 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, percentage)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Detox Calendar */}
      <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-2 shrink-0 max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-serif text-amber-400 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-400" />
            <span>잠금 사용 달력</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={goPrevMonth}
              className="p-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors active:scale-95"
              title="이전 달"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[92px] text-center text-sm font-bold text-white tabular-nums">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={goNextMonth}
              disabled={atCurrentMonth}
              className="p-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              title="다음 달"
              aria-label="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
          {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
            <div key={w} className={i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-neutral-400'}>{w}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((d, idx) => {
            if (d === null) return <div key={`e${idx}`} />;
            const used = isUsed(d);
            const todayCell = isToday(d);
            return (
              <div
                key={d}
                className={`h-7 rounded-md flex items-center justify-center text-[11px] font-semibold border transition-colors ${
                  used
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-neutral-900/60 text-neutral-300 border-neutral-800'
                } ${todayCell ? 'ring-2 ring-white' : ''}`}
                title={used ? `${dateKey(d)} · 잠금 사용` : dateKey(d)}
              >
                {d}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center text-[11px] text-neutral-400 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 border border-amber-400"></span>
            <span className="break-keep">잠금 기능 사용한 날</span>
          </div>
        </div>
      </div>

    </div>
  );
};
