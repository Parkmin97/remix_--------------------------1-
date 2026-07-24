import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, BarChart3, Bell, User as UserIcon, ChevronRight, Shield, Volume2, Camera, LogOut, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface MoreScreenProps {
  onNavigateToScreen: (screen: string) => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigateToScreen }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    // 로그아웃 → App의 onAuthStateChange가 user를 비우면 서비스 게이트(로그인)로 자동 전환된다.
    await supabase.auth.signOut();
    setLoggingOut(false);
    setShowLogoutConfirm(false);
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
        { icon: BarChart3, label: '디톡스 일간/주간 리포트', badge: '기록', target: 'report' },
        { icon: HelpCircle, label: '지휘 동작 연습 튜토리얼', badge: '연습', target: 'tutorial' },
      ],
    },
    {
      title: '앱 환경 설정',
      items: [
        { icon: Settings, label: '알림 및 개입 모드 설정' },
        { icon: Volume2, label: '오디오 및 클래식 지휘음 설정' },
        { icon: Bell, label: '소프트 차단 강도 조절' },
      ],
    },
    {
      title: '계정 및 정보',
      items: [
        { icon: UserIcon, label: '프로필 관리' },
        { icon: Shield, label: '개인정보 처리방침' },
      ],
    },
  ];

  const nickname = user?.user_metadata?.nickname || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '클래식 지휘자');
  const email = user?.email || 'user@example.com';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-full flex flex-col justify-center max-w-2xl mx-auto w-full px-4 py-4 gap-4 text-stone-100">
      {/* 프로필 정보 배너 */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 border border-amber-500/40 shadow-xl flex items-center gap-3 shrink-0">
        {/* 프로필 사진 영역 (왼쪽) */}
        <div className="relative w-12 h-12 rounded-full bg-amber-500/10 border-2 border-amber-400/50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group">
          {avatarUrl ? (
            <img src={avatarUrl} alt="프로필 사진" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-6 h-6 text-amber-300" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="w-4 h-4 text-amber-200" />
          </div>
        </div>

        {/* 닉네임 및 이메일 영역 (오른쪽) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-amber-100 truncate">
              {nickname}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
              마에스트로
            </span>
          </div>
          <p className="text-xs text-stone-300/90 font-mono truncate mt-0.5">
            {email}
          </p>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/80 hover:bg-rose-950/60 text-stone-300 hover:text-rose-300 text-xs font-semibold border border-stone-700 hover:border-rose-800 transition-colors active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>로그아웃</span>
        </button>
      </div>

      <div className="space-y-3">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h2 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider px-2">
              {section.title}
            </h2>
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden divide-y divide-stone-800 shadow-lg">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => { if (item.target) onNavigateToScreen(item.target); }}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-stone-800/60 transition-all text-xs text-stone-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium group-hover:text-amber-200 break-keep">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-stone-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
