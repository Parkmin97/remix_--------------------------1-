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
