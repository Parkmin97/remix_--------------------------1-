import { TargetService, ShortVideo } from '../types';

export const TARGET_SERVICES: TargetService[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    color: 'from-purple-600 via-pink-500 to-amber-500',
    url: 'https://www.instagram.com',
    category: '소셜 릴스'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'Youtube',
    color: 'from-red-600 to-red-700',
    url: 'https://www.youtube.com',
    category: '동영상 숏츠'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'Video',
    color: 'from-cyan-500 to-black',
    url: 'https://www.tiktok.com',
    category: '숏폼 트렌드'
  },
  {
    id: 'x-twitter',
    name: 'X (Twitter)',
    icon: 'Twitter',
    color: 'from-gray-800 to-black',
    url: 'https://x.com',
    category: '실시간 피드'
  }
];

export const SIMULATED_SHORTS: ShortVideo[] = [
  {
    id: 'short-1',
    serviceId: 'instagram',
    creator: '클래식리듬랩',
    handle: '@classical_rhythm',
    caption: '🎻 지휘자 추천! 1분 안에 집중력 끌어올리는 클래식 하이라이트 #클래식 #디톡스 #지휘자',
    musicTitle: '루트비히 판 베토벤 - 교향곡 5번 운명',
    likes: '12.4만',
    comments: '1,420',
    bgColor: 'bg-gradient-to-b from-purple-900 to-slate-900',
    gradient: 'from-amber-500/20 via-purple-600/30 to-black'
  },
  {
    id: 'short-2',
    serviceId: 'youtube',
    creator: '트렌드숏폼피드',
    handle: '@trend_shorts_kr',
    caption: '🔥 2026 지금 가장 핫한 챌린지 모음집! 끝없이 내려보는 무한 스크롤의 늪 😵 #릴스 #추천피드',
    musicTitle: '인기 오디오 - 트렌드 비트 2026',
    likes: '8.9만',
    comments: '890',
    bgColor: 'bg-gradient-to-b from-red-950 to-zinc-900',
    gradient: 'from-red-600/20 via-rose-900/30 to-black'
  },
  {
    id: 'short-3',
    serviceId: 'tiktok',
    creator: '지휘자의집중시간',
    handle: '@maestro_focus',
    caption: '🎶 스마트폰을 내려놓고 내 인생의 지휘봉을 잡아보세요. #내인생지휘자 #디지털디톡스',
    musicTitle: '요한 슈트라우스 2세 - 아름답고 푸른 도나우',
    likes: '25.1만',
    comments: '3,100',
    bgColor: 'bg-gradient-to-b from-amber-950 to-stone-900',
    gradient: 'from-yellow-600/20 via-amber-900/30 to-black'
  }
];
