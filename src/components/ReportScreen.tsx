import React from 'react';
import { getDailyReports, clearAllData } from '../lib/storage';
import { Award, Calendar, CheckCircle2, Music, Sparkles, Clock, Trash2, ArrowLeft } from 'lucide-react';

interface ReportScreenProps {
  onBack: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ onBack }) => {
  const reports = getDailyReports();
  const totalFocusMinutes = reports.reduce((acc, r) => acc + r.completedFocusMinutes, 0);
  const totalConfirmed = reports.reduce((acc, r) => acc + r.confirmedCount, 0);

  const handleClearData = () => {
    if (confirm('모든 리포트 및 지휘 세션 기록을 삭제하시겠습니까?')) {
      clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto px-4 py-3 gap-3 text-stone-100">
      {/* Title Header */}
      <div className="flex flex-row items-center justify-between gap-3 border-b border-amber-900/40 pb-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="shrink-0 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors active:scale-95"
            title="뒤로가기"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl text-amber-400 font-serif">𝄞</span>
              <h2 className="text-lg font-bold font-serif text-amber-200 break-keep">
                디톡스 성과 & 지휘 리포트
              </h2>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5 break-keep">
              계획 기반 집중 약속 달성 기록 및 지휘자 칭호 피드백
            </p>
          </div>
        </div>

        <button
          onClick={handleClearData}
          className="px-2.5 py-1.5 bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 text-xs rounded-xl border border-stone-800 hover:border-rose-800 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">기록 초기화</span>
        </button>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-3 gap-2.5 shrink-0">
        <div className="p-3 rounded-2xl bg-stone-900 border border-amber-600/30 shadow-lg space-y-0.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="break-keep">총 집중 시간</span>
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-300">
            {totalFocusMinutes}분
          </div>
          <p className="text-[10px] text-stone-400 break-keep">지켜낸 총 시간</p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-900 border border-amber-600/30 shadow-lg space-y-0.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="break-keep">확인 세션</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-300">
            {totalConfirmed}회
          </div>
          <p className="text-[10px] text-stone-400 break-keep">명시적 확인 수</p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-900 border border-amber-600/30 shadow-lg space-y-0.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="break-keep">지휘자 랭크</span>
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-lg font-serif font-bold text-amber-200 break-keep leading-tight">
            {reports[reports.length - 1]?.conductorRank || '지휘자'}
          </div>
          <p className="text-[10px] text-stone-400 break-keep">클래식 칭호</p>
        </div>
      </div>

      {/* Weekly Visual Chart Bar */}
      <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-900/40 shadow-xl space-y-2 flex-1 min-h-0 overflow-hidden flex flex-col">
        <h3 className="text-sm font-bold font-serif text-amber-300 flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>최근 지휘 약속 달성 기록</span>
        </h3>

        <div className="space-y-2 pt-1 flex-1 min-h-0">
          {reports.map((r, idx) => {
            const maxVal = 240;
            const percentage = Math.min(100, Math.round((r.completedFocusMinutes / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-stone-300">{r.date}</span>
                  <span className="font-semibold text-amber-200 break-keep">{r.completedFocusMinutes}분 완료 ({r.confirmedCount}회 성공)</span>
                </div>

                <div className="w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, percentage)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conductor Rank Roadmap Explanation */}
      <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/30 space-y-2 shrink-0">
        <h3 className="text-sm font-bold font-serif text-amber-300 flex items-center gap-2">
          <Music className="w-4 h-4 text-amber-400" />
          <span>지휘자 칭호 등급표</span>
        </h3>

        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-stone-900/80 rounded-xl border border-stone-800 space-y-0.5">
            <div className="font-bold text-amber-300 text-[11px] break-keep">신예 지휘자</div>
            <div className="text-[10px] text-stone-400">0~60분</div>
          </div>
          <div className="p-2 bg-stone-900/80 rounded-xl border border-stone-800 space-y-0.5">
            <div className="font-bold text-amber-300 text-[11px] break-keep">지휘자</div>
            <div className="text-[10px] text-stone-400">60~120분</div>
          </div>
          <div className="p-2 bg-stone-900/80 rounded-xl border border-stone-800 space-y-0.5">
            <div className="font-bold text-amber-300 text-[11px] break-keep">수석 지휘자</div>
            <div className="text-[10px] text-stone-400">120~180분</div>
          </div>
          <div className="p-2 bg-stone-900/80 rounded-xl border border-amber-500/40 space-y-0.5">
            <div className="font-bold text-amber-300 text-[11px] break-keep">마에스트로</div>
            <div className="text-[10px] text-stone-400">180분+</div>
          </div>
        </div>
      </div>

    </div>
  );
};
