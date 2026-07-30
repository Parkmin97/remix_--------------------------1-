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
    <div className="min-h-full flex flex-col justify-start max-w-2xl mx-auto w-full px-4 pt-4 pb-20 gap-4 text-black">
      {/* 프로필 정보 배너 (검은색 배경, 흰색 텍스트) */}
      <div className="p-4 rounded-3xl bg-black text-white border border-black shadow-xl flex items-center gap-3 shrink-0">
        {/* 프로필 사진 영역 (왼쪽) */}
        <div className="relative w-12 h-12 rounded-full bg-neutral-900 border-2 border-[#FE9A00] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group">
          {avatarUrl ? (
            <img src={avatarUrl} alt="프로필 사진" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-6 h-6 text-[#FE9A00]" />
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-4 h-4 text-[#FE9A00]" />
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
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-[#FE9A00] border border-neutral-700 transition-colors shrink-0"
              title="닉네임 수정"
              aria-label="닉네임 수정"
            >
              <Pencil className="w-3.5 h-3.5 text-[#FE9A00]" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 font-mono truncate mt-0.5">
            {email}
          </p>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs border border-neutral-800 transition-colors active:scale-95 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5 text-[#FE9A00] stroke-[2.5]" />
          <span>로그아웃</span>
        </button>
      </div>

      <div className="space-y-3">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h2 className="text-[11px] font-bold text-black/60 uppercase tracking-wider px-2">
              {section.title}
            </h2>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-100 shadow-lg">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => { if (item.target) onNavigateToScreen(item.target); }}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-black hover:text-white transition-all text-xs group active:bg-black active:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FE9A00]/15 border border-[#FE9A00]/40 flex items-center justify-center text-[#FE9A00] shrink-0 group-hover:bg-[#FE9A00] group-hover:text-black group-active:bg-[#FE9A00] group-active:text-black transition-all">
                        <Icon className="w-4 h-4 text-[#FE9A00] group-hover:text-black group-active:text-black transition-colors" />
                      </div>
                      <span className="font-bold text-black group-hover:text-white group-active:text-white text-sm break-keep transition-colors">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2.5 py-1 rounded-md bg-[#FE9A00] text-black text-[10px] font-extrabold border border-[#e08800] shadow-sm">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-active:text-white group-hover:translate-x-0.5 transition-all" />
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
