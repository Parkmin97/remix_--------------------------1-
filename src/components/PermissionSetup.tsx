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

import React, { useState } from 'react';
import { ShieldCheck, Eye, Check, ChevronRight, AlertTriangle } from 'lucide-react';
import { PermissionKind, useBlockerPermissions } from '../lib/blockerPermissions';

/** 앱 이름 — 설정 화면 목록에서 사용자가 찾아야 하는 이름과 같아야 한다 */
const APP_NAME = '내인생 지휘자';

interface PermissionItem {
  kind: PermissionKind;
  title: string;
  /** 왜 필요한지 한 줄. 없을 때 무엇이 안 되는지를 적는다. */
  why: string;
  required: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  /**
   * 설정 화면에서 무엇을 눌러야 하는지.
   *
   * ⚠️ 이 권한들은 **팝업이 없다.** 안드로이드가 특수 권한에는 허용/거부 다이얼로그를
   *    제공하지 않아, 사용자가 설정 화면에서 직접 앱을 찾아 켜야만 한다.
   *    안내 없이 설정으로 던지면 어디를 눌러야 할지 몰라 그냥 뒤로 나온다.
   */
  steps: string[];
  /** 설정 앱에서의 위치. 제조사마다 문구가 조금씩 다르다. */
  path: string;
}

const ITEMS: PermissionItem[] = [
  {
    kind: 'usageStats',
    title: '사용 정보 접근',
    why: '어떤 앱을 켰는지 알아야 막을 수 있습니다. 없으면 감지 자체가 불가능합니다.',
    required: true,
    Icon: ShieldCheck,
    steps: [
      `목록에서 '${APP_NAME}'을 찾아 누릅니다`,
      "'사용 정보 액세스 허용'을 켭니다",
      '뒤로 나오면 자동으로 확인됩니다',
    ],
    path: '설정 › 앱 › 특수한 접근 › 사용 정보 액세스',
  },
  {
    kind: 'overlay',
    title: '다른 앱 위에 표시',
    why: '잠근 앱을 열었을 때 차단 화면을 띄웁니다. 없으면 감지해도 막지 못합니다.',
    required: true,
    Icon: Eye,
    steps: [
      `목록에서 '${APP_NAME}'을 찾아 누릅니다`,
      "'다른 앱 위에 표시 허용'을 켭니다",
      '뒤로 나오면 자동으로 확인됩니다',
    ],
    path: '설정 › 앱 › 특수한 접근 › 다른 앱 위에 표시',
  },
];

function isGranted(kind: PermissionKind, p: { usageStats: boolean; overlay: boolean; batteryOptimizationIgnored: boolean } | null): boolean {
  if (!p) return false;
  if (kind === 'usageStats') return p.usageStats;
  if (kind === 'overlay') return p.overlay;
  return p.batteryOptimizationIgnored;
}

/**
 * 권한 한 줄. 켜짐이면 체크만, 꺼짐이면 설명과 이동 버튼을 보여준다.
 *
 * 설정으로 곧장 던지지 않고 **무엇을 눌러야 하는지 먼저 보여준 뒤** 이동한다.
 * 팝업이 없는 권한이라 설정 화면에 도착해도 사용자가 스스로 항목을 찾아야 하고,
 * 그 화면은 앱 수십 개가 나열된 낯선 목록이다.
 */
const PermissionRow: React.FC<{
  item: PermissionItem;
  granted: boolean;
  /** 설정에 다녀왔는데도 안 켜진 상태인지 */
  failed: boolean;
  onRequest: () => void;
}> = ({ item, granted, failed, onRequest }) => {
  // 안내를 먼저 펼치고, 확인한 뒤에 설정으로 보낸다.
  // 빈손으로 돌아온 경우(failed)에는 접어두지 않고 바로 펼쳐 보여준다.
  const [showSteps, setShowSteps] = useState(false);
  const stepsOpen = showSteps || failed;

  return (
    <div className={`rounded-2xl border p-3.5 ${granted ? 'bg-slate-50 border-slate-200' : failed ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-300'}`}>
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

      {/* 설정에 다녀왔는데 그대로인 경우 — 그냥 뒤로 나왔을 가능성이 높다 */}
      {!granted && failed && (
        <div className="mt-2.5 flex items-start gap-1.5 text-xs text-black leading-relaxed break-keep">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#FE9A00]" />
          <span>아직 켜지지 않았습니다. 아래 순서대로 다시 해보세요.</span>
        </div>
      )}

      {!granted && stepsOpen && (
        <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
          <ol className="space-y-1.5">
            {item.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-black leading-relaxed break-keep">
                <span className="shrink-0 w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-slate-500 break-keep pt-1 border-t border-slate-200">
            {item.path}
            <br />
            <span className="text-slate-400">기기에 따라 문구가 조금 다를 수 있습니다.</span>
          </p>
        </div>
      )}

      {!granted && (
        <button
          onClick={() => (stepsOpen ? onRequest() : setShowSteps(true))}
          className="mt-2.5 w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all active:scale-[0.99]"
        >
          <span>{stepsOpen ? (failed ? '설정 다시 열기' : '설정 열기') : '켜는 방법 보기'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FE9A00]" />
        </button>
      )}
    </div>
  );
};

/**
 * 앱을 열었을 때 필수 권한이 빠져 있으면 뜨는 전체 화면.
 * 권한이 없으면 잠금이 무의미하므로 첫 화면으로 세운다.
 */
export const PermissionSetupScreen: React.FC<{ onSkip: () => void; onDone: () => void }> = ({ onSkip, onDone }) => {
  const { permissions, canBlock, request, returnedWithoutGrant } = useBlockerPermissions();

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
            failed={returnedWithoutGrant === item.kind}
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
  const { env, permissions, canBlock, request, returnedWithoutGrant } = useBlockerPermissions();

  if (env !== 'native' || !permissions) return null;
  // 필수 권한(사용 정보 접근 + 다른 앱 위에 표시)이 모두 켜져 있으면 아무것도 그리지 않는다.
  if (canBlock) return null;

  // 필수 권한이 빠져 있는 경우에만 표시
  const missing = ITEMS.filter(item => item.required && !isGranted(item.kind, permissions));
  if (missing.length === 0) return null;

  return (
    <div className="rounded-2xl border p-3.5 space-y-2.5 bg-white border-slate-300 shadow-xl">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#FE9A00]" />
        <p className="text-xs text-black leading-relaxed break-keep">
          권한이 없어 잠금이 실제로 걸리지 않습니다. 아래 필수 권한을 켠 뒤 실행해 주세요.
        </p>
      </div>

      {/* 켜는 방법 안내는 설정 화면과 똑같이 보여준다. */}
      {missing.map(item => (
        <PermissionRow
          key={item.kind}
          item={item}
          granted={false}
          failed={returnedWithoutGrant === item.kind}
          onRequest={() => request(item.kind)}
        />
      ))}
    </div>
  );
};
