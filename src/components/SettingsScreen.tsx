import React, { useState } from 'react';
import { getSoundMuted, setSoundMuted } from '../lib/storage';
import { audioSynthesizer } from '../lib/audioSynthesizer';
import { Settings, Volume2, VolumeX, ShieldCheck, Activity, HelpCircle, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="min-h-full flex flex-col max-w-3xl mx-auto px-4 py-4 gap-4 text-neutral-900">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 shrink-0">
        <Settings className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold font-serif text-neutral-900 break-keep">
          설정 및 지휘 감도 보정
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
              <span className="break-keep">서비스 작동 방식 및 안내 다시 보기</span>
            </div>
            <p className="text-[11px] text-stone-400 break-keep leading-snug">
              PRD v3.0 안내 및 제품 약속 고지를 다시 확인합니다.
            </p>
          </div>

          <button
            onClick={onOpenOnboarding}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold rounded-xl text-xs border border-amber-600/40 shrink-0 break-keep"
          >
            안내 창 열기
          </button>
        </div>
      </div>
    </div>
  );
};
