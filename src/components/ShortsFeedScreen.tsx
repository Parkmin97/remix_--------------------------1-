import React, { useState, useEffect } from 'react';
import { SIMULATED_SHORTS } from '../data/targetServices';
import { SessionData } from '../types';
import { saveActiveSession } from '../lib/storage';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Music2,
  ArrowLeft,
  Volume2,
  Camera,
  Search,
  Play,
  Plus,
  House,
  Clapperboard,
  User,
  Bell,
  Mail,
  Repeat2,
  BadgeCheck,
  ChevronDown,
} from 'lucide-react';

/**
 * 서비스별 룩앤필 정의.
 * 실제 SNS 앱의 화면 구성(상단 탭 / 강조색 / 하단 내비게이션)을 흉내 낸 표시용 값이며,
 * 기능은 없다 (look-alike 화면 전용).
 */
type FeedBrand = {
  label: string;
  tabs: string[];
  activeTab: string;
  accent: string;
  accentText: string;
  followLabel: string;
  commentPlaceholder: string;
  nav: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean }>;
};

const FEED_BRANDS: Record<string, FeedBrand> = {
  instagram: {
    label: 'Reels',
    tabs: [],
    activeTab: '',
    accent: 'bg-gradient-to-tr from-fuchsia-600 via-rose-500 to-amber-400',
    accentText: 'text-rose-400',
    followLabel: '팔로우',
    commentPlaceholder: '댓글 달기...',
    nav: [
      { icon: House, label: '홈' },
      { icon: Search, label: '검색' },
      { icon: Plus, label: '등록' },
      { icon: Clapperboard, label: '릴스', active: true },
      { icon: User, label: '프로필' },
    ],
  },
  youtube: {
    label: 'Shorts',
    tabs: [],
    activeTab: '',
    accent: 'bg-red-600',
    accentText: 'text-red-500',
    followLabel: '구독',
    commentPlaceholder: '댓글 추가...',
    nav: [
      { icon: House, label: '홈' },
      { icon: Play, label: 'Shorts', active: true },
      { icon: Plus, label: '만들기' },
      { icon: Bell, label: '구독' },
      { icon: User, label: '나' },
    ],
  },
  tiktok: {
    label: '',
    tabs: ['팔로잉', '추천'],
    activeTab: '추천',
    accent: 'bg-rose-500',
    accentText: 'text-cyan-300',
    followLabel: '팔로우',
    commentPlaceholder: '댓글 추가...',
    nav: [
      { icon: House, label: '홈', active: true },
      { icon: Search, label: '친구' },
      { icon: Plus, label: '' },
      { icon: Mail, label: '받은함' },
      { icon: User, label: '프로필' },
    ],
  },
  'x-twitter': {
    label: '',
    tabs: ['추천', '팔로우 중'],
    activeTab: '추천',
    accent: 'bg-sky-500',
    accentText: 'text-sky-400',
    followLabel: '팔로우',
    commentPlaceholder: '답글 게시하기...',
    nav: [
      { icon: House, label: '홈', active: true },
      { icon: Search, label: '탐색' },
      { icon: Clapperboard, label: '동영상' },
      { icon: Bell, label: '알림' },
      { icon: Mail, label: '메시지' },
    ],
  },
};

const DEFAULT_BRAND = FEED_BRANDS.instagram;

/** 홈 화면에서 마지막으로 터치한 앱 id를 읽는다 (화면 표시 목적). */
const readLastOpenedApp = (): string | undefined => {
  try {
    return sessionStorage.getItem('life_conductor_last_opened_app') ?? undefined;
  } catch {
    return undefined;
  }
};

interface ShortsFeedScreenProps {
  activeSession: SessionData | null;
  setActiveSession: (session: SessionData | null) => void;
  onNavigateToScreen: (screen: string) => void;
}

export const ShortsFeedScreen: React.FC<ShortsFeedScreenProps> = ({
  activeSession,
  setActiveSession,
  onNavigateToScreen
}) => {
  // 홈에서 터치한 앱의 게시물만 모아 보여준다.
  // (인스타를 열었으면 인스타 피드 안에서만 스크롤되는 것이 실제 앱 동작이다.)
  // 세션이 없을 때는 홈 화면이 남겨둔 '마지막으로 연 앱' 표시값을 쓴다.
  const openedServiceId = activeSession?.activeUsageServiceId ?? readLastOpenedApp();
  const feed = React.useMemo(() => {
    const matched = openedServiceId
      ? SIMULATED_SHORTS.filter(short => short.serviceId === openedServiceId)
      : [];
    return matched.length > 0 ? matched : SIMULATED_SHORTS;
  }, [openedServiceId]);

  const [currentShortIndex, setCurrentShortIndex] = useState(0);

  // 다른 앱을 열어 피드 목록이 바뀌면 첫 게시물부터 다시 시작한다.
  useEffect(() => {
    setCurrentShortIndex(0);
  }, [feed]);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // 30초 카운트는 모드 B에서 SNS를 클릭해 만들어진 USAGE_ACTIVE 세션에서만 진행한다.
  // (숏폼 화면에 들어왔다는 이유만으로 자동 세션을 만들지 않는다.)
  const isUsageCounting = Boolean(activeSession && activeSession.state === 'USAGE_ACTIVE' && activeSession.usageEndsAt);

  // Countdown timer for Mode B active session (30s physical timer based on focusStartsAt)
  useEffect(() => {
    if (!activeSession) return;
    const targetEndIso = activeSession.focusStartsAt || activeSession.usageEndsAt;
    if (!targetEndIso) return;

    const sessionServiceIds = new Set(
      (activeSession.targetServices ?? []).map((s: unknown) => (typeof s === 'string' ? s : (s as { id: string }).id))
    );
    const isCurrentAppSelected = Boolean(activeSession.activeUsageServiceId && sessionServiceIds.has(activeSession.activeUsageServiceId));

    const updateTimer = () => {
      const now = Date.now();
      const endMs = new Date(targetEndIso).getTime();
      const diffSecs = Math.max(0, Math.ceil((endMs - now) / 1000));
      setSecondsLeft(diffSecs);

      if (diffSecs <= 0) {
        // 이용 시간(30초) 종료 -> 세션 state를 FOCUS_ACTIVE로 전환
        if (activeSession.state !== 'FOCUS_ACTIVE' && activeSession.state !== 'MISSION_ACTIVE') {
          const updatedSession: SessionData = {
            ...activeSession,
            state: 'FOCUS_ACTIVE',
          };
          saveActiveSession(updatedSession);
          setActiveSession(updatedSession);
        }

        // 설정한 (통제 대상) 앱을 이용 중이었다면 시간이 끝나는 즉시 홈 화면으로 튕겨나온다.
        if (isCurrentAppSelected) {
          onNavigateToScreen('phone-home');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeSession, setActiveSession, onNavigateToScreen]);

  // Scroll & Gesture States
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const lastScrollTimeRef = React.useRef<number>(0);

  const currentShort = feed[Math.min(currentShortIndex, feed.length - 1)];
  const brand = FEED_BRANDS[currentShort.serviceId] ?? DEFAULT_BRAND;

  // 화면 전환 시 상호작용 상태(좋아요/저장/팔로우/캡션 펼침)를 초기화한다.
  const resetInteractions = () => {
    setLiked(false);
    setSaved(false);
    setFollowing(false);
    setCaptionExpanded(false);
  };

  const handleNextShort = () => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 350) return;
    lastScrollTimeRef.current = now;

    resetInteractions();
    setIsSwiping(true);
    setTimeout(() => setIsSwiping(false), 250);
    setCurrentShortIndex((prev) => (prev + 1) % feed.length);
  };

  const handlePrevShort = () => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 350) return;
    lastScrollTimeRef.current = now;

    resetInteractions();
    setIsSwiping(true);
    setTimeout(() => setIsSwiping(false), 250);
    setCurrentShortIndex((prev) => (prev - 1 + feed.length) % feed.length);
  };

  // Wheel Scroll Event Handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) < 15) return;
    if (e.deltaY > 0) {
      handleNextShort(); // Scroll down -> Next video
    } else {
      handlePrevShort(); // Scroll up -> Previous video
    }
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;

    // Minimum swipe distance threshold (35px)
    if (diffY > 35) {
      handleNextShort(); // Swiped up -> Next
    } else if (diffY < -35) {
      handlePrevShort(); // Swiped down -> Previous
    }
    setTouchStartY(null);
  };

  // Keyboard Navigation (Up / Down Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        handleNextShort();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        handlePrevShort();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feed]);

  return (
    <div className="h-full flex flex-col max-w-md mx-auto w-full relative p-2">
      {/* 실제 숏폼 앱 화면을 흉내 낸 피드 컨테이너 (화면 전용, 실제 재생 기능 없음) */}
      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex-1 min-h-0 rounded-3xl overflow-hidden shadow-2xl text-white bg-black border border-black/80 flex flex-col select-none cursor-grab active:cursor-grabbing"
      >
        {/* 영상 프레임 (세로 클립 스틸) */}
        <img
          key={currentShort.id}
          src={currentShort.thumbnail}
          alt=""
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
            isSwiping ? 'scale-[1.04]' : 'scale-100'
          }`}
        />
        {/* 상·하단 UI 가독성용 스크림 */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/75 via-black/25 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* 다음/이전 클립 미리 불러오기 — 스와이프 시 사진이 늦게 뜨는 것을 막는다 */}
        <div className="hidden">
          {[1, -1].map(offset => {
            const preload = feed[(currentShortIndex + offset + feed.length) % feed.length];
            return <img key={`${preload.id}-${offset}`} src={preload.thumbnail} alt="" />;
          })}
        </div>

        {/* 이용 시간 카운트다운 게이지 — 카운트 중일 때만 */}
        {isUsageCounting && (
          <div className="absolute top-0 inset-x-0 z-40 h-1.5 bg-white/15 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                (secondsLeft ?? 30) <= 5
                  ? 'bg-rose-500 animate-pulse'
                  : (secondsLeft ?? 30) <= 10
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, ((secondsLeft ?? 30) / 30) * 100))}%` }}
            />
          </div>
        )}

        {/* 상단 앱 바 — 서비스별 탭 구성 */}
        <div className="relative z-30 pt-4 px-3.5">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onNavigateToScreen('phone-home')}
              className="p-1.5 -ml-1 rounded-full text-white/95 hover:bg-white/10 transition-colors shrink-0"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
            </button>

            {brand.tabs.length > 0 ? (
              <div className="flex items-center gap-4 text-sm">
                {brand.tabs.map(tab => (
                  <span
                    key={tab}
                    className={
                      tab === brand.activeTab
                        ? 'font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                        : 'font-medium text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
                    }
                  >
                    {tab}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-base font-extrabold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {brand.label}
              </span>
            )}

            <div className="flex items-center gap-2.5 shrink-0">
              {currentShort.serviceId === 'youtube' && (
                <Search className="w-5 h-5 text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
              )}
              {currentShort.serviceId === 'instagram' && (
                <Camera className="w-5 h-5 text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
              )}
              {currentShort.serviceId === 'tiktok' && (
                <Search className="w-5 h-5 text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
              )}
              {currentShort.serviceId === 'x-twitter' && (
                <MoreHorizontal className="w-5 h-5 text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
              )}
            </div>
          </div>

          {/* 잠금 전 남은 이용 시간 안내 — 활동 시간 진행 중에만 */}
          {activeSession && secondsLeft !== null && secondsLeft > 0 && (
            <div className="mt-2.5 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-black/70 border border-amber-400/40 px-3 py-1 backdrop-blur-sm shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-bold text-amber-200">활동 모드 실행 중</span>
                <span className="text-[11px] font-mono font-bold text-amber-400">{secondsLeft}초</span>
              </div>
            </div>
          )}
        </div>

        {/* 재생 상태 표시 + 스와이프 힌트 */}
        <div className="relative z-30 flex-1 min-h-0 px-3.5 pt-3">
          <div className="flex flex-col items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-white" />
            </div>
            <span className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono font-semibold text-white/90">
              {currentShort.duration}
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-8 flex flex-col items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-[2px]">
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              위로 스와이프
            </span>

            {/* 피드 내 위치 표시 */}
            {feed.length > 1 && (
              <span className="flex items-center gap-1">
                {feed.map((short, index) => (
                  <span
                    key={short.id}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentShortIndex ? 'w-4 bg-white' : 'w-1 bg-white/50'
                    }`}
                  />
                ))}
              </span>
            )}
          </div>
        </div>

        {/* 오른쪽 액션 레일 */}
        <div className="absolute right-2.5 bottom-28 z-30 flex flex-col items-center gap-4">
          {/* 프로필 + 팔로우 배지 */}
          <button
            type="button"
            onClick={() => setFollowing(prev => !prev)}
            className="relative mb-1"
            aria-label={following ? '팔로우 취소' : brand.followLabel}
          >
            <span className={`flex w-11 h-11 items-center justify-center rounded-full border-2 border-white text-lg ${brand.accent}`}>
              {currentShort.avatar}
            </span>
            <span
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black text-white transition-colors ${
                following ? 'bg-neutral-600' : 'bg-rose-500'
              }`}
            >
              {following ? <BadgeCheck className="w-3 h-3" /> : <Plus className="w-3 h-3" strokeWidth={3} />}
            </span>
          </button>

          <button type="button" onClick={() => setLiked(prev => !prev)} className="flex flex-col items-center gap-0.5">
            <Heart
              className={`w-8 h-8 drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)] transition-transform active:scale-90 ${
                liked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'
              }`}
            />
            <span className="text-[11px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {currentShort.likes}
            </span>
          </button>

          <button type="button" className="flex flex-col items-center gap-0.5">
            <MessageCircle className="w-8 h-8 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)]" />
            <span className="text-[11px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {currentShort.comments}
            </span>
          </button>

          {currentShort.serviceId === 'x-twitter' ? (
            <button type="button" className="flex flex-col items-center gap-0.5">
              <Repeat2 className="w-8 h-8 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)]" />
              <span className="text-[11px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {currentShort.reposts ?? currentShort.shares}
              </span>
            </button>
          ) : (
            <button type="button" onClick={() => setSaved(prev => !prev)} className="flex flex-col items-center gap-0.5">
              <Bookmark
                className={`w-8 h-8 drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)] transition-transform active:scale-90 ${
                  saved ? 'fill-white text-white' : 'text-white'
                }`}
              />
              <span className="text-[11px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {currentShort.saves}
              </span>
            </button>
          )}

          <button type="button" className="flex flex-col items-center gap-0.5">
            <Send className="w-8 h-8 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)]" />
            <span className="text-[11px] font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {currentShort.shares}
            </span>
          </button>

          <button type="button" aria-label="더보기">
            <MoreHorizontal className="w-6 h-6 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.75)]" />
          </button>

          {/* 회전하는 음원 디스크 */}
          <div
            className={`mt-1 w-10 h-10 rounded-full border-2 border-white/25 bg-gradient-to-br from-neutral-700 to-black flex items-center justify-center overflow-hidden ${
              isSwiping ? '' : 'animate-spin-slow'
            }`}
          >
            <span className="text-base">{currentShort.avatar}</span>
          </div>
        </div>

        {/* 하단 게시물 정보 */}
        <div className="relative z-30 px-3.5 pb-2 pr-20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {currentShort.handle}
            </span>
            {currentShort.verified && <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400/20" />}
            <span className="text-white/50 text-xs">·</span>
            <button
              type="button"
              onClick={() => setFollowing(prev => !prev)}
              className={`px-2 py-0.5 rounded-md border text-[11px] font-bold transition-colors ${
                following
                  ? 'border-white/40 text-white/70'
                  : 'border-white text-white hover:bg-white/15'
              }`}
            >
              {following ? '팔로잉' : brand.followLabel}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCaptionExpanded(prev => !prev)}
            className="block w-full text-left"
          >
            <p
              className={`text-[13px] leading-snug whitespace-pre-line break-keep drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${
                captionExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {currentShort.caption}
            </p>
            {!captionExpanded && (
              <span className="text-[11px] font-semibold text-white/70 inline-flex items-center gap-0.5">
                더 보기 <ChevronDown className="w-3 h-3" />
              </span>
            )}
          </button>

          {/* 음원 정보 — 실제 앱처럼 좌우로 흐른다 */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Music2 className="w-3.5 h-3.5 shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
            <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
              <div className="whitespace-nowrap text-[12px] font-medium text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] feed-ticker">
                <span className="pr-8">{currentShort.musicTitle}</span>
                <span className="pr-8">{currentShort.musicTitle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 댓글 입력 바 (표시 전용) */}
        <div className="relative z-30 px-3.5 pb-2">
          <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
            <span className="flex-1 text-[12px] text-white/70">{brand.commentPlaceholder}</span>
            <Heart className="w-4 h-4 text-white/80" />
            <Send className="w-4 h-4 text-white/80" />
          </div>
        </div>

        {/* 영상 진행 바 */}
        <div className="relative z-30 mx-3.5 h-[3px] rounded-full bg-white/25 overflow-hidden">
          <div className="h-full rounded-full bg-white" style={{ width: `${currentShort.progress}%` }} />
        </div>


        {/* 하단 내비게이션 — 서비스별 구성 */}
        <div className="relative z-30 mt-2 border-t border-white/10 bg-black/85 backdrop-blur-md px-2 pt-1.5 pb-2.5 flex items-center justify-around">
          {brand.nav.map((item, index) => {
            const Icon = item.icon;
            const isCreate = item.icon === Plus;
            return (
              <div key={`${item.label}-${index}`} className="flex flex-col items-center gap-0.5">
                {isCreate ? (
                  <span className="flex h-6 w-9 items-center justify-center rounded-md border border-white/70">
                    <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon
                    className={`w-[22px] h-[22px] ${item.active ? 'text-white' : 'text-white/50'}`}
                    strokeWidth={item.active ? 2.6 : 1.9}
                  />
                )}
                {item.label && (
                  <span className={`text-[9px] ${item.active ? 'text-white font-semibold' : 'text-white/50'}`}>
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
