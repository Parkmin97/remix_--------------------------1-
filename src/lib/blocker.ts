import { registerPlugin } from '@capacitor/core';
import { AppCategoryId } from '../types';

/**
 * 안드로이드 차단 엔진과 통신하는 통로.
 *
 * 화면과 사용자 설정은 웹이, 실제 감시와 차단 판단은 네이티브가 담당한다.
 * 잠금 세션의 소유자는 **네이티브**다. 감시 서비스는 앱이 꺼져 있어도 돌아가야 하므로
 * 웹의 localStorage 에 세션을 두면 읽을 수 없기 때문이다.
 *
 * ⚠️ 웹 브라우저에서 실행할 때는 네이티브가 없다. [isBlockerAvailable] 로 먼저 확인할 것.
 */

export interface BlockerPermissions {
  /** 어떤 앱이 켜져 있는지 알아내는 권한. 없으면 감지 자체가 불가능하다. */
  usageStats: boolean;
  /** 다른 앱 위에 차단 화면을 띄우는 권한. 없으면 감지해도 막지 못한다. */
  overlay: boolean;
  /** 배터리 최적화 제외 여부. 없어도 당장은 동작하지만 며칠 뒤 서비스가 죽을 수 있다. */
  batteryOptimizationIgnored: boolean;
  /** 위 둘(usageStats, overlay)이 모두 있는지. */
  canBlock: boolean;
}

export interface InstalledAppInfo {
  packageName: string;
  appName: string;
  /** 제조사 선탑재 앱인지. 유튜브도 여기 해당하므로 거르는 기준으로 쓰면 안 된다. */
  isPreinstalled: boolean;
  /** 안드로이드가 주는 분류값. 미분류가 57%라 신뢰할 수 없다. 진단용. */
  systemCategory: number;
  /** 우리 매핑표로 붙인 카테고리. 호출부에서 채운다. */
  categoryId?: AppCategoryId;
}

export interface BlockStatus {
  hasSession: boolean;
  /** 지금 이 순간 잠금이 걸려 있는지. 모드 B의 사용 허용 시간 중이면 false. */
  isLocked: boolean;
  lockEndsAt: number;
  usageEndsAt: number;
  blockedPackages: string[];
  /** 이번 세션에서 미션을 이미 시도했는지. 했으면 다시 못 한다. */
  missionAttempted: boolean;
  /** 잠근 앱을 열려고 시도한 횟수. 리포트에서 "몇 번 흔들렸는지"로 쓴다. */
  launchAttempts: number;
}

export interface StartSessionOptions {
  sessionId: string;
  /** 잠금이 끝나는 시각 (epoch millis) */
  lockEndsAt: number;
  /** 모드 B에서 먼저 쓰기로 한 시간의 종료 시각. 모드 A면 0 또는 생략. */
  usageEndsAt?: number;
  blockedPackages: string[];
}

export interface BlockerPlugin {
  checkBlockerPermissions(): Promise<BlockerPermissions>;
  requestUsageAccess(): Promise<void>;
  requestOverlayPermission(): Promise<void>;
  requestBatteryOptimizationExemption(): Promise<void>;
  getInstalledApps(): Promise<{ apps: InstalledAppInfo[] }>;
  startSession(options: StartSessionOptions): Promise<void>;
  endSession(options: { reason?: string }): Promise<void>;
  markMissionAttempted(): Promise<void>;
  getStatus(): Promise<BlockStatus>;
  /** 실제 안드로이드 홈 화면으로 나간다. 잠금 시작 후 사용자를 앱에 붙잡아두지 않기 위해 쓴다. */
  goToHomeScreen(): Promise<void>;
}

export const Blocker = registerPlugin<BlockerPlugin>('Blocker');

/**
 * 실제 폰 홈 화면으로 나간다.
 * 웹 브라우저에서는 할 수 없으므로 false 를 돌려준다(호출부가 대체 동작을 정한다).
 */
export async function goToRealHomeScreen(): Promise<boolean> {
  try {
    await Blocker.goToHomeScreen();
    return true;
  } catch {
    return false;
  }
}

/** 네이티브 차단 엔진을 쓸 수 있는 환경인지. 웹 브라우저에서는 false. */
export async function isBlockerAvailable(): Promise<boolean> {
  try {
    await Blocker.checkBlockerPermissions();
    return true;
  } catch {
    return false;
  }
}
