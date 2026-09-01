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

/**
 * 미션에 쓰는 클래식 곡.
 *
 * ⚠️ 음원은 반드시 퍼블릭 도메인이거나 CC0 여야 한다.
 *    2026-09-01에 비발디 사계 "봄"·"여름"을 뺐다. 두 곡 모두 John Harrison 연주
 *    음반(Wichita State University Chamber Players)이었고 CC BY-SA 라이선스다.
 *    - BY: 연주자 표기 의무가 생긴다
 *    - SA: 90초로 잘라 쓰는 것 자체가 개작이라, 결과물도 같은 조건으로
 *          배포해야 한다. 상업 배포와 맞지 않는다.
 *    곡을 추가할 때는 라이선스를 먼저 확인할 것.
 *    (커먼즈 API: action=query&prop=imageinfo&iiprop=extmetadata 로 조회 가능)
 *
 * 현재 3곡으로 2/4·3/4·4/4 를 모두 덮는다. 1/4 을 쓰는 곡은 없다.
 */
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
  /*
   * 2026-09-01 추가. 박자표는 사용자가 지정한 값이다.
   *
   * 음원 출처: Musopen (https://musopen.org/music/2204-the-nutcracker-suite-op-71a/)
   * 라이선스: CC0 1.0 Universal — Public Domain Dedication (2026-09-01 확인)
   *   다운로드 페이지에 사선 C 아이콘과 "Public Domain Dedication" 표기가 있었고,
   *   BY(사람 아이콘)·SA(회전 화살표)는 없었다. 표기 의무도 상업적 사용 제한도 없다.
   *   ※ Musopen 은 음원마다 라이선스가 다르다(PD/CC0/CC BY-SA 혼재).
   *      곡을 추가할 때마다 개별 음원의 배지를 반드시 확인할 것.
   *
   * ⚠️ bpm 은 잠정값이다. 음원의 에너지 포락선 자기상관으로 측정했으나 후보가
   *    여러 개로 갈려 확정하지 못했다. 실기기에서 메트로놈과 음악이 어긋나면
   *    이 값부터 조정할 것.
   * ⚠️ fallbackAudioUrl 은 비워 둔다. Musopen 다운로드 주소는 안정적인 직접 링크가
   *    아니라, 넣어봤자 폴백으로 못 쓴다. (예전 "봄"의 폴백이 404 였던 전례가 있다)
   */
  {
    id: 'piece-trepak',
    title: '호두까기 인형 - 러시안 댄스 (트레팍)',
    composer: '표트르 차이콥스키 (P. I. Tchaikovsky)',
    beatType: '2/4',
    // 측정된 펄스는 약 170. 그대로 쓰면 한 박이 353ms 라 60초 내내 흔들기가
    // 불가능에 가깝고, 아래 '허용 오차' 문제로 타이밍 판정도 무의미해진다.
    // 그래서 절반으로 잡아 두 펄스에 한 번 젓게 한다.
    bpm: 85,
    durationSeconds: 60,
    description: '러시아 민속춤의 폭발적인 에너지로 몰아치는 짧고 강렬한 곡입니다. 2박자의 힘찬 상하 동작으로 이끄세요.',
    audioUrl: '/audio/trepak.mp3',
    notesSequence: generateNotesForPiece(85, '2/4', ['D5', 'D5', 'A4', 'D5', 'F#5', 'A5', 'D5', 'A4'])
  },
  {
    id: 'piece-galop',
    title: '호두까기 인형 - 어린이 갤럽',
    composer: '표트르 차이콥스키 (P. I. Tchaikovsky)',
    beatType: '4/4',
    // 측정 최고 후보는 81.5, 두 번째가 99.5 였다. 4박자로 젓기에 적당한 99 를 골랐다.
    bpm: 99,
    durationSeconds: 60,
    description: '아이들이 뛰노는 듯 경쾌하고 빠르게 달려가는 곡입니다. 4박자의 또렷한 흐름으로 이끄세요.',
    audioUrl: '/audio/galop.mp3',
    notesSequence: generateNotesForPiece(99, '4/4', ['G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'C5', 'E5', 'G5', 'E5'])
  },
];

export const DAILY_QUOTES = [
  "쓸데없는 스크롤에 내 인생을 맡기지 말고, 내 삶의 다음 박자를 직접 정해요.",
  "오케스트라의 거장처럼, 오늘 나의 24시간을 가장 아름다운 하모니로 지휘해 보세요.",
  "잠시 소셜미디어를 내려놓고 마음의 템포를 조율할 시간입니다.",
  "마에스트로의 지휘봉 끝에서 시작되는 집중, 당신 삶의 주도권은 당신에게 있습니다.",
  "멈춤도 음악의 중요한 악보입니다. 잠시 쉼표를 찍고 다시 힘차게 지휘해 보세요."
];
