/**
 * 차단 권한 안내.
 *
 * 이 앱의 잠금은 안드로이드 특수 권한 3종 위에서만 동작한다.
 * 권한이 없으면 잠금을 걸어도 **아무 일도 일어나지 않는다** — 사용자 입장에선
 * 고장난 앱으로 보이므로, 잠금을 시작하기 전에 반드시 여기를 거치게 한다.
 *
 * 두 가지 모습으로 쓴다.
 *  - PermissionSetupScreen: 앱을 열었을 때 필수 권한이 없으면 뜨는 전체 화면
 *  - PermissionNotice:      잠금 실행 화면(모드 A/B) 안에 끼워 넣는 작은 카드
 */

import React from 'react';
import { ShieldCheck, Eye, BatteryCharging, Check, ChevronRight, AlertTriangle } from 'lucide-react';
import { PermissionKind, useBlockerPermissions } from '../lib/blockerPermissions';

interface PermissionItem {
  kind: PermissionKind;
  title: string;
  /** 왜 필요한지 한 줄. 없을 때 무엇이 안 되는지를 적는다. */
  why: string;
  required: boolean;
  Icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: PermissionItem[] = [
  {
    kind: 'usageStats',
    title: '사용 정보 접근',
    why: '어떤 앱을 켰는지 알아야 막을 수 있습니다. 없으면 감지 자체가 불가능합니다.',
    required: true,
    Icon: ShieldCheck,
  },
  {
    kind: 'overlay',
    title: '다른 앱 위에 표시',
    why: '잠근 앱을 열었을 때 차단 화면을 띄웁니다. 없으면 감지해도 막지 못합니다.',
    required: true,
    Icon: Eye,
  },
  {
    kind: 'battery',
    title: '배터리 최적화 제외',
    why: '없어도 당장은 되지만, 며칠 뒤 감시가 꺼져 잠금이 풀릴 수 있습니다.',
    required: false,
    Icon: BatteryCharging,
  },
];

function isGranted(kind: PermissionKind, p: { usageStats: boolean; overlay: boolean; batteryOptimizationIgnored: boolean } | null): boolean {
  if (!p) return false;
  if (kind === 'usageStats') return p.usageStats;
  if (kind === 'overlay') return p.overlay;
  return p.batteryOptimizationIgnored;
}

/** 권한 한 줄. 켜짐이면 체크만, 꺼짐이면 설명과 이동 버튼을 보여준다. */
const PermissionRow: React.FC<{ item: PermissionItem; granted: boolean; onRequest: () => void }> = ({ item, granted, onRequest }) => (
  <div className={`rounded-2xl border p-3.5 ${granted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-300'}`}>
    <div className="flex items-start gap-2.5">
      <item.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${granted ? 'text-slate-400' : 'text-[#FE9A00]'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-black break-keep">{item.title}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${item.required ? 'bg-black text-white' : 'bg-slate-200 text-slate-600'}`}>
            {item.required ? '필수' : '권장'}
          </span>
          {granted && (
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 ml-auto">
              <Check className="w-3 h-3" /> 켜짐
            </span>
          )}
        </div>
        {!granted && (
          <p className="text-xs text-slate-600 leading-relaxed break-keep mt-1">{item.why}</p>
        )}
      </div>
    </div>

    {!granted && (
      <button
        onClick={onRequest}
        className="mt-2.5 w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all active:scale-[0.99]"
      >
        <span>설정에서 켜기</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#FE9A00]" />
      </button>
    )}
  </div>
);

/**
 * 앱을 열었을 때 필수 권한이 빠져 있으면 뜨는 전체 화면.
 * 권한이 없으면 잠금이 무의미하므로 첫 화면으로 세운다.
 */
export const PermissionSetupScreen: React.FC<{ onSkip: () => void; onDone: () => void }> = ({ onSkip, onDone }) => {
  const { permissions, canBlock, request } = useBlockerPermissions();

  return (
    <div className="min-h-full flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-3.5 text-black">
      <div className="p-4 rounded-3xl bg-black text-white border border-black shadow-xl space-y-1.5 shrink-0">
        <h1 className="text-lg font-serif font-bold flex items-center gap-2 break-keep">
          <ShieldCheck className="w-5 h-5 text-[#FE9A00]" />
          <span className="text-white">잠금 권한 설정</span>
        </h1>
        <p className="text-xs text-neutral-300 leading-relaxed break-keep">
          앱을 실제로 잠그려면 안드로이드 설정에서 아래 권한을 직접 켜야 합니다. 앱이 대신 켤 수 없는 권한입니다.
        </p>
      </div>

      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-2.5 flex-1">
        {ITEMS.map(item => (
          <PermissionRow
            key={item.kind}
            item={item}
            granted={isGranted(item.kind, permissions)}
            onRequest={() => request(item.kind)}
          />
        ))}

        <div className="pt-1 space-y-2">
          <button
            onClick={onDone}
            disabled={!canBlock}
            className="w-full py-3.5 bg-black hover:bg-neutral-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-xl transition-all active:scale-[0.99]"
          >
            {canBlock ? '설정 완료, 시작하기' : '필수 권한 2가지를 켜주세요'}
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-black transition-colors"
          >
            나중에 하기
          </button>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed break-keep">
            설정 화면에 다녀오면 상태가 자동으로 갱신됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 잠금 실행 화면에 끼워 넣는 작은 안내 카드.
 * 모두 켜져 있거나 웹 환경이면 아무것도 그리지 않는다.
 */
export const PermissionNotice: React.FC = () => {
  const { env, permissions, canBlock, batteryOk, request } = useBlockerPermissions();

  if (env !== 'native' || !permissions) return null;
  if (canBlock && batteryOk) return null;

  // 필수가 빠졌으면 그것만, 필수가 다 있고 배터리만 빠졌으면 그것만 보여준다.
  const missing = ITEMS.filter(item => !isGranted(item.kind, permissions) && (canBlock ? !item.required : item.required));

  return (
    <div className={`rounded-2xl border p-3.5 space-y-2.5 ${canBlock ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-300 shadow-xl'}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#FE9A00]" />
        <p className="text-xs text-black leading-relaxed break-keep">
          {canBlock
            ? '배터리 최적화 제외가 꺼져 있습니다. 지금은 잠기지만 며칠 뒤 잠금이 풀릴 수 있습니다.'
            : '권한이 없어 잠금이 실제로 걸리지 않습니다. 아래 권한을 켠 뒤 실행해 주세요.'}
        </p>
      </div>

      {missing.map(item => (
        <button
          key={item.kind}
          onClick={() => request(item.kind)}
          className="w-full py-2.5 px-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center justify-between gap-2 transition-all active:scale-[0.99]"
        >
          <span className="break-keep text-left">{item.title} 켜러 가기</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FE9A00] shrink-0" />
        </button>
      ))}
    </div>
  );
};
