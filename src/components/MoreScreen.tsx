import React, { useState, useEffect } from 'react';
import { HelpCircle, BarChart3, User as UserIcon, ChevronRight, Camera, LogOut, Loader2, Pencil } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface MoreScreenProps {
  onNavigateToScreen: (screen: string) => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigateToScreen }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showNicknameEdit, setShowNicknameEdit] = useState<boolean>(false);
  const [nicknameInput, setNicknameInput] = useState<string>('');
  const [savingNickname, setSavingNickname] = useState<boolean>(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoggingOut(true);
    // 로그아웃 → App의 onAuthStateChange가 user를 비우면 서비스 게이트(로그인)로 자동 전환된다.
    await supabase.auth.signOut();
    setLoggingOut(false);
    setShowLogoutConfirm(false);
  };

  const openNicknameEdit = () => {
    setNicknameInput(nickname);
    setNicknameError(null);
    setShowNicknameEdit(true);
  };

  const handleSaveNickname = async () => {
    const next = nicknameInput.trim();
    if (!next) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    if (next.length > 20) {
      setNicknameError('닉네임은 20자 이내로 입력해주세요.');
      return;
    }
    setSavingNickname(true);
    setNicknameError(null);
    const { data, error } = await supabase.auth.updateUser({ data: { nickname: next } });
    setSavingNickname(false);
    if (error) {
      setNicknameError('저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (data.user) setUser(data.user);
    setShowNicknameEdit(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const menuSections: Array<{
    title: string;
    items: Array<{ icon: React.ElementType; label: string; badge?: string; target?: string }>;
  }> = [
      {
        title: '서비스 기능',
        items: [
          { icon: BarChart3, label: '디톡스 주간 리포트', target: 'report' },
          { icon: HelpCircle, label: '지휘 동작 연습 튜토리얼', target: 'tutorial' },
        ],
      },
    ];

  const nickname = user?.user_metadata?.nickname || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '클래식 지휘자');
  const email = user?.email || 'user@example.com';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-full flex flex-col justify-start max-w-2xl mx-auto w-full px-4 pt-4 pb-20 gap-4 text-neutral-900">
      {/* 프로필 정보 배너 */}
      <div className="p-4 rounded-3xl bg-neutral-950 ring-1 ring-black/5 shadow-xl flex items-center gap-3 shrink-0">
        {/* 프로필 사진 영역 (왼쪽) */}
        <div className="relative w-12 h-12 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group">
          {avatarUrl ? (
            <img src={avatarUrl} alt="프로필 사진" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-6 h-6 text-amber-400" />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {/* 닉네임 및 이메일 영역 (오른쪽) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white truncate">
              {nickname}
            </h1>
            <button
              onClick={openNicknameEdit}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-400/80 transition-colors shrink-0"
              title="닉네임 수정"
              aria-label="닉네임 수정"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 font-mono truncate mt-0.5">
            {email}
          </p>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs border border-white transition-colors active:scale-95 shadow-md"
        >
          <LogOut className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          <span>로그아웃</span>
        </button>
      </div>

      <div className="space-y-3">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h2 className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider px-2">
              {section.title}
            </h2>
            <div className="bg-neutral-950 ring-1 ring-black/5 rounded-3xl overflow-hidden divide-y divide-neutral-800 shadow-lg">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => { if (item.target) onNavigateToScreen(item.target); }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-neutral-800/60 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-neutral-800/80 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="font-bold text-amber-400 group-hover:text-amber-300 text-sm break-keep">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2.5 py-1 rounded-md bg-white text-black text-[10px] font-extrabold border border-white shadow-sm">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 닉네임 수정 모달 */}
      {showNicknameEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm px-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-amber-500/30 bg-stone-900 p-6 shadow-2xl">
            <div className="flex items-center gap-2 justify-center">
              <Pencil className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-100">닉네임 수정</h2>
            </div>
            <p className="mt-1.5 text-center text-xs text-stone-400 break-keep">
              앱에서 표시될 닉네임을 입력해주세요.
            </p>
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname(); }}
              maxLength={20}
              autoFocus
              placeholder="닉네임"
              className="mt-4 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500 transition-colors"
            />
            {nicknameError && (
              <p className="mt-2 text-xs text-rose-400 break-keep">{nicknameError}</p>
            )}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setShowNicknameEdit(false)}
                disabled={savingNickname}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold border border-stone-700 transition-colors disabled:opacity-60"
              >
                취소
              </button>
              <button
                onClick={handleSaveNickname}
                disabled={savingNickname}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {savingNickname ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm px-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-amber-500/30 bg-stone-900 p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/15 text-rose-400">
              <LogOut className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-serif text-lg font-bold text-amber-100 break-keep">로그아웃하시겠어요?</h2>
            <p className="mt-1.5 text-xs leading-snug text-stone-400 break-keep">
              로그아웃하면 로그인 화면으로 돌아갑니다.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold border border-stone-700 transition-colors disabled:opacity-60"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
