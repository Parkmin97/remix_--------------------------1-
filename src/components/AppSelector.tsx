import React, { useState } from 'react';
import { Plus, Minus, X, Check, LayoutGrid } from 'lucide-react';
import { TARGET_SERVICES } from '../data/targetServices';
import { TargetService } from '../types';

interface AppSelectorProps {
  selectedServices: string[];
  onToggleService: (id: string) => void;
  lockedServices?: string[];
}

export const AppSelector: React.FC<AppSelectorProps> = ({
  selectedServices,
  onToggleService,
  lockedServices = [],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedList = TARGET_SERVICES.filter((s) =>
    selectedServices.includes(s.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-black flex items-center gap-1.5 break-keep">
          <LayoutGrid className="w-3.5 h-3.5 text-[#FE9A00]" />
          <span>잠금할 앱 선택</span>
          <span className="text-[10px] text-black/60 font-normal">
            ({selectedServices.length}개 선택됨)
          </span>
        </label>
      </div>

      {/* Selected Apps Container (iOS widget style card — 밝은 톤) */}
      <div className="p-3.5 rounded-2xl bg-slate-50 text-black shadow-inner border border-slate-200">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {/* Add Button Slot */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 hover:border-[#FE9A00] hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#FE9A00] transition-all group active:scale-95 shadow-sm"
              title="앱 추가"
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] transition-transform group-hover:scale-110" />
            </button>
            <span className="text-[11px] font-semibold text-black/70">추가</span>
          </div>

          {/* Selected App Slots */}
          {selectedList.map((service) => {
            const isLocked = lockedServices.includes(service.id);
            return (
              <div key={service.id} className="relative flex flex-col items-center gap-1 group">
                <div className="relative">
                  {/* Delete (-) Badge: 기존 잠금된 앱은 해제/제거 불가 */}
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => onToggleService(service.id)}
                      className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-rose-500 hover:border-rose-500 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                      title={`${service.name} 제거`}
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  )}

                  {/* App Icon */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-xl font-bold shadow-md transition-transform group-hover:scale-105 ${
                      isLocked ? 'ring-2 ring-black' : ''
                    }`}
                  >
                    {service.name[0]}
                  </div>
                </div>

                {/* App Label */}
                <span className="text-[11px] font-medium text-black truncate max-w-[64px] text-center">
                  {service.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* App Selection Modal (화이트 배경, 검은색 완료 버튼) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-5 space-y-4 shadow-2xl text-black relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-black">잠금할 앱 선택</h3>
                <p className="text-[11px] text-black/60">
                  {lockedServices.length > 0
                    ? '기존 잠금 앱은 해제할 수 없으며 추가 선택만 가능합니다'
                    : '통제할 소셜 앱을 체크하세요'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* App Checkbox List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {TARGET_SERVICES.map((service: TargetService) => {
                const isChecked = selectedServices.includes(service.id);
                const isLocked = lockedServices.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => {
                      if (!isLocked) {
                        onToggleService(service.id);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isLocked
                        ? 'bg-slate-100 border-slate-200 text-black/50 cursor-not-allowed opacity-50'
                        : isChecked
                        ? 'bg-slate-100 border-2 border-black text-black font-semibold cursor-pointer shadow-sm'
                        : 'bg-white border-2 border-slate-300 hover:border-slate-400 text-black cursor-pointer shadow-sm hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                      >
                        {service.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black">{service.name}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isLocked
                          ? 'bg-slate-400 border-slate-400 text-white'
                          : isChecked
                          ? 'bg-black border-black text-white'
                          : 'border-slate-400 bg-white'
                      }`}
                    >
                      {(isChecked || isLocked) && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Button (검은색 배경, 흰색 텍스트) */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors"
            >
              선택 완료 ({selectedServices.length}개 선택)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
