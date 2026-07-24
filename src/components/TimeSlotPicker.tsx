import React, { useRef, useEffect } from 'react';

interface TimeSlotPickerProps {
  value: number; // minutes, e.g. 5, 10, 15...
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  heightPx?: number; // overall wheel height; compact frames pass a smaller value
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  value,
  onChange,
  min = 5,
  max = 480,
  step = 5,
  heightPx = 160,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate options list based on min, max, step
  const options: number[] = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
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
    <div className="relative w-full bg-stone-950/80 border border-amber-800/40 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center select-none" style={{ height: heightPx }}>
      {/* Top & Bottom Gradient Overlay for Slot Machine Wheel Blur Effect */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-stone-950 via-stone-950/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent z-10 pointer-events-none" />

      {/* Center Highlight Slot */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 h-[40px] bg-amber-500/10 border-y border-amber-500/40 rounded-xl pointer-events-none z-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]" />

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
              className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${isSelected
                  ? 'text-amber-400 font-bold text-base scale-105'
                  : 'text-stone-500 text-xs hover:text-stone-400'
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
