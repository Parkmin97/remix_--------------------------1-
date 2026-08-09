import { TargetService } from '../types';
import { TARGET_SERVICES } from '../data/targetServices';
import {
  APP_CATEGORIES,
  BUILTIN_PACKAGE_CATEGORIES,
  FALLBACK_CATEGORY,
  getCategoryForPackage,
} from '../data/appCategories';
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
        // 기기에서 읽어온 실제 아이콘. 없으면 화면이 첫 글자로 대체한다.
        iconUri: app.iconBase64 ? `data:image/png;base64,${app.iconBase64}` : undefined,
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

/** 마지막으로 실제 조회한 시각. 화면을 열 때마다 네이티브를 부르지 않도록 막는다. */
let lastLoadedAt = 0;

/**
 * 목록을 다시 읽어야 하는지 확인하고, 필요하면 읽는다.
 *
 * ■ 왜 필요한가
 *   사용자가 앱을 **새로 설치한 직후** 우리 앱에서 잠그려 할 수 있다.
 *   목록을 앱 시작 시 한 번만 읽으면 방금 깐 앱이 안 보여서
 *   "왜 없지?" 하게 된다.
 *   잠글 앱을 고르는 화면에 들어올 때마다 확인하면 자연스럽게 해결된다.
 *
 * @returns 목록이 실제로 바뀌었으면 true (화면을 다시 그려야 한다)
 */
export async function refreshAppCatalogIfStale(): Promise<boolean> {
  // 앱 설치는 자주 일어나는 일이 아니다. 화면을 들락날락할 때마다
  // 수십 개 앱 정보를 다시 읽을 이유는 없다.
  const now = Date.now();
  if (now - lastLoadedAt < 10_000) return false;
  lastLoadedAt = now;

  // 개수만 비교하면 "하나 지우고 하나 깐" 경우를 놓친다. 패키지명까지 본다.
  const before = new Set((cached ?? []).map(a => a.id));
  const after = await loadAppCatalog();

  if (before.size !== after.length) return true;
  return after.some(a => !before.has(a.id));
}

/** 목록을 다 읽었는지. 로딩 표시에 쓴다. */
export function isAppCatalogLoaded(): boolean {
  return cached !== null;
}

/**
 * 선택된 앱들로부터 **통째로 잠근 카테고리**를 알아낸다.
 *
 * 별도의 UI 상태를 두지 않고, "그 카테고리의 앱을 하나도 빠짐없이 골랐다"는 사실로
 * 사용자 의도를 읽는다. 사용자가 '숏폼 전체 선택'을 눌렀다면 자연스럽게 여기 걸린다.
 * 반대로 하나라도 빼면 "전체를 막겠다"는 의도가 아니므로 제외된다.
 *
 * 이 카테고리들은 네이티브에 함께 넘겨져, **잠금 중에 새로 설치한 앱까지 막는 데** 쓰인다.
 */
export function resolveLockedCategories(selectedIds: string[]): {
  categoryIds: string[];
  /** 잠근 카테고리에 속한 패키지 → 카테고리 대응표 (네이티브가 새 앱을 판정할 때 쓴다) */
  packageCategories: Record<string, string>;
} {
  const selected = new Set(selectedIds);
  const catalog = getAppCatalog();
  const categoryIds: string[] = [];

  APP_CATEGORIES.forEach((category) => {
    // '기타'는 성격이 모호해 통째로 잠그는 의미가 없다.
    if (category.id === FALLBACK_CATEGORY.id) return;

    const apps = catalog.filter((a) => a.category === category.label);
    if (apps.length === 0) return;
    if (!apps.every((a) => selected.has(a.id))) return;

    categoryIds.push(category.id);
  });

  // 대응표는 잠근 카테고리에 속한 것만 넘긴다. 전부 넘길 이유가 없다.
  const lockedLabels = new Set(
    APP_CATEGORIES.filter((c) => categoryIds.includes(c.id)).map((c) => c.label)
  );
  const packageCategories: Record<string, string> = {};

  Object.entries(BUILTIN_PACKAGE_CATEGORIES).forEach(([pkg, categoryId]) => {
    const category = APP_CATEGORIES.find((c) => c.id === categoryId);
    if (category && lockedLabels.has(category.label)) {
      packageCategories[pkg] = categoryId;
    }
  });

  return { categoryIds, packageCategories };
}
