/**
 * 차단에 필요한 특수 권한 3종의 상태를 앱 전체에서 공유한다.
 *
 * 이 권한들은 앱이 직접 부여할 수 없고 사용자가 안드로이드 설정 화면에서 켜야 한다.
 * 그래서 흐름이 늘 "설정으로 나갔다가 → 돌아온다" 이며,
 * 돌아온 시점에 다시 확인하지 않으면 화면이 옛 상태 그대로 남는다.
 * (App.tsx 의 세션 동기화와 같은 visibilitychange 방식을 쓴다)
 *
 * ⚠️ 웹 브라우저에는 네이티브가 없어 조회 자체가 실패한다.
 *    이때는 권한 안내를 띄우지 않고 **조용히 통과**시킨다(개발 편의).
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Blocker, BlockerPermissions } from './blocker';
import { isBlockMode } from './blockBridge';

/** 권한 한 종류. 'battery' 는 없어도 잠금은 되지만 며칠 뒤 서비스가 죽는다. */
export type PermissionKind = 'usageStats' | 'overlay' | 'battery';

/**
 * 지금 실행 환경.
 * - checking: 최초 조회 중 (아직 판단하지 않음)
 * - native:   안드로이드 앱. 권한 안내가 의미 있다.
 * - web:      브라우저이거나 차단 화면 웹뷰. 권한 안내를 띄우지 않는다.
 */
export type PermissionEnv = 'checking' | 'native' | 'web';

interface BlockerPermissionsValue {
  env: PermissionEnv;
  /** 네이티브에서 읽어온 원본 상태. 웹이면 null. */
  permissions: BlockerPermissions | null;
  /** 필수 2종(사용 정보 접근 + 다른 앱 위에 표시)이 모두 켜져 있는지. 웹에서는 항상 true. */
  canBlock: boolean;
  /** 배터리 최적화 제외까지 되어 있는지. 웹에서는 항상 true. */
  batteryOk: boolean;
  /** 지금 상태를 다시 조회한다. */
  refresh: () => void;
  /** 해당 권한의 안드로이드 설정 화면을 연다. */
  request: (kind: PermissionKind) => void;
}

const BlockerPermissionsContext = createContext<BlockerPermissionsValue>({
  env: 'web',
  permissions: null,
  canBlock: true,
  batteryOk: true,
  refresh: () => {},
  request: () => {},
});

export const BlockerPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [env, setEnv] = useState<PermissionEnv>('checking');
  const [permissions, setPermissions] = useState<BlockerPermissions | null>(null);

  const refresh = useCallback(() => {
    // 차단 화면 웹뷰는 Capacitor 가 없어 조회가 실패한다. 애초에 시도하지 않는다.
    if (isBlockMode()) {
      setEnv('web');
      return;
    }

    Blocker.checkBlockerPermissions()
      .then(p => {
        setPermissions(p);
        setEnv('native');
      })
      .catch(() => {
        // 네이티브가 없는 환경 — 권한 개념 자체가 없다.
        setPermissions(null);
        setEnv('web');
      });
  }, []);

  useEffect(() => {
    refresh(); // 앱을 열었을 때

    // 설정 화면에 다녀온 뒤 결과를 반영한다.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const request = useCallback((kind: PermissionKind) => {
    const open =
      kind === 'usageStats' ? Blocker.requestUsageAccess()
      : kind === 'overlay' ? Blocker.requestOverlayPermission()
      : Blocker.requestBatteryOptimizationExemption();

    open.catch(err => console.warn('[permissions] 설정 화면을 열지 못했다', err));
  }, []);

  // 네이티브가 아니면 막지 않는다. 조회 중(checking)일 때도 막지 않는다 —
  // 몇 밀리초 사이에 버튼이 잠깐 잠겼다 풀리면 사용자에겐 오작동으로 보인다.
  const isNative = env === 'native' && permissions !== null;
  // canBlock 을 그대로 믿지 않고 필수 2종을 직접 본다. 판단 기준이 한눈에 보이는 편이 낫다.
  const canBlock = !isNative || Boolean(permissions?.usageStats && permissions?.overlay);
  const batteryOk = !isNative || Boolean(permissions?.batteryOptimizationIgnored);

  return (
    <BlockerPermissionsContext.Provider value={{ env, permissions, canBlock, batteryOk, refresh, request }}>
      {children}
    </BlockerPermissionsContext.Provider>
  );
};

export function useBlockerPermissions(): BlockerPermissionsValue {
  return useContext(BlockerPermissionsContext);
}
