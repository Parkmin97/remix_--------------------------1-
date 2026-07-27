import { ClassicalPiece } from '../types';

// Helper to generate notes for 60 seconds
function generateNotesForPiece(bpm: number, beatType: string, baseNotes: string[]): Array<{ time: number; note: string; beatIndex: number }> {
  const beatsPerBar = beatType === '4/4' ? 4 : beatType === '3/4' ? 3 : beatType === '2/4' ? 2 : 1;
  const beatInterval = 60 / bpm; // seconds per beat
  const totalBeats = Math.floor(60 / beatInterval);
  const notes = [];

  for (let i = 0; i < totalBeats; i++) {
    const time = i * beatInterval;
    const note = baseNotes[i % baseNotes.length];
    const beatIndex = (i % beatsPerBar) + 1;
    notes.push({ time, note, beatIndex });
  }

  return notes;
}

export const CLASSICAL_PIECES: ClassicalPiece[] = [
  {
    id: 'piece-4-4',
    title: '교향곡 5번 "운명" 1악장',
    composer: '루트비히 판 베토벤 (L. v. Beethoven)',
    beatType: '2/4',
    bpm: 108,
    durationSeconds: 60,
    description: '운명의 문을 두드리는 전율과 압도적인 강렬함의 오케스트라 최고 명곡입니다. 원곡 그대로 2박자 강한 지휘로 박자를 맞추세요.',
    audioUrl: '/audio/beethoven5.mp3',
    fallbackAudioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ludwig%20van%20Beethoven%20-%20Symphonie%205%20c-moll%20-%201.%20Allegro%20con%20brio.ogg',
    notesSequence: generateNotesForPiece(108, '2/4', ['G4', 'G4', 'G4', 'Eb4', 'F4', 'F4', 'F4', 'D4', 'C4', 'E4', 'G4', 'C5'])
  },
  {
    id: 'piece-3-3',
    title: '호두까기 인형 - 꽃의 왈츠 (Waltz of the Flowers)',
    composer: '표트르 차이콥스키 (P. I. Tchaikovsky)',
    beatType: '3/4',
    bpm: 136,
    durationSeconds: 60,
    description: '0초 시작과 동시에 신나고 화려하게 뿜어져 나오는 오케스트라 왈츠 메인 테마! 누구나 아는 최고의 3/4박자 클래식 명곡입니다.',
    audioUrl: '/audio/waltz.mp3',
    fallbackAudioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/P.I._Tchaikovsky%27s_Waltz_of_the_Flowers_Performed_by_The_U.S._Army_Band%2C_c._2019.mp3',
    notesSequence: generateNotesForPiece(136, '3/4', ['D5', 'F#5', 'A5', 'D6', 'A5', 'F#5', 'E5', 'G5', 'B5', 'C#6', 'B5', 'G5'])
  },
  {
    id: 'piece-2-4',
    title: '카르멘 서곡 & 투우사의 노래',
    composer: '조르주 비제 (G. Bizet)',
    beatType: '4/4',
    bpm: 116,
    durationSeconds: 60,
    description: '열정적이고 힘차게 몰아치는 오케스트라의 대표적인 강렬한 행진곡입니다. 원곡 그대로 4박자 강한 리듬으로 이끄세요.',
    audioUrl: '/audio/carmen.mp3',
    fallbackAudioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Carmen%20-%20Prelude%20to%20Act%201.ogg',
    notesSequence: generateNotesForPiece(116, '4/4', ['A4', 'C5', 'E5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G#4', 'A4'])
  },
  {
    id: 'piece-1-4',
    title: '사계 중 "여름" 3악장 프레스토',
    composer: '안토니오 비발디 (A. Vivaldi)',
    beatType: '3/4',
    bpm: 132,
    durationSeconds: 60,
    description: '폭풍우처럼 강렬하고 빠르게 몰아치는 카리스마 현악 오케스트라입니다. 원곡 그대로 3박자 흐름을 명확한 강박으로 이끄세요.',
    audioUrl: '/audio/summer.mp3',
    fallbackAudioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vivaldi%20-%20Four%20Seasons%202%20Summer%20mvt%203%20Presto%20-%20John%20Harrison%20violin.oga',
    notesSequence: generateNotesForPiece(132, '3/4', ['G5', 'G5', 'F5', 'Eb5', 'D5', 'C5', 'B4', 'C5', 'D5', 'G4', 'C5', 'D5'])
  },
  {
    id: 'piece-spring-1',
    title: '사계 중 "봄" 1악장 알레그로',
    composer: '안토니오 비발디 (A. Vivaldi)',
    beatType: '4/4',
    bpm: 108,
    durationSeconds: 60,
    description: '봄의 도래를 노래하는 만개한 햇살처럼 밝고 경쾌한 바이올린 오케스트라입니다. 4박자의 경쾌한 지휘로 박자를 맞추세요.',
    audioUrl: '/audio/spring.mp3',
    fallbackAudioUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Vivaldi_-_Four_Seasons_-_01_-_Spring_1_Allegro.mp3',
    notesSequence: generateNotesForPiece(108, '4/4', ['E5', 'G#5', 'G#5', 'G#5', 'F#5', 'E5', 'B4', 'E5', 'G#5', 'G#5', 'G#5', 'F#5', 'E5', 'B4'])
  }
];

export const DAILY_QUOTES = [
  "쓸데없는 스크롤에 내 인생을 맡기지 말고, 내 삶의 다음 박자를 직접 정해요.",
  "오케스트라의 거장처럼, 오늘 나의 24시간을 가장 아름다운 하모니로 지휘해 보세요.",
  "잠시 소셜미디어를 내려놓고 마음의 템포를 조율할 시간입니다.",
  "마에스트로의 지휘봉 끝에서 시작되는 집중, 당신 삶의 주도권은 당신에게 있습니다.",
  "멈춤도 음악의 중요한 악보입니다. 잠시 쉼표를 찍고 다시 힘차게 지휘해 보세요."
];
