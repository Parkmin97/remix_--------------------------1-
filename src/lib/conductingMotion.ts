/**
 * 지휘 동작의 "방향"을 읽는다.
 *
 * 기존 판정은 흔들림의 세기(가속도 크기)만 봤다. 그래서 아무렇게나 흔들어도
 * 타점으로 인정됐다. 여기서는 한 번의 스윙이 **어느 쪽으로 그어졌는지**를 뽑아내
 * 박자별 지휘 방향(1박 하강, 2박 안쪽 …)과 맞는지 볼 수 있게 한다.
 *
 * ── 왜 순간 가속도 방향을 쓰지 않는가 ────────────────────────────────
 * 아래로 긋는 동작에서 가속도는 출발할 때 아래를 향하고 멈출 때 위를 향한다.
 * 한 스트로크 안에서 부호가 뒤집히므로 순간값으로는 방향을 알 수 없다.
 * 대신 스트로크 구간 전체에 걸쳐 가속도를 **한 번 적분**해 속도 변화량(Δv)을 구한다.
 * 방향이 안정적으로 남고, 짧은 구간(0.2~0.4초)이라 적분 드리프트도 갇힌다.
 * (변위까지 두 번 적분하면 드리프트가 터진다. 그래서 Δv 에서 멈춘다.)
 *
 * ── 좌표계 ──────────────────────────────────────────────────────────
 * 가속도 값은 '기기 기준'이라 폰을 기울이면 같은 동작도 다른 축으로 잡힌다.
 * 그래서 매 스트로크마다 중력으로 '위쪽'을 다시 찾아 몸 기준으로 바꾼다.
 * 나침반(절대 방위)은 실내에서 부정확해 쓰지 않는다. 중력만으로 충분하다.
 * → 별도 캘리브레이션 단계가 필요 없다.
 *
 * ── 되돌리는 법 ─────────────────────────────────────────────────────
 * 실기기 튜닝이 실패하거나 사용자가 못 푸는 문제가 생기면 두 단계로 되돌린다.
 *
 *  1) 즉시(코드 수정 없음): 미션 시작 화면의 '방향 인식 판정' 스위치를 끈다.
 *     판정이 예전의 세기 기준으로 돌아간다. 기본값은
 *     ConductingMissionScreen 의 directionModeOn 초기값(true)이라,
 *     그 한 글자를 false 로 바꾸면 전체 사용자에게 꺼진 채 나간다.
 *
 *  2) 완전 제거: 이 파일과 ConductingMissionScreen 의 방향 관련 블록을 지운다.
 *     기준 커밋은 아래와 같다.
 *       git revert <이 기능 커밋>
 *     ARM_THRESHOLD(22) / RELEASE_THRESHOLD(16) 은 기존 판정과 같은 값이라
 *     되돌려도 스윙을 잡아내는 감도는 달라지지 않는다.
 */

/** 한 번의 스윙이 그어진 방향. UNKNOWN 은 너무 약하거나 판별 불가한 경우. */
export type StrokeDirection = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT' | 'UNKNOWN';

export interface StrokeResult {
  direction: StrokeDirection;
  /** 몸 기준 Δv (m/s). down 은 아래가 +, right 는 오른쪽이 +. 튜닝·디버그용. */
  downComponent: number;
  rightComponent: number;
  /** Δv 크기(m/s). 동작의 세기. */
  speed: number;
  /** 방향 판별을 믿어도 되는지. 중력 기준이 흔들렸거나 너무 약하면 false. */
  confident: boolean;
}

interface Vec3 { x: number; y: number; z: number; }

// ── 튜닝 상수 ─────────────────────────────────────────────────────────
// 실기기 측정 전 초기값이다. 첫 테스트 후 반드시 다시 잡아야 한다.

/** 스트로크 시작으로 보는 가속도 크기(m/s²). 기존 판정과 같은 값을 유지한다. */
export const ARM_THRESHOLD = 22;
/** 스트로크 끝으로 보는 가속도 크기(m/s²). 기존 판정과 같은 값을 유지한다. */
export const RELEASE_THRESHOLD = 16;
/** 이보다 느린 Δv 는 지휘 동작으로 보지 않는다(m/s). */
const MIN_STROKE_SPEED = 0.8;
/** 수직으로 볼지 수평으로 볼지 가르는 비율. 1보다 크면 수직 쪽으로 기운다. */
const VERTICAL_BIAS = 1.0;
/** 중력 추정 저역통과 계수. 60Hz 기준 시상수 약 0.17초. */
const GRAVITY_LOWPASS = 0.9;
/** 샘플 간격 상한(초). 이벤트가 끊겼을 때 적분이 튀는 것을 막는다. */
const MAX_SAMPLE_DT = 0.05;
/** 스트로크 최대 길이(초). 넘으면 방향을 못 믿는 것으로 표시한다(제스처는 살린다). */
const MAX_STROKE_SECONDS = 0.6;
/**
 * 기기 x축을 수평면에 투영했을 때 남아야 하는 최소 길이.
 * 폰을 완전히 옆으로 눕히면 좌우 기준이 무너지는데, 그때를 걸러낸다.
 */
const MIN_HORIZONTAL_BASIS = 0.25;

const len = (v: Vec3) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;

/**
 * 박자표별 각 박의 기대 지휘 방향.
 * ConductingMissionScreen 의 TUTORIAL_SVG_GUIDES 에 그려진 패턴과 같은 내용이다.
 * (안내 그림과 판정이 어긋나면 사용자는 이유를 알 수 없으므로 반드시 함께 고친다.)
 */
export const BEAT_DIRECTIONS: Record<string, StrokeDirection[]> = {
  // 1(Down) → 2(In, 안쪽=왼쪽) → 3(Out, 바깥=오른쪽) → 4(Up)
  '4/4': ['DOWN', 'LEFT', 'RIGHT', 'UP'],
  // 1(Down) → 2(Out, 오른쪽) → 3(Up)
  '3/4': ['DOWN', 'RIGHT', 'UP'],
  // 1(Down) → 2(Up)
  '2/4': ['DOWN', 'UP'],
  // 마디 맥박 하나. 하강만 본다.
  '1/4': ['DOWN'],
};

/** 해당 박자표의 n번째 박(1부터)에 기대되는 방향. */
export function expectedDirectionFor(beatType: string, beatInBar: number): StrokeDirection {
  const pattern = BEAT_DIRECTIONS[beatType];
  if (!pattern || pattern.length === 0) return 'UNKNOWN';
  const idx = (beatInBar - 1) % pattern.length;
  return pattern[idx] ?? 'UNKNOWN';
}

const DIRECTION_LABEL_KO: Record<StrokeDirection, string> = {
  DOWN: '아래로',
  UP: '위로',
  LEFT: '왼쪽으로',
  RIGHT: '오른쪽으로',
  UNKNOWN: '알 수 없음',
};

const DIRECTION_ARROW: Record<StrokeDirection, string> = {
  DOWN: '↓', UP: '↑', LEFT: '←', RIGHT: '→', UNKNOWN: '·',
};

export const directionLabel = (d: StrokeDirection) => DIRECTION_LABEL_KO[d];
export const directionArrow = (d: StrokeDirection) => DIRECTION_ARROW[d];

/**
 * devicemotion 샘플을 계속 먹으면서 스트로크가 하나 끝날 때마다 방향을 돌려준다.
 *
 * 사용법: 매 이벤트마다 push() 를 부르고, null 이 아닌 값이 나오면 그게 한 번의 스윙이다.
 */
export class StrokeTracker {
  /** 중력 방향 추정(기기 기준). 저역통과로 계속 갱신한다. */
  private gravity: Vec3 | null = null;
  private armed = false;
  private lastTimeMs: number | null = null;
  /** 스트로크 구간 동안 누적한 Δv. */
  private velocity: Vec3 = { x: 0, y: 0, z: 0 };
  /** 스트로크 시작 시점의 중력 기준. 동작 중엔 중력 추정이 오염되므로 시작값을 쓴다. */
  private strokeGravity: Vec3 | null = null;
  private strokeStartMs = 0;
  /** 마지막으로 본 가속도 크기. 화면 게이지용. */
  private lastMagnitude = 0;

  reset() {
    this.gravity = null;
    this.armed = false;
    this.lastTimeMs = null;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.strokeGravity = null;
    this.strokeStartMs = 0;
    this.lastMagnitude = 0;
  }

  get magnitude() {
    return this.lastMagnitude;
  }

  /**
   * 이벤트 하나를 처리한다. 스트로크가 방금 끝났으면 결과를, 아니면 null 을 준다.
   *
   * @param acc  중력이 제거된 가속도. 기기가 못 주면 null (자이로 없는 저가 기기).
   * @param accG 중력이 포함된 가속도. 중력 방향을 찾는 데 쓴다.
   */
  push(acc: Vec3 | null, accG: Vec3 | null, timeMs: number): StrokeResult | null {
    // 중력 추정을 먼저 갱신한다. 중력 포함 값이 없으면 방향을 잡을 수 없다.
    if (accG) {
      if (!this.gravity) {
        this.gravity = { ...accG };
      } else {
        const a = GRAVITY_LOWPASS;
        this.gravity = {
          x: a * this.gravity.x + (1 - a) * accG.x,
          y: a * this.gravity.y + (1 - a) * accG.y,
          z: a * this.gravity.z + (1 - a) * accG.z,
        };
      }
    }

    // 선형 가속도. 기기가 직접 주면 그걸 쓰고, 없으면 중력 추정을 빼서 만든다.
    let linear: Vec3 | null = acc;
    if (!linear && accG && this.gravity) {
      linear = {
        x: accG.x - this.gravity.x,
        y: accG.y - this.gravity.y,
        z: accG.z - this.gravity.z,
      };
    }
    if (!linear) return null;

    const magnitude = len(linear);
    this.lastMagnitude = magnitude;

    // 시간 간격. 첫 샘플이거나 이벤트가 끊겼으면 적분하지 않는다.
    const dtRaw = this.lastTimeMs === null ? 0 : (timeMs - this.lastTimeMs) / 1000;
    this.lastTimeMs = timeMs;
    const dt = dtRaw > 0 ? Math.min(dtRaw, MAX_SAMPLE_DT) : 0;

    if (!this.armed) {
      // 아직 스트로크 밖. 임계값을 넘으면 적분을 시작한다.
      if (magnitude > ARM_THRESHOLD) {
        this.armed = true;
        this.strokeStartMs = timeMs;
        this.strokeGravity = this.gravity ? { ...this.gravity } : null;
        // 임계값을 넘은 이 샘플부터 포함시킨다.
        this.velocity = { x: linear.x * dt, y: linear.y * dt, z: linear.z * dt };
      }
      return null;
    }

    // 스트로크 진행 중 — 계속 적분한다.
    this.velocity = {
      x: this.velocity.x + linear.x * dt,
      y: this.velocity.y + linear.y * dt,
      z: this.velocity.z + linear.z * dt,
    };

    // 너무 오래 끌면 지휘 동작으로 보기 어렵다(계속 흔드는 중).
    // 다만 **제스처 자체를 버리지는 않는다.** 여기서 삼켜버리면 방향 인식을 꺼도
    // 예전보다 타점이 덜 잡혀 되돌린 것이 되지 않고, 무엇보다 차단 화면은
    // 잠금을 푸는 유일한 출구라 입력을 조용히 먹으면 안 된다.
    // 방향만 못 믿는 것으로 표시해 내보내고, 타이밍 판정은 그대로 받게 한다.
    if ((timeMs - this.strokeStartMs) / 1000 > MAX_STROKE_SECONDS) {
      this.armed = false;
      const dv = this.velocity;
      this.velocity = { x: 0, y: 0, z: 0 };
      const speed = len(dv);
      return { direction: 'UNKNOWN', downComponent: 0, rightComponent: 0, speed, confident: false };
    }

    // 정점을 지나 힘이 빠지면 스트로크가 끝난 것으로 본다.
    if (magnitude < RELEASE_THRESHOLD) {
      this.armed = false;
      const dv = this.velocity;
      this.velocity = { x: 0, y: 0, z: 0 };
      return this.classify(dv, this.strokeGravity);
    }

    return null;
  }

  /** Δv 를 몸 기준(아래/오른쪽)으로 바꿔 방향 하나로 정리한다. */
  private classify(dv: Vec3, gravityAtStart: Vec3 | null): StrokeResult {
    const speed = len(dv);
    const weak = speed < MIN_STROKE_SPEED;

    const g = gravityAtStart ?? this.gravity;
    const gLen = g ? len(g) : 0;
    if (!g || gLen < 1) {
      // 중력 기준이 없으면 위아래조차 정할 수 없다.
      return { direction: 'UNKNOWN', downComponent: 0, rightComponent: 0, speed, confident: false };
    }

    // accelerationIncludingGravity 는 중력의 반작용이라 '세계의 위쪽'을 가리킨다.
    const up: Vec3 = { x: g.x / gLen, y: g.y / gLen, z: g.z / gLen };

    // 수직 성분: 아래로 그었으면 +
    const downComponent = -dot(dv, up);

    // 수평 기준축: 기기 x축(화면 가로)에서 위쪽 성분을 빼 수평면에 눕힌다.
    // 폰을 세로로 들고 있으면 이 축이 사용자의 오른쪽과 거의 일치한다.
    const deviceX: Vec3 = { x: 1, y: 0, z: 0 };
    const xDotUp = dot(deviceX, up);
    const rightRaw: Vec3 = {
      x: deviceX.x - xDotUp * up.x,
      y: deviceX.y - xDotUp * up.y,
      z: deviceX.z - xDotUp * up.z,
    };
    const rightLen = len(rightRaw);

    // 폰이 옆으로 누워 x축이 수직에 가까우면 좌우 기준이 무너진다.
    const horizontalUsable = rightLen >= MIN_HORIZONTAL_BASIS;
    const rightComponent = horizontalUsable
      ? dot(dv, { x: rightRaw.x / rightLen, y: rightRaw.y / rightLen, z: rightRaw.z / rightLen })
      : 0;

    if (weak) {
      return { direction: 'UNKNOWN', downComponent, rightComponent, speed, confident: false };
    }

    // 수직이 우세한가 수평이 우세한가.
    const vertical = Math.abs(downComponent);
    const horizontal = Math.abs(rightComponent);

    let direction: StrokeDirection;
    if (!horizontalUsable || vertical >= horizontal * VERTICAL_BIAS) {
      direction = downComponent > 0 ? 'DOWN' : 'UP';
    } else {
      direction = rightComponent > 0 ? 'RIGHT' : 'LEFT';
    }

    return { direction, downComponent, rightComponent, speed, confident: true };
  }
}
