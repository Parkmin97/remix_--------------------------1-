# Phase 2 · state-data — 앱 카테고리 매핑표

## 산출물
- `src/data/appCategories.ts` (신규)
- `src/types.ts` (타입 추가만, 기존 타입 변경/삭제 없음)

## 추가한 타입 (src/types.ts)
| 이름 | 종류 | 내용 |
|------|------|------|
| `AppCategoryId` | union | `SHORTFORM \| SOCIAL \| GAME \| STREAMING \| COMMUNITY \| WEBTOON \| SHOPPING \| MUSIC \| FINANCE \| ETC` |
| `AppCategory` | interface | `id, label(한국어), icon(lucide명), priority(1=시간 소모 최대), description, defaultLocked` |
| `InstalledApp` | interface | `packageName, label, categoryId, systemCategory?(안드로이드 원본값), iconBase64?` |

기존 인터페이스는 손대지 않았으므로 ui/interaction 쪽 회귀 없음.

## 카테고리 (priority 순 = 시간을 많이 뺏는 순서)
| # | id | 표시명 | 아이콘 | 기본 잠금 |
|---|----|--------|--------|-----------|
| 1 | SHORTFORM | 숏폼/영상 | Flame | O |
| 2 | SOCIAL | 소셜/메신저 | MessageCircle | O |
| 3 | GAME | 게임 | Gamepad2 | O |
| 4 | STREAMING | OTT/스트리밍 | MonitorPlay | O |
| 5 | COMMUNITY | 뉴스/커뮤니티 | Newspaper | O |
| 6 | WEBTOON | 웹툰/웹소설 | BookOpen | X |
| 7 | SHOPPING | 쇼핑/배달 | ShoppingBag | X |
| 8 | MUSIC | 음악/오디오 | Music | X |
| 9 | FINANCE | 금융/페이 | Wallet | X |
| 99 | ETC | 기타 | LayoutGrid | X |

- 숏폼과 OTT를 분리했다. 무한 스크롤(릴스·쇼츠)과 몰아보기는 개입 방식이 달라서다.
- 금융/페이는 생활 필수라 `defaultLocked: false`. 은행 앱은 아예 매핑표에 넣지 않았다.

## 등록 앱
총 **95개** (숏폼 9 / 소셜 17 / 게임 20 / OTT 7 / 커뮤니티 10 / 웹툰 6 / 쇼핑 16 / 음악 7 / 금융 3)

변종 패키지 포함: 틱톡 3종(`com.zhiliaoapp.musically`, `com.ss.android.ugc.trill`, `com.ss.android.ugc.tiktok.lite`), 인스타 2종(`com.instagram.android`, `com.instagram.lite`), 페이스북/메신저 라이트, 배그 글로벌·KR 2종.
유튜브는 실기기에서 `com.google.android.youtube` 단일 확인. 쇼츠는 별도 앱이 아니므로 유튜브 패키지 하나로 커버된다.

## 조회 API
```ts
getCategoryForPackage(packageName: string, systemCategory?: number): AppCategory
```
3단계 폴백: ① 우리 매핑표(정확 일치 → 소문자 일치로 `com.miHoYo.*` 흡수) → ② 안드로이드 `ApplicationInfo.category`(0=GAME, 1=AUDIO, 2=VIDEO, 3=IMAGE, 4=SOCIAL, 5=NEWS 매핑, `-1`은 무시) → ③ `ETC`.

부가 export: `APP_CATEGORIES`, `FALLBACK_CATEGORY`, `PACKAGE_CATEGORY_MAP`, `getCategoryById`, `groupPackagesByCategory`(카테고리 일괄 잠금 UI용, priority 순 정렬 + 빈 카테고리 제외).

## 검증 필요 목록
확신 없는 패키지 22건은 매핑표에 넣지 않고 파일 하단 주석에 분리했다 (치지직, 쿠팡플레이, 카카오웹툰, 컬리, 번개장터, FLO, 블루 아카이브, 붕괴: 스타레일, 에펨코리아 등).
실기기에서 `adb shell pm list packages` 로 확인 후 옮길 것.

## 빌드
`npx tsc --noEmit` — 내 두 파일 관련 에러 0건.
기존 에러 1건 발견 (내 작업과 무관, 미수정): `src/components/NewHomeScreen.tsx:7` `SessionData` import 누락 (TS2304). ui-designer 소유 파일이라 손대지 않았다.
