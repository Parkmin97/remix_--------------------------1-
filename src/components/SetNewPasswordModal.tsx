import React, { useState } from 'react';
import { Lock, CheckCircle2, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase, toKoreanAuthError } from '../lib/supabase';

interface SetNewPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SetNewPasswordModal: React.FC<SetNewPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(toKoreanAuthError(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl text-center">
        {isSuccess ? (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-amber-100 font-serif">비밀번호 변경 완료</h3>
            <p className="text-xs text-stone-400">
              새로운 비밀번호로 안전하게 변경되었습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 mb-3 shadow-md">
              <KeyRound className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-amber-100 font-serif">새 비밀번호 설정</h3>
            <p className="text-xs text-stone-400 mt-1 mb-5">
              새로 사용할 비밀번호(6자 이상)를 입력해주세요.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (6자 이상)"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-10 pr-10 text-sm text-stone-100 placeholder-stone-500 outline-none transition-colors focus:border-amber-500/60"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 확인"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-10 pr-3 text-sm text-stone-100 placeholder-stone-500 outline-none transition-colors focus:border-amber-500/60"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 text-sm font-black text-stone-950 transition-all hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '비밀번호 변경하기'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
