import {
  AppCategory,
  AppCategoryId,
  AppCategoryMapping,
  MappingApplyResult,
  RemoteMappingSource
} from '../types';

/**
 * 앱 카테고리 매핑표 v2.
 *
 * ─── 왜 안드로이드 ApplicationInfo.category 를 쓰지 않는가 (2026-08-07 실측) ───
 * 갤럭시 A32 / 안드로이드 13 / LAUNCHER 쿼리로 잡힌 앱 45개를 덤프한 결과:
 *
 *   · 미분류(CATEGORY_UNDEFINED = -1)  26개 / 45개 = 57%
 *     → 넷플릭스, 케이툰(웹툰), 지니뮤직이 전부 여기 들어갔다.
 *   · 분류된 43%도 우리 기준과 어긋남
 *     → "소셜" 12개 안에 인스타그램·카카오톡·Chrome·당근이 같이 들어 있다.
 *
 * 원인은 명확하다. 안드로이드 카테고리는 8종(게임·오디오·동영상·이미지·소셜·뉴스·
 * 지도·생산성)뿐이라 숏폼·메신저·웹툰·쇼핑·브라우저를 구분할 칸 자체가 없다.
 * 이 값을 폴백으로 두면 "SNS 전부 잠금"에 카카오톡과 브라우저가 딸려 들어간다.
 *
 * → **폴백을 제거하고 2단계로 간다: 자체 매핑표 → 기타.**
 *   잘못 분류되는 것보다 "기타"로 남는 편이 안전하다. 기타여도 개별 선택은 가능하다.
 *   InstalledApp.systemCategory 값은 진단용으로 보관만 하고 분류에는 쓰지 않는다.
 *
 * 매핑표가 유일한 분류 근거가 되었으므로 커버리지가 곧 제품 품질이다.
 * 그래서 (1) 내장 기본값을 계속 늘리고, (2) 앱 심사 없이 원격으로 갱신할 수 있게
 * 병합 구조를 뒀다(applyRemoteMapping / syncMappingFrom 참고).
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
    // 실측에서 Chrome 이 안드로이드 기준 "소셜"로 잡혔다. 브라우저를 소셜에 섞으면
    // SNS 일괄 잠금에 검색까지 막히므로 반드시 별도 칸으로 분리한다.
    id: 'BROWSER',
    label: '브라우저',
    icon: 'Globe',
    priority: 10,
    description: '앱을 잠가도 웹으로 우회할 수 있는 경로입니다. 필요할 때만 함께 잠그세요.',
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

/** 매핑표에 없는 앱이 떨어지는 자리 */
export const FALLBACK_CATEGORY: AppCategory = APP_CATEGORIES[APP_CATEGORIES.length - 1];

const CATEGORY_BY_ID: Record<AppCategoryId, AppCategory> = APP_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<AppCategoryId, AppCategory>
);

/**
 * 내장 패키지명 → 카테고리 매핑표.
 *
 * ⚠️ 확신할 수 없는 패키지명은 넣지 않는다. 틀린 패키지명은 차단 실패로 이어지고
 *    사용자는 "잠갔는데 안 막힌다"고 느낀다. 불확실한 후보는 파일 하단
 *    "검증 필요" 주석에 모아뒀다. 실기기에서 확인한 뒤 이쪽으로 옮길 것.
 *    확인법: adb shell pm list packages | grep -i <키워드>
 */
export const BUILTIN_PACKAGE_CATEGORIES: Record<string, AppCategoryId> = {
  // ── 숏폼/영상 ────────────────────────────────────────────────
  'com.zhiliaoapp.musically': 'SHORTFORM', // 틱톡 (정식)
  'com.zhiliaoapp.musically.go': 'SHORTFORM', // 틱톡 라이트 (글로벌)
  'com.ss.android.ugc.trill': 'SHORTFORM', // 틱톡 (일부 지역 변종)
  'com.ss.android.ugc.tiktok.lite': 'SHORTFORM', // 틱톡 라이트 — A32 실기기 확인
  'com.ss.android.ugc.aweme': 'SHORTFORM', // 더우인 (중국판 틱톡)
  'com.google.android.youtube': 'SHORTFORM', // 유튜브 (쇼츠 포함)
  'com.google.android.apps.youtube.kids': 'SHORTFORM', // 유튜브 키즈
  'com.instagram.android': 'SHORTFORM', // 인스타그램 (릴스 포함)
  'com.instagram.lite': 'SHORTFORM', // 인스타그램 라이트
  'video.like': 'SHORTFORM', // 라이키
  'sg.bigo.live': 'SHORTFORM', // 비고 라이브
  'tv.twitch.android.app': 'SHORTFORM', // 트위치
  'kr.co.nowcom.mobile.afreeca': 'SHORTFORM', // SOOP (구 아프리카TV)
  'com.vimeo.android.videoapp': 'SHORTFORM', // 비메오
  'com.dailymotion.dailymotion': 'SHORTFORM', // 데일리모션

  // ── 소셜/메신저 ──────────────────────────────────────────────
  'com.kakao.talk': 'SOCIAL', // 카카오톡
  'com.kakao.story': 'SOCIAL', // 카카오스토리
  'com.nhn.android.band': 'SOCIAL', // 네이버 밴드
  'kr.co.vcnc.android.couple': 'SOCIAL', // 비트윈
  'com.facebook.katana': 'SOCIAL', // 페이스북
  'com.facebook.lite': 'SOCIAL', // 페이스북 라이트
  'com.facebook.orca': 'SOCIAL', // 페이스북 메신저
  'com.facebook.mlite': 'SOCIAL', // 메신저 라이트
  'com.instagram.barcelona': 'SOCIAL', // 스레드 (패키지명에 threads 가 없다)
  'com.twitter.android': 'SOCIAL', // X (트위터)
  'com.snapchat.android': 'SOCIAL', // 스냅챗
  'com.whatsapp': 'SOCIAL', // 왓츠앱
  'com.whatsapp.w4b': 'SOCIAL', // 왓츠앱 비즈니스
  'org.telegram.messenger': 'SOCIAL', // 텔레그램
  'org.telegram.messenger.web': 'SOCIAL', // 텔레그램 (웹 배포판)
  'org.thunderdog.challegram': 'SOCIAL', // 텔레그램 X
  'com.discord': 'SOCIAL', // 디스코드
  'jp.naver.line.android': 'SOCIAL', // 라인
  'com.tencent.mm': 'SOCIAL', // 위챗
  'com.sina.weibo': 'SOCIAL', // 웨이보
  'com.viber.voip': 'SOCIAL', // 바이버
  'com.skype.raider': 'SOCIAL', // 스카이프
  'com.linkedin.android': 'SOCIAL', // 링크드인
  'com.pinterest': 'SOCIAL', // 핀터레스트
  'com.tumblr': 'SOCIAL', // 텀블러
  'com.tinder': 'SOCIAL', // 틴더
  'com.bumble.app': 'SOCIAL', // 범블
  'com.grindrapp.android': 'SOCIAL', // 그라인더
  'com.Slack': 'SOCIAL', // 슬랙 (대문자 S 주의)
  'com.microsoft.teams': 'SOCIAL', // 팀즈

  // ── 게임 ────────────────────────────────────────────────────
  'com.ncsoft.lineagem19': 'GAME', // 리니지M
  'com.ncsoft.lineage2m': 'GAME', // 리니지2M
  'com.ncsoft.lineagew': 'GAME', // 리니지W
  'com.kakaogames.odin': 'GAME', // 오딘: 발할라 라이징
  'com.pearlabyss.blackdesertm': 'GAME', // 검은사막 모바일
  'com.devsisters.ck': 'GAME', // 쿠키런: 킹덤
  'com.devsisters.gb': 'GAME', // 쿠키런: 오븐브레이크
  'com.supercell.clashofclans': 'GAME', // 클래시 오브 클랜
  'com.supercell.clashroyale': 'GAME', // 클래시 로얄
  'com.supercell.brawlstars': 'GAME', // 브롤스타즈
  'com.supercell.hayday': 'GAME', // 헤이 데이
  'com.supercell.boombeach': 'GAME', // 붐비치
  'com.tencent.ig': 'GAME', // 배틀그라운드 모바일 (글로벌)
  'com.pubg.krmobile': 'GAME', // 배틀그라운드 모바일 (KR)
  'com.pubg.newstate': 'GAME', // 뉴스테이트 모바일
  'com.dts.freefireth': 'GAME', // 프리파이어
  'com.dts.freefiremax': 'GAME', // 프리파이어 MAX
  'com.mobile.legends': 'GAME', // 모바일 레전드
  'com.riotgames.league.wildrift': 'GAME', // 와일드 리프트
  'com.riotgames.league.teamfighttactics': 'GAME', // 전략적 팀 전투 (TFT)
  'com.riotgames.legendsofruneterra': 'GAME', // 레전드 오브 룬테라
  'com.blizzard.wtcg.hearthstone': 'GAME', // 하스스톤
  'com.blizzard.diablo.immortal': 'GAME', // 디아블로 이모탈
  'com.activision.callofduty.shooter': 'GAME', // 콜 오브 듀티: 모바일
  'com.activision.callofduty.warzone': 'GAME', // 워존 모바일
  'com.miHoYo.GenshinImpact': 'GAME', // 원신
  'com.miHoYo.bh3global': 'GAME', // 붕괴 3rd
  'com.roblox.client': 'GAME', // 로블록스
  'com.mojang.minecraftpe': 'GAME', // 마인크래프트
  'com.innersloth.spacemafia': 'GAME', // 어몽 어스
  'com.nianticlabs.pokemongo': 'GAME', // 포켓몬 GO
  'com.nianticproject.ingress': 'GAME', // 인그레스
  'com.chucklefish.stardewvalley': 'GAME', // 스타듀밸리
  'com.king.candycrushsaga': 'GAME', // 캔디크러시 사가
  'com.king.candycrushsodasaga': 'GAME', // 캔디크러시 소다
  'com.king.candycrushjellysaga': 'GAME', // 캔디크러시 젤리
  'com.king.farmheroessaga': 'GAME', // 팜히어로 사가
  'com.king.bubblewitch3': 'GAME', // 버블위치 3
  'com.playrix.homescapes': 'GAME', // 홈스케이프
  'com.playrix.gardenscapes': 'GAME', // 가든스케이프
  'com.playrix.township': 'GAME', // 타운십
  'com.playrix.fishdomdd.gplay': 'GAME', // 피쉬덤
  'net.peakgames.toonblast': 'GAME', // 툰블라스트
  'net.peakgames.toyblast': 'GAME', // 토이블라스트
  'com.dreamgames.royalmatch': 'GAME', // 로얄매치
  'com.moonactive.coinmaster': 'GAME', // 코인마스터
  'com.scopely.monopolygo': 'GAME', // 모노폴리 GO
  'com.habby.archero': 'GAME', // 아처로
  'com.igg.android.lordsmobile': 'GAME', // 로드모바일
  'com.miniclip.eightballpool': 'GAME', // 8 볼 풀
  'com.kiloo.subwaysurf': 'GAME', // 서브웨이 서퍼즈
  'com.imangi.templerun2': 'GAME', // 템플런 2
  'com.halfbrick.fruitninjafree': 'GAME', // 후르츠 닌자
  'com.fingersoft.hillclimb': 'GAME', // 힐클라임 레이싱
  'com.rovio.baba': 'GAME', // 앵그리버드 2
  'com.rovio.angrybirds': 'GAME', // 앵그리버드 클래식
  'com.ea.games.r3_row': 'GAME', // 리얼 레이싱 3
  'com.ea.game.pvz2_row': 'GAME', // 식물 vs 좀비 2
  'com.ea.gp.fifamobile': 'GAME', // FIFA 모바일

  // ── OTT/스트리밍 ────────────────────────────────────────────
  'com.netflix.mediaclient': 'STREAMING', // 넷플릭스
  'net.cj.cjhv.gs.tving': 'STREAMING', // 티빙
  'com.pooq.androidapp': 'STREAMING', // 웨이브
  'com.frograms.wplay': 'STREAMING', // 왓챠
  'com.disney.disneyplus': 'STREAMING', // 디즈니+
  'com.amazon.avod.thirdpartyclient': 'STREAMING', // 프라임 비디오
  'com.google.android.videos': 'STREAMING', // 구글 TV (구 플레이 무비)
  'com.crunchyroll.crunchyroid': 'STREAMING', // 크런치롤
  'com.viki.android': 'STREAMING', // 비키

  // ── 뉴스/커뮤니티 ───────────────────────────────────────────
  'com.nhn.android.search': 'COMMUNITY', // 네이버
  'com.nhn.android.navercafe': 'COMMUNITY', // 네이버 카페
  'com.nhn.android.blog': 'COMMUNITY', // 네이버 블로그
  'net.daum.android.daum': 'COMMUNITY', // 다음
  'net.daum.android.cafe': 'COMMUNITY', // 다음 카페
  'com.dcinside.app': 'COMMUNITY', // 디시인사이드
  'com.everytime.v2': 'COMMUNITY', // 에브리타임
  'com.teamblind.blind': 'COMMUNITY', // 블라인드
  'com.reddit.frontpage': 'COMMUNITY', // 레딧
  'com.quora.android': 'COMMUNITY', // 쿼라
  'com.medium.reader': 'COMMUNITY', // 미디엄
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
  'kr.co.company.hwahae': 'SHOPPING', // 화해
  'com.starbucks.co': 'SHOPPING', // 스타벅스
  'com.nike.omega': 'SHOPPING', // 나이키
  'com.alibaba.aliexpresshd': 'SHOPPING', // 알리익스프레스
  'com.einnovation.temu': 'SHOPPING', // 테무
  'com.zzkko': 'SHOPPING', // 쉬인
  'com.amazon.mShop.android.shopping': 'SHOPPING', // 아마존
  'com.ebay.mobile': 'SHOPPING', // 이베이
  'com.etsy.android': 'SHOPPING', // 엣시
  'com.contextlogic.wish': 'SHOPPING', // 위시

  // ── 음악/오디오 ─────────────────────────────────────────────
  'com.iloen.melon': 'MUSIC', // 멜론
  'com.ktmusic.geniemusic': 'MUSIC', // 지니뮤직
  'com.neowiz.android.bugs': 'MUSIC', // 벅스
  'com.spotify.music': 'MUSIC', // 스포티파이
  'com.spotify.lite': 'MUSIC', // 스포티파이 라이트
  'com.google.android.apps.youtube.music': 'MUSIC', // 유튜브 뮤직
  'com.apple.android.music': 'MUSIC', // 애플 뮤직
  'com.amazon.mp3': 'MUSIC', // 아마존 뮤직
  'deezer.android.app': 'MUSIC', // 디저
  'com.soundcloud.android': 'MUSIC', // 사운드클라우드
  'com.shazam.android': 'MUSIC', // 샤잠
  'com.smule.singandroid': 'MUSIC', // 스뮬
  'tunein.player': 'MUSIC', // 튠인 라디오
  'com.audible.application': 'MUSIC', // 오디블

  // ── 금융/페이 ───────────────────────────────────────────────
  'viva.republica': 'FINANCE', // 토스
  'com.kakaopay.app': 'FINANCE', // 카카오페이
  'com.kakaobank.channel': 'FINANCE', // 카카오뱅크
  'com.nhnent.payapp': 'FINANCE', // 페이코
  'com.rainist.banksalad2': 'FINANCE', // 뱅크샐러드
  'com.samsung.android.spay': 'FINANCE', // 삼성월렛 (구 삼성페이)
  'com.kbstar.kbbank': 'FINANCE', // KB스타뱅킹
  'com.dunamu.exchange': 'FINANCE', // 업비트
  'com.btckorea.bithumb': 'FINANCE', // 빗썸
  'com.binance.dev': 'FINANCE', // 바이낸스

  // ── 브라우저 ────────────────────────────────────────────────
  'com.android.chrome': 'BROWSER', // 크롬 (실측에서 안드로이드가 "소셜"로 분류했던 앱)
  'com.chrome.beta': 'BROWSER', // 크롬 베타
  'com.chrome.dev': 'BROWSER', // 크롬 데브
  'com.chrome.canary': 'BROWSER', // 크롬 카나리
  'com.android.browser': 'BROWSER', // AOSP 기본 브라우저
  'com.sec.android.app.sbrowser': 'BROWSER', // 삼성 인터넷
  'com.sec.android.app.sbrowser.beta': 'BROWSER', // 삼성 인터넷 베타
  'com.naver.whale': 'BROWSER', // 네이버 웨일
  'org.mozilla.firefox': 'BROWSER', // 파이어폭스
  'org.mozilla.firefox_beta': 'BROWSER', // 파이어폭스 베타
  'org.mozilla.focus': 'BROWSER', // 파이어폭스 포커스
  'com.microsoft.emmx': 'BROWSER', // 엣지
  'com.opera.browser': 'BROWSER', // 오페라
  'com.opera.mini.native': 'BROWSER', // 오페라 미니
  'com.opera.gx': 'BROWSER', // 오페라 GX
  'com.brave.browser': 'BROWSER', // 브레이브
  'com.duckduckgo.mobile.android': 'BROWSER', // 덕덕고
  'com.kiwibrowser.browser': 'BROWSER', // 키위 브라우저
  'com.UCMobile.intl': 'BROWSER' // UC 브라우저
};

/** 앱에 내장된 기본 매핑표. 원격 갱신이 없거나 실패하면 항상 이 값으로 동작한다 */
export const BUILTIN_MAPPING: AppCategoryMapping = {
  version: 2,
  updatedAt: '2026-08-07',
  packages: BUILTIN_PACKAGE_CATEGORIES
};

const VALID_CATEGORY_IDS = new Set<string>(APP_CATEGORIES.map((category) => category.id));

// ─────────────────────────────────────────────────────────────
// 원격 갱신 (fetch 는 여기서 하지 않는다. 서버가 생기면 RemoteMappingSource 만 구현)
// ─────────────────────────────────────────────────────────────

/** 현재 사용 중인 매핑표. 내장본에서 시작해 원격본이 들어오면 병합된다 */
let activeMapping: AppCategoryMapping = BUILTIN_MAPPING;

/** 대소문자 차이(com.miHoYo.*, com.Slack 등)를 흡수하기 위한 소문자 키 인덱스 */
let lowercaseIndex: Record<string, AppCategoryId> = buildLowercaseIndex(BUILTIN_MAPPING.packages);

function buildLowercaseIndex(packages: Record<string, AppCategoryId>): Record<string, AppCategoryId> {
  return Object.keys(packages).reduce((acc, packageName) => {
    acc[packageName.toLowerCase()] = packages[packageName];
    return acc;
  }, {} as Record<string, AppCategoryId>);
}

/** 지금 사용 중인 매핑표(내장 또는 병합본) */
export function getActiveMapping(): AppCategoryMapping {
  return activeMapping;
}

/** 원격본을 버리고 내장 기본값으로 되돌린다 */
export function resetMappingToBuiltin(): void {
  activeMapping = BUILTIN_MAPPING;
  lowercaseIndex = buildLowercaseIndex(BUILTIN_MAPPING.packages);
}

/**
 * 내장본 + 원격본 병합.
 * 같은 패키지가 양쪽에 있으면 원격본이 이긴다(오분류 긴급 수정 경로).
 * 원격본에만 있는 패키지는 그대로 추가된다.
 */
export function mergeMapping(
  base: AppCategoryMapping,
  remote: AppCategoryMapping
): AppCategoryMapping {
  return {
    version: remote.version,
    updatedAt: remote.updatedAt,
    packages: { ...base.packages, ...remote.packages }
  };
}

/**
 * 원격에서 받은 값(파싱 전 JSON 또는 localStorage 캐시)을 검증해 반영한다.
 * 형식이 깨졌거나 버전이 낮으면 아무것도 바꾸지 않고 내장 기본값을 유지한다.
 */
export function applyRemoteMapping(raw: unknown): MappingApplyResult {
  try {
    const remote = normalizeRemoteMapping(raw);
    if (!remote) {
      return { ...describeActive(), applied: false, reason: 'invalid-format' };
    }
    if (remote.version <= activeMapping.version) {
      return { ...describeActive(), applied: false, reason: 'stale-version' };
    }
    if (Object.keys(remote.packages).length === 0) {
      return { ...describeActive(), applied: false, reason: 'empty-packages' };
    }

    // 병합 기준은 항상 내장본이다. 원격본을 여러 번 받아도 결과가 같아야 한다.
    activeMapping = mergeMapping(BUILTIN_MAPPING, remote);
    lowercaseIndex = buildLowercaseIndex(activeMapping.packages);
    return { ...describeActive(), applied: true };
  } catch {
    // 어떤 이유로든 실패하면 내장 기본값으로 계속 동작한다
    return { ...describeActive(), applied: false, reason: 'exception' };
  }
}

/**
 * 원격 공급자에서 매핑표를 받아 반영한다.
 * 네트워크 구현은 호출부(RemoteMappingSource)가 담당하고, 여기서는 실패를 흡수만 한다.
 */
export async function syncMappingFrom(source: RemoteMappingSource): Promise<MappingApplyResult> {
  try {
    const remote = await source.fetchMapping(activeMapping.version);
    if (!remote) {
      return { ...describeActive(), applied: false, reason: 'no-update' };
    }
    return applyRemoteMapping(remote);
  } catch {
    return { ...describeActive(), applied: false, reason: 'fetch-failed' };
  }
}

function describeActive(): MappingApplyResult {
  return {
    applied: false,
    version: activeMapping.version,
    packageCount: Object.keys(activeMapping.packages).length
  };
}

/** 알 수 없는 카테고리 id·비문자열 키를 걸러낸 안전한 매핑표를 만든다 */
function normalizeRemoteMapping(raw: unknown): AppCategoryMapping | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Partial<AppCategoryMapping>;
  if (typeof candidate.version !== 'number' || !Number.isFinite(candidate.version)) return null;
  if (!candidate.packages || typeof candidate.packages !== 'object') return null;

  const packages: Record<string, AppCategoryId> = {};
  Object.entries(candidate.packages as Record<string, unknown>).forEach(([key, value]) => {
    if (!key || typeof value !== 'string') return;
    if (!VALID_CATEGORY_IDS.has(value)) return; // 우리가 모르는 카테고리는 무시
    packages[key] = value as AppCategoryId;
  });

  return {
    version: candidate.version,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : '',
    packages
  };
}

// ─────────────────────────────────────────────────────────────
// 조회
// ─────────────────────────────────────────────────────────────

/** id로 카테고리 정의를 찾는다. 없으면 기타 */
export function getCategoryById(id: AppCategoryId): AppCategory {
  return CATEGORY_BY_ID[id] ?? FALLBACK_CATEGORY;
}

/**
 * 패키지명으로 카테고리를 판정한다. 2단계:
 *   1) 매핑표(내장 + 원격 병합본) — 정확 일치 → 소문자 일치
 *   2) 기타
 *
 * 안드로이드 ApplicationInfo.category 는 의도적으로 쓰지 않는다(파일 상단 실측 근거).
 */
export function getCategoryForPackage(packageName: string): AppCategory {
  if (!packageName) return FALLBACK_CATEGORY;

  const mapped =
    activeMapping.packages[packageName] ?? lowercaseIndex[packageName.toLowerCase()];

  return mapped ? getCategoryById(mapped) : FALLBACK_CATEGORY;
}

/** 매핑표에 등록된 앱인지 확인한다 (커버리지 진단·"기타" 안내용) */
export function isMappedPackage(packageName: string): boolean {
  if (!packageName) return false;
  return Boolean(
    activeMapping.packages[packageName] ?? lowercaseIndex[packageName.toLowerCase()]
  );
}

/**
 * 설치 앱 목록을 카테고리별로 묶는다.
 * 반환 배열은 시간 소모 우선순위(priority) 순이며, 빈 카테고리는 제외한다.
 */
export function groupPackagesByCategory(
  packageNames: string[]
): Array<{ category: AppCategory; packageNames: string[] }> {
  const buckets = new Map<AppCategoryId, string[]>();

  packageNames.forEach((packageName) => {
    const category = getCategoryForPackage(packageName);
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
 * 검증 필요 — 실기기에서 패키지명 확인 후 위 매핑표로 옮길 것
 *
 * 매핑표가 유일한 분류 근거가 된 이상 커버리지를 계속 늘려야 하지만,
 * 틀린 패키지명은 차단 실패로 이어지므로 확인 전에는 넣지 않는다.
 * 확인법: adb shell pm list packages | grep -i <키워드>
 *        (또는 스파이크용 AppListHelper 로그로 실기기 목록 덤프)
 * ─────────────────────────────────────────────────────────────
 * [숏폼/영상]
 *   치지직(네이버)          com.naver.chzzk / com.navercorp.chzzk (?)
 *   카카오TV                com.kakao.tv (?)
 *   유튜브 Go               com.google.android.apps.youtube.mango (?) — 서비스 종료
 *   네이버 나우             com.naver.now (?)
 * [OTT/스트리밍]
 *   쿠팡플레이               com.coupang.mobile.play (?)
 *   웨이브 구 패키지          kr.co.captv.pooqV2 (?) — 구 '푹' 시절 잔존 여부
 *   라프텔                  com.laftel.android (?)
 *   왓챠피디아               com.frograms.watchapedia (?)
 *   애플 TV (모바일)         com.apple.atve.android.appletv (?)
 *   네이버 시리즈온           com.naver.serieson (?)
 *   KBS·MBC·SBS 방송사 앱    (전부 미확인)
 * [게임]
 *   블루 아카이브            com.nexon.bluearchive (?)
 *   메이플스토리M            com.nexon.maplem (?)
 *   카트라이더 러쉬플러스      com.nexon.kart (?)
 *   붕괴: 스타레일           com.HoYoverse.hkrpgoversea (?)
 *   우마무스메 (KR)          com.kakaogames.umamusume (?)
 *   검은사막 모바일 글로벌     com.pearlabyss.blackdesertm.gl (?)
 *   미르4                   com.wemade.mir4global (?)
 *   나이트크로우              com.wemade.nightcrow (?)
 *   마블 퓨처파이트           com.netmarble.mherosgb (?)
 *   리니지2 레볼루션          com.netmarble.revolution (?)
 *   서머너즈 워              com.com2us.smon.normal.freefull.google.kr.android.common (?)
 *   애니팡 시리즈            com.wemade.anipang4 (?)
 *   피망/한게임 포커         com.neowiz.games.poker (?)
 *   명일방주                com.YoStarEN.Arknights (?)
 *   라이즈 오브 킹덤즈        com.lilithgames.* (?)
 *   Whiteout Survival     com.gof.global (?)
 * [뉴스/커뮤니티]
 *   에펨코리아               com.fmkorea.app (?)
 *   뽐뿌                    com.ppomppu.android (?)
 *   클리앙                   com.clien.android (?)
 *   루리웹                   com.ruliweb.android (?)
 *   인벤                    com.inven.app (?)
 *   네이트/네이트판           com.nate.android.portalmini (?)
 *   네이버 지식iN            com.nhn.android.kin (?)
 *   네이버 포스트             com.nhn.android.post (?)
 *   브런치                   com.kakao.brunch (?)
 *   티스토리                 com.tistory.android (?)
 *   연합뉴스·조선·중앙·동아    (전부 미확인)
 * [웹툰/웹소설]
 *   카카오웹툰               com.kakaoent.webtoon (?)
 *   케이툰                   com.ktoon.app (?) — A32 실측 목록에 있었음
 *   탑툰                    com.toptoon.android (?)
 *   봄툰                    com.bomtoon.app (?)
 *   투믹스                   com.toomics.global.google (?)
 *   타파스                   com.tapastic (?)
 *   밀리의 서재              kr.co.millie.millieofficial (?)
 *   교보ebook·예스24북클럽    (전부 미확인)
 * [쇼핑/배달]
 *   컬리                    com.kurly.mobile.app (?)
 *   에이블리                 com.ablycorp.app (?)
 *   29CM                   com.the29cm.app29cm (?)
 *   올리브영                 com.oliveyoung (?)
 *   SSG닷컴                 com.ssg.serviceapp.android.egiftcertificate (?)
 *   롯데온                   com.lotte.on (?)
 *   GS SHOP                com.gsshop.mobile (?)
 *   CJ온스타일               com.cjoshppingphone (?)
 *   홈플러스                 com.homeplus.mobile (?)
 *   번개장터                 com.quicket.bunjang (?)
 *   중고나라                 com.jn.joonggonara (?)
 *   인터파크·야놀자·여기어때    (전부 미확인)
 * [음악/오디오]
 *   플로(FLO)               com.dreamus.flo (?)
 *   네이버 바이브             com.naver.vibe (?)
 *   팟빵                    com.podbbang.android (?)
 *   윌라                    com.wellaudio.willa (?)
 * [금융/페이]
 *   네이버페이               com.naverfin.payapp (?)
 *   신한 SOL / 신한플레이      com.shinhan.sbanking / com.shcard.smartpay (?)
 *   우리WON뱅킹             com.wooribank.smart.npib (?)
 *   하나원큐                 com.hanabank.ebk.channel.android.hananbank (?)
 *   NH스마트뱅킹             nh.smart.banking (?)
 *   코인원                   com.coinone.app (?)
 *   ※ 은행 앱은 생활 필수라 매핑에 넣더라도 defaultLocked 는 false 를 유지할 것
 * [소셜]
 *   BeReal                 com.bereal.ft (?)
 *   아자르                   com.azarlive.android (?)
 *   글램·위피 등 국내 소개팅앱  (전부 미확인)
 * [브라우저]
 *   Via / Yandex / Vivaldi  (전부 미확인)
 *
 * ※ 전화·문자·연락처·설정·알람은 의도적으로 매핑하지 않는다.
 *   차단 후보에서 하드 제외되는 안전 목록이라 카테고리를 붙일 이유가 없다.
 */
