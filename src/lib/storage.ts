import { SessionData, DailyReport, BeatType } from '../types';

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

export const getDailyReports = (): DailyReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      // Default sample report data for demonstration
      const defaultReports: DailyReport[] = [
        {
          date: '2026-07-21',
          completedFocusMinutes: 120,
          confirmedCount: 3,
          cancelledCount: 0,
          missionSuccessCount: 2,
          missionFailCount: 0,
          extensionCount: 1,
          conductorRank: '수석 지휘자'
        },
        {
          date: '2026-07-22',
          completedFocusMinutes: 180,
          confirmedCount: 4,
          cancelledCount: 1,
          missionSuccessCount: 3,
          missionFailCount: 1,
          extensionCount: 1,
          conductorRank: '마에스트로'
        },
        {
          date: new Date().toISOString().split('T')[0],
          completedFocusMinutes: 60,
          confirmedCount: 1,
          cancelledCount: 0,
          missionSuccessCount: 1,
          missionFailCount: 0,
          extensionCount: 0,
          conductorRank: '지휘자'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(defaultReports));
      return defaultReports;
    }
    return JSON.parse(raw);
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
      cancelledCount: 0,
      missionSuccessCount: 0,
      missionFailCount: 0,
      extensionCount: 0,
      conductorRank: '신예 지휘자'
    };
    reports.push(todayReport);
  }

  if (wasConfirmed) {
    todayReport.confirmedCount += 1;
    todayReport.completedFocusMinutes += session.focusDurationMinutes;
  }
  if (session.missionSucceeded) {
    todayReport.missionSuccessCount += 1;
  } else if (session.missionAttempted && !session.missionSucceeded) {
    todayReport.missionFailCount += 1;
  }
  if (session.extensionUsed) {
    todayReport.extensionCount += 1;
  }

  // Update Conductor Rank based on total minutes
  if (todayReport.completedFocusMinutes >= 240) {
    todayReport.conductorRank = '오케스트라 총감독';
  } else if (todayReport.completedFocusMinutes >= 180) {
    todayReport.conductorRank = '마에스트로';
  } else if (todayReport.completedFocusMinutes >= 120) {
    todayReport.conductorRank = '수석 지휘자';
  } else {
    todayReport.conductorRank = '지휘자';
  }

  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
};

export const clearAllData = (): void => {
  localStorage.clear();
};
