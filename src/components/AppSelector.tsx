import React, { useState } from 'react';
import { Plus, Minus, X, Check, LayoutGrid, Lock } from 'lucide-react';
import { getAppCatalog, refreshAppCatalogIfStale } from '../lib/appCatalog';
import { APP_CATEGORIES } from '../data/appCategories';
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
  // 목록이 갱신되면 이 값을 올려 화면을 다시 그린다.
  const [, setCatalogVersion] = useState(0);

  /**
   * 앱 선택 모달을 연다.
   *
   * 열 때마다 설치된 앱 목록을 다시 확인한다.
   * 사용자가 방금 인스타를 깔고 잠그러 왔는데 목록에 없으면 고장으로 보인다.
   */
  const openModal = () => {
    setIsModalOpen(true);
    refreshAppCatalogIfStale()
      .then(changed => {
        if (changed) setCatalogVersion(v => v + 1);
      })
      .catch(() => {
        /* 조회 실패해도 기존 목록으로 계속 쓴다 */
      });
  };

  const catalog = getAppCatalog();

  const selectedList = catalog.filter((s) => selectedServices.includes(s.id));

  // 카테고리별로 묶는다. APP_CATEGORIES 순서를 따르므로 "시간을 많이 뺏는" 것부터 위에 온다.
  const grouped = APP_CATEGORIES
    .map((category) => ({
      category,
      apps: catalog.filter((s) => s.category === category.label),
    }))
    .filter((g) => g.apps.length > 0);

  /**
   * 카테고리 전체를 한 번에 켜고 끈다.
   * 하나라도 꺼져 있으면 전부 켜고, 이미 다 켜져 있으면 전부 끈다.
   * 잠금 중이라 바꿀 수 없는 앱은 건드리지 않는다.
   */
  const toggleCategory = (apps: TargetService[]) => {
    const changeable = apps.filter((a) => !lockedServices.includes(a.id));
    if (changeable.length === 0) return;

    const allSelected = changeable.every((a) => selectedServices.includes(a.id));
    changeable.forEach((a) => {
      const isSelected = selectedServices.includes(a.id);
      // 목표 상태와 다른 것만 뒤집는다
      if (allSelected ? isSelected : !isSelected) {
        onToggleService(a.id);
      }
    });
  };

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
              onClick={openModal}
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

                  {/*
                    App Icon — 기기에서 읽어온 실제 아이콘, 없으면 첫 글자로 대체.
                    잠금 중이면 회색조 + 밝기를 낮춰 어둡게 만든다. 실제 아이콘이 들어오면서
                    테두리만으로는 잠긴 앱과 그냥 고른 앱이 구분되지 않게 됐다.
                  */}
                  {service.iconUri ? (
                    <img
                      src={service.iconUri}
                      alt={service.name}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-md transition-transform group-hover:scale-105 ${
                        isLocked ? 'ring-2 ring-black grayscale brightness-[0.45]' : ''
                      }`}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-xl font-bold shadow-md transition-transform group-hover:scale-105 ${
                        isLocked ? 'ring-2 ring-black grayscale brightness-[0.45]' : ''
                      }`}
                    >
                      {service.name[0]}
                    </div>
                  )}

                  {/* 어두워진 이유를 알려주는 자물쇠. 어둡기만 하면 고장으로 보일 수 있다. */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Lock className="w-5 h-5 text-white/90 drop-shadow-md stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* App Label */}
                <span
                  className={`text-[11px] font-medium truncate max-w-[64px] text-center ${
                    isLocked ? 'text-black/40' : 'text-black'
                  }`}
                >
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

            {/* App Checkbox List — 카테고리별로 묶어서 보여준다 */}
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {grouped.map(({ category, apps }) => {
              const selectedCount = apps.filter(a => selectedServices.includes(a.id)).length;
              const allSelected = selectedCount === apps.length;

              return (
              <div key={category.id} className="space-y-2">
                {/* 카테고리 헤더 — 묶음 선택 */}
                <div className="flex items-center justify-between px-1">
                  <div className="text-[11px] font-bold text-black/70">
                    {category.label}
                    <span className="ml-1.5 font-normal text-black/40">
                      {selectedCount}/{apps.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCategory(apps)}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-300 text-black/70 hover:bg-slate-100 transition-colors"
                  >
                    {allSelected ? '전체 해제' : '전체 선택'}
                  </button>
                </div>

                {apps.map((service: TargetService) => {
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
                        ? 'bg-slate-100 border-slate-200 text-black/50 cursor-not-allowed'
                        : isChecked
                        ? 'bg-slate-100 border-2 border-black text-black font-semibold cursor-pointer shadow-sm'
                        : 'bg-white border-2 border-slate-300 hover:border-slate-400 text-black cursor-pointer shadow-sm hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* 잠금 중인 앱은 목록에서도 똑같이 어둡게 보여 상태가 한눈에 읽히도록 한다 */}
                      <div className="relative shrink-0">
                        {service.iconUri ? (
                          <img
                            src={service.iconUri}
                            alt={service.name}
                            className={`w-9 h-9 rounded-xl object-cover shadow-sm ${
                              isLocked ? 'grayscale brightness-[0.45]' : ''
                            }`}
                            draggable={false}
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${service.color} flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                              isLocked ? 'grayscale brightness-[0.45]' : ''
                            }`}
                          >
                            {service.name[0]}
                          </div>
                        )}
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Lock className="w-3.5 h-3.5 text-white/90 drop-shadow-md stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isLocked ? 'text-black/45' : 'text-black'}`}>
                          {service.name}
                        </div>
                        {isLocked && (
                          <div className="text-[10px] text-black/40">잠금 중 · 해제 불가</div>
                        )}
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
