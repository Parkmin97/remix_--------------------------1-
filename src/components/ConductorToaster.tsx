import React from 'react';
import { Toaster } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * 앱 전역 토스트 계층.
 * 브랜드 토큰(stone 베이스 + amber 강조)과 라운드 스케일을 여기 한 곳에서 고정한다.
 * 개별 화면이 토스트 모양을 다시 정의하지 않도록 하는 것이 목적이다.
 */
export const ConductorToaster: React.FC = () => (
  <Toaster
    theme="dark"
    position="top-center"
    gap={8}
    visibleToasts={3}
    duration={2600}
    offset={{ top: 76 }}
    mobileOffset={{ top: 72, left: 12, right: 12 }}
    containerAriaLabel="지휘 알림"
    icons={{
      success: <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
      error: <AlertCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />,
      warning: <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />,
      info: <Info className="w-4 h-4 text-stone-300" aria-hidden="true" />,
    }}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          'w-full flex items-center gap-2.5 rounded-xl border border-stone-700/80 bg-stone-950/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md',
        title: 'text-[12px] font-bold leading-snug text-stone-100 break-keep',
        description: 'text-[11px] leading-snug text-stone-400 break-keep',
        icon: 'shrink-0 text-amber-400',
        closeButton:
          'rounded-lg border border-stone-700 bg-stone-900 text-stone-300 hover:text-stone-100',
      },
    }}
  />
);

export default ConductorToaster;
