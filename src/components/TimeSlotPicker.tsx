import React, { useRef, useEffect } from 'react';

/**
 * 정식 출시 전까지만 쓰는 테스트용 임시 시간 옵션(분).
 */
export const TEST_EXTRA_MINUTES: number[] = [];

interface TimeSlotPickerProps {
  value: number; // total minutes (e.g. 0, 5, 10, 60, 90...)
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  heightPx?: number;
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
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  // Hours options: 0 ~ 12
  const maxHours = Math.min(12, Math.floor(max / 60));
  const hourOptions: number[] = [];
  for (let h = 0; h <= maxHours; h++) {
    hourOptions.push(h);
  }

  // Minutes options: 0, 5, 10, 15 ... 55 (plus extraOptions if present)
  const minuteOptions: number[] = [];
  for (let m = 0; m < 60; m += step) {
    minuteOptions.push(m);
  }
  if (extraOptions.length > 0) {
    for (const extra of extraOptions) {
      if (extra >= 0 && extra < 60 && !minuteOptions.includes(extra)) {
        minuteOptions.push(extra);
      }
    }
    minuteOptions.sort((a, b) => a - b);
  }

  const ITEM_HEIGHT = 40;
  const padY = (heightPx - ITEM_HEIGHT) / 2;

  // Deconstruct total minutes into current hours & minutes
  const currentHours = Math.floor(value / 60);
  const currentMins = value % 60;

  // Initial scroll position synchronization
  useEffect(() => {
    if (hoursRef.current) {
      const hIdx = hourOptions.indexOf(currentHours);
      if (hIdx !== -1) {
        hoursRef.current.scrollTop = hIdx * ITEM_HEIGHT;
      }
    }
    if (minutesRef.current) {
      const mIdx = minuteOptions.indexOf(currentMins);
      if (mIdx !== -1) {
        minutesRef.current.scrollTop = mIdx * ITEM_HEIGHT;
      }
    }
  }, []);

  const handleHourScroll = () => {
    if (!hoursRef.current) return;
    const index = Math.round(hoursRef.current.scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, hourOptions.length - 1));
    const newHour = hourOptions[clampedIndex];
    if (newHour !== undefined && newHour !== currentHours) {
      const newTotal = newHour * 60 + currentMins;
      onChange(newTotal);
    }
  };

  const handleMinuteScroll = () => {
    if (!minutesRef.current) return;
    const index = Math.round(minutesRef.current.scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, minuteOptions.length - 1));
    const newMin = minuteOptions[clampedIndex];
    if (newMin !== undefined && newMin !== currentMins) {
      const newTotal = currentHours * 60 + newMin;
      onChange(newTotal);
    }
  };

  return (
    <div
      className="relative w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center select-none"
      style={{ height: heightPx }}
    >
      {/* Top & Bottom Gradient Overlay for Slot Machine Wheel Blur Effect */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-slate-50 via-slate-50/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent z-10 pointer-events-none" />

      {/* Center Highlight Slot (검은색 하이라이트 바) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 h-[40px] bg-black border border-black rounded-xl pointer-events-none z-0 shadow-md flex items-center justify-around">
        <span className="text-white/20 text-xs font-bold pl-8">시간</span>
        <span className="text-white/20 text-xs font-bold pr-8">분</span>
      </div>

      {/* 2-Column Grid Container (Left: Hours, Right: Minutes) */}
      <div className="w-full h-full grid grid-cols-2 relative z-10">
        {/* Left Column: Hours */}
        <div
          ref={hoursRef}
          onScroll={handleHourScroll}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
          style={{ scrollSnapType: 'y mandatory', paddingTop: padY, paddingBottom: padY }}
        >
          {hourOptions.map((h) => {
            const isSelected = h === currentHours;
            return (
              <div
                key={`h-${h}`}
                onClick={() => {
                  const newTotal = h * 60 + currentMins;
                  onChange(newTotal);
                  const index = hourOptions.indexOf(h);
                  if (hoursRef.current) {
                    hoursRef.current.scrollTo({
                      top: index * ITEM_HEIGHT,
                      behavior: 'smooth',
                    });
                  }
                }}
                className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'text-white font-extrabold text-base scale-105 drop-shadow-sm'
                    : 'text-slate-500 text-xs hover:text-black'
                }`}
              >
                <span>{h}시간</span>
              </div>
            );
          })}
        </div>

        {/* Right Column: Minutes */}
        <div
          ref={minutesRef}
          onScroll={handleMinuteScroll}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
          style={{ scrollSnapType: 'y mandatory', paddingTop: padY, paddingBottom: padY }}
        >
          {minuteOptions.map((m) => {
            const isSelected = m === currentMins;
            return (
              <div
                key={`m-${m}`}
                onClick={() => {
                  const newTotal = currentHours * 60 + m;
                  onChange(newTotal);
                  const index = minuteOptions.indexOf(m);
                  if (minutesRef.current) {
                    minutesRef.current.scrollTo({
                      top: index * ITEM_HEIGHT,
                      behavior: 'smooth',
                    });
                  }
                }}
                className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'text-white font-extrabold text-base scale-105 drop-shadow-sm'
                    : 'text-slate-500 text-xs hover:text-black'
                }`}
              >
                <span>{m}분</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
