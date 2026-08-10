import { AppCategoryId, TargetService, ShortVideo } from '../types';
import { APP_CATEGORIES } from './appCategories';

/**
 * 웹 브라우저용 **대체 앱 목록**.
 *
 * ■ 이 목록이 왜 있는가
 *   앱 선택 목록은 원래 안드로이드에서 기기에 실제 설치된 앱을 읽어 만든다
 *   (`lib/appCatalog.ts` 의 loadAppCatalog). 하지만 브라우저에는 네이티브 브릿지가
 *   없어 그 호출이 실패한다. 그때 catch 절이 이 배열로 대체한다.
 *   즉 **개발·데모 중 브라우저에서 보는 목록이 전부 여기서 나온다.**
 *   여기가 비거나 잘못되면 앱을 못 고르고, 잠금·세션이 필요한 기능을 전부 확인할 수 없다.
 *
 * ■ ⚠️ category 는 APP_CATEGORIES 의 label 과 **반드시 글자까지 같아야 한다**
 *   AppSelector 는 목록을 카테고리별로 묶어서 그린다:
 *     APP_CATEGORIES.map(c => catalog.filter(s => s.category === c.label))
 *   문자열 일치로 묶기 때문에 label 에 없는 값을 쓰면 그 항목은 **어느 그룹에도 안 잡히고
 *   화면에서 조용히 사라진다. 에러도 경고도 안 난다.**
 *   실제로 예전 값('소셜 릴스', '동영상 숏츠', '숏폼 트렌드', '실시간 피드')이
 *   label 과 하나도 안 맞아 목록 전체가 빈 화면이 된 적이 있다.
 *   → 그래서 아래 LABEL 을 통해서만 카테고리를 쓴다. 문자열을 직접 적지 마라.
 *
 * ■ id 는 실제 패키지명을 쓴다
 *   안드로이드에서 오는 목록은 패키지명을 id 로 쓴다(네이티브 차단 엔진이 그대로 쓴다).
 *   형식을 맞춰야 웹에서 만든 선택 결과가 실기기와 같은 모양이 된다.
 *   예외는 아래 4개(instagram/youtube/tiktok/x-twitter)뿐이다 — SIMULATED_SHORTS 의
 *   serviceId 가 이 id 들을 참조하고 있어 그대로 둔다. 새 항목은 반드시 패키지명으로.
 *
 * ■ 카테고리 분류 기준
 *   appCategories.ts 의 BUILTIN_PACKAGE_CATEGORIES 와 동일하게 맞췄다.
 *   같은 앱이 웹에서는 '소셜', 실기기에서는 '숏폼'으로 보이면 안 되기 때문이다.
 */

/** APP_CATEGORIES 의 label 을 id 로 안전하게 꺼내 쓰기 위한 표 (오타 시 컴파일 에러) */
const LABEL: Record<AppCategoryId, string> = APP_CATEGORIES.reduce((acc, category) => {
  acc[category.id] = category.label;
  return acc;
}, {} as Record<AppCategoryId, string>);

export const TARGET_SERVICES: TargetService[] = [
  // ── 숏폼/영상 ────────────────────────────────────────────────
  {
    // ⚠️ id 유지: SIMULATED_SHORTS 의 serviceId 가 참조한다
    id: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    color: 'from-purple-600 via-pink-500 to-amber-500',
    url: 'https://www.instagram.com',
    category: LABEL.SHORTFORM
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'Youtube',
    color: 'from-red-600 to-red-700',
    url: 'https://www.youtube.com',
    category: LABEL.SHORTFORM
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'Video',
    color: 'from-cyan-500 to-black',
    url: 'https://www.tiktok.com',
    category: LABEL.SHORTFORM
  },
  {
    id: 'tv.twitch.android.app',
    name: '트위치',
    icon: 'Flame',
    color: 'from-violet-500 to-purple-700',
    url: 'https://www.twitch.tv',
    category: LABEL.SHORTFORM
  },
  {
    id: 'kr.co.nowcom.mobile.afreeca',
    name: 'SOOP (아프리카TV)',
    icon: 'Flame',
    color: 'from-blue-500 to-indigo-600',
    url: 'https://www.sooplive.co.kr',
    category: LABEL.SHORTFORM
  },

  // ── 소셜/메신저 ──────────────────────────────────────────────
  {
    // ⚠️ id 유지: SIMULATED_SHORTS 의 serviceId 가 참조한다
    id: 'x-twitter',
    name: 'X (Twitter)',
    icon: 'Twitter',
    color: 'from-gray-800 to-black',
    url: 'https://x.com',
    category: LABEL.SOCIAL
  },
  {
    id: 'com.kakao.talk',
    name: '카카오톡',
    icon: 'MessageCircle',
    color: 'from-yellow-400 to-amber-500',
    url: 'https://www.kakaocorp.com',
    category: LABEL.SOCIAL
  },
  {
    id: 'com.nhn.android.band',
    name: '네이버 밴드',
    icon: 'MessageCircle',
    color: 'from-green-500 to-emerald-600',
    url: 'https://band.us',
    category: LABEL.SOCIAL
  },
  {
    id: 'com.facebook.katana',
    name: '페이스북',
    icon: 'MessageCircle',
    color: 'from-blue-600 to-blue-800',
    url: 'https://www.facebook.com',
    category: LABEL.SOCIAL
  },
  {
    id: 'com.discord',
    name: '디스코드',
    icon: 'MessageCircle',
    color: 'from-indigo-500 to-violet-600',
    url: 'https://discord.com',
    category: LABEL.SOCIAL
  },

  // ── 게임 ────────────────────────────────────────────────────
  {
    id: 'com.roblox.client',
    name: '로블록스',
    icon: 'Gamepad2',
    color: 'from-slate-600 to-slate-800',
    url: 'https://www.roblox.com',
    category: LABEL.GAME
  },
  {
    id: 'com.supercell.brawlstars',
    name: '브롤스타즈',
    icon: 'Gamepad2',
    color: 'from-amber-500 to-orange-700',
    url: '',
    category: LABEL.GAME
  },
  {
    id: 'com.pubg.krmobile',
    name: '배틀그라운드 모바일',
    icon: 'Gamepad2',
    color: 'from-orange-500 to-yellow-600',
    url: '',
    category: LABEL.GAME
  },

  // ── OTT/스트리밍 ────────────────────────────────────────────
  {
    id: 'com.netflix.mediaclient',
    name: '넷플릭스',
    icon: 'MonitorPlay',
    color: 'from-red-600 to-black',
    url: 'https://www.netflix.com',
    category: LABEL.STREAMING
  },
  {
    id: 'net.cj.cjhv.gs.tving',
    name: '티빙',
    icon: 'MonitorPlay',
    color: 'from-rose-500 to-red-600',
    url: 'https://www.tving.com',
    category: LABEL.STREAMING
  },
  {
    id: 'com.disney.disneyplus',
    name: '디즈니+',
    icon: 'MonitorPlay',
    color: 'from-blue-700 to-indigo-900',
    url: 'https://www.disneyplus.com',
    category: LABEL.STREAMING
  },

  // ── 뉴스/커뮤니티 ───────────────────────────────────────────
  {
    id: 'com.nhn.android.search',
    name: '네이버',
    icon: 'Newspaper',
    color: 'from-green-500 to-green-700',
    url: 'https://www.naver.com',
    category: LABEL.COMMUNITY
  },
  {
    id: 'com.nhn.android.navercafe',
    name: '네이버 카페',
    icon: 'Newspaper',
    color: 'from-lime-500 to-green-600',
    url: 'https://cafe.naver.com',
    category: LABEL.COMMUNITY
  },
  {
    id: 'com.dcinside.app',
    name: '디시인사이드',
    icon: 'Newspaper',
    color: 'from-sky-600 to-blue-700',
    url: 'https://www.dcinside.com',
    category: LABEL.COMMUNITY
  },

  // ── 웹툰/웹소설 ─────────────────────────────────────────────
  {
    id: 'com.nhn.android.webtoon',
    name: '네이버 웹툰',
    icon: 'BookOpen',
    color: 'from-emerald-400 to-teal-600',
    url: 'https://comic.naver.com',
    category: LABEL.WEBTOON
  },
  {
    id: 'com.kakao.page',
    name: '카카오페이지',
    icon: 'BookOpen',
    color: 'from-yellow-500 to-amber-600',
    url: 'https://page.kakao.com',
    category: LABEL.WEBTOON
  },

  // ── 쇼핑/배달 ───────────────────────────────────────────────
  {
    id: 'com.coupang.mobile',
    name: '쿠팡',
    icon: 'ShoppingBag',
    color: 'from-red-500 to-rose-600',
    url: 'https://www.coupang.com',
    category: LABEL.SHOPPING
  },
  {
    // 배달의민족 패키지명은 실제로 com.sampleapp 이다 (오타 아님)
    id: 'com.sampleapp',
    name: '배달의민족',
    icon: 'ShoppingBag',
    color: 'from-teal-400 to-cyan-600',
    url: 'https://www.baemin.com',
    category: LABEL.SHOPPING
  },
  {
    id: 'com.towneers.www',
    name: '당근',
    icon: 'ShoppingBag',
    color: 'from-orange-400 to-amber-600',
    url: 'https://www.daangn.com',
    category: LABEL.SHOPPING
  },

  // ── 음악/오디오 ─────────────────────────────────────────────
  {
    id: 'com.iloen.melon',
    name: '멜론',
    icon: 'Music',
    color: 'from-green-400 to-emerald-600',
    url: 'https://www.melon.com',
    category: LABEL.MUSIC
  },
  {
    id: 'com.spotify.music',
    name: '스포티파이',
    icon: 'Music',
    color: 'from-green-500 to-green-800',
    url: 'https://open.spotify.com',
    category: LABEL.MUSIC
  },
  {
    id: 'com.google.android.apps.youtube.music',
    name: '유튜브 뮤직',
    icon: 'Music',
    color: 'from-red-500 to-rose-700',
    url: 'https://music.youtube.com',
    category: LABEL.MUSIC
  },

  // ── 금융/페이 ───────────────────────────────────────────────
  {
    id: 'viva.republica',
    name: '토스',
    icon: 'Wallet',
    color: 'from-blue-500 to-indigo-700',
    url: 'https://toss.im',
    category: LABEL.FINANCE
  },
  {
    id: 'com.kakaopay.app',
    name: '카카오페이',
    icon: 'Wallet',
    color: 'from-amber-400 to-yellow-600',
    url: 'https://www.kakaopay.com',
    category: LABEL.FINANCE
  },

  // ── 브라우저 ────────────────────────────────────────────────
  {
    id: 'com.android.chrome',
    name: '크롬',
    icon: 'Globe',
    color: 'from-sky-400 to-blue-600',
    url: 'https://www.google.com',
    category: LABEL.BROWSER
  },
  {
    id: 'com.sec.android.app.sbrowser',
    name: '삼성 인터넷',
    icon: 'Globe',
    color: 'from-indigo-400 to-blue-700',
    url: '',
    category: LABEL.BROWSER
  },
  {
    id: 'com.naver.whale',
    name: '네이버 웨일',
    icon: 'Globe',
    color: 'from-cyan-400 to-sky-600',
    url: 'https://whale.naver.com',
    category: LABEL.BROWSER
  },

  // ── 기타 ────────────────────────────────────────────────────
  // 매핑표에 없는 앱이 '기타'로 떨어지는 모습을 웹에서도 확인하기 위한 표본이다.
  // (실기기에서도 매핑표에 없는 앱은 여기로 온다 — appCategories 의 FALLBACK_CATEGORY)
  //
  // 아래 둘이 매핑표에 없는 것은 누락이 아니라 방침이다(2026-08-10 매핑 담당 확인).
  // 지도·업무·사진 같은 도구 앱을 매핑하면 리포트의 'SNS 시간'에 딸려 들어가므로
  // 의도적으로 ETC 에 남겨둔다 — appCategories.ts 하단 "의도적으로 매핑하지 않은 것" 참고.
  // 즉 이 표본은 앞으로도 '기타'로 유지된다.
  {
    id: 'com.nhn.android.nmap',
    name: '네이버 지도',
    icon: 'LayoutGrid',
    color: 'from-green-400 to-teal-600',
    url: 'https://map.naver.com',
    category: LABEL.ETC
  },
  {
    id: 'com.google.android.gm',
    name: 'Gmail',
    icon: 'LayoutGrid',
    color: 'from-red-400 to-rose-600',
    url: 'https://mail.google.com',
    category: LABEL.ETC
  }
];

export const SIMULATED_SHORTS: ShortVideo[] = [
  {
    id: 'short-1',
    serviceId: 'instagram',
    creator: '하루의댄스',
    handle: '@haru_dance',
    avatar: '💃',
    verified: true,
    caption: '퇴근길에 갑자기 몸이 움직였어요 🌇 이 노래 중독성 진짜 심함\n#골든아워 #댄스챌린지 #퇴근길 #오늘의무드',
    musicTitle: 'Golden Hour Move — Nuvo Beats',
    likes: '12.4만',
    comments: '1,420',
    shares: '3,208',
    saves: '9,512',
    thumbnail: '/feed/clip_dance.png',
    duration: '0:28',
    progress: 42
  },
  {
    id: 'short-1b',
    serviceId: 'instagram',
    creator: '오늘의룩북',
    handle: '@today_lookbook',
    avatar: '🧥',
    verified: true,
    caption: '가을 첫 출근룩 🍂 블레이저 하나로 분위기 끝\n#ootd #출근룩 #가을코디 #룩북',
    musicTitle: 'soft indie pop — cozy fits',
    likes: '4.6만',
    comments: '812',
    shares: '1,504',
    saves: '3.1만',
    thumbnail: '/feed/clip_ootd.png',
    duration: '0:22',
    progress: 35
  },
  {
    id: 'short-1c',
    serviceId: 'instagram',
    creator: '작은카페일기',
    handle: '@small_cafe_log',
    avatar: '☕',
    verified: false,
    caption: '오늘 라떼아트 성공한 날 ☕ 손목 각도가 전부였어요\n#라떼아트 #카페브이로그 #커피스타그램',
    musicTitle: 'slow morning jazz — cafe loop',
    likes: '3.2만',
    comments: '604',
    shares: '972',
    saves: '1.8만',
    thumbnail: '/feed/clip_latte.png',
    duration: '0:19',
    progress: 58
  },
  {
    id: 'short-2',
    serviceId: 'youtube',
    creator: '자취요리연구소',
    handle: '@jachi_kitchen',
    avatar: '🍜',
    verified: false,
    caption: '자취생 3분 매운 볶음면 🔥 이거 한 번 하면 배달 앱 지웁니다\n#자취요리 #3분레시피 #야식 #먹스타그램',
    musicTitle: '원본 오디오 — 자취요리연구소',
    likes: '8.9만',
    comments: '2,104',
    shares: '1,876',
    saves: '4.2만',
    thumbnail: '/feed/clip_food.png',
    duration: '0:45',
    progress: 67
  },
  {
    id: 'short-2b',
    serviceId: 'youtube',
    creator: '3분리뷰',
    handle: '@3min_review',
    avatar: '📦',
    verified: true,
    caption: '10만원대 무선이어폰 언박싱 🎧 결론부터 말하면 살 만합니다\n#언박싱 #가성비 #리뷰 #테크',
    musicTitle: '원본 오디오 — 3분리뷰',
    likes: '15.3만',
    comments: '4,220',
    shares: '6,140',
    saves: '7.7만',
    thumbnail: '/feed/clip_unboxing.png',
    duration: '0:52',
    progress: 29
  },
  {
    id: 'short-2c',
    serviceId: 'youtube',
    creator: '헬스기록장',
    handle: '@lift_log_kr',
    avatar: '🏋️',
    verified: false,
    caption: '데드리프트 180kg 성공 💥 3개월 만에 20kg 올린 방법\n#데드리프트 #헬스 #운동기록 #벌크업',
    musicTitle: '원본 오디오 — 헬스기록장',
    likes: '21.7만',
    comments: '3,508',
    shares: '9,412',
    saves: '11.2만',
    thumbnail: '/feed/clip_gym.png',
    duration: '0:38',
    progress: 74
  },
  {
    id: 'short-3',
    serviceId: 'tiktok',
    creator: '치즈냥일기',
    handle: '@cheese_cat_log',
    avatar: '🐱',
    verified: true,
    caption: '소파에서 착지 실패한 치즈냥.. 마지막 표정 보세요 😹\n#고양이 #치즈냥 #반려묘 #웃긴영상',
    musicTitle: 'funny cat theme — trending audio',
    likes: '25.1만',
    comments: '3,912',
    shares: '1.1만',
    saves: '5.8만',
    thumbnail: '/feed/clip_cat.png',
    duration: '0:16',
    progress: 81
  },
  {
    id: 'short-3b',
    serviceId: 'tiktok',
    creator: '뭉치의하루',
    handle: '@mungchi_day',
    avatar: '🐶',
    verified: false,
    caption: '스웨터 입혀줬더니 세상 억울한 표정 짓는 뭉치 🧶\n#강아지 #말티푸 #반려견 #귀여움주의',
    musicTitle: 'cute puppy sound — viral audio',
    likes: '38.4만',
    comments: '6,701',
    shares: '2.4만',
    saves: '9.3만',
    thumbnail: '/feed/clip_puppy.png',
    duration: '0:14',
    progress: 47
  },
  {
    id: 'short-3c',
    serviceId: 'tiktok',
    creator: '야시장먹방',
    handle: '@nightmarket_eats',
    avatar: '🔥',
    verified: true,
    caption: '불 쇼 하는 꼬치 아저씨 🔥 소리 켜고 보세요 (ASMR)\n#야시장 #먹방 #길거리음식 #불맛',
    musicTitle: '원본 오디오 — 야시장먹방',
    likes: '17.9만',
    comments: '2,845',
    shares: '1.6만',
    saves: '6.4만',
    thumbnail: '/feed/clip_market.png',
    duration: '0:31',
    progress: 62
  },
  {
    id: 'short-4',
    serviceId: 'x-twitter',
    creator: '새벽두시기록',
    handle: '@2am_diary',
    avatar: '🌙',
    verified: false,
    caption: '“10분만 보고 잘게” 하고 새벽 3시 된 사람 손 🙋\n#새벽감성 #스크롤중독 #오늘도밤샘',
    musicTitle: 'lofi night loop — slowed + reverb',
    likes: '6.7만',
    comments: '5,436',
    shares: '2,940',
    saves: '1.9만',
    reposts: '8,317',
    thumbnail: '/feed/clip_night.png',
    duration: '0:34',
    progress: 23
  },
  {
    id: 'short-4b',
    serviceId: 'x-twitter',
    creator: '출근길관찰기',
    handle: '@commute_notes',
    avatar: '🚇',
    verified: false,
    caption: '월요일 아침 9호선. 이건 교통이 아니라 인내심 훈련입니다.\n#출근길 #지하철 #월요일',
    musicTitle: 'field recording — morning rush',
    likes: '4.1만',
    comments: '3,102',
    shares: '1,745',
    saves: '9,204',
    reposts: '1.2만',
    thumbnail: '/feed/clip_subway.png',
    duration: '0:24',
    progress: 51
  },
  {
    id: 'short-4c',
    serviceId: 'x-twitter',
    creator: '밤샘개발자',
    handle: '@night_dev_log',
    avatar: '💡',
    verified: true,
    caption: '오늘도 책상 정리만 완벽하게 끝냄. 코드는 한 줄도 안 씀.\n#개발자 #밤샘 #생산성의역설',
    musicTitle: 'ambient desk noise — study loop',
    likes: '9.3만',
    comments: '1,988',
    shares: '4,506',
    saves: '3.7만',
    reposts: '2.1만',
    thumbnail: '/feed/clip_desk.png',
    duration: '0:27',
    progress: 39
  }
];
