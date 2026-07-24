import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 클라이언트 (브라우저용).
 * 공개(anon) 키만 사용하므로 프론트엔드에 노출되어도 안전합니다.
 * 값은 .env 의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 에서 주입됩니다.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // 값이 비어 있어도 앱이 죽지 않게 경고만 남긴다.
  console.warn(
    '[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다. .env 파일을 확인하세요.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

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
