import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, BarChart3, Bell, User as UserIcon, ChevronRight, Shield, Volume2, Camera } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const MoreScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const menuSections = [
    {
      title: '서비스 기능',
      items: [
        { icon: BarChart3, label: '디톡스 일간/주간 리포트', badge: '기록' },
        { icon: HelpCircle, label: '지휘 동작 연습 튜토리얼', badge: '연습' },
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-stone-100 pb-24">
      {/* 프로필 정보 배너 */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 border border-amber-500/40 shadow-xl flex items-center gap-4">
        {/* 프로필 사진 영역 (왼쪽) */}
        <div className="relative w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-400/50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group">
          {avatarUrl ? (
            <img src={avatarUrl} alt="프로필 사진" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-7 h-7 text-amber-300" />
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
      </div>

      <div className="space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider px-2">
              {section.title}
            </h2>
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden divide-y divide-stone-800 shadow-lg">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-stone-800/60 transition-all text-xs text-stone-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium group-hover:text-amber-200">{item.label}</span>
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
    </div>
  );
};
