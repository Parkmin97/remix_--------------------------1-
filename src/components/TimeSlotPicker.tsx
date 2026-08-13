import React, { useRef, useEffect } from 'react';

/**
 * 정식 출시 전까지만 쓰는 테스트용 임시 시간 옵션(분).
 *
 * 잠금이 실제로 걸리고 풀리는지 확인하려면 최소 15분을 기다려야 해서
 * 실기기 검증이 사실상 불가능하다. 그래서 1분을 임시로 열어둔다.
 * **출시 전에 이 배열을 비우면** 원래 최소 시간 규칙으로 그대로 돌아간다.
 */
export const TEST_EXTRA_MINUTES: number[] = [1];

interface TimeSlotPickerProps {
  value: number; // minutes, e.g. 5, 10, 15...
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  heightPx?: number; // overall wheel height; compact frames pass a smaller value
  /** min 아래로 추가할 값들(분). 테스트용 1분처럼 규칙 밖의 값을 끼워 넣는 용도. */
  extraOptions?: number[];
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  value,
  onChange,
  min = 5,
  max = 480,
  step = 5,
  heightPx = 160,
  extraOptions = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate options list based on min, max, step
  const options: number[] = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
  }
  // 규칙 밖 값(테스트용 1분 등)을 앞에 붙인다. 중복·범위 밖 값은 걸러내고 오름차순 유지.
  if (extraOptions.length > 0) {
    for (const extra of extraOptions) {
      if (extra > 0 && extra <= max && !options.includes(extra)) {
        options.push(extra);
      }
    }
    options.sort((a, b) => a - b);
  }

  const ITEM_HEIGHT = 40; // Height of each slot item in px
  const padY = (heightPx - ITEM_HEIGHT) / 2; // centers the selected item in the wheel

  useEffect(() => {
    if (containerRef.current) {
      const index = options.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * ITEM_HEIGHT;
      }
    }
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
    const selectedVal = options[clampedIndex];
    if (selectedVal !== undefined && selectedVal !== value) {
      onChange(selectedVal);
    }
  };

  const formatLabel = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainderMins = mins % 60;

    if (hours > 0 && remainderMins > 0) {
      return `${hours}시간 ${remainderMins}분`;
    } else if (hours > 0) {
      return `${hours}시간`;
    }
    return `${mins}분`;
  };

  return (
    <div className="relative w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center select-none" style={{ height: heightPx }}>
      {/* Top & Bottom Gradient Overlay for Slot Machine Wheel Blur Effect */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-slate-50 via-slate-50/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent z-10 pointer-events-none" />

      {/* Center Highlight Slot (검은색 하이라이트) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 h-[40px] bg-black border border-black rounded-xl pointer-events-none z-0 shadow-md" />

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
        style={{ scrollSnapType: 'y mandatory', paddingTop: padY, paddingBottom: padY }}
      >
        {options.map((mins) => {
          const isSelected = mins === value;
          return (
            <div
              key={mins}
              onClick={() => {
                onChange(mins);
                const index = options.indexOf(mins);
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    top: index * ITEM_HEIGHT,
                    behavior: 'smooth',
                  });
                }
              }}
              className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 relative z-10 ${isSelected
                  ? 'text-white font-extrabold text-base scale-105 drop-shadow-sm'
                  : 'text-slate-500 text-xs hover:text-black'
                }`}
            >
              <span>{formatLabel(mins)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
