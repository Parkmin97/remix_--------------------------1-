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
  const defaultReports: DailyReport[] = [
    // Week 1: 2026.06.29 ~ 2026.07.05
    { date: '2026-06-29', completedFocusMinutes: 60, confirmedCount: 1, totalSnsMinutes: 15, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-06-30', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-01', completedFocusMinutes: 90, confirmedCount: 2, totalSnsMinutes: 30, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-02', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-03', completedFocusMinutes: 45, confirmedCount: 1, totalSnsMinutes: 15, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-04', completedFocusMinutes: 120, confirmedCount: 2, totalSnsMinutes: 30, cancelledCount: 0, missionSuccessCount: 2, missionFailCount: 0, extensionCount: 1, conductorRank: '수석 지휘자' },
    { date: '2026-07-05', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },

    // Week 2: 2026.07.06 ~ 2026.07.12
    { date: '2026-07-06', completedFocusMinutes: 90, confirmedCount: 2, totalSnsMinutes: 30, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-07', completedFocusMinutes: 150, confirmedCount: 3, totalSnsMinutes: 45, cancelledCount: 0, missionSuccessCount: 2, missionFailCount: 0, extensionCount: 1, conductorRank: '수석 지휘자' },
    { date: '2026-07-08', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-09', completedFocusMinutes: 60, confirmedCount: 1, totalSnsMinutes: 15, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-10', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-11', completedFocusMinutes: 90, confirmedCount: 2, totalSnsMinutes: 30, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-12', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },

    // Week 3: 2026.07.13 ~ 2026.07.19
    { date: '2026-07-13', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-14', completedFocusMinutes: 60, confirmedCount: 1, totalSnsMinutes: 15, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-15', completedFocusMinutes: 120, confirmedCount: 2, totalSnsMinutes: 30, cancelledCount: 0, missionSuccessCount: 2, missionFailCount: 0, extensionCount: 0, conductorRank: '수석 지휘자' },
    { date: '2026-07-16', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-17', completedFocusMinutes: 45, confirmedCount: 1, totalSnsMinutes: 15, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-18', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-19', completedFocusMinutes: 90, confirmedCount: 2, totalSnsMinutes: 30, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },

    // Week 4: 2026.07.20 ~ 2026.07.26
    { date: '2026-07-20', completedFocusMinutes: 60, confirmedCount: 1, totalSnsMinutes: 15, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-21', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-22', completedFocusMinutes: 120, confirmedCount: 2, totalSnsMinutes: 30, cancelledCount: 0, missionSuccessCount: 2, missionFailCount: 0, extensionCount: 1, conductorRank: '수석 지휘자' },
    { date: '2026-07-23', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-24', completedFocusMinutes: 90, confirmedCount: 2, totalSnsMinutes: 20, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
    { date: '2026-07-25', completedFocusMinutes: 0, confirmedCount: 0, totalSnsMinutes: 0, cancelledCount: 0, missionSuccessCount: 0, missionFailCount: 0, extensionCount: 0, conductorRank: '신예 지휘자' },
    { date: '2026-07-26', completedFocusMinutes: 60, confirmedCount: 1, totalSnsMinutes: 15, cancelledCount: 0, missionSuccessCount: 1, missionFailCount: 0, extensionCount: 0, conductorRank: '지휘자' },
  ];

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const stored: DailyReport[] = raw ? JSON.parse(raw) : [];

    // 특정 날짜(dateStr: YYYY-MM-DD)에 대해 일관되지만 시뮬레이션된 랜덤 데이터 생성 함수
    const generateSyntheticReport = (dateStr: string): DailyReport => {
      // 날짜 문자열을 시드(hash)값으로 전환
      let hash = 0;
      for (let i = 0; i < dateStr.length; i++) {
        hash = (hash << 5) - hash + dateStr.charCodeAt(i);
        hash |= 0;
      }
      const absHash = Math.abs(hash);

      // 약 65% 확률로 잠금/지휘 사용한 날로 설정
      const used = (absHash % 100) < 65;
      if (!used) {
        return {
          date: dateStr,
          completedFocusMinutes: 0,
          confirmedCount: 0,
          totalSnsMinutes: 0,
          cancelledCount: 0,
          missionSuccessCount: 0,
          missionFailCount: 0,
          extensionCount: 0,
          conductorRank: '신예 지휘자',
        };
      }

      // 사용한 날의 집중시간 (30, 45, 60, 90, 120, 150, 180분 중 하나)
      const focusOptions = [30, 45, 60, 90, 120, 150, 180];
      const completedFocusMinutes = focusOptions[absHash % focusOptions.length];
      
      // SNS 사용시간 (0, 15, 30, 45, 60분 중 하나)
      const snsOptions = [0, 15, 30, 45, 60];
      const totalSnsMinutes = snsOptions[(absHash >> 3) % snsOptions.length];

      const confirmedCount = Math.max(1, Math.floor(completedFocusMinutes / 45));
      const missionSuccessCount = Math.max(1, Math.floor(confirmedCount * 0.8));

      let conductorRank: DailyReport['conductorRank'] = '신예 지휘자';
      if (completedFocusMinutes >= 180) conductorRank = '마에스트로';
      else if (completedFocusMinutes >= 120) conductorRank = '수석 지휘자';
      else if (completedFocusMinutes >= 60) conductorRank = '지휘자';

      return {
        date: dateStr,
        completedFocusMinutes,
        confirmedCount,
        totalSnsMinutes,
        cancelledCount: 0,
        missionSuccessCount,
        missionFailCount: 0,
        extensionCount: (absHash % 3 === 0) ? 1 : 0,
        conductorRank,
      };
    };

    // 병합: 저장된 리포트를 우선하고, 없는 날짜는 동적 생성을 지원할 수 있도록 만듦
    const map = new Map<string, DailyReport>();
    defaultReports.forEach(r => map.set(r.date, r));
    stored.forEach(r => map.set(r.date, { ...map.get(r.date), ...r }));

    // 최근 1년간(과거 및 미래 범위)의 날짜에 대해 기본 리포트가 없으면 동적 리포트 생성 보장
    const today = new Date();
    for (let d = -180; d <= 180; d++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() + d);
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      if (!map.has(dateStr)) {
        map.set(dateStr, generateSyntheticReport(dateStr));
      }
    }

    return Array.from(map.values());
  } catch {
    return defaultReports;
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
      conductorRank: '신예 지휘자'
    };
    reports.push(todayReport);
  }

  if (wasConfirmed) {
    todayReport.confirmedCount += 1;
    todayReport.completedFocusMinutes += session.focusDurationMinutes;
    if (session.mode === 'GUIDED_USE' && session.usageLimitMinutes) {
      todayReport.totalSnsMinutes = (todayReport.totalSnsMinutes || 0) + session.usageLimitMinutes;
    }
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
