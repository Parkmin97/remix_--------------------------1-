import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Mail, Lock, LogIn, UserPlus, LogOut, CheckCircle2, Loader2, Music } from 'lucide-react';
import { supabase, toKoreanAuthError, isSupabaseConfigured } from '../lib/supabase';

interface LoginScreenProps {
  user: User | null;
  onNavigateToScreen: (screen: string) => void;
}

type Mode = 'login' | 'signup';

export const LoginScreen: React.FC<LoginScreenProps> = ({ user, onNavigateToScreen }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        // 성공 시 App의 onAuthStateChange가 user를 갱신 → 홈으로 이동
        onNavigateToScreen('home');
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.session) {
          // 이메일 확인이 꺼져 있으면 바로 로그인됨
          onNavigateToScreen('home');
        } else {
          setInfo('가입 확인 메일을 보냈습니다. 메일함에서 링크를 눌러 인증을 완료해주세요.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(toKoreanAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    resetMessages();
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  /* -------------------- 로그인 완료 상태 -------------------- */
  if (user) {
    return (
      <div className="h-full flex items-center justify-center mx-auto w-full max-w-md px-4 py-4">
        <div className="w-full rounded-3xl border border-amber-500/20 bg-stone-900/60 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold text-amber-100">로그인 완료</h2>
          <p className="mt-2 text-sm text-stone-400">
            <span className="font-semibold text-amber-200">{user.email}</span> 님으로<br />
            내인생 지휘자에 로그인되어 있습니다.
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={() => onNavigateToScreen('home')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-amber-400"
            >
              <Music className="h-4 w-4" /> 디톡스 시작하기
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-800 bg-stone-900 py-3 text-sm font-semibold text-stone-300 transition-colors hover:bg-stone-800 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              로그아웃
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- 로그인 / 회원가입 폼 -------------------- */
  return (
    <div className="h-full flex items-center justify-center mx-auto w-full max-w-md px-4 py-4">
      <div className="w-full rounded-3xl border border-amber-500/20 bg-stone-900/60 p-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 font-serif text-xl text-amber-300">
            𝄞
          </div>
          <h2 className="mt-3 font-serif text-2xl font-bold text-amber-100 break-keep">
            {mode === 'login' ? '다시 오신 걸 환영합니다' : '내인생 지휘자 시작하기'}
          </h2>
          <p className="mt-1.5 text-sm text-stone-400">
            {mode === 'login' ? '이메일로 로그인하세요.' : '이메일로 간단히 가입하세요.'}
          </p>
        </div>

        {/* 탭 */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-stone-950 p-1">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); resetMessages(); }}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === m ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-amber-200'
              }`}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full rounded-xl border border-stone-800 bg-stone-950 py-3 pl-10 pr-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition-colors focus:border-amber-500/60"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'login' ? '비밀번호' : '비밀번호 (6자 이상)'}
              className="w-full rounded-xl border border-stone-800 bg-stone-950 py-3 pl-10 pr-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition-colors focus:border-amber-500/60"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>
          )}
          {info && (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 text-sm font-black text-stone-950 transition-all hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'login' ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {!isSupabaseConfigured && (
          <p className="mt-4 text-center text-[11px] text-rose-400">
            Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.
          </p>
        )}

        <p className="mt-5 text-center text-xs text-stone-500">
          {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetMessages(); }}
            className="font-semibold text-amber-300 hover:underline"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  );
};
