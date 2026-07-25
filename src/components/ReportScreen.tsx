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
    <div className="min-h-full flex flex-col max-w-4xl mx-auto px-4 py-4 gap-3.5 text-white relative select-none">
      {/* Background Dark Scrim */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-neutral-950/75 to-black/90 pointer-events-none -z-10"></div>

      {/* Title Header */}
      <div className="flex flex-row items-center justify-between gap-3 border-b border-neutral-800 pb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="shrink-0 p-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors active:scale-95 shadow-sm"
            title="뒤로가기"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-mono font-extrabold text-white break-keep tracking-wider">
                CONDUCTOR OF MY LIFE REPORT
              </h2>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 break-keep">
              계획 기반 집중 약속 달성 기록 및 지휘자 칭호 피드백
            </p>
          </div>
        </div>

        <button
          onClick={handleClearData}
          className="px-2.5 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs rounded-xl border border-neutral-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">기록 초기화</span>
        </button>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-3 gap-2.5 shrink-0">
        <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="break-keep">총 집중 시간</span>
            <Clock className="w-3.5 h-3.5 text-white shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-white">
            {totalFocusMinutes}분
          </div>
          <p className="text-[10px] text-neutral-400 break-keep">지켜낸 총 시간</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="break-keep">확인 세션</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-white">
            {totalConfirmed}회
          </div>
          <p className="text-[10px] text-neutral-400 break-keep">명시적 확인 수</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="break-keep">지휘자 랭크</span>
            <Award className="w-3.5 h-3.5 text-white shrink-0" />
          </div>
          <div className="text-lg font-serif font-bold text-white break-keep leading-tight">
            {reports[reports.length - 1]?.conductorRank || '지휘자'}
          </div>
          <p className="text-[10px] text-neutral-400 break-keep">클래식 칭호</p>
        </div>
      </div>

      {/* Weekly Visual Chart Bar */}
      <div className="p-4.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 shadow-xl space-y-3 flex-1 min-h-0 overflow-hidden flex flex-col">
        <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
          <span>최근 지휘 약속 달성 기록</span>
        </h3>

        <div className="space-y-2.5 pt-1 flex-1 min-h-0">
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

      {/* Conductor Rank Roadmap Explanation */}
      <div className="p-3.5 rounded-2xl bg-black/75 backdrop-blur-md border border-neutral-800 space-y-2 shrink-0">
        <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
          <Music className="w-4 h-4 text-white" />
          <span>지휘자 칭호 등급표</span>
        </h3>

        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-0.5">
            <div className="font-bold text-white text-[11px] break-keep">신예 지휘자</div>
            <div className="text-[10px] text-neutral-400">0~60분</div>
          </div>
          <div className="p-2 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-0.5">
            <div className="font-bold text-white text-[11px] break-keep">지휘자</div>
            <div className="text-[10px] text-neutral-400">60~120분</div>
          </div>
          <div className="p-2 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-0.5">
            <div className="font-bold text-white text-[11px] break-keep">수석 지휘자</div>
            <div className="text-[10px] text-neutral-400">120~180분</div>
          </div>
          <div className="p-2 bg-neutral-900/80 rounded-xl border border-neutral-600 space-y-0.5">
            <div className="font-bold text-white text-[11px] break-keep">마에스트로</div>
            <div className="text-[10px] text-neutral-400">180분+</div>
          </div>
        </div>
      </div>

    </div>
  );
};
