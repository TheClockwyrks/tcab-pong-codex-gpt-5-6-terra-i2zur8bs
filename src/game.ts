import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLE_HH,
  OBSTACLE_HW,
  OBSTACLE_SPIN_RATE,
  OBSTACLE_SWAY_AMP,
  OBSTACLE_SWAY_PERIOD,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly theta: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly obstacleClock: number;
  readonly obstacleClockRunning: boolean;
  readonly simTime: number;
  readonly muted: boolean;
}
export interface CaromSnapshot extends CaromState {
  readonly version: number;
  readonly ball: (BallState & { readonly speed: number }) | null;
}
export interface MenuRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}
type Pose = (s: DeepReadonly<CaromState>) => CaromState;
export interface CaromDebugApi {
  readonly version: number;
  clearWorld: Pose;
  spawnBall: Pose;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset: Pose;
  reconcile: Pose;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign: Pose;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setObstacleClock(s: DeepReadonly<CaromState>, v: number): CaromState;
  setObstacleClockRunning(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): MenuRect | null;
}

export const BACKGROUND = "#07111f";
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const sign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const obstacle = (index: number, t: number): ObstacleState => ({
  index,
  cx: OBSTACLE_CENTERS[index].x,
  cy:
    OBSTACLE_CENTERS[index].y +
    (index ? -1 : 1) *
      OBSTACLE_SWAY_AMP *
      Math.sin((2 * Math.PI * t) / OBSTACLE_SWAY_PERIOD),
  theta: OBSTACLE_SPIN_RATE * t,
});
const obstacles = (t: number): readonly ObstacleState[] => [
  obstacle(0, t),
  obstacle(1, t),
];
const ball = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: sign(),
  trail: [],
});
const initial = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: ball(),
  obstacles: obstacles(0),
  obstacleClock: 0,
  obstacleClockRunning: true,
  simTime: 0,
  muted,
});
const items = (screen: Screen): readonly string[] | null =>
  screen === "title"
    ? TITLE_ITEMS
    : screen === "howto"
      ? ["BACK"]
      : screen === "paused"
        ? PAUSE_ITEMS
        : screen === "matchover"
          ? MATCHOVER_ITEMS
          : null;
const itemRect = (screen: Screen, index: number): MenuRect | null => {
  const a = items(screen);
  return a && index >= 0 && index < a.length
    ? {
        x: 440,
        y: screen === "title" ? 350 + index * 62 : 400 + index * 62,
        w: 400,
        h: 48,
      }
    : null;
};
const paddle = (
  s: DeepReadonly<CaromState>,
  side: Side,
  p: PaddleState,
): CaromState => ({ ...s, paddles: { ...s.paddles, [side]: p } });
const mustBall = (s: DeepReadonly<CaromState>): DeepReadonly<BallState> => {
  if (!s.ball) throw new Error("Carom: no ball is present");
  return s.ball;
};
const returnTitle = (s: DeepReadonly<CaromState>): CaromState => ({
  ...initial(s.muted),
  titleIndex: s.titleIndex,
  menuIndex: s.titleIndex,
  simTime: s.simTime,
});
const start = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...s,
  mode,
  screen: "countdown",
  resumeScreen: "playing",
  menuIndex: 0,
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: ball(),
  paddles: {
    left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
  },
  obstacleClock: 0,
  obstacleClockRunning: true,
  obstacles: obstacles(0),
});
function integrate(
  p: DeepReadonly<PaddleState>,
  velocity: number,
  dt: number,
): PaddleState {
  const raw = p.cy + velocity * dt,
    cy = clamp(raw, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return { ...p, cy, vy: dt > 0 && cy !== raw ? (cy - p.cy) / dt : velocity };
}
function movePaddles(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState["paddles"] {
  const human = (up: string, down: string) =>
    (api.input.value(down) - api.input.value(up)) * PADDLE_SPEED;
  const left = s.paddles.left.driven
    ? s.paddles.left.drivenVy
    : human("p1-up", "p1-down");
  let right = s.paddles.right.driven ? s.paddles.right.drivenVy : 0;
  if (!s.paddles.right.driven && s.mode === "versus")
    right = human("p2-up", "p2-down");
  if (!s.paddles.right.driven && s.mode === "solo" && s.ai.movement) {
    const tracking =
        s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0,
      target = tracking ? s.ball!.y - s.ball!.vy * AI_REACT : AI_HOME_Y,
      dead = tracking ? AI_DEADZONE : AI_HOME_DEADZONE,
      d = target - s.paddles.right.cy;
    right =
      Math.abs(d) <= dead || dt <= 0
        ? 0
        : Math.sign(d) * Math.min(AI_SPEED, Math.abs(d) / dt);
  }
  return {
    left: integrate(s.paddles.left, left, dt),
    right: integrate(s.paddles.right, right, dt),
  };
}
type Events = { wall: boolean; paddle: boolean; obstacle: boolean };
function hitPaddle(
  b: BallState,
  x0: number,
  x1: number,
  cy: number,
  side: Side,
  pvy: number,
): [BallState, "none" | "wall" | "paddle"] {
  const y0 = cy - PADDLE_HALF,
    y1 = cy + PADDLE_HALF;
  if (!(
    b.x > x0 - BALL_R &&
    b.x < x1 + BALL_R &&
    b.y > y0 - BALL_R &&
    b.y < y1 + BALL_R
  ))
    return [b, "none"];
  const d = [
      b.x - (x0 - BALL_R),
      x1 + BALL_R - b.x,
      b.y - (y0 - BALL_R),
      y1 + BALL_R - b.y,
    ],
    f = d.indexOf(Math.min(...d));
  if (f < 2) {
    const speed = Math.min(Math.hypot(b.vx, b.vy) * SPEED_MULT, SPEED_CAP),
      angle = clamp((b.y - cy) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE;
    return [
      {
        ...b,
        x: side === "left" ? x1 + BALL_R : x0 - BALL_R,
        vx: (side === "left" ? 1 : -1) * speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        spin: clamp(b.spin + pvy * SPIN_FROM_PADDLE, -SPIN_CLAMP, SPIN_CLAMP),
      },
      "paddle",
    ];
  }
  if (f === 2)
    return [{ ...b, y: y0 - BALL_R, vy: b.vy > 0 ? -b.vy : b.vy }, "wall"];
  return [{ ...b, y: y1 + BALL_R, vy: b.vy < 0 ? -b.vy : b.vy }, "wall"];
}
function hitObstacle(b: BallState, o: ObstacleState): [BallState, boolean] {
  const c = Math.cos(o.theta),
    s = Math.sin(o.theta),
    dx = b.x - o.cx,
    dy = b.y - o.cy,
    lx = dx * c + dy * s,
    ly = -dx * s + dy * c,
    qx = clamp(lx, -OBSTACLE_HW, OBSTACLE_HW),
    qy = clamp(ly, -OBSTACLE_HH, OBSTACLE_HH),
    ox = lx - qx,
    oy = ly - qy;
  if (ox * ox + oy * oy >= BALL_R * BALL_R) return [b, false];
  const length = Math.hypot(ox, oy);
  let nx: number, ny: number;
  if (length) {
    nx = ox / length;
    ny = oy / length;
  } else if (OBSTACLE_HW - Math.abs(lx) <= OBSTACLE_HH - Math.abs(ly)) {
    nx = lx >= 0 ? 1 : -1;
    ny = 0;
  } else {
    nx = 0;
    ny = ly >= 0 ? 1 : -1;
  }
  const wx = nx * c - ny * s,
    wy = nx * s + ny * c,
    dot = b.vx * wx + b.vy * wy,
    v =
      dot < 0 ? { ...b, vx: b.vx - 2 * dot * wx, vy: b.vy - 2 * dot * wy } : b;
  return [
    {
      ...v,
      x: o.cx + (qx + nx * BALL_R) * c - (qy + ny * BALL_R) * s,
      y: o.cy + (qx + nx * BALL_R) * s + (qy + ny * BALL_R) * c,
    },
    true,
  ];
}
function stepBall(
  original: BallState,
  s: DeepReadonly<CaromState>,
  dt: number,
): [BallState, Events] {
  let b = original;
  const e: Events = { wall: false, paddle: false, obstacle: false },
    n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / MAX_SUBSTEP)),
    h = dt / n;
  for (let i = 0; i < n; i += 1) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed) {
      const a = (b.spin / speed) * h,
        c = Math.cos(a),
        si = Math.sin(a);
      b = { ...b, vx: b.vx * c - b.vy * si, vy: b.vx * si + b.vy * c };
    }
    b = {
      ...b,
      spin: b.spin * 0.5 ** (h / SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: BALL_R, vy: -b.vy };
      e.wall = true;
    } else if (b.y + BALL_R > FIELD_H && b.vy > 0) {
      b = { ...b, y: FIELD_H - BALL_R, vy: -b.vy };
      e.wall = true;
    }
    let k: "none" | "wall" | "paddle";
    [b, k] = hitPaddle(
      b,
      P1_X0,
      P1_X1,
      s.paddles.left.cy,
      "left",
      s.paddles.left.vy,
    );
    e.wall ||= k === "wall";
    e.paddle ||= k === "paddle";
    [b, k] = hitPaddle(
      b,
      P2_X0,
      P2_X1,
      s.paddles.right.cy,
      "right",
      s.paddles.right.vy,
    );
    e.wall ||= k === "wall";
    e.paddle ||= k === "paddle";
    for (const o of s.obstacles) {
      let hitted: boolean;
      [b, hitted] = hitObstacle(b, o);
      e.obstacle ||= hitted;
    }
  }
  return [b, e];
}
const trail = (b: BallState, t: number): BallState => ({
  ...b,
  trail: [...b.trail, { x: b.x, y: b.y, t }].filter(
    (p) => p.t >= t - TRAIL_TIME,
  ),
});
function confirm(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title")
    return s.menuIndex === 0
      ? { ...start(s, "solo"), titleIndex: 0 }
      : s.menuIndex === 1
        ? { ...start(s, "versus"), titleIndex: 1 }
        : { ...s, titleIndex: 2, screen: "howto", menuIndex: 0 };
  if (s.screen === "howto") return returnTitle(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...s, screen: s.resumeScreen }
      : s.menuIndex === 1
        ? start(s, s.mode)
        : returnTitle(s);
  if (s.screen === "matchover")
    return s.menuIndex === 0 ? start(s, s.mode) : returnTitle(s);
  return s as CaromState;
}
function menus(s: DeepReadonly<CaromState>, api: UpdateApi): CaromState {
  if (s.screen === "countdown" || s.screen === "playing")
    return api.input.pressed("pause")
      ? { ...s, resumeScreen: s.screen, screen: "paused", menuIndex: 0 }
      : (s as CaromState);
  if (
    s.screen === "paused" &&
    (api.input.pressed("pause") || api.input.pressed("back"))
  )
    return { ...s, screen: s.resumeScreen };
  if (
    s.screen === "howto" &&
    (api.input.pressed("confirm") || api.input.pressed("back"))
  )
    return returnTitle(s);
  if (s.screen === "matchover" && api.input.pressed("back"))
    return returnTitle(s);
  const list = items(s.screen);
  if (!list) return s as CaromState;
  const up = api.input.pressed("p1-up") || api.input.pressed("p2-up"),
    down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
  let next = s as CaromState;
  if (up)
    next = {
      ...next,
      menuIndex: (next.menuIndex + list.length - 1) % list.length,
    };
  else if (down)
    next = { ...next, menuIndex: (next.menuIndex + 1) % list.length };
  const p = api.input.pointer();
  for (let i = 0; i < list.length; i += 1) {
    const r = itemRect(next.screen, i)!;
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h)
      next = { ...next, menuIndex: i };
  }
  const keyboardConfirm = api.input.pressed("confirm");
  const pointerConfirm = api.input.pointerReleased() && !keyboardConfirm;
  return !up && !down && (keyboardConfirm || pointerConfirm)
    ? confirm(next)
    : next;
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const action of ACTIONS)
      api.input.register(action, { keys: [...BINDINGS[action]] });
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 320,
      freqTo: 180,
      gain: 0.14,
      durationMs: 60,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "sine",
      freq: 480,
      freqTo: 310,
      gain: 0.1,
      durationMs: 55,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "triangle",
      freq: 720,
      freqTo: 380,
      gain: 0.12,
      durationMs: 75,
    });
    api.audio.define(CUES.score, {
      wave: "sine",
      freq: 440,
      freqTo: 880,
      gain: 0.16,
      durationMs: 170,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score", (s) => `${s.score.p1}-${s.score.p2}`);
    api.diagnostics.register("ball", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    api.diagnostics.register("velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    api.diagnostics.register("speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0,
    );
    api.diagnostics.register("spin", (s) => s.ball?.spin ?? 0);
    api.diagnostics.register(
      "left paddle",
      (s) =>
        `${s.paddles.left.cy.toFixed(1)} / ${s.paddles.left.vy.toFixed(1)}`,
    );
    api.diagnostics.register(
      "right paddle",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)} / ${s.paddles.right.vy.toFixed(1)}`,
    );
    const debug: CaromDebugApi = {
      version: CAROM_DEBUG_VERSION,
      clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
      spawnBall: (s) => ({ ...s, ball: ball() }),
      spawnObstacle: (s, i) => {
        if (i !== 0 && i !== 1)
          throw new Error("Carom: invalid obstacle index");
        return {
          ...s,
          obstacles: [
            ...s.obstacles.filter((o) => o.index !== i),
            obstacle(i, s.obstacleClock),
          ].sort((a, b) => a.index - b.index),
        };
      },
      reset: (s) => initial(s.muted),
      reconcile: (s) => ({
        ...s,
        obstacles: s.obstacles.map((o) => obstacle(o.index, s.obstacleClock)),
      }),
      setScreen: (s, v) => ({ ...s, screen: v }),
      setMode: (s, v) => ({ ...s, mode: v }),
      setMenuIndex: (s, v) => ({ ...s, menuIndex: v }),
      setTitleIndex: (s, v) => ({ ...s, titleIndex: v }),
      setResumeScreen: (s, v) => ({ ...s, resumeScreen: v }),
      setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
      setWinner: (s, v) => ({ ...s, winner: v }),
      setReceiver: (s, v) => ({ ...s, receiver: v }),
      setPaddleCy: (s, side, v) =>
        paddle(s, side, { ...s.paddles[side], cy: v }),
      setPaddleVy: (s, side, v) =>
        paddle(s, side, { ...s.paddles[side], drivenVy: v }),
      setPaddleDriven: (s, side, v) =>
        paddle(s, side, { ...s.paddles[side], driven: v }),
      setBallPosition: (s, x, y) => ({ ...s, ball: { ...mustBall(s), x, y } }),
      setBallVelocity: (s, x, y) => ({
        ...s,
        ball: { ...mustBall(s), vx: x, vy: y },
      }),
      setBallSpin: (s, v) => ({ ...s, ball: { ...mustBall(s), spin: v } }),
      setBallHeld: (s, v) => ({ ...s, ball: { ...mustBall(s), held: v } }),
      setBallHoldTimer: (s, v) => ({
        ...s,
        ball: { ...mustBall(s), holdTimer: v },
      }),
      setBallServeSign: (s, v) => ({
        ...s,
        ball: { ...mustBall(s), serveSign: v },
      }),
      drawBallServeSign: (s) => ({
        ...s,
        ball: { ...mustBall(s), serveSign: sign() },
      }),
      setAiTracking: (s, v) => ({ ...s, ai: { ...s.ai, tracking: v } }),
      setAiMovement: (s, v) => ({ ...s, ai: { ...s.ai, movement: v } }),
      setMuted: (s, v) => ({ ...s, muted: v }),
      setObstacleClock: (s, v) => ({
        ...s,
        obstacleClock: v,
        obstacles: s.obstacles.map((o) => obstacle(o.index, v)),
      }),
      setObstacleClockRunning: (s, v) => ({ ...s, obstacleClockRunning: v }),
      snapshot: (s) => ({
        ...s,
        version: CAROM_DEBUG_VERSION,
        ball: s.ball
          ? { ...s.ball, speed: Math.hypot(s.ball.vx, s.ball.vy) }
          : null,
      }),
      menuItemRect: (s, i) => itemRect(s.screen, i),
    };
    return [initial(false), debug];
  },
  update(state, api, dt) {
    if (state.muted !== api.audio.muted()) api.audio.setMuted(state.muted);
    if (api.input.pressed("mute")) api.audio.setMuted(!api.audio.muted());
    let s = menus(state, api);
    const now = state.simTime + dt;
    if (s.screen === "countdown" || s.screen === "playing") {
      s = { ...s, paddles: movePaddles(s, api, dt) };
      const b = s.ball;
      if (b && s.screen === "countdown") {
        const remaining = b.holdTimer - dt;
        if (remaining <= 0) {
          const dir = s.receiver === "left" ? -1 : 1;
          s = {
            ...s,
            screen: "playing",
            ball: {
              ...b,
              held: false,
              holdTimer: 0,
              vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
              vy: b.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
              trail: [],
            },
          };
        } else s = { ...s, ball: { ...b, holdTimer: remaining } };
      } else if (b && s.screen === "playing" && !b.held) {
        const [moved, events] = stepBall(b, s, dt);
        if (events.wall) api.audio.play(CUES.wallBounce);
        if (events.paddle) api.audio.play(CUES.paddleHit);
        if (events.obstacle) api.audio.play(CUES.obstacleBounce);
        if (moved.x - BALL_R > FIELD_W || moved.x + BALL_R < 0) {
          const scorer: Side = moved.x - BALL_R > FIELD_W ? "left" : "right",
            score = {
              p1: s.score.p1 + (scorer === "left" ? 1 : 0),
              p2: s.score.p2 + (scorer === "right" ? 1 : 0),
            },
            won =
              (score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD) ||
              (score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD);
          api.audio.play(CUES.score);
          s = won
            ? {
                ...s,
                score,
                winner: scorer,
                screen: "matchover",
                menuIndex: 0,
                ball: moved,
              }
            : {
                ...s,
                score,
                receiver: scorer === "left" ? "right" : "left",
                screen: "countdown",
                ball: ball(),
              };
        } else s = { ...s, ball: moved };
      }
      if (s.ball) s = { ...s, ball: trail(s.ball, now) };
      const clock = s.obstacleClockRunning
        ? s.obstacleClock + dt
        : s.obstacleClock;
      s = {
        ...s,
        obstacleClock: clock,
        obstacles: s.obstacles.map((o) => obstacle(o.index, clock)),
      };
    }
    return { ...s, simTime: now, muted: api.audio.muted() };
  },
  render(state, api) {
    const c = api.ctx;
    c.fillStyle = BACKGROUND;
    c.fillRect(0, 0, FIELD_W, FIELD_H);
    c.strokeStyle = "#385066";
    c.lineWidth = 2;
    c.setLineDash([12, 14]);
    c.beginPath();
    c.moveTo(NET_X, 44);
    c.lineTo(NET_X, FIELD_H - 44);
    c.stroke();
    c.setLineDash([]);
    const drawPaddle = (x: number, p: PaddleState, color: string) => {
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 16;
      c.beginPath();
      c.roundRect(x, p.cy - PADDLE_HALF, 16, PADDLE_HALF * 2, 8);
      c.fill();
      c.shadowBlur = 0;
    };
    drawPaddle(P1_X0, state.paddles.left, "#42d9ff");
    drawPaddle(P2_X0, state.paddles.right, "#ff657e");
    for (const o of state.obstacles) {
      c.save();
      c.translate(o.cx, o.cy);
      c.rotate(o.theta);
      c.fillStyle = "#f6c95e";
      c.beginPath();
      c.roundRect(
        -OBSTACLE_HW,
        -OBSTACLE_HH,
        OBSTACLE_HW * 2,
        OBSTACLE_HH * 2,
        10,
      );
      c.fill();
      c.restore();
    }
    if (state.ball) {
      if (state.ball.trail.length > 1) {
        c.strokeStyle = "rgba(220,247,255,.45)";
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(state.ball.trail[0].x, state.ball.trail[0].y);
        for (const p of state.ball.trail.slice(1)) c.lineTo(p.x, p.y);
        c.stroke();
      }
      c.fillStyle = "#effaff";
      c.beginPath();
      c.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
      c.fill();
    }
    c.textAlign = "center";
    if (
      ["countdown", "playing", "paused", "matchover"].includes(state.screen)
    ) {
      c.fillStyle = "#e8f3ff";
      c.font = "700 42px system-ui";
      c.fillText(String(state.score.p1), FIELD_CX - 95, 70);
      c.fillText(String(state.score.p2), FIELD_CX + 95, 70);
      c.font = "600 16px system-ui";
      c.fillStyle = "#91a8bb";
      c.fillText(
        state.mode === "solo" ? "SOLO // FIRST TO 11" : "VERSUS // FIRST TO 11",
        FIELD_CX,
        104,
      );
    }
    if (state.screen === "title") {
      c.fillStyle = "rgba(2,8,18,.6)";
      c.fillRect(0, 0, FIELD_W, FIELD_H);
      c.fillStyle = "#effaff";
      c.font = "800 100px system-ui";
      c.fillText(TITLE_TEXT, FIELD_CX, 245);
      c.font = "500 17px system-ui";
      c.fillStyle = "#93aec4";
      c.fillText("SPIN THE RALLY. BANK THE ANGLES.", FIELD_CX, 280);
    }
    if (state.screen === "howto") {
      c.fillStyle = "rgba(2,8,18,.83)";
      c.fillRect(0, 0, FIELD_W, FIELD_H);
      c.fillStyle = "#effaff";
      c.font = "800 54px system-ui";
      c.fillText("HOW TO PLAY", FIELD_CX, 210);
      c.font = "500 22px system-ui";
      c.fillStyle = "#b9cbda";
      c.fillText(
        "W / S move blue. Arrow keys move coral. Move while striking to add spin.",
        FIELD_CX,
        300,
      );
      c.fillText(
        "Curve around the rotating gates. P pauses. M mutes.",
        FIELD_CX,
        345,
      );
    }
    if (state.screen === "paused" || state.screen === "matchover") {
      c.fillStyle = "rgba(2,8,18,.72)";
      c.fillRect(0, 0, FIELD_W, FIELD_H);
      c.fillStyle = "#effaff";
      c.font = "800 52px system-ui";
      c.fillText(
        state.screen === "paused"
          ? "PAUSED"
          : `${state.winner === "left" ? "BLUE" : "CORAL"} WINS`,
        FIELD_CX,
        310,
      );
    }
    const list = items(state.screen);
    if (list)
      for (let i = 0; i < list.length; i += 1) {
        const r = itemRect(state.screen, i)!;
        if (i === state.menuIndex) {
          c.fillStyle = "#f6c95e";
          c.fillRect(r.x, r.y, r.w, r.h);
        }
        c.fillStyle = i === state.menuIndex ? "#091321" : "#dceaf5";
        c.font = "700 22px system-ui";
        c.fillText(list[i], FIELD_CX, r.y + 32);
      }
  },
};
