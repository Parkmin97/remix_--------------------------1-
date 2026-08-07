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
  /** 안드로이드 ApplicationInfo.category 원본값 (미설정이면 -1) */
  systemCategory?: number;
  /** 앱 아이콘 (data URI 또는 base64) */
  iconBase64?: string;
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
