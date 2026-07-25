import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Music, ArrowRight, Brain, Award, Lock,
  Instagram, Youtube, Video, Twitter, Timer, HeartPulse,
  ChevronRight, Check, X, Star, Feather
} from 'lucide-react';

interface LandingScreenProps {
  onNavigateToScreen: (screen: string) => void;
  onFreeStart: () => void;
}

/* -------------------------------------------------------------------------- */
/* Scroll-reveal: adds data-shown="true" to any .lp-reveal element on entry.   */
/* -------------------------------------------------------------------------- */
function useScrollReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll('.lp-reveal')) as HTMLElement[];
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.setAttribute('data-shown', 'true'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-shown', 'true');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return rootRef;
}

/* Eyebrow label above section headings */
const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block text-[11px] font-mono uppercase tracking-[0.28em] text-amber-600">
    {children}
  </span>
);

/* -------------------------------------------------------------------------- */
/* Phone shell + three in-browser screen mockups for the showcase section.     */
/* -------------------------------------------------------------------------- */
const PhoneShell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative mx-auto w-[228px] ${className}`}>
    <div className="relative rounded-[2.4rem] bg-neutral-800 p-2 ring-1 ring-black/10">
      <div className="relative overflow-hidden rounded-[2rem] bg-neutral-950 aspect-[9/19.2]">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
        {/* Status bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-2.5 text-[9px] font-medium text-neutral-300">
          <span>11:34</span>
          <span className="tracking-tighter">5G ▪ ▪ ▪</span>
        </div>
        {children}
      </div>
    </div>
    {/* Ambient glow */}
    <div className="absolute -inset-6 -z-10 rounded-full bg-amber-400/20 blur-3xl" />
  </div>
);

const MockLockHome: React.FC = () => {
  const apps = [
    { Icon: Instagram, c: 'from-fuchsia-600 to-amber-500' },
    { Icon: Youtube, c: 'from-red-600 to-red-700' },
    { Icon: Video, c: 'from-cyan-500 to-stone-900' },
    { Icon: Twitter, c: 'from-stone-700 to-black' },
    { Icon: Music, c: 'from-amber-500 to-amber-700' },
    { Icon: HeartPulse, c: 'from-emerald-500 to-teal-700' },
    { Icon: Star, c: 'from-indigo-500 to-purple-700' },
    { Icon: Feather, c: 'from-sky-500 to-blue-700' },
  ];
  return (
    <div className="relative h-full px-4 pt-4">
      <div className="grid grid-cols-4 gap-x-3 gap-y-4">
        {apps.map(({ Icon, c }, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-gradient-to-br ${c}`}>
              <Icon className="h-4 w-4 text-white/95" strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>
      {/* Soft-lock intervention overlay */}
      <div className="absolute inset-x-3 bottom-4 rounded-2xl border border-amber-500/30 bg-neutral-900/95 p-3.5 backdrop-blur">
        <div className="mb-2 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-bold tracking-wide text-amber-200">소프트 개입</span>
        </div>
        <p className="text-[11px] font-semibold leading-snug text-neutral-100">
          잠깐, 지금 정말 필요한가요?
        </p>
        <p className="mt-1 text-[9px] leading-snug text-neutral-400">오늘의 목표: 포트폴리오 마감</p>
        <div className="mt-2.5 flex gap-1.5">
          <div className="flex-1 rounded-lg bg-amber-500 py-1.5 text-center text-[9px] font-bold text-neutral-950">
            1분 지휘하기
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-center text-[9px] font-medium text-neutral-300">
            닫기
          </div>
        </div>
      </div>
    </div>
  );
};

const MockMission: React.FC = () => (
  <div className="relative flex h-full flex-col items-center px-4 pt-3">
    <p className="text-[9px] font-mono uppercase tracking-widest text-amber-400/80">Now Conducting</p>
    <p className="mt-0.5 text-center text-[10px] font-semibold text-neutral-200">교향곡 5번 &ldquo;운명&rdquo;</p>
    <p className="text-[8px] text-neutral-500">L. v. Beethoven · 4/4</p>

    {/* Timer ring + conducting path */}
    <div className="relative mt-3 h-[124px] w-[124px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#292524" strokeWidth="6" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke="#fbbf24" strokeWidth="6"
          strokeLinecap="round" strokeDasharray="339" strokeDashoffset="88"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Conducting arc */}
        <svg viewBox="0 0 90 60" className="h-12 w-16">
          <path d="M 12 12 L 30 46 L 45 22 L 60 46 L 78 12" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
          {[[12,12],[30,46],[45,22],[60,46],[78,12]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r={i===2?3.5:2.5} fill={i===2?'#fde68a':'#f59e0b'} />
          ))}
        </svg>
        <span className="mt-1 font-mono text-lg font-bold text-amber-300">0:47</span>
      </div>
      <div className="lp-baton absolute -right-1 top-1 h-10 w-0.5 rounded-full bg-gradient-to-b from-amber-200 to-amber-500" />
    </div>

    <div className="mt-3 flex gap-1.5">
      {[1, 2, 3, 4].map((b) => (
        <div key={b} className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-[10px] font-bold ${b === 2 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-amber-300/70'}`}>
          {b}
        </div>
      ))}
    </div>
    <div className="mt-2.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-bold text-emerald-300">
      PERFECT · 정확도 92%
    </div>
  </div>
);

const MockReport: React.FC = () => (
  <div className="relative flex h-full flex-col px-4 pt-3">
    <p className="text-center text-[9px] font-mono uppercase tracking-widest text-amber-400/80">Detox Report</p>
    {/* Rank badge */}
    <div className="mt-3 flex flex-col items-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-700">
        <Award className="h-8 w-8 text-neutral-950" />
        <span className="lp-pulse-ring absolute inset-0 rounded-full ring-2 ring-amber-400" />
      </div>
      <p className="mt-2 text-[8px] uppercase tracking-widest text-neutral-500">현재 지휘자 랭크</p>
      <p className="font-serif text-sm font-bold text-amber-200">마에스트로</p>
    </div>
    {/* Stats */}
    <div className="mt-3 grid grid-cols-2 gap-1.5">
      <div className="rounded-lg bg-neutral-900 p-2 text-center">
        <div className="font-mono text-sm font-bold text-amber-400">128분</div>
        <div className="text-[8px] text-neutral-500">되찾은 집중</div>
      </div>
      <div className="rounded-lg bg-neutral-900 p-2 text-center">
        <div className="font-mono text-sm font-bold text-amber-400">7일</div>
        <div className="text-[8px] text-neutral-500">연속 디톡스</div>
      </div>
    </div>
    {/* Weekly bars */}
    <div className="mt-3 flex items-end justify-between gap-1 px-1">
      {[40, 65, 50, 80, 72, 95, 88].map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="w-full rounded-sm bg-gradient-to-t from-amber-600 to-amber-300" style={{ height: `${h * 0.5}px` }} />
          <span className="text-[7px] text-neutral-600">{'월화수목금토일'[i]}</span>
        </div>
      ))}
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigateToScreen, onFreeStart }) => {
  const [activeTab, setActiveTab] = useState<'screen1' | 'screen2' | 'screen3'>('screen1');
  const rootRef = useScrollReveal();

  const screens = {
    screen1: {
      label: '잠금 홈',
      title: '무의식적 실행을 붙잡는 소프트 잠금',
      desc: '앱을 여는 순간, 강제 차단 대신 부드러운 개입 창이 오늘의 목표를 다시 물어봅니다. 반발심 없이 스스로 멈추게 됩니다.',
      cta: '잠금 홈 체험하기',
      target: 'phone-home',
      Mock: MockLockHome,
    },
    screen2: {
      label: '1분 지휘 미션',
      title: '클래식 비트에 맞춘 60초 지휘',
      desc: '베토벤 운명(4/4), 차이콥스키 꽃의 왈츠(3/4)의 실제 비트를 따라 스마트폰을 지휘합니다. 손과 귀를 쓰는 사이 시각 중독이 풀립니다.',
      cta: '지휘 미션 수행하기',
      target: 'mission',
      Mock: MockMission,
    },
    screen3: {
      label: '디톡스 리포트',
      title: '되찾은 시간과 지휘자 랭크',
      desc: '집중 성공률, 연속 디톡스, 마에스트로 랭크까지. 절제가 성취로 시각화되어 자기 효능감을 키웁니다.',
      cta: '디톡스 리포트 보기',
      target: 'report',
      Mock: MockReport,
    },
  };
  const active = screens[activeTab];

  /* Black block base — 각 블록 영역은 블랙 */
  const block = 'rounded-3xl bg-neutral-950 text-neutral-100';

  return (
    <div ref={rootRef} className="w-full overflow-x-hidden bg-white font-sans text-neutral-900 antialiased break-keep [word-break:keep-all] selection:bg-amber-400 selection:text-neutral-950">

      {/* ===================================================================== */}
      {/* 1. HERO                                                                */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 bg-white">

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="lp-reveal inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-mono tracking-tight">Digital Dopamine Care · 지휘형 디톡스</span>
          </div>

          <h1 className="lp-reveal mt-6 font-serif text-[2.4rem] font-black leading-[1.14] tracking-tight text-balance sm:text-6xl" style={{ transitionDelay: '60ms' }}>
            <span className="text-neutral-900">무의식적인 숏폼 스크롤,</span>
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              1분의 지휘로 멈춥니다
            </span>
          </h1>

          <p className="lp-reveal mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-neutral-600 sm:mt-6 sm:text-lg" style={{ transitionDelay: '120ms' }}>
            강제로 앱을 막지 않습니다. 클래식 <strong className="font-semibold text-amber-600">오케스트라 지휘 미션</strong>으로
            뇌의 감각을 리셋하고, 스마트폰의 주도권을 스스로 되찾게 합니다.
          </p>

          <div className="lp-reveal mt-8 flex justify-center" style={{ transitionDelay: '180ms' }}>
            <button
              onClick={onFreeStart}
              className="group flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-base font-black text-neutral-950 transition-all active:scale-[0.97] sm:w-auto sm:max-w-none"
            >
              무료로 시작하기
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Hero mockup — 블랙 블록 */}
        <div className="lp-reveal relative z-10 mx-auto mt-12 max-w-lg" style={{ transitionDelay: '160ms' }}>
          <div className={`${block} p-2.5 sm:p-3`}>
            <img
              src="/hero_mockup.png"
              alt="내인생 지휘자 앱 화면 목업"
              className="mx-auto w-full rounded-[1.6rem] border border-neutral-800"
              loading="eager"
            />
          </div>
        </div>
      </section>



      {/* ===================================================================== */}
      {/* 2. PROBLEM                                                             */}
      {/* ===================================================================== */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <Eyebrow>Problem</Eyebrow>
            <h2 className="mt-3 font-serif text-[1.7rem] font-bold text-neutral-900 text-balance sm:text-4xl">
              의지력의 문제가<br className="sm:hidden" /> 아닙니다
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600 text-pretty sm:text-base">
              스마트폰을 켜자마자 알고리즘에 끌려 들어가는 건 설계된 결과입니다.
              혼자 참는 방식으로는 이길 수 없습니다.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { n: '01', t: '손가락의 자동 실행', d: '약간의 지루함만 생겨도 뇌가 자동으로 SNS·숏폼 아이콘을 터치합니다.' },
              { n: '02', t: '강제 차단의 반발심', d: '화면을 막기만 하는 앱은 답답함과 거부감을 낳아 결국 차단을 해제하게 만듭니다.' },
              { n: '03', t: '신체 리셋의 부재', d: '도파민 과부하를 풀려면 시각에서 벗어나 몸을 움직이는 인지 전환이 필요합니다.' },
            ].map((c, i) => (
              <div
                key={c.n}
                className={`lp-reveal ${block} p-7 ring-1 ring-black/5 transition-transform hover:-translate-y-1`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="font-mono text-sm font-bold text-amber-400">{c.n}</div>
                <h3 className="mt-3 text-lg font-bold text-white">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. SOLUTION                                                            */}
      {/* ===================================================================== */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <Eyebrow>Solution</Eyebrow>
            <h2 className="mt-3 font-serif text-[1.7rem] font-bold text-neutral-900 text-balance sm:text-4xl">
              막는 대신, 지휘하게 합니다
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600 text-pretty sm:text-base">
              앱을 여는 순간 1분간 클래식 오케스트라를 지휘하며 마음의 템포를 되찾습니다.
            </p>
          </div>

          <div className={`lp-reveal mt-10 grid items-center gap-6 ${block} p-6 sm:p-9 md:grid-cols-2`}>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                <Music className="h-3.5 w-3.5" /> 1분 클래식 지휘 미션
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">
                비트에 맞춘 신체 감각 리셋
              </h3>
              <p className="text-sm leading-relaxed text-neutral-300">
                베토벤 &lsquo;운명&rsquo;(4/4), 차이콥스키 &lsquo;꽃의 왈츠&rsquo;(3/4)의 실제 비트를 따라
                스마트폰을 지휘하세요. 손과 귀를 함께 쓰는 60초 동안 시각 중독 회로가 느슨해지고,
                원래 하려던 일로 <strong className="text-amber-300">자발적으로 복귀</strong>하게 됩니다.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['베토벤 · 운명', '차이콥스키 · 꽃의 왈츠', '비제 · 카르멘'].map((p) => (
                  <span key={p} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 font-serif text-3xl text-amber-300">
                𝄞
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-200/90">지휘 미션 효과</div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { v: '60초', l: '몰입 리셋' },
                  { v: '±0.1s', l: '박자 정밀도' },
                  { v: '80%', l: '통과 기준' },
                ].map((x) => (
                  <div key={x.l} className="rounded-xl bg-neutral-900 p-2.5">
                    <div className="font-mono text-sm font-bold text-amber-400">{x.v}</div>
                    <div className="mt-0.5 text-[10px] text-neutral-500">{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. KEY FEATURES                                                        */}
      {/* ===================================================================== */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <Eyebrow>Features</Eyebrow>
            <h2 className="mt-3 font-serif text-[1.7rem] font-bold text-neutral-900 text-balance sm:text-4xl">
              디톡스를 완성하는 4가지 기능
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Lock, t: '소프트 개입', d: '무의식적 앱 진입 시 개입 창을 띄워 진짜 목적을 다시 확인시킵니다.' },
              { Icon: Music, t: '오케스트라 미션', d: '클래식 비트에 맞춰 스마트폰을 지휘하며 뇌 인지를 리셋합니다.' },
              { Icon: Brain, t: '자기 성찰 피드백', d: '미션 완수 후 집중 성과와 마음 상태를 기록해 자기 효능감을 키웁니다.' },
              { Icon: Award, t: '지휘자 랭크 리포트', d: '되찾은 시간과 마에스트로 등급을 데이터로 시각화합니다.' },
            ].map((f, i) => (
              <div
                key={f.t}
                className={`lp-reveal group ${block} p-6 ring-1 ring-black/5 transition-transform hover:-translate-y-1`}
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 transition-colors group-hover:bg-amber-500 group-hover:text-neutral-950">
                  <f.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. HOW IT WORKS                                                        */}
      {/* ===================================================================== */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 font-serif text-[1.7rem] font-bold text-neutral-900 text-balance sm:text-4xl">
              단 3단계로 시작합니다
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { s: 'Step 1', Icon: Timer, t: '집중 약속 설정', d: '오늘의 목표와 소셜 앱 허용 시간을 정합니다.' },
              { s: 'Step 2', Icon: Music, t: '개입 & 1분 지휘', d: '앱 접속 시 클래식 지휘 미션을 60초 수행합니다.' },
              { s: 'Step 3', Icon: HeartPulse, t: '주도권 회복', d: '인지가 전환된 상태로 원래 하던 일에 복귀합니다.' },
            ].map((step, i) => (
              <div key={step.s} className={`lp-reveal ${block} p-7 text-center ring-1 ring-black/5`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <step.Icon className="h-6 w-6" />
                </div>
                <div className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-amber-400">{step.s}</div>
                <h3 className="mt-1.5 text-lg font-bold text-white">{step.t}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-400">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. SCREEN SHOWCASE                                                     */}
      {/* ===================================================================== */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <Eyebrow>Product tour</Eyebrow>
            <h2 className="mt-3 font-serif text-[1.7rem] font-bold text-neutral-900 text-balance sm:text-4xl">
              실제 서비스 화면
            </h2>
          </div>

          {/* Tabs */}
          <div className="lp-reveal mt-8 flex flex-wrap justify-center gap-2">
            {(Object.keys(screens) as Array<keyof typeof screens>).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  activeTab === key
                    ? 'bg-neutral-950 text-amber-300'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {screens[key].label}
              </button>
            ))}
          </div>

          <div className={`lp-reveal mt-8 grid items-center gap-8 ${block} p-6 sm:p-10 md:grid-cols-2`}>
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                {active.label}
              </div>
              <h3 className="mt-4 font-serif text-2xl font-bold text-white">{active.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">{active.desc}</p>
              <button
                onClick={() => onNavigateToScreen(active.target)}
                className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-400"
              >
                {active.cta}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <div className="order-1 flex justify-center md:order-2">
              <PhoneShell key={activeTab} className="animate-fade-in">
                <active.Mock />
              </PhoneShell>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. TARGET AUDIENCE                                                     */}
      {/* ===================================================================== */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <Eyebrow>For you</Eyebrow>
            <h2 className="mt-3 font-serif text-[1.7rem] font-bold text-neutral-900 text-balance sm:text-4xl">
              이런 분께 추천합니다
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: '📚', t: '집중이 자꾸 끊기는 학생·취준생', d: '공부 중 습관적으로 쇼츠를 켜 흐름이 깨지는 분' },
              { emoji: '🚫', t: '강제 차단에 지친 분', d: '일방적인 앱 차단에 답답함과 거부감을 느낀 분' },
              { emoji: '🎼', t: '품격 있는 디톡스를 원하는 분', d: '클래식 지휘로 우아하게 습관을 바꾸고 싶은 분' },
            ].map((c, i) => (
              <div
                key={c.t}
                className={`lp-reveal ${block} p-7 ring-1 ring-black/5 transition-transform hover:-translate-y-1`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="text-3xl">{c.emoji}</div>
                <h3 className="mt-4 text-base font-bold text-white">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. COMPARISON                                                          */}
      {/* ===================================================================== */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="lp-reveal mx-auto max-w-2xl text-center">
            <Eyebrow>Why us</Eyebrow>
            <h2 className="mt-3 font-serif text-[1.7rem] font-bold text-neutral-900 text-balance sm:text-4xl">
              기존 차단 앱과 무엇이 다른가
            </h2>
          </div>

          <div className="lp-reveal mt-10 grid gap-4 md:grid-cols-2">
            {/* Old way — light card */}
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-7">
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">기존 강제 차단 앱</div>
              <ul className="mt-5 space-y-4">
                {['일방적으로 화면을 강제 차단', '답답함과 반발심을 유발', '자극 갈망을 수동적으로 억제', '결국 차단을 해제하게 됨'].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-neutral-500">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Our way — black block */}
            <div className={`relative ${block} p-7`}>
              <div className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-black text-neutral-950">
                내인생 지휘자
              </div>
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400">지휘형 디톡스</div>
              <ul className="mt-5 space-y-4">
                {['소프트 개입으로 목적을 다시 확인', '클래식 사운드로 인지를 리셋', '1분 신체 미션으로 능동 전환', '스스로 주도권을 회복'].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm font-medium text-white">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. FINAL CTA — 블랙 블록                                               */}
      {/* ===================================================================== */}
      <section className="px-4 pb-20 pt-4 sm:pb-24">
        <div className={`lp-reveal relative mx-auto max-w-3xl overflow-hidden ${block} px-6 py-14 text-center sm:px-12 sm:py-16`}>
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-amber-500/20 blur-[100px]" />
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 font-serif text-2xl text-amber-300">
              𝄞
            </div>
            <h2 className="font-serif text-[1.8rem] font-black leading-tight text-white text-balance sm:text-5xl">
              오늘 하루, 직접 지휘해보세요
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-sm text-neutral-300 sm:text-base">
              설치도, 회원가입도 필요 없습니다. 지금 바로 소프트 잠금과 1분 지휘 미션을 체험하세요.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                onClick={onFreeStart}
                className="group flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-4 text-base font-black text-neutral-950 transition-all active:scale-[0.97] sm:w-auto sm:max-w-none"
              >
                지금 무료로 시작하기
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* FOOTER                                                                 */}
      {/* ===================================================================== */}
      <footer className="border-t border-neutral-200 px-4 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 font-serif text-amber-400">
              𝄞
            </div>
            <span className="font-serif text-sm font-bold text-neutral-900">내인생 지휘자</span>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-700">PWA</span>
          </div>
          <p className="text-center text-[11px] text-neutral-400">
            Conductor of My Life · Digital Dopamine Care · © 2026
          </p>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* STICKY MOBILE CTA — 블랙 바                                            */}
      {/* ===================================================================== */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-neutral-950 p-3 sm:hidden">
        <button
          onClick={onFreeStart}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 text-sm font-black text-neutral-950 active:scale-[0.98]"
        >
          무료로 시작하기
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {/* Spacer so sticky bar doesn't cover footer on mobile */}
      <div className="h-16 sm:hidden" />
    </div>
  );
};
