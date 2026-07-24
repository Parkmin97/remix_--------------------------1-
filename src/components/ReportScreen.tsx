import React from 'react';
import { getDailyReports, clearAllData } from '../lib/storage';
import { Award, Calendar, CheckCircle2, Music, Sparkles, Clock, Trash2, ArrowRight } from 'lucide-react';

interface ReportScreenProps {
  onNavigateToScreen: (screen: string) => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ onNavigateToScreen }) => {
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-stone-100">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl text-amber-400 font-serif">𝄞</span>
            <h2 className="text-2xl font-bold font-serif text-amber-200">
              디톡스 성과 & 지휘 리포트
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            계획 기반 집중 약속 달성 기록 및 지휘자 칭호 피드백
          </p>
        </div>

        <button
          onClick={handleClearData}
          className="px-3 py-1.5 bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 text-xs rounded-xl border border-stone-800 hover:border-rose-800 transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>기록 초기화</span>
        </button>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-stone-900 border border-amber-600/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>총 완료한 집중 약속 시간</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-serif font-bold text-amber-300">
            {totalFocusMinutes}분
          </div>
          <p className="text-[11px] text-stone-400">* 계획 기반으로 지켜낸 총 시간</p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-amber-600/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>확인 완료한 디톡스 세션</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-serif font-bold text-emerald-300">
            {totalConfirmed}회
          </div>
          <p className="text-[11px] text-stone-400">* 명시적 확인 세션 수</p>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900 border border-amber-600/30 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>현재 지휘자 랭크</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-200">
            {reports[reports.length - 1]?.conductorRank || '지휘자'}
          </div>
          <p className="text-[11px] text-stone-400">* 클래식 박자 성찰 칭호</p>
        </div>
      </div>

      {/* Weekly Visual Chart Bar */}
      <div className="p-6 rounded-3xl bg-stone-900/90 border border-amber-900/40 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-serif text-amber-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>최근 지휘 약속 달성 기록</span>
        </h3>

        <div className="space-y-3 pt-2">
          {reports.map((r, idx) => {
            const maxVal = 240;
            const percentage = Math.min(100, Math.round((r.completedFocusMinutes / maxVal) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-stone-300">{r.date}</span>
                  <span className="font-semibold text-amber-200">{r.completedFocusMinutes}분 완료 ({r.confirmedCount}회 성공)</span>
                </div>

                <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
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
      <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-600/30 space-y-3">
        <h3 className="text-sm font-bold font-serif text-amber-300 flex items-center gap-2">
          <Music className="w-4 h-4 text-amber-400" />
          <span>지휘자 칭호 등급표</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
            <div className="font-bold text-amber-300">신예 지휘자</div>
            <div className="text-[11px] text-stone-400">0분 ~ 60분</div>
          </div>
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
            <div className="font-bold text-amber-300">지휘자</div>
            <div className="text-[11px] text-stone-400">60분 ~ 120분</div>
          </div>
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 space-y-1">
            <div className="font-bold text-amber-300">수석 지휘자</div>
            <div className="text-[11px] text-stone-400">120분 ~ 180분</div>
          </div>
          <div className="p-3 bg-stone-900/80 rounded-xl border border-amber-500/40 space-y-1">
            <div className="font-bold text-amber-300">마에스트로</div>
            <div className="text-[11px] text-stone-400">180분 이상</div>
          </div>
        </div>
      </div>

      {/* Quick Return */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => onNavigateToScreen('home')}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <span>새 지휘 세션으로 돌아가기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
