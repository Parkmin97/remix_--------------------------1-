import React, { useState } from 'react';
import { getSoundMuted, setSoundMuted } from '../lib/storage';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Settings, Volume2, VolumeX, Activity, HelpCircle, CheckCircle2, FileText, ExternalLink, ShieldCheck } from 'lucide-react';

/**
 * 약관 웹 URL 상수 (나중에 노션 공유 링크나 웹페이지 주소가 나오면 이 값만 교체하면 됩니다)
 */
const PRIVACY_POLICY_URL = ''; // 예: 'https://your-notion-privacy-url.com'
const TERMS_OF_SERVICE_URL = ''; // 예: 'https://your-notion-terms-url.com'

interface SettingsScreenProps {
  onOpenOnboarding: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenOnboarding,
  isMuted,
  setIsMuted
}) => {
  const [calibrated, setCalibrated] = useState(false);
  const [legalNoticeMessage, setLegalNoticeMessage] = useState<string | null>(null);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
    audioSynthesizer.setMuted(next);
  };

  const handleTestSound = () => {
    audioSynthesizer.playCountdownBeep(true);
  };

  const handleCalibrateSensors = () => {
    setCalibrated(true);
    setTimeout(() => setCalibrated(false), 3000);
  };

  const handleOpenPrivacyPolicy = () => {
    if (PRIVACY_POLICY_URL) {
      window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer');
    } else {
      setLegalNoticeMessage('개인정보처리방침 웹페이지 준비 중입니다. 노션/웹 URL이 지정되면 자동으로 연결됩니다.');
      setTimeout(() => setLegalNoticeMessage(null), 4000);
    }
  };

  const handleOpenTerms = () => {
    if (TERMS_OF_SERVICE_URL) {
      window.open(TERMS_OF_SERVICE_URL, '_blank', 'noopener,noreferrer');
    } else {
      setLegalNoticeMessage('서비스 이용약관 웹페이지 준비 중입니다. 노션/웹 URL이 지정되면 자동으로 연결됩니다.');
      setTimeout(() => setLegalNoticeMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-full flex flex-col max-w-3xl mx-auto px-4 py-4 gap-4 text-neutral-900">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 shrink-0">
        <Settings className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold font-serif text-neutral-900 break-keep">
          설정 및 서비스 정보
        </h2>
      </div>

      <div className="bg-neutral-950 ring-1 ring-black/5 rounded-3xl p-4 space-y-3.5 shadow-xl">
        {/* Sound Settings */}
        <div className="flex items-center justify-between gap-3 p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
          <div className="space-y-0.5 min-w-0">
            <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400 shrink-0" /> : <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="break-keep">클래식 오케스트라 사운드 및 메트로놈</span>
            </div>
            <p className="text-[11px] text-stone-400 break-keep leading-snug">
              지휘 미션 및 메트로놈 카운트다운 사운드를 켜거나 끕니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestSound}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold rounded-xl border border-amber-600/30"
            >
              소리 테스트
            </button>
            <button
              onClick={toggleSound}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isMuted
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                  : 'bg-amber-500 text-stone-950 shadow'
              }`}
            >
              {isMuted ? '음소거 됨' : '사운드 켜짐'}
            </button>
          </div>
        </div>

        {/* Motion Sensor Calibration */}
        <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="break-keep">지휘 모션 센서 보정 (DeviceMotion / Touch)</span>
              </div>
              <p className="text-[11px] text-stone-400 break-keep leading-snug">
                스마트폰의 가속도계 센서 반응 속도 및 터치 지휘 궤적을 보정합니다.
              </p>
            </div>

            <button
              onClick={handleCalibrateSensors}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs shadow transition-all shrink-0 break-keep"
            >
              센서 보정하기
            </button>
          </div>

          {calibrated && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="break-keep">지휘 모션 센서 보정이 완료되었습니다!</span>
            </div>
          )}
        </div>

        {/* Onboarding Restart */}
        <div className="flex items-center justify-between gap-3 p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
          <div className="space-y-0.5 min-w-0">
            <div className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="break-keep">서비스 작동 방식 및 권한 안내 다시 보기</span>
            </div>
            <p className="text-[11px] text-stone-400 break-keep leading-snug">
              안드로이드 OS 연동 및 핵심 제품 서비스 고지를 확인합니다.
            </p>
          </div>

          <button
            onClick={onOpenOnboarding}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold rounded-xl text-xs border border-amber-600/40 shrink-0 break-keep"
          >
            안내 창 열기
          </button>
        </div>

        {/* Legal Notices Section */}
        <div className="p-3.5 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-3">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>약관 및 법적 고지</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleOpenPrivacyPolicy}
              className="flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-medium text-stone-300 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>개인정보처리방침</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-300 transition-colors" />
            </button>

            <button
              onClick={handleOpenTerms}
              className="flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-medium text-stone-300 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span>서비스 이용약관</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-300 transition-colors" />
            </button>
          </div>

          {legalNoticeMessage && (
            <div className="p-2.5 bg-amber-950/60 border border-amber-600/40 rounded-xl text-xs text-amber-200 animate-fade-in break-keep">
              💡 {legalNoticeMessage}
            </div>
          )}
        </div>

        {/* App Version Info */}
        <div className="pt-2 text-center text-[11px] text-stone-500 font-mono">
          내인생 지휘자 · My Life Maestro v1.0.0 (Capacitor Android Ready)
        </div>
      </div>
    </div>
  );
};
