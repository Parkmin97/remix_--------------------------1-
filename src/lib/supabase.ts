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

  // 네트워크가 끊긴 상태. 실기기에서 Wi-Fi 가 꺼져 있거나 SIM 이 없으면
  // 로그인·회원가입이 전부 실패하는데, 예전에는 "Failed to fetch" 같은
  // 영문 원문이 그대로 노출돼 사용자가 앱 고장으로 오해했다.
  if (
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('err_internet_disconnected') ||
    m.includes('err_name_not_resolved')
  ) {
    return '인터넷에 연결되어 있지 않습니다. Wi-Fi 또는 데이터를 켠 뒤 다시 시도해주세요.';
  }

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
 * 로그인한 유저의 Supabase DB에서 일별 리포트 목록을 조회하여 복원한다.
 */
export async function fetchDailyReportsFromSupabase(): Promise<Array<{
  date: string;
  completedFocusMinutes: number;
  confirmedCount: number;
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


/**
 * 회원 탈퇴 — 계정과 서버 데이터를 영구 삭제한다.
 *
 * ⚠️ 로그아웃과 전혀 다르다.
 *    로그아웃(`supabase.auth.signOut`)은 이 기기의 세션만 끊고 계정은 그대로 남아
 *    다시 로그인하면 데이터가 돌아온다.
 *    탈퇴는 daily_reports · lock_histories · session_decisions 의 본인 행과
 *    인증 계정 자체를 지우며, **되돌릴 수 없다.**
 *
 * 계정 삭제는 service_role 권한이 필요하고 그 키는 앱에 둘 수 없으므로,
 * 서버의 Edge Function(`delete-account`)이 대신 수행한다.
 * 함수가 아직 배포되지 않았으면 실패로 돌려준다 — **지우지 못했는데 성공이라고 말하지 않는다.**
 *
 * @returns 성공 여부와, 실패 시 사용자에게 보여줄 한국어 사유
 */
export async function deleteAccountOnServer(): Promise<{ ok: boolean; message?: string }> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      return { ok: false, message: '로그인 상태를 확인하지 못했습니다. 다시 로그인해주세요.' };
    }

    const { data, error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) {
      console.error('[Supabase] 탈퇴 함수 호출 실패:', error.message);
      return {
        ok: false,
        message: '탈퇴 처리에 실패했습니다. 잠시 후 다시 시도하거나 고객센터로 문의해주세요.',
      };
    }

    if (!data?.ok) {
      return {
        ok: false,
        message: (data?.error as string) || '탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.',
      };
    }

    return { ok: true };
  } catch (err) {
    console.error('[Supabase] 탈퇴 처리 예외:', err);
    return { ok: false, message: '네트워크 연결을 확인한 뒤 다시 시도해주세요.' };
  }
}
