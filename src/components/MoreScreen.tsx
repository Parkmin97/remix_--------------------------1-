import React, { useState, useEffect } from 'react';
import { HelpCircle, BarChart3, Settings, User as UserIcon, ChevronRight } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface MoreScreenProps {
  onNavigateToScreen: (screen: string) => void;
  lockRunning?: boolean;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigateToScreen }) => {
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

  const menuSections: Array<{
    title: string;
    items: Array<{ icon: React.ElementType; label: string; badge?: string; target?: string }>;
  }> = [
    {
      title: '서비스 기능',
      items: [
        { icon: BarChart3, label: '디톡스 주간 리포트', target: 'report' },
        { icon: HelpCircle, label: '지휘 동작 튜토리얼', target: 'tutorial' },
        { icon: HelpCircle, label: '자주 묻는 질문 (FAQ)', target: 'faq' },
        { icon: Settings, label: '설정 및 서비스 정보', target: 'settings' },
      ],
    },
  ];

  const nickname = user?.user_metadata?.nickname || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : '클래식 지휘자');
  const email = user?.email || 'user@example.com';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-full flex flex-col justify-start max-w-2xl mx-auto w-full px-4 pt-4 pb-20 gap-4 text-black">
      {/* 프로필 정보 배너 (검은색 배경, 흰색 텍스트 - 딱 닉네임, 이메일, 프로필 사진만 표시) */}
      <div className="p-4 rounded-3xl bg-black text-white border border-black shadow-xl flex items-center gap-3 shrink-0">
        {/* 프로필 사진 영역 */}
        <div className="relative w-12 h-12 rounded-full bg-neutral-900 border-2 border-[#FE9A00] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
          {avatarUrl ? (
            <img src={avatarUrl} alt="프로필 사진" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-6 h-6 text-[#FE9A00]" />
          )}
        </div>

        {/* 닉네임 및 이메일 영역 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">
            {nickname}
          </h1>
          <p className="text-xs text-neutral-400 font-mono truncate mt-0.5">
            {email}
          </p>
        </div>
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
    </div>
  );
};
