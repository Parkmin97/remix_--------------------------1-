import { SessionData, DailyReport, BeatType } from '../types';
import { syncDailyReportToSupabase, fetchDailyReportsFromSupabase } from './supabase';

const STORAGE_KEYS = {
  ACTIVE_SESSION: 'life_conductor_active_session',
  REPORTS: 'life_conductor_daily_reports',
  ONBOARDING_DONE: 'life_conductor_onboarding_done',
  SOUND_MUTED: 'life_conductor_sound_muted',
};

export const getStoredActiveSession = (): SessionData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!raw) return null;
    const session: SessionData = JSON.parse(raw);
    
    // Check if expired
    const now = new Date().getTime();
    const focusEnd = new Date(session.focusEndsAt).getTime();
    
    if (session.state !== 'COMPLETED' && session.state !== 'CANCELLED' && now >= focusEnd) {
      session.state = 'COMPLETED';
      saveActiveSession(session);
    }
    
    return session;
  } catch {
    return null;
  }
};

export const saveActiveSession = (session: SessionData | null): void => {
  if (!session) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  }
};

export const getOnboardingCompleted = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE) === 'true';
};

export const setOnboardingCompleted = (done: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, done ? 'true' : 'false');
};

export const getSoundMuted = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) === 'true';
};

export const setSoundMuted = (muted: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, muted ? 'true' : 'false');
};

/**
 * 저장된 일별 리포트를 돌려준다.
 *
 * ⚠️ 예전에는 여기서 하드코딩 시드 데이터와 날짜 해시 기반의 가짜 리포트를 만들어냈다.
 *    사용자가 무엇을 했든 같은 숫자가 나오는 값이라 리포트를 믿을 수 없었다. 전부 제거했다.
 *    기록이 없으면 빈 배열이다. 화면에서 빈 상태로 보여줄 것.
 */
export const getDailyReports = (): DailyReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const stored: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(stored) ? (stored as DailyReport[]) : [];
  } catch {
    return [];
  }
};

export const addCompletedSessionToReport = (session: SessionData, wasConfirmed: boolean): void => {
  const reports = getDailyReports();
  const todayStr = new Date().toISOString().split('T')[0];
  let todayReport = reports.find(r => r.date === todayStr);

  if (!todayReport) {
    todayReport = {
      date: todayStr,
      completedFocusMinutes: 0,
      confirmedCount: 0,
      totalSnsMinutes: 0,
      cancelledCount: 0,
      missionSuccessCount: 0,
      missionFailCount: 0,
      extensionCount: 0,
    };
    reports.push(todayReport);
  }

  if (wasConfirmed) {
    todayReport.confirmedCount += 1;

    // ⚠️ 여기서 시간을 더하지 않는다.
    //
    // 예전에는 `focusDurationMinutes`(설정한 시간)를 그대로 더했다.
    // 60분 잠금을 걸고 10분 만에 미션으로 풀어도 60분 지켜낸 것으로 기록돼
    // 리포트가 실제보다 부풀려졌다.
    //
    // 실제 유지 시간은 네이티브가 세션 종료 시점에 기록한다(LockHistoryStore).
    // 웹에는 그 값이 없으므로, 모르는 값을 지어내느니 **횟수만 세는 편이 정직하다.**
    // 리포트는 네이티브 이력을 우선 쓰고, 그게 없을 때만 이 값으로 폴백한다.
  }
  if (session.missionSucceeded) {
    todayReport.missionSuccessCount += 1;
  } else if (session.missionAttempted && !session.missionSucceeded) {
    todayReport.missionFailCount += 1;
  }
  if (session.extensionUsed) {
    todayReport.extensionCount += 1;
  }

  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  syncDailyReportToSupabase(todayReport);
};

/**
 * Supabase DB에 저장된 유저의 이전 일별 리포트를 가져와 localStroage에 안전하게 복원/병합한다.
 */
export const syncReportsFromSupabase = async (): Promise<boolean> => {
  try {
    const remoteReports = await fetchDailyReportsFromSupabase();
    if (!remoteReports || remoteReports.length === 0) return false;

    const localReports = getDailyReports();
    const reportMap = new Map<string, DailyReport>();

    // 원격 서버 데이터 우선 적용
    for (const r of remoteReports) {
      reportMap.set(r.date, r);
    }

    // 로컬 전용 데이터가 있다면 병합
    for (const r of localReports) {
      if (!reportMap.has(r.date)) {
        reportMap.set(r.date, r);
      }
    }

    const mergedReports = Array.from(reportMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(mergedReports));
    return true;
  } catch (err) {
    console.warn('[storage] Supabase 리포트 복원 실패:', err);
    return false;
  }
};

export const clearAllData = (): void => {
  localStorage.clear();
};
