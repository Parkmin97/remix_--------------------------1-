import {
  AppCategory,
  AppCategoryId,
  AppCategoryMapping,
  MappingApplyResult,
  RemoteMappingSource
} from '../types';

/**
 * 앱 카테고리 매핑표 v3.
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
 * ─── 이 표는 리포트 숫자도 결정한다 (2026-08-07 추가) ───
 * 리포트의 'SNS·숏폼 시간'은 앱별 스크린타임 중 카테고리가
 * SHORTFORM / SOCIAL / STREAMING / COMMUNITY 인 것만 합산한다.
 * 즉 **매핑표에 없는 앱은 ETC 로 떨어져 SNS 합계에서 조용히 빠진다.**
 * 커버리지가 낮으면 사용자에게 실제보다 적은 숫자를 보여주게 되고, 에러도 나지 않는다.
 * 그래서 (1) 내장 기본값을 계속 늘리고, (2) 앱 심사 없이 원격으로 갱신할 수 있게
 * 병합 구조를 뒀다(applyRemoteMapping / syncMappingFrom 참고).
 *
 * ─── 전수 검증 (2026-08-10) ───
 * 이 표의 모든 항목을 두 경로로 확인했다. 표시 규칙:
 *
 *   ✓D = 실기기(갤럭시 A32 / 안드로이드 13)에 실제 설치된 것을 `adb shell pm path` +
 *        APK 라벨(aapt2 dump badging)로 확인
 *   ✓P = Play 스토어 상세 페이지(/store/apps/details?id=…)가 200 으로 열리고
 *        og:title 이 해당 앱과 일치
 *
 * 표시가 없는 항목은 v3 이전부터 있던 글로벌 앱으로, 2026-08-10 일괄 조회에서
 * 상세 페이지가 정상 확인됐다(아래 '미등재' 목록에 없으면 전부 확인된 것이다).
 *
 * 미등재(상세 페이지 404)지만 **의도적으로 남긴** 27건 — 전부 과거에 실존했던
 * 패키지이며 서비스 종료·지역 제한으로 목록에서만 빠졌다. 잔존 설치 기기에서는
 * 여전히 매칭되므로 유지한다. 추측으로 지어낸 이름이 아니다:
 *   com.ss.android.ugc.aweme(중국 전용) · com.google.android.apps.youtube.mango ·
 *   com.facebook.mlite · com.linecorp.linelite · com.twitter.android.lite ·
 *   com.spotify.lite · org.telegram.messenger.web · com.skype.raider ·
 *   com.google.android.apps.podcasts · com.android.browser · com.kiwibrowser.browser ·
 *   com.mxtech.videoplayer.pro · com.rockstargames.gtasa ·
 *   com.activision.callofduty.warzone · com.ea.games.r3_row · com.ea.gp.fifamobile ·
 *   com.nintendo.zaaa · com.miniclip.eightballpool · com.moonactive.coinmaster ·
 *   com.playrix.wildscapes · net.peakgames.toyblast · com.rovio.angrybirds ·
 *   com.samsung.android.game.gamehome(갤럭시 스토어 선탑재, ✓D 로 확인) 외
 *
 * 반대로 **틀려서 고친 것**은 아래 각 항목의 주석에 남겨뒀다(구 패키지명 병기).
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
 * ⚠️ 확신할 수 없는 패키지명은 넣지 않는다. 틀린 패키지명은 조용히 실패한다 —
 *    그 앱은 영원히 ETC 로 떨어지고 차단도 집계도 안 되는데 에러조차 나지 않는다.
 *    불확실한 후보는 파일 하단 "검증 필요" 주석에 모아뒀다. 실기기에서 확인 후 옮길 것.
 *    확인법: adb shell pm list packages | grep -i <키워드>
 *
 * ⚠️ **이 상수를 직접 읽지 말 것.** 여기는 앱에 박제된 기본값 스냅샷이라
 *    원격으로 갱신한 내용이 반영되지 않는다. 원격 갱신은 오분류를 급히 고치거나
 *    새 앱을 심사 없이 추가하는 경로인데, 이 상수를 보면 그게 전부 무시된다.
 *      · 앱 하나 조회      → getCategoryForPackage(packageName)
 *      · 카테고리별 패키지  → getPackagesInCategories([...])
 *      · 전체 순회         → getActiveMapping().packages
 */
export const BUILTIN_PACKAGE_CATEGORIES: Record<string, AppCategoryId> = {
  // ── 숏폼/영상 ────────────────────────────────────────────────
  'com.zhiliaoapp.musically': 'SHORTFORM', // 틱톡 (정식)
  'com.zhiliaoapp.musically.go': 'SHORTFORM', // 틱톡 라이트 (글로벌)
  'com.ss.android.ugc.trill': 'SHORTFORM', // 틱톡 (일부 지역 변종)
  'com.ss.android.ugc.tiktok.lite': 'SHORTFORM', // 틱톡 라이트 — A32 실기기 확인
  'com.ss.android.ugc.aweme': 'SHORTFORM', // 더우인 (중국판 틱톡)
  'com.lemon.lvoverseas': 'SHORTFORM', // 캡컷 (틱톡 편집기)
  'com.google.android.youtube': 'SHORTFORM', // 유튜브 (쇼츠 포함)
  'com.google.android.apps.youtube.mango': 'SHORTFORM', // 유튜브 Go (서비스 종료, 잔존 기기 대비)
  'com.google.android.apps.youtube.kids': 'SHORTFORM', // 유튜브 키즈
  'com.google.android.apps.youtube.creator': 'SHORTFORM', // 유튜브 스튜디오
  'com.instagram.android': 'SHORTFORM', // 인스타그램 (릴스 포함)
  'com.instagram.lite': 'SHORTFORM', // 인스타그램 라이트
  'video.like': 'SHORTFORM', // 라이키
  'sg.bigo.live': 'SHORTFORM', // 비고 라이브
  'tv.twitch.android.app': 'SHORTFORM', // 트위치
  'kr.co.nowcom.mobile.afreeca': 'SHORTFORM', // SOOP (구 아프리카TV)
  'com.vimeo.android.videoapp': 'SHORTFORM', // 비메오
  'com.dailymotion.dailymotion': 'SHORTFORM', // 데일리모션
  // 치지직은 네이버 게임 커뮤니티 앱을 그대로 승계해 패키지명에 chzzk 가 없다.
  // 추정했던 com.naver.chzzk / com.navercorp.chzzk 은 둘 다 존재하지 않는다.
  'com.navercorp.game.android.community': 'SHORTFORM', // 치지직 ✓P
  'com.kwai.video': 'SHORTFORM', // 콰이(Kwai) ✓P

  // ── 소셜/메신저 ──────────────────────────────────────────────
  'com.kakao.talk': 'SOCIAL', // 카카오톡
  'com.kakao.story': 'SOCIAL', // 카카오스토리
  'com.nhn.android.band': 'SOCIAL', // 네이버 밴드
  'kr.co.vcnc.android.couple': 'SOCIAL', // 비트윈
  'jp.naver.line.android': 'SOCIAL', // 라인
  'com.linecorp.linelite': 'SOCIAL', // 라인 라이트
  'com.facebook.katana': 'SOCIAL', // 페이스북
  'com.facebook.lite': 'SOCIAL', // 페이스북 라이트
  'com.facebook.orca': 'SOCIAL', // 페이스북 메신저
  'com.facebook.mlite': 'SOCIAL', // 메신저 라이트
  'com.instagram.barcelona': 'SOCIAL', // 스레드 (패키지명에 threads 가 없다)
  'com.twitter.android': 'SOCIAL', // X (트위터)
  'com.twitter.android.lite': 'SOCIAL', // 트위터 라이트
  'com.snapchat.android': 'SOCIAL', // 스냅챗
  'com.whatsapp': 'SOCIAL', // 왓츠앱
  'com.whatsapp.w4b': 'SOCIAL', // 왓츠앱 비즈니스
  'org.telegram.messenger': 'SOCIAL', // 텔레그램
  'org.telegram.messenger.web': 'SOCIAL', // 텔레그램 (웹 배포판)
  'org.thunderdog.challegram': 'SOCIAL', // 텔레그램 X
  'org.thoughtcrime.securesms': 'SOCIAL', // 시그널
  'com.discord': 'SOCIAL', // 디스코드
  'com.tencent.mm': 'SOCIAL', // 위챗
  'com.tencent.mobileqq': 'SOCIAL', // QQ
  'com.sina.weibo': 'SOCIAL', // 웨이보
  'com.vkontakte.android': 'SOCIAL', // VK
  'org.joinmastodon.android': 'SOCIAL', // 마스토돈 (공식 클라이언트)
  'com.viber.voip': 'SOCIAL', // 바이버
  'com.skype.raider': 'SOCIAL', // 스카이프
  'com.linkedin.android': 'SOCIAL', // 링크드인
  'com.pinterest': 'SOCIAL', // 핀터레스트
  'com.tumblr': 'SOCIAL', // 텀블러
  'com.tinder': 'SOCIAL', // 틴더
  'com.bumble.app': 'SOCIAL', // 범블
  'com.grindrapp.android': 'SOCIAL', // 그라인더
  'com.bereal.ft': 'SOCIAL', // BeReal ✓P
  'com.azarlive.android': 'SOCIAL', // 아자르 ✓P
  'com.lifeoasis.willu': 'SOCIAL', // 윌유 (소개팅) ✓D ✓P
  'com.charmy.cupist': 'SOCIAL', // 글램 (소개팅) ✓P
  'net.nrise.wippy': 'SOCIAL', // 위피 (소개팅) ✓P
  // ⚠️ 아래 둘은 업무용 협업툴이다. SOCIAL 이라 리포트의 'SNS 시간'에 합산된다.
  //    업무 시간이 SNS 로 잡히는 게 맞는지 기획 판단이 필요하다(리더 보고 완료).
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
  'com.rockstargames.gtasa': 'GAME', // GTA 산 안드레아스
  'com.epicgames.fortnite': 'GAME', // 포트나이트 (스토어 외 설치)
  'com.king.candycrushsaga': 'GAME', // 캔디크러시 사가
  'com.king.candycrushsodasaga': 'GAME', // 캔디크러시 소다
  'com.king.candycrushjellysaga': 'GAME', // 캔디크러시 젤리
  'com.king.farmheroessaga': 'GAME', // 팜히어로 사가
  'com.king.bubblewitch3': 'GAME', // 버블위치 3
  'com.playrix.homescapes': 'GAME', // 홈스케이프
  'com.playrix.gardenscapes': 'GAME', // 가든스케이프
  'com.playrix.township': 'GAME', // 타운십
  'com.playrix.wildscapes': 'GAME', // 와일드스케이프
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
  'com.outfit7.mytalkingtomfree': 'GAME', // 마이 톡킹 톰
  'com.rovio.baba': 'GAME', // 앵그리버드 2
  'com.rovio.angrybirds': 'GAME', // 앵그리버드 클래식
  'com.gameloft.android.ANMP.GloftA9HM': 'GAME', // 아스팔트 9
  'com.ea.games.r3_row': 'GAME', // 리얼 레이싱 3
  'com.ea.game.pvz2_row': 'GAME', // 식물 vs 좀비 2
  'com.ea.games.simsfreeplay_row': 'GAME', // 심즈 프리플레이
  'com.ea.gp.fifamobile': 'GAME', // FIFA 모바일
  'com.nintendo.zaaa': 'GAME', // 슈퍼 마리오 런
  'com.nintendo.zaka': 'GAME', // 마리오 카트 투어
  'com.nintendo.zara': 'GAME', // 동물의 숲 포켓 캠프
  'com.google.android.play.games': 'GAME', // Play 게임즈
  'com.valvesoftware.android.steam.community': 'GAME', // 스팀
  'com.microsoft.xboxone.smartglass': 'GAME', // Xbox
  // 넥슨 계열 — 추정했던 com.nexon.maplem / com.nexon.dnfm 은 존재하지 않는다
  'com.nexon.bluearchive': 'GAME', // 블루 아카이브 ✓P
  'com.nexon.nsc.maplem': 'GAME', // 메이플스토리M ✓P
  'com.nexon.mod': 'GAME', // 메이플스토리 월드 ✓D
  'com.nexon.nxplay': 'GAME', // 넥슨플레이 ✓D ✓P
  'com.nexon.kart': 'GAME', // 카트라이더 러쉬플러스 ✓P
  'com.nexon.mdnf': 'GAME', // 던전앤파이터 모바일 ✓P
  'com.HoYoverse.hkrpgoversea': 'GAME', // 붕괴: 스타레일 ✓P
  'com.proximabeta.nikke': 'GAME', // 승리의 여신: 니케 ✓P
  'com.kakaogames.umamusume': 'GAME', // 우마무스메 프리티 더비 ✓P
  'com.pearlabyss.blackdesertm.gl': 'GAME', // 검은사막 모바일 (글로벌) ✓P
  'com.wemade.mir4': 'GAME', // 미르4 ✓P
  'com.wemade.nightcrows': 'GAME', // 나이트 크로우 ✓P
  'com.netmarble.mherosgb': 'GAME', // 마블 퓨처파이트 ✓P
  'com.netmarble.lineageII': 'GAME', // 리니지2 레볼루션 ✓P
  'com.netmarble.tskgb': 'GAME', // 세븐나이츠 리버스 ✓P
  'com.netmarble.skiagb': 'GAME', // 세븐나이츠 키우기 ✓P
  'com.cjenm.ModooMarbleKakao': 'GAME', // 모두의마블 ✓P
  'com.com2us.smon.normal.freefull.google.kr.android.common': 'GAME', // 서머너즈 워 ✓P
  'com.sundaytoz.kakao.anipang4': 'GAME', // 애니팡4 ✓P
  'com.neowiz.games.poker': 'GAME', // 피망 포커 ✓P
  'com.stove.epic7.google': 'GAME', // 에픽세븐 ✓P
  'com.YoStarEN.Arknights': 'GAME', // 명일방주 (영문판) ✓P
  'com.lilithgames.rok.gpkr': 'GAME', // 라이즈 오브 킹덤즈 ✓P
  'com.gof.global': 'GAME', // 화이트아웃 서바이벌 ✓P
  'com.samsung.android.game.gamehome': 'GAME', // 게임 런처 (갤럭시 선탑재) ✓D

  // ── OTT/스트리밍 ────────────────────────────────────────────
  'com.netflix.mediaclient': 'STREAMING', // 넷플릭스
  'net.cj.cjhv.gs.tving': 'STREAMING', // 티빙
  // 웨이브는 '푹(pooq)' 시절 패키지를 그대로 쓴다. 표에 있던 com.pooq.androidapp 은
  // 존재하지 않는 이름이라 지금까지 웨이브가 통째로 ETC 로 새고 있었다.
  'kr.co.captv.pooqV2': 'STREAMING', // 웨이브 ✓P (구 오기: com.pooq.androidapp)
  'com.frograms.wplay': 'STREAMING', // 왓챠 ✓P
  'com.disney.disneyplus': 'STREAMING', // 디즈니+
  'com.amazon.avod.thirdpartyclient': 'STREAMING', // 프라임 비디오
  'com.google.android.videos': 'STREAMING', // 구글 TV (구 플레이 무비)
  'com.samsung.android.tvplus': 'STREAMING', // 삼성 TV Plus (갤럭시 선탑재)
  'com.crunchyroll.crunchyroid': 'STREAMING', // 크런치롤
  'com.viki.android': 'STREAMING', // 비키
  'com.mxtech.videoplayer.ad': 'STREAMING', // MX 플레이어
  'com.mxtech.videoplayer.pro': 'STREAMING', // MX 플레이어 프로
  'org.videolan.vlc': 'STREAMING', // VLC
  'com.plexapp.android': 'STREAMING', // 플렉스
  'com.coupang.mobile.play': 'STREAMING', // 쿠팡플레이 ✓P
  'laftel.net.laftel': 'STREAMING', // 라프텔 ✓P
  'com.frograms.watcha': 'STREAMING', // 왓챠피디아 ✓P
  'com.nhn.android.navertv': 'STREAMING', // 네이버 시리즈온 ✓P
  'com.wbd.stream': 'STREAMING', // HBO Max ✓P
  'com.apple.atve.androidtv.appletv': 'STREAMING', // Apple TV ✓P (안드로이드 TV 배포판)
  'kr.co.kbs.kplayer': 'STREAMING', // KBS+ ✓P
  'com.imbc.downloadapp': 'STREAMING', // MBC ✓P
  'kr.co.sbs.videoplayer': 'STREAMING', // SBS play ✓P
  'com.lguplus.remocon': 'STREAMING', // U+tv모바일 ✓P (패키지명이 remocon 이지만 시청 앱이 맞다)

  // ── 뉴스/커뮤니티 ───────────────────────────────────────────
  'com.nhn.android.search': 'COMMUNITY', // 네이버
  'com.nhn.android.navercafe': 'COMMUNITY', // 네이버 카페
  'com.nhn.android.blog': 'COMMUNITY', // 네이버 블로그
  'net.daum.android.daum': 'COMMUNITY', // 다음
  'net.daum.android.cafe': 'COMMUNITY', // 다음 카페
  // 표에 있던 com.dcinside.app 은 존재하지 않는다. 실제로는 .android 가 붙는다.
  'com.dcinside.app.android': 'COMMUNITY', // 디시인사이드 ✓P (구 오기: com.dcinside.app)
  'com.everytime.v2': 'COMMUNITY', // 에브리타임
  'com.teamblind.blind': 'COMMUNITY', // 블라인드
  'com.reddit.frontpage': 'COMMUNITY', // 레딧
  'com.quora.android': 'COMMUNITY', // 쿼라
  'com.medium.reader': 'COMMUNITY', // 미디엄
  'flipboard.app': 'COMMUNITY', // 플립보드
  'com.google.android.apps.magazines': 'COMMUNITY', // 구글 뉴스
  'com.nytimes.android': 'COMMUNITY', // 뉴욕타임스
  'com.cnn.mobile.android.phone': 'COMMUNITY', // CNN
  'bbc.mobile.news.ww': 'COMMUNITY', // BBC 뉴스
  'com.fmkorea.m.fmk': 'COMMUNITY', // 에펨코리아 ✓P
  'com.ppomppu.android': 'COMMUNITY', // 뽐뿌 ✓P
  'com.esstudio.clien': 'COMMUNITY', // 클리앙 (ESClien — 공식 앱이 없어 사실상 표준 클라이언트) ✓P
  'com.ruliweb.www.ruliapp': 'COMMUNITY', // 루리웹 ✓P
  'kr.co.invenapp': 'COMMUNITY', // 인벤 ✓P
  'com.nate.android.portalmini': 'COMMUNITY', // 네이트 (판 포함) ✓P
  'net.instiz.www.instiz': 'COMMUNITY', // 인스티즈 ✓P
  'com.nhn.android.kin': 'COMMUNITY', // 네이버 지식iN ✓P
  'com.daumkakao.android.brunchapp': 'COMMUNITY', // 브런치 ✓P
  'net.daum.android.tistoryapp': 'COMMUNITY', // 티스토리 ✓P
  'kr.psynet.yhnews': 'COMMUNITY', // 연합뉴스 ✓P
  'com.chosunmedia.android': 'COMMUNITY', // 조선일보 ✓P
  'kr.connect.touch.joins': 'COMMUNITY', // 중앙일보 ✓P
  'com.aslo.smartview.donga': 'COMMUNITY', // 동아일보 ✓P

  // ── 웹툰/웹소설 ─────────────────────────────────────────────
  'com.nhn.android.webtoon': 'WEBTOON', // 네이버 웹툰
  'com.naver.linewebtoon': 'WEBTOON', // LINE 웹툰 (글로벌)
  'com.nhn.android.nbooks': 'WEBTOON', // 네이버 시리즈
  'com.kakao.page': 'WEBTOON', // 카카오페이지
  'com.initialcoms.ridi': 'WEBTOON', // 리디 (리디북스)
  'com.lezhin.comics': 'WEBTOON', // 레진코믹스
  'wp.wattpad': 'WEBTOON', // 왓패드 (웹소설)
  'com.google.android.apps.books': 'WEBTOON', // Play 북스 (전자책)
  'com.amazon.kindle': 'WEBTOON', // 킨들 (전자책)
  // 케이툰은 KT 계열이라 패키지가 olleh 로 시작한다. 추정했던 com.ktoon.app 은 없다.
  // 사용자 폰에서 '기타'로 보이던 원인이 이것이었다. Play 미등재(원스토어·선탑재 경로).
  'com.olleh.webtoon': 'WEBTOON', // 케이툰 (완전판) ✓D
  'net.daum.android.webtoon': 'WEBTOON', // 카카오웹툰 ✓P (추정 com.kakaoent.webtoon 은 없음)
  'com.topco.toptoon.google.hj': 'WEBTOON', // 탑툰 ✓P
  'com.bomcomics.bomtoon.playstore': 'WEBTOON', // 봄툰 ✓P
  'com.toomics.global.google': 'WEBTOON', // 투믹스 ✓P
  'com.tapastic': 'WEBTOON', // 타파스 ✓P
  'com.qidian.Int.reader': 'WEBTOON', // WebNovel ✓P
  'kr.co.millie.millieshelf': 'WEBTOON', // 밀리의 서재 ✓P
  'com.kyobo.ebook.common.b2c': 'WEBTOON', // 교보eBook ✓P
  'com.yes24.ebook.fourth': 'WEBTOON', // 예스24 eBook ✓P

  // ── 쇼핑/배달 ───────────────────────────────────────────────
  'com.coupang.mobile': 'SHOPPING', // 쿠팡
  'com.coupang.mobile.eats': 'SHOPPING', // 쿠팡이츠
  'com.sampleapp': 'SHOPPING', // 배달의민족 (패키지명이 실제로 com.sampleapp)
  'com.fineapp.yogiyo': 'SHOPPING', // 요기요
  'com.towneers.www': 'SHOPPING', // 당근
  'com.elevenst': 'SHOPPING', // 11번가
  'com.ebay.kr.gmarket': 'SHOPPING', // G마켓
  'com.ebay.kr.auction': 'SHOPPING', // 옥션
  // 티몬(com.tmon)·위메프(com.wemakeprice)는 제거했다. 두 패키지 모두 상세 페이지가
  // 열리지 않아 이름을 확인할 방법이 없다(2024 정산 사태 이후 서비스 중단).
  // 확인 못 한 이름을 남겨두면 "분류했다"는 착각만 준다.
  'com.wemakeprice.cupping': 'SHOPPING', // 위메프오 ✓P (위메프 본진과 별개로 운영 중)
  'com.musinsa.store': 'SHOPPING', // 무신사
  'com.croquis.zigzag': 'SHOPPING', // 지그재그
  'net.bucketplace': 'SHOPPING', // 오늘의집
  'kr.co.company.hwahae': 'SHOPPING', // 화해
  'com.starbucks.co': 'SHOPPING', // 스타벅스
  'com.nike.omega': 'SHOPPING', // 나이키
  'com.alibaba.aliexpresshd': 'SHOPPING', // 알리익스프레스
  'com.einnovation.temu': 'SHOPPING', // 테무
  'com.zzkko': 'SHOPPING', // 쉬인
  'com.taobao.taobao': 'SHOPPING', // 타오바오
  'com.amazon.mShop.android.shopping': 'SHOPPING', // 아마존
  'com.ebay.mobile': 'SHOPPING', // 이베이
  'com.etsy.android': 'SHOPPING', // 엣시
  'com.contextlogic.wish': 'SHOPPING', // 위시
  'com.ubercab.eats': 'SHOPPING', // 우버이츠
  'com.airbnb.android': 'SHOPPING', // 에어비앤비
  'com.booking': 'SHOPPING', // 부킹닷컴
  'com.agoda.mobile.consumer': 'SHOPPING', // 아고다
  'com.dbs.kurly.m2': 'SHOPPING', // 컬리 ✓P
  'com.banhala.android': 'SHOPPING', // 에이블리 ✓P (사명 반할라 시절 패키지 유지)
  'com.the29cm.app29cm': 'SHOPPING', // 29CM ✓P
  'com.fstudio.kream': 'SHOPPING', // KREAM ✓P
  'com.oliveyoung': 'SHOPPING', // 올리브영 ✓P
  'kr.co.ssg': 'SHOPPING', // SSG.COM ✓P
  'com.lotte': 'SHOPPING', // 롯데ON ✓P
  'gsshop.mobile.v2': 'SHOPPING', // GS SHOP ✓P
  'com.cjoshppingphone': 'SHOPPING', // CJ온스타일 ✓P
  'com.socialapps.homeplus': 'SHOPPING', // 홈플러스 ✓P
  'kr.co.quicket': 'SHOPPING', // 번개장터 ✓P
  'com.elz.secondhandstore': 'SHOPPING', // 중고나라 ✓P
  'com.cultsotry.yanolja.nativeapp': 'SHOPPING', // NOL(야놀자) ✓P
  'kr.goodchoice.abouthere': 'SHOPPING', // 여기어때 ✓P
  'com.interpark.app.ticket': 'SHOPPING', // NOL 티켓 (구 인터파크 티켓) ✓P
  'com.interpark.app': 'SHOPPING', // 인터파크 도서 ✓P
  'com.mhows.giftishow': 'SHOPPING', // 기프티쇼 ✓D ✓P

  // ── 음악/오디오 ─────────────────────────────────────────────
  'com.iloen.melon': 'MUSIC', // 멜론
  'com.ktmusic.geniemusic': 'MUSIC', // 지니뮤직
  'com.neowiz.android.bugs': 'MUSIC', // 벅스
  'com.sec.android.app.music': 'MUSIC', // 삼성 뮤직 (갤럭시 선탑재)
  'com.spotify.music': 'MUSIC', // 스포티파이
  'com.spotify.lite': 'MUSIC', // 스포티파이 라이트
  'com.google.android.apps.youtube.music': 'MUSIC', // 유튜브 뮤직
  'com.apple.android.music': 'MUSIC', // 애플 뮤직
  'com.amazon.mp3': 'MUSIC', // 아마존 뮤직
  'deezer.android.app': 'MUSIC', // 디저
  'com.aspiro.tidal': 'MUSIC', // 타이달
  'com.pandora.android': 'MUSIC', // 판도라
  'com.soundcloud.android': 'MUSIC', // 사운드클라우드
  'com.shazam.android': 'MUSIC', // 샤잠
  'com.smule.singandroid': 'MUSIC', // 스뮬
  'tunein.player': 'MUSIC', // 튠인 라디오
  'com.audible.application': 'MUSIC', // 오디블
  'com.google.android.apps.podcasts': 'MUSIC', // 구글 팟캐스트
  'fm.castbox.audiobook.radio.podcast': 'MUSIC', // 캐스트박스
  'com.podbean.app.podcast': 'MUSIC', // 팟빈
  'skplanet.musicmate': 'MUSIC', // 플로(FLO) ✓P (추정 com.dreamus.flo 는 없음)
  'com.naver.vibe': 'MUSIC', // 네이버 바이브 ✓P
  'com.makeshop.podbbang': 'MUSIC', // 팟빵 ✓P
  'kr.co.influential.youngkangapp': 'MUSIC', // 윌라 ✓P (추정 com.wellaudio.willa 는 없음)
  'com.imbc.mini': 'MUSIC', // MBC mini (라디오) ✓P

  // ── 금융/페이 ───────────────────────────────────────────────
  // 현재 스토어에 올라간 토스는 viva.republica.toss 다. 접미사 없는 viva.republica 는
  // 상세 페이지가 열리지 않지만 구버전 잔존 설치 가능성이 있어 함께 남긴다.
  'viva.republica.toss': 'FINANCE', // 토스 ✓P
  'viva.republica': 'FINANCE', // 토스 (구 패키지, 잔존 설치 대비)
  'com.kakaopay.app': 'FINANCE', // 카카오페이
  'com.kakaobank.channel': 'FINANCE', // 카카오뱅크
  'com.nhnent.payapp': 'FINANCE', // 페이코
  'com.rainist.banksalad2': 'FINANCE', // 뱅크샐러드
  'com.samsung.android.spay': 'FINANCE', // 삼성월렛 (구 삼성페이)
  'com.google.android.apps.walletnfcrel': 'FINANCE', // 구글 월렛
  'com.paypal.android.p2pmobile': 'FINANCE', // 페이팔
  'com.kbstar.kbbank': 'FINANCE', // KB스타뱅킹
  'com.dunamu.exchange': 'FINANCE', // 업비트
  'com.btckorea.bithumb': 'FINANCE', // 빗썸
  'com.binance.dev': 'FINANCE', // 바이낸스
  'com.coinbase.android': 'FINANCE', // 코인베이스
  'com.naverfin.payapp': 'FINANCE', // 네이버페이 ✓P
  'com.shinhan.sbanking': 'FINANCE', // 신한 슈퍼SOL ✓P
  'com.shcard.smartpay': 'FINANCE', // 신한 SOL페이 ✓P
  'com.wooribank.smart.npib': 'FINANCE', // 우리WON뱅킹 ✓P
  'com.hanabank.oqf': 'FINANCE', // 하나원큐 ✓P (추정 …channel.android.hananbank 는 없음)
  'nh.smart.banking': 'FINANCE', // NH스마트뱅킹 ✓P
  'com.kbankwith.smartbank': 'FINANCE', // 케이뱅크 ✓D ✓P
  'com.ssg.serviceapp.android.egiftcertificate': 'FINANCE', // SSGPAY ✓P (SSG닷컴이 아니라 페이 앱이다)
  'com.dunamu.stockplus': 'FINANCE', // 증권플러스 ✓P
  'coinone.co.kr.official': 'FINANCE', // 코인원 ✓P

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
  'com.UCMobile.intl': 'BROWSER', // UC 브라우저
  'com.yandex.browser': 'BROWSER', // 얀덱스 브라우저
  'com.vivaldi.browser': 'BROWSER', // 비발디
  'org.torproject.torbrowser': 'BROWSER', // 토르 브라우저
  'mark.via.gp': 'BROWSER' // Via 브라우저 ✓P
};

/** 앱에 내장된 기본 매핑표. 원격 갱신이 없거나 실패하면 항상 이 값으로 동작한다 */
export const BUILTIN_MAPPING: AppCategoryMapping = {
  version: 4,
  updatedAt: '2026-08-10',
  packages: BUILTIN_PACKAGE_CATEGORIES
};

/** 리포트의 'SNS·숏폼 시간'에 합산되는 카테고리 (집계 기준을 한 곳에서 관리) */
export const SNS_CATEGORY_IDS: AppCategoryId[] = [
  'SHORTFORM',
  'SOCIAL',
  'STREAMING',
  'COMMUNITY'
];

/** 해당 앱의 사용 시간이 'SNS 시간'에 들어가는지 */
export function isSnsCategory(id: AppCategoryId): boolean {
  return SNS_CATEGORY_IDS.includes(id);
}

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

/**
 * 지정한 카테고리들에 속한 패키지 전체를 돌려준다.
 *
 * 카테고리 단위 잠금에서 **"잠금 중에 새로 설치된 앱"을 네이티브가 판정**할 때 쓴다.
 * 반드시 현재 매핑표(내장 + 원격 병합본)를 본다 — 내장 스냅샷
 * (BUILTIN_PACKAGE_CATEGORIES)을 직접 순회하면 원격으로 급히 추가한 패키지가
 * 빠져서, 카테고리를 잠갔는데도 그 앱만 안 막히는 구멍이 생긴다.
 */
export function getPackagesInCategories(
  categoryIds: AppCategoryId[]
): Record<string, AppCategoryId> {
  const wanted = new Set<AppCategoryId>(categoryIds);
  const result: Record<string, AppCategoryId> = {};

  Object.entries(activeMapping.packages).forEach(([packageName, categoryId]) => {
    if (wanted.has(categoryId)) {
      result[packageName] = categoryId;
    }
  });

  return result;
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
 * 미확인 — 이름만 알고 패키지명을 확인하지 못한 앱
 *
 * 2026-08-10 검증 라운드에서 후보 88건을 전부 조회했다. 확인된 것은 위 매핑표로
 * 올렸고, **추측했던 패키지명 46건이 실제로는 존재하지 않았다**(조용히 ETC 로
 * 새고 있었다는 뜻이다). 그중 실제 이름을 찾아낸 것은 옮겼고, 여기 남은 것은
 * 이름을 확정하지 못한 것뿐이다.
 *
 * 원칙: **확인 못 한 이름은 적지 않는다.** 틀린 패키지명은 아무 앱에도 매칭되지
 * 않으면서 "분류해 뒀다"는 착각만 준다. 개수보다 정확도가 우선이다.
 *
 * 확인법
 *   실기기   adb shell pm list packages -3
 *            adb shell pm path <패키지명> → adb pull → aapt2 dump badging (앱 이름 확인)
 *   스토어   https://play.google.com/store/apps/details?id=<패키지명>
 *            200 + og:title 이 해당 앱이면 확인, 404 면 그 이름은 존재하지 않는다
 *
 * ★ = SNS 집계(SHORTFORM/SOCIAL/STREAMING/COMMUNITY)에 직접 영향 → 최우선
 * ─────────────────────────────────────────────────────────────
 * [숏폼/영상] ★
 *   카카오TV        서비스 종료. 검색·직접 조회 모두 결과 없음 → 추적 중단
 *   네이버 나우      치지직으로 통합. 별도 앱 없음 → 추적 중단
 *   틱톡 지역 변종    com.ss.android.ugc.trill.go 는 존재하지 않음. 실기기에서 발견될
 *                  때마다 추가하는 방식이 맞다(지역별로 이름이 계속 갈린다)
 * [OTT/스트리밍] ★
 *   B tv 모바일      SK브로드밴드 앱 중 시청용을 특정하지 못했다. 검색 상위는
 *                  com.skb.smartrc(리모컨)·com.skb.bworld(요금 조회)로 전부 다른 앱
 * [뉴스/커뮤니티] ★
 *   더쿠            공식 앱 없음(웹 전용). 검색 결과는 전부 다른 앱
 *   네이버 포스트     블로그로 통합. 독립 앱 없음 → 추적 중단
 * [금융/페이]
 *   KB Liiv         검색 상위 com.kbstar.liivmobile 은 알뜰폰(KB리브모바일) 앱이라
 *                  금융이 아니다. 뱅킹 쪽 Liiv 는 KB스타뱅킹에 흡수된 것으로 보인다
 *   ※ 은행 앱은 생활 필수라 매핑에 넣더라도 defaultLocked 는 false 를 유지할 것
 * [쇼핑]
 *   티몬·위메프       두 패키지(com.tmon / com.wemakeprice) 모두 상세 페이지가 열리지
 *                  않아 이름 확인 불가. 표에서 제거했다. 위메프오는 별개로 운영 중이라
 *                  com.wemakeprice.cupping 으로 추가
 * [브라우저]
 *   QQ브라우저       com.tencent.mtt 은 국내 스토어에서 조회되지 않아 확인 불가
 *
 * ─── 의도적으로 매핑하지 않은 것 ───
 * · 전화·문자·연락처·설정·알람 — 차단 후보에서 하드 제외되는 안전 목록이라 분류 불필요
 * · 구글 앱(com.google.android.googlequicksearchbox) — Discover 피드 때문에 커뮤니티로
 *   넣고 싶지만, 카테고리 일괄 잠금 시 검색·어시스턴트까지 막힌다. 기획 판단 대기.
 * · 카카오비즈니스 파트너센터(com.kakao.yellowid) — 이름은 '카카오톡 채널 관리자'지만
 *   실제로는 사업자용 관리 도구다. SOCIAL 로 넣으면 업무 시간이 SNS 시간으로 집계된다.
 * · 삼성 데일리보드(com.samsung.android.app.spage) — 뉴스·영상 피드를 스크롤하는
 *   면이지만 홈 화면 좌측 패널이라 앱 단위 차단 대상이 아니다. 기획 판단 대기.
 * · Google Meet(com.google.android.apps.tachyon) — 영상 통화라 전화에 가깝다.
 *   SOCIAL 로 넣으면 통화 시간이 SNS 시간에 합산된다.
 * · 지도·업무·사진·통신사 유틸·앱스토어 등 도구 앱 — SNS 집계에 들어가면 안 되므로
 *   ETC 로 두는 게 맞다.
 */
