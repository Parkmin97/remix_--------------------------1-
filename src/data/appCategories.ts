import { AppCategory, AppCategoryId } from '../types';

/**
 * 앱 카테고리 매핑표.
 *
 * 안드로이드 ApplicationInfo.category 는 앱 개발자가 직접 지정하는 선택값이라
 * 미설정(CATEGORY_UNDEFINED = -1)인 앱이 매우 많다. 그것만 믿으면 인스타그램조차
 * "미분류"로 떨어지므로, 국내 사용자가 실제로 많이 쓰는 앱은 우리가 직접 분류한다.
 */

/** 카테고리 정의 — priority 오름차순 = 시간을 많이 뺏는 순서 */
export const APP_CATEGORIES: AppCategory[] = [
  {
    id: 'SHORTFORM',
    label: '숏폼/영상',
    icon: 'Flame',
    priority: 1,
    description: '릴스·쇼츠·틱톡처럼 끝이 없는 세로 스크롤. 가장 먼저 멈춰야 할 대상입니다.',
    defaultLocked: true
  },
  {
    id: 'SOCIAL',
    label: '소셜/메신저',
    icon: 'MessageCircle',
    priority: 2,
    description: '알림 하나에 다시 들어가게 되는 피드와 대화방입니다.',
    defaultLocked: true
  },
  {
    id: 'GAME',
    label: '게임',
    icon: 'Gamepad2',
    priority: 3,
    description: '한 판만 하려다 한 시간이 사라지는 구간입니다.',
    defaultLocked: true
  },
  {
    id: 'STREAMING',
    label: 'OTT/스트리밍',
    icon: 'MonitorPlay',
    priority: 4,
    description: '자동 재생으로 이어지는 몰아보기 시청입니다.',
    defaultLocked: true
  },
  {
    id: 'COMMUNITY',
    label: '뉴스/커뮤니티',
    icon: 'Newspaper',
    priority: 5,
    description: '새로고침을 반복하게 만드는 실시간 글 목록입니다.',
    defaultLocked: true
  },
  {
    id: 'WEBTOON',
    label: '웹툰/웹소설',
    icon: 'BookOpen',
    priority: 6,
    description: '다음 화 버튼이 계속 이어지는 연재 콘텐츠입니다.',
    defaultLocked: false
  },
  {
    id: 'SHOPPING',
    label: '쇼핑/배달',
    icon: 'ShoppingBag',
    priority: 7,
    description: '목적 없이 둘러보다 결제까지 가는 커머스 앱입니다.',
    defaultLocked: false
  },
  {
    id: 'MUSIC',
    label: '음악/오디오',
    icon: 'Music',
    priority: 8,
    description: '배경 재생이 많아 집중을 돕기도 합니다. 필요할 때만 잠그세요.',
    defaultLocked: false
  },
  {
    id: 'FINANCE',
    label: '금융/페이',
    icon: 'Wallet',
    priority: 9,
    description: '결제·송금에 필요한 앱입니다. 기본적으로 잠그지 않습니다.',
    defaultLocked: false
  },
  {
    id: 'ETC',
    label: '기타',
    icon: 'LayoutGrid',
    priority: 99,
    description: '분류되지 않은 앱입니다. 직접 골라서 잠글 수 있습니다.',
    defaultLocked: false
  }
];

/** 매핑 실패 시 최종 폴백 카테고리 */
export const FALLBACK_CATEGORY: AppCategory = APP_CATEGORIES[APP_CATEGORIES.length - 1];

const CATEGORY_BY_ID: Record<AppCategoryId, AppCategory> = APP_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<AppCategoryId, AppCategory>
);

/**
 * 패키지명 → 카테고리 매핑표.
 * 확신할 수 없는 패키지명은 넣지 않는다. 틀린 패키지명은 "잠갔는데 안 막힌다"로 이어진다.
 * (불확실한 후보는 파일 하단 UNVERIFIED_PACKAGES 주석 참고)
 */
export const PACKAGE_CATEGORY_MAP: Record<string, AppCategoryId> = {
  // ── 숏폼/영상 ────────────────────────────────────────────────
  'com.zhiliaoapp.musically': 'SHORTFORM', // 틱톡 (정식)
  'com.ss.android.ugc.trill': 'SHORTFORM', // 틱톡 (일부 지역 변종)
  'com.ss.android.ugc.tiktok.lite': 'SHORTFORM', // 틱톡 라이트
  'com.google.android.youtube': 'SHORTFORM', // 유튜브 (쇼츠 포함)
  'com.instagram.android': 'SHORTFORM', // 인스타그램 (릴스 포함)
  'com.instagram.lite': 'SHORTFORM', // 인스타그램 라이트
  'video.like': 'SHORTFORM', // 라이키
  'tv.twitch.android.app': 'SHORTFORM', // 트위치
  'kr.co.nowcom.mobile.afreeca': 'SHORTFORM', // SOOP (구 아프리카TV)

  // ── 소셜/메신저 ──────────────────────────────────────────────
  'com.kakao.talk': 'SOCIAL', // 카카오톡
  'com.kakao.story': 'SOCIAL', // 카카오스토리
  'com.nhn.android.band': 'SOCIAL', // 네이버 밴드
  'com.facebook.katana': 'SOCIAL', // 페이스북
  'com.facebook.lite': 'SOCIAL', // 페이스북 라이트
  'com.facebook.orca': 'SOCIAL', // 페이스북 메신저
  'com.facebook.mlite': 'SOCIAL', // 메신저 라이트
  'com.instagram.barcelona': 'SOCIAL', // 스레드 (Threads)
  'com.twitter.android': 'SOCIAL', // X (트위터)
  'com.snapchat.android': 'SOCIAL', // 스냅챗
  'com.whatsapp': 'SOCIAL', // 왓츠앱
  'org.telegram.messenger': 'SOCIAL', // 텔레그램
  'com.discord': 'SOCIAL', // 디스코드
  'jp.naver.line.android': 'SOCIAL', // 라인
  'com.tencent.mm': 'SOCIAL', // 위챗
  'com.linkedin.android': 'SOCIAL', // 링크드인
  'com.pinterest': 'SOCIAL', // 핀터레스트

  // ── 게임 ────────────────────────────────────────────────────
  'com.ncsoft.lineagem19': 'GAME', // 리니지M
  'com.ncsoft.lineage2m': 'GAME', // 리니지2M
  'com.ncsoft.lineagew': 'GAME', // 리니지W
  'com.kakaogames.odin': 'GAME', // 오딘: 발할라 라이징
  'com.devsisters.ck': 'GAME', // 쿠키런: 킹덤
  'com.supercell.clashofclans': 'GAME', // 클래시 오브 클랜
  'com.supercell.clashroyale': 'GAME', // 클래시 로얄
  'com.supercell.brawlstars': 'GAME', // 브롤스타즈
  'com.tencent.ig': 'GAME', // 배틀그라운드 모바일 (글로벌)
  'com.pubg.krmobile': 'GAME', // 배틀그라운드 모바일 (KR)
  'com.dts.freefireth': 'GAME', // 프리파이어
  'com.riotgames.league.wildrift': 'GAME', // 와일드 리프트
  'com.miHoYo.GenshinImpact': 'GAME', // 원신
  'com.roblox.client': 'GAME', // 로블록스
  'com.mojang.minecraftpe': 'GAME', // 마인크래프트
  'com.nianticlabs.pokemongo': 'GAME', // 포켓몬 GO
  'com.king.candycrushsaga': 'GAME', // 캔디크러시 사가
  'com.blizzard.wtcg.hearthstone': 'GAME', // 하스스톤
  'com.activision.callofduty.shooter': 'GAME', // 콜 오브 듀티: 모바일
  'com.innersloth.spacemafia': 'GAME', // 어몽 어스

  // ── OTT/스트리밍 ────────────────────────────────────────────
  'com.netflix.mediaclient': 'STREAMING', // 넷플릭스
  'net.cj.cjhv.gs.tving': 'STREAMING', // 티빙
  'com.pooq.androidapp': 'STREAMING', // 웨이브
  'com.frograms.wplay': 'STREAMING', // 왓챠
  'com.disney.disneyplus': 'STREAMING', // 디즈니+
  'com.amazon.avod.thirdpartyclient': 'STREAMING', // 프라임 비디오
  'com.google.android.videos': 'STREAMING', // 구글 TV (구 플레이 무비)

  // ── 뉴스/커뮤니티 ───────────────────────────────────────────
  'com.nhn.android.search': 'COMMUNITY', // 네이버
  'com.nhn.android.navercafe': 'COMMUNITY', // 네이버 카페
  'com.nhn.android.blog': 'COMMUNITY', // 네이버 블로그
  'net.daum.android.daum': 'COMMUNITY', // 다음
  'com.dcinside.app': 'COMMUNITY', // 디시인사이드
  'com.everytime.v2': 'COMMUNITY', // 에브리타임
  'com.teamblind.blind': 'COMMUNITY', // 블라인드
  'com.reddit.frontpage': 'COMMUNITY', // 레딧
  'flipboard.app': 'COMMUNITY', // 플립보드
  'com.google.android.apps.magazines': 'COMMUNITY', // 구글 뉴스

  // ── 웹툰/웹소설 ─────────────────────────────────────────────
  'com.nhn.android.webtoon': 'WEBTOON', // 네이버 웹툰
  'com.naver.linewebtoon': 'WEBTOON', // LINE 웹툰 (글로벌)
  'com.nhn.android.nbooks': 'WEBTOON', // 네이버 시리즈
  'com.kakao.page': 'WEBTOON', // 카카오페이지
  'com.initialcoms.ridi': 'WEBTOON', // 리디 (리디북스)
  'com.lezhin.comics': 'WEBTOON', // 레진코믹스

  // ── 쇼핑/배달 ───────────────────────────────────────────────
  'com.coupang.mobile': 'SHOPPING', // 쿠팡
  'com.coupang.mobile.eats': 'SHOPPING', // 쿠팡이츠
  'com.sampleapp': 'SHOPPING', // 배달의민족 (패키지명이 실제로 com.sampleapp)
  'com.fineapp.yogiyo': 'SHOPPING', // 요기요
  'com.towneers.www': 'SHOPPING', // 당근
  'com.elevenst': 'SHOPPING', // 11번가
  'com.ebay.kr.gmarket': 'SHOPPING', // G마켓
  'com.ebay.kr.auction': 'SHOPPING', // 옥션
  'com.tmon': 'SHOPPING', // 티몬
  'com.wemakeprice': 'SHOPPING', // 위메프
  'com.musinsa.store': 'SHOPPING', // 무신사
  'com.croquis.zigzag': 'SHOPPING', // 지그재그
  'net.bucketplace': 'SHOPPING', // 오늘의집
  'com.alibaba.aliexpresshd': 'SHOPPING', // 알리익스프레스
  'com.zzkko': 'SHOPPING', // 쉬인
  'com.amazon.mShop.android.shopping': 'SHOPPING', // 아마존

  // ── 음악/오디오 ─────────────────────────────────────────────
  'com.iloen.melon': 'MUSIC', // 멜론
  'com.ktmusic.geniemusic': 'MUSIC', // 지니뮤직
  'com.neowiz.android.bugs': 'MUSIC', // 벅스
  'com.spotify.music': 'MUSIC', // 스포티파이
  'com.google.android.apps.youtube.music': 'MUSIC', // 유튜브 뮤직
  'com.apple.android.music': 'MUSIC', // 애플 뮤직
  'com.soundcloud.android': 'MUSIC', // 사운드클라우드

  // ── 금융/페이 ───────────────────────────────────────────────
  'viva.republica': 'FINANCE', // 토스
  'com.kakaopay.app': 'FINANCE', // 카카오페이
  'com.samsung.android.spay': 'FINANCE' // 삼성월렛 (구 삼성페이)
};

/** 대소문자 차이(com.miHoYo.* 등)를 흡수하기 위한 소문자 키 인덱스 */
const LOWERCASE_PACKAGE_INDEX: Record<string, AppCategoryId> = Object.keys(
  PACKAGE_CATEGORY_MAP
).reduce((acc, packageName) => {
  acc[packageName.toLowerCase()] = PACKAGE_CATEGORY_MAP[packageName];
  return acc;
}, {} as Record<string, AppCategoryId>);

/**
 * 안드로이드 ApplicationInfo.category 상수 → 우리 카테고리.
 * -1(CATEGORY_UNDEFINED)이거나 여기에 없으면 기타로 떨어진다.
 */
const SYSTEM_CATEGORY_MAP: Record<number, AppCategoryId> = {
  0: 'GAME', // CATEGORY_GAME
  1: 'MUSIC', // CATEGORY_AUDIO
  2: 'STREAMING', // CATEGORY_VIDEO
  3: 'SOCIAL', // CATEGORY_IMAGE
  4: 'SOCIAL', // CATEGORY_SOCIAL
  5: 'COMMUNITY' // CATEGORY_NEWS
};

/** id로 카테고리 정의를 찾는다. 없으면 기타. */
export function getCategoryById(id: AppCategoryId): AppCategory {
  return CATEGORY_BY_ID[id] ?? FALLBACK_CATEGORY;
}

/**
 * 패키지명으로 카테고리를 판정한다. 3단계 폴백:
 * 1) 우리 매핑표
 * 2) 호출부가 넘겨준 안드로이드 ApplicationInfo.category 값
 * 3) 기타
 */
export function getCategoryForPackage(packageName: string, systemCategory?: number): AppCategory {
  if (!packageName) return FALLBACK_CATEGORY;

  // 1) 우리 매핑표 (정확 일치 → 소문자 일치)
  const mapped =
    PACKAGE_CATEGORY_MAP[packageName] ?? LOWERCASE_PACKAGE_INDEX[packageName.toLowerCase()];
  if (mapped) return getCategoryById(mapped);

  // 2) 안드로이드가 알려준 값 (미설정이면 -1로 들어온다)
  if (typeof systemCategory === 'number' && systemCategory >= 0) {
    const fromSystem = SYSTEM_CATEGORY_MAP[systemCategory];
    if (fromSystem) return getCategoryById(fromSystem);
  }

  // 3) 기타
  return FALLBACK_CATEGORY;
}

/**
 * 설치 앱 목록을 카테고리별로 묶는다.
 * 반환 배열은 시간 소모 우선순위(priority) 순이며, 빈 카테고리는 제외한다.
 */
export function groupPackagesByCategory(
  packages: Array<{ packageName: string; systemCategory?: number }>
): Array<{ category: AppCategory; packageNames: string[] }> {
  const buckets = new Map<AppCategoryId, string[]>();

  packages.forEach(({ packageName, systemCategory }) => {
    const category = getCategoryForPackage(packageName, systemCategory);
    const bucket = buckets.get(category.id);
    if (bucket) {
      bucket.push(packageName);
    } else {
      buckets.set(category.id, [packageName]);
    }
  });

  return APP_CATEGORIES.filter((category) => buckets.has(category.id)).map((category) => ({
    category,
    packageNames: buckets.get(category.id)!
  }));
}

/*
 * ─────────────────────────────────────────────────────────────
 * 검증 필요 (실기기에서 패키지명 확인 후 위 매핑표로 옮길 것)
 * 확신이 없어 일부러 제외한 목록. 틀린 패키지는 차단 실패로 이어지므로
 * `adb shell pm list packages` 또는 앱 목록 조회 API로 확인한 뒤 추가한다.
 * ─────────────────────────────────────────────────────────────
 * [숏폼/영상]
 *   치지직(네이버)            com.naver.chzzk (?)
 *   틱톡 중국판(더우인)        com.ss.android.ugc.aweme (?)
 *   유튜브 Go                 com.google.android.apps.youtube.mango (?) — 서비스 종료
 *   카카오TV                  com.kakao.tv (?)
 * [OTT/스트리밍]
 *   웨이브 구 패키지            kr.co.captv.pooqV2 (?) — 구 '푹' 시절 패키지 잔존 여부
 *   쿠팡플레이                 com.coupang.mobile.play (?)
 *   라프텔                    com.laftel.android (?)
 * [게임]
 *   블루 아카이브              com.nexon.bluearchive (?)
 *   붕괴: 스타레일             com.HoYoverse.hkrpgoversea (?)
 *   FIFA 모바일               com.ea.gp.fifamobile (?)
 *   서머너즈 워               com.com2us.smon.normal.freefull.google.kr.android.common (?)
 * [뉴스/커뮤니티]
 *   에펨코리아                com.fmkorea.app (?)
 *   네이트                    com.nate.android.portalmini (?)
 * [웹툰/웹소설]
 *   카카오웹툰                com.kakaoent.webtoon (?)
 *   밀리의 서재               kr.co.millie.millieofficial (?)
 * [쇼핑/배달]
 *   컬리                     com.kurly.mobile.app (?)
 *   번개장터                  com.quicket.bunjang (?)
 *   SSG닷컴                  com.ssg.serviceapp.android.egiftcertificate (?)
 * [음악/오디오]
 *   플로(FLO)                com.dreamus.flo (?)
 *   네이버 바이브             com.naver.vibe (?)
 * [소셜]
 *   BeReal                   com.bereal.ft (?)
 *   아자르                    com.azarlive.android (?)
 */
