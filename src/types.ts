export type ModeType = 'FOCUS_NOW' | 'GUIDED_USE';

export type SessionState =
  | 'NO_SESSION'
  | 'GUIDED_READY'
  | 'USAGE_ACTIVE'
  | 'GRACE_DUE'
  | 'GRACE_ACTIVE'
  | 'FOCUS_ACTIVE'
  | 'INTERVENTION'
  | 'MISSION_ACTIVE'
  | 'DECISION_PENDING'
  | 'EXTENSION_ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'TECHNICAL_ABORT';

export type BeatType = '4/4' | '3/4' | '2/4' | '1/4';

export interface ClassicalPiece {
  id: string;
  title: string;
  composer: string;
  beatType: BeatType;
  bpm: number;
  durationSeconds: number; // 60s
  description: string;
  audioUrl: string;
  fallbackAudioUrl?: string;
  notesSequence: Array<{ time: number; note: string; beatIndex: number }>;
}

export interface TargetService {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
  category: string;
}

export interface ShortVideo {
  id: string;
  serviceId: string;
  creator: string;
  handle: string;
  caption: string;
  musicTitle: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  /** X(트위터) 리포스트 수 */
  reposts?: string;
  /** 피드 배경으로 쓰는 세로형 클립 스틸 이미지 (public 경로) */
  thumbnail: string;
  /** 프로필 아바타에 쓰는 이모지 (실사 인물 사진 대체) */
  avatar: string;
  /** 공식 인증 배지 표시 여부 */
  verified?: boolean;
  /** 영상 길이 표기 (예: 0:32) */
  duration: string;
  /** 자동 재생 진행률 (0~100) — 실제 재생 대신 화면용 표시값 */
  progress: number;
  bgColor?: string;
  gradient?: string;
}

export interface SessionData {
  id: string;
  mode: ModeType;
  targetServices: TargetService[];
  usageLimitMinutes?: number;
  activeUsageServiceId?: string; // 모드 B에서 마지막으로 클릭해 30초 카운트를 시작한 SNS id
  focusDurationMinutes: number;
  focusTask?: string;
  usageIntent?: string;
  createdAt: string;
  usageStartsAt?: string;
  usageEndsAt?: string;
  graceEndsAt?: string;
  focusStartsAt: string;
  focusEndsAt: string;
  extensionEndsAt?: string;
  state: SessionState;
  missionBeatType: BeatType;
  selectedPieceId: string;
  missionAttempted: boolean;
  missionSucceeded: boolean;
  extensionUsed: boolean;
  launchAttemptCount: number;
}

/**
 * 앱 카테고리 식별자.
 * 배열 순서 = 디지털 디톡스 관점에서 "시간을 많이 뺏는 순서" (APP_CATEGORIES 참고)
 */
export type AppCategoryId =
  | 'SHORTFORM'
  | 'SOCIAL'
  | 'GAME'
  | 'STREAMING'
  | 'COMMUNITY'
  | 'WEBTOON'
  | 'SHOPPING'
  | 'MUSIC'
  | 'FINANCE'
  | 'BROWSER'
  | 'ETC';

export interface AppCategory {
  id: AppCategoryId;
  /** 한국어 표시명 (예: 숏폼/영상) */
  label: string;
  /** lucide-react 아이콘명 힌트 */
  icon: string;
  /** 시간 소모 우선순위 — 1이 가장 크고, 잠금 추천 정렬에 사용 */
  priority: number;
  /** 카테고리 잠금 화면에 노출할 한 줄 설명 */
  description: string;
  /** 카테고리 일괄 잠금 시 기본 선택 여부 (생활 필수 앱은 false) */
  defaultLocked: boolean;
}

/** 기기에서 조회한 설치 앱 1건 (안드로이드 네이티브 브리지 응답) */
export interface InstalledApp {
  packageName: string;
  /** 사용자에게 보이는 앱 이름 */
  label: string;
  /** 우리 매핑표 기준으로 확정된 카테고리 */
  categoryId: AppCategoryId;
  /**
   * 안드로이드 ApplicationInfo.category 원본값 (미설정이면 -1).
   * ⚠️ 분류에는 쓰지 않는다 — 실측에서 신뢰할 수 없다는 결론(appCategories.ts 상단 주석).
   * 디버깅·진단 표시 용도로만 보관한다.
   */
  systemCategory?: number;
  /** 앱 아이콘 (data URI 또는 base64) */
  iconBase64?: string;
}

/**
 * 패키지명 → 카테고리 매핑표 1벌.
 * 앱에 내장된 기본값과 원격에서 받은 갱신본이 같은 모양을 쓴다.
 */
export interface AppCategoryMapping {
  /** 클수록 최신. 내장본보다 큰 버전만 병합한다 */
  version: number;
  /** 매핑표 생성 시각 (ISO 문자열) */
  updatedAt: string;
  packages: Record<string, AppCategoryId>;
}

/** 원격 매핑표 공급자 계약 — 서버가 생기면 이 인터페이스만 구현하면 된다 */
export interface RemoteMappingSource {
  /**
   * 원격 매핑표를 가져온다.
   * 갱신할 것이 없거나 실패하면 null 을 반환한다(내장 기본값 유지).
   */
  fetchMapping(currentVersion: number): Promise<AppCategoryMapping | null>;
}

/** 원격 매핑표 반영 결과 */
export interface MappingApplyResult {
  applied: boolean;
  /** 반영 후 실제로 사용 중인 매핑표 버전 */
  version: number;
  /** 등록된 패키지 총 개수 */
  packageCount: number;
  /** 반영하지 않았다면 그 사유 */
  reason?: string;
}

export interface DailyReport {
  date: string;
  completedFocusMinutes: number;
  confirmedCount: number;
  totalSnsMinutes?: number;
  cancelledCount: number;
  missionSuccessCount: number;
  missionFailCount: number;
  extensionCount: number;
  conductorRank: string;
}
