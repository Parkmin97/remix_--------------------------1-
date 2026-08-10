import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 클라이언트 (브라우저용).
 *
 * URL 과 anon(공개) 키는 원래 클라이언트 번들에 노출되도록 설계된 "공개 값"입니다.
 * 데이터 보호는 키 비밀이 아니라 Supabase의 RLS(Row Level Security)가 담당합니다.
 * 따라서 아래 기본값(fallback)을 코드에 두어, 배포 환경에 VITE_ 환경변수가
 * 주입되지 않아도 항상 로그인/회원가입이 동작하도록 합니다.
 *
 * 우선순위: .env 의 VITE_ 값 → 없으면 아래 기본값.
 * ⚠️ service_role(secret) 키는 절대 여기에 넣지 마세요 (브라우저에 노출됨).
 */
const FALLBACK_SUPABASE_URL = 'https://csknuhtxpoqezudwqntf.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNza251aHR4cG9xZXp1ZHdxbnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Njk2NTgsImV4cCI6MjEwMDQ0NTY1OH0.kIzQxsdVnEmz0pj63JO9TpKbmh_H8wjtoYCymrskB30';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Supabase Auth 에러 메시지를 한국어로 보기 좋게 변환한다. */
export function toKoreanAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (m.includes('email not confirmed')) return '이메일 인증이 완료되지 않았습니다. 메일함의 확인 링크를 눌러주세요.';
  if (m.includes('user already registered')) return '이미 가입된 이메일입니다. 로그인해주세요.';
  if (m.includes('password should be at least')) return '비밀번호는 최소 6자 이상이어야 합니다.';
  if (m.includes('unable to validate email address') || m.includes('invalid email')) return '이메일 형식이 올바르지 않습니다.';
  if (m.includes('rate limit') || m.includes('too many')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  return message;
}

/**
 * 미션 성공 후 유저의 행동 선택(성공 후 사용 참음 vs 완전 해제)을 Supabase DB에 백업한다.
 * 로그인되지 않았거나 네트워크가 안 될 경우 에러 없이 안전하게 넘어간다.
 */
export async function syncSessionDecisionToSupabase(params: {
  sessionId: string;
  focusTask?: string;
  choseNotToUse: boolean;
}): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const user = authData.session?.user;
    if (!user) return false;

    const { error } = await supabase.from('session_decisions').upsert(
      {
        user_id: user.id,
        session_id: params.sessionId,
        focus_task: params.focusTask || null,
        chose_not_to_use: params.choseNotToUse,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_id' }
    );

    if (error) {
      console.warn('[Supabase] 세션 선택 백업 실패 (테이블 미생성일 수 있음):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] 세션 선택 백업 중 예외 발생:', err);
    return false;
  }
}

/**
 * 일별 리포트(DailyReport) 데이터를 Supabase DB에 동기화 백업한다.
 */
export async function syncDailyReportToSupabase(report: {
  date: string;
  completedFocusMinutes: number;
  confirmedCount: number;
  totalSnsMinutes?: number;
  cancelledCount: number;
  missionSuccessCount: number;
  missionFailCount: number;
  extensionCount: number;
}): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const user = authData.session?.user;
    if (!user) return false;

    const { error } = await supabase.from('daily_reports').upsert(
      {
        user_id: user.id,
        date: report.date,
        completed_focus_minutes: report.completedFocusMinutes,
        confirmed_count: report.confirmedCount,
        total_sns_minutes: report.totalSnsMinutes || 0,
        cancelled_count: report.cancelledCount,
        mission_success_count: report.missionSuccessCount,
        mission_fail_count: report.missionFailCount,
        extension_count: report.extensionCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    );

    if (error) {
      console.warn('[Supabase] 일별 리포트 백업 실패:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] 일별 리포트 백업 중 예외 발생:', err);
    return false;
  }
}

/**
 * 잠금 이력(LockHistoryEntry) 데이터를 Supabase DB에 동기화 백업한다.
 */
export async function syncLockHistoryToSupabase(history: {
  sessionId: string;
  date: string;
  startedAt: number;
  endedAt: number;
  heldMinutes: number;
  plannedMinutes: number;
  endReason: string;
  blockedAppCount: number;
  launchAttempts: number;
}): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const user = authData.session?.user;
    if (!user) return false;

    const { error } = await supabase.from('lock_histories').upsert(
      {
        user_id: user.id,
        session_id: history.sessionId,
        date: history.date,
        started_at: history.startedAt,
        ended_at: history.endedAt,
        held_minutes: history.heldMinutes,
        planned_minutes: history.plannedMinutes,
        end_reason: history.endReason,
        blocked_app_count: history.blockedAppCount,
        launch_attempts: history.launchAttempts,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_id' }
    );

    if (error) {
      console.warn('[Supabase] 잠금 이력 백업 실패:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] 잠금 이력 백업 중 예외 발생:', err);
    return false;
  }
}

/**
 * 로그인한 유저의 Supabase DB에서 일별 리포트 목록을 조회하여 복원한다.
 */
export async function fetchDailyReportsFromSupabase(): Promise<Array<{
  date: string;
  completedFocusMinutes: number;
  confirmedCount: number;
  totalSnsMinutes?: number;
  cancelledCount: number;
  missionSuccessCount: number;
  missionFailCount: number;
  extensionCount: number;
}>> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const user = authData.session?.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.warn('[Supabase] 일별 리포트 조회 실패:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map(row => ({
      date: row.date,
      completedFocusMinutes: row.completed_focus_minutes || 0,
      confirmedCount: row.confirmed_count || 0,
      totalSnsMinutes: row.total_sns_minutes || 0,
      cancelledCount: row.cancelled_count || 0,
      missionSuccessCount: row.mission_success_count || 0,
      missionFailCount: row.mission_fail_count || 0,
      extensionCount: row.extension_count || 0,
    }));
  } catch (err) {
    console.warn('[Supabase] 일별 리포트 조회 예외 발생:', err);
    return [];
  }
}

