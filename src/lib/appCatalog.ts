import { TargetService } from '../types';
import { TARGET_SERVICES } from '../data/targetServices';
import { getCategoryForPackage } from '../data/appCategories';
import { Blocker } from './blocker';

/**
 * 잠글 수 있는 앱 목록을 공급한다.
 *
 * 안드로이드에서는 **실제로 설치된 앱**을 읽어오고,
 * 웹 브라우저(개발 중)에서는 기존 하드코딩 목록으로 대체한다.
 *
 * ■ 왜 TargetService 형태로 맞추는가
 *   기존 화면들(AppSelector, ModeA/B, 리포트 등)이 이미 이 타입을 쓰고 있다.
 *   같은 모양으로 공급하면 화면 코드를 거의 손대지 않아도 된다.
 *
 * ■ id 는 패키지명이다
 *   기존에는 'instagram' 같은 임의 문자열이었지만, 이제 'com.instagram.android' 처럼
 *   실제 패키지명이 들어간다. 네이티브 차단 엔진이 그대로 쓸 수 있어야 하기 때문이다.
 */

/** 카테고리별 표시 색상. 디자인이 나오면 교체한다. */
const CATEGORY_COLORS: Record<string, string> = {
  SHORTFORM: 'from-pink-500 to-rose-600',
  SOCIAL: 'from-sky-500 to-blue-600',
  GAME: 'from-violet-500 to-purple-700',
  STREAMING: 'from-red-500 to-rose-700',
  COMMUNITY: 'from-amber-500 to-orange-600',
  WEBTOON: 'from-emerald-500 to-teal-600',
  SHOPPING: 'from-orange-500 to-amber-600',
  MUSIC: 'from-fuchsia-500 to-pink-600',
  FINANCE: 'from-slate-500 to-slate-700',
  ETC: 'from-neutral-500 to-neutral-700',
};

let cached: TargetService[] | null = null;

/**
 * 기기에서 설치된 앱을 읽어 목록을 만든다. 앱 시작 시 한 번 호출한다.
 * 네이티브가 없는 환경(웹 브라우저)에서는 기존 하드코딩 목록을 그대로 쓴다.
 */
export async function loadAppCatalog(): Promise<TargetService[]> {
  try {
    const { apps } = await Blocker.getInstalledApps();

    cached = apps.map((app) => {
      const category = getCategoryForPackage(app.packageName);
      return {
        id: app.packageName,
        name: app.appName,
        // 아이콘은 네이티브에서 아직 안 넘긴다. 카테고리 아이콘으로 대체한다.
        icon: category.icon,
        color: CATEGORY_COLORS[category.id] ?? CATEGORY_COLORS.ETC,
        url: '',
        category: category.label,
      };
    });

    return cached;
  } catch {
    // 웹 브라우저에서 실행 중이거나 네이티브 호출이 실패한 경우
    cached = TARGET_SERVICES;
    return cached;
  }
}

/**
 * 이미 읽어둔 목록을 돌려준다. 화면 렌더링 중에는 이걸 쓴다.
 * 아직 안 읽었으면 기존 하드코딩 목록으로 대체한다(첫 프레임 깨짐 방지).
 */
export function getAppCatalog(): TargetService[] {
  return cached ?? TARGET_SERVICES;
}

/** 목록을 다 읽었는지. 로딩 표시에 쓴다. */
export function isAppCatalogLoaded(): boolean {
  return cached !== null;
}
