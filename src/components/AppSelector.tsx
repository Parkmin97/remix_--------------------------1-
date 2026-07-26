import React, { useState } from 'react';
import { Plus, Minus, X, Check, LayoutGrid } from 'lucide-react';
import { TARGET_SERVICES } from '../data/targetServices';
import { TargetService } from '../types';

interface AppSelectorProps {
  selectedServices: string[];
  onToggleService: (id: string) => void;
}

export const AppSelector: React.FC<AppSelectorProps> = ({
  selectedServices,
  onToggleService,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedList = TARGET_SERVICES.filter((s) =>
    selectedServices.includes(s.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5 break-keep">
          <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
          <span>잠금할 앱 선택</span>
          <span className="text-[10px] text-neutral-400 font-normal">
            ({selectedServices.length}개 선택됨)
          </span>
        </label>
      </div>

      {/* Selected Apps Container (iOS widget style card) */}
      <div className="p-3.5 rounded-2xl bg-white/95 text-stone-900 shadow-xl border border-white/20">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {/* Add Button Slot */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-100 border-2 border-dashed border-neutral-300 hover:border-amber-500 hover:bg-neutral-50 flex items-center justify-center text-neutral-500 hover:text-amber-600 transition-all group active:scale-95 shadow-sm"
              title="앱 추가"
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] transition-transform group-hover:scale-110" />
            </button>
            <span className="text-[11px] font-semibold text-neutral-600">추가</span>
          </div>

          {/* Selected App Slots */}
          {selectedList.map((service) => (
            <div key={service.id} className="relative flex flex-col items-center gap-1 group">
              <div className="relative">
                {/* Delete (-) Badge */}
                <button
                  type="button"
                  onClick={() => onToggleService(service.id)}
                  className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full bg-white border border-neutral-300 text-neutral-500 hover:text-red-500 hover:border-red-400 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                  title={`${service.name} 제거`}
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* App Icon */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-xl font-bold shadow-md transition-transform group-hover:scale-105`}
                >
                  {service.name[0]}
                </div>
              </div>

              {/* App Label */}
              <span className="text-[11px] font-medium text-neutral-700 truncate max-w-[64px] text-center">
                {service.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* App Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-5 space-y-4 shadow-2xl text-white relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-white">잠금할 앱 선택</h3>
                <p className="text-[11px] text-neutral-400">통제할 소셜 앱을 체크하세요</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* App Checkbox List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {TARGET_SERVICES.map((service: TargetService) => {
                const isChecked = selectedServices.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => onToggleService(service.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-neutral-800/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                      >
                        {service.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{service.name}</div>
                        <div className="text-[10px] text-neutral-400">{service.category}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-amber-500 border-amber-500 text-black'
                          : 'border-neutral-600 bg-neutral-800'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition-colors"
            >
              선택 완료 ({selectedServices.length}개 선택)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
