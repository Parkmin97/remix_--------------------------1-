import React, { useState } from 'react';
import { HelpCircle, FileText, ExternalLink, ShieldCheck, ArrowLeft, User, ChevronRight } from 'lucide-react';
import { openExternalUrl } from '../lib/externalBrowser';

/**
 * 약관 및 개인정보처리방침 PDF 파일 경로
 */
const PRIVACY_POLICY_URL = '/privacy_terms.pdf';

interface SettingsScreenProps {
  onBack?: () => void;
  onOpenOnboarding: () => void;
  onNavigateToScreen?: (screen: string) => void;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onOpenOnboarding,
  onNavigateToScreen,
}) => {
  const [legalNoticeMessage, setLegalNoticeMessage] = useState<string | null>(null);

  const handleOpenPrivacyPolicy = () => {
    if (PRIVACY_POLICY_URL) {
      openExternalUrl(PRIVACY_POLICY_URL);
    } else {
      setLegalNoticeMessage('개인정보처리방침 웹페이지 준비 중입니다. 노션/웹 URL이 지정되면 자동으로 연결됩니다.');
      setTimeout(() => setLegalNoticeMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-full flex flex-col max-w-4xl mx-auto px-4 py-3 sm:py-4 gap-3.5 text-black relative select-none pb-12">
      {/* 1. 상단 뒤로가기 & 서브 타이틀 */}
      <div className="flex items-center gap-3 shrink-0 pt-0.5 pb-1">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-black transition-colors active:scale-95 shadow-sm cursor-pointer"
            title="뒤로가기"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>
        )}
        <h2 className="text-base sm:text-lg font-sans font-extrabold text-black tracking-wide">
          설정 및 서비스 정보
        </h2>
      </div>

      {/* 2. 프로필 설정 카드 (신규 추가) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center text-[#FE9A00] shrink-0">
            <User className="w-4 h-4 text-[#FE9A00]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-black break-keep">프로필 설정</h3>
          </div>
        </div>

        <button
          onClick={() => { if (onNavigateToScreen) onNavigateToScreen('profile-settings'); }}
          className="px-3.5 py-2 bg-black text-white hover:bg-neutral-800 font-bold rounded-xl text-xs transition-colors active:scale-95 shrink-0 cursor-pointer flex items-center gap-1"
        >
          <span>관리</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FE9A00]" />
        </button>
      </div>

      {/* 3. 서비스 작동 방식 안내 카드 */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center text-[#FE9A00] shrink-0">
            <HelpCircle className="w-4 h-4 text-[#FE9A00]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-black break-keep">서비스 작동 방식 안내</h3>
          </div>
        </div>

        <button
          onClick={onOpenOnboarding}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs border border-slate-200 transition-colors active:scale-95 shrink-0 cursor-pointer"
        >
          가이드 열기
        </button>
      </div>

      {/* 4. 약관 및 법적 고지 카드 */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-3">
        <div className="text-xs font-bold text-black/60 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <FileText className="w-3.5 h-3.5 text-[#FE9A00]" />
          <span>약관 및 법적 고지</span>
        </div>

        <button
          onClick={handleOpenPrivacyPolicy}
          className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-black hover:text-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-black transition-all text-left group active:scale-98 cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#FE9A00] shrink-0" />
            <span className="group-hover:text-white transition-colors break-keep">
              서비스 이용약관 및 개인정보처리방침
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#FE9A00] transition-colors shrink-0" />
        </button>

        {legalNoticeMessage && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 font-medium animate-fade-in break-keep">
            💡 {legalNoticeMessage}
          </div>
        )}
      </div>

      {/* 5. 앱 버전 및 우리 팀 설명 (화면 최하단으로 밀어서 표시) */}
      <div className="mt-auto pt-8 pb-4 px-4 flex flex-col items-center justify-center text-center space-y-1.5 text-slate-400 select-text">
        <div className="flex items-center gap-2">
          <span className="font-sans font-black text-xs tracking-widest text-slate-600">
            MY LIFE MAESTRO
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-mono font-bold">
            v1.0.0
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-sans">
          Designed & Developed with Passion by Team AIZ
        </p>
      </div>
    </div>
  );
};
