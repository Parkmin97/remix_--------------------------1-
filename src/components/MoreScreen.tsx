import React from 'react';
import { Settings, HelpCircle, BarChart3, Bell, User, ChevronRight, Shield, Volume2 } from 'lucide-react';

export const MoreScreen: React.FC = () => {
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
        { icon: User, label: '프로필 관리' },
        { icon: Shield, label: '개인정보 처리방침' },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 text-stone-100 pb-24">
      <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 border border-amber-500/40 shadow-xl space-y-2">
        <h1 className="text-xl font-serif font-bold text-amber-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span>더보기</span>
        </h1>
        <p className="text-xs text-stone-300">
          앱의 추가 기능과 환경 설정을 관리하실 수 있습니다.
        </p>
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
