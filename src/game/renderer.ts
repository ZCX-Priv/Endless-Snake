import type { SnakeEngine } from './engine';
import type { Theme } from './themes';
import type { Vec } from './types';

export interface RenderState {
  cell: number;
  ox: number; // board origin x (px)
  oy: number;
  boardW: number;
  boardH: number;
}

export function computeLayout(
  canvasW: number, canvasH: number, cols: number, rows: number, padding: number,
): RenderState {
  const availW = canvasW - padding * 2;
  const availH = canvasH - padding * 2;
  const cell = Math.max(8, Math.floor(Math.min(availW / cols, availH / rows)));
  const boardW = cell * cols;
  const boardH = cell * rows;
  return {
    cell,
    boardW, boardH,
    ox: Math.round((canvasW - boardW) / 2),
    oy: Math.round((canvasH - boardH) / 2),
  };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function mixColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
}

/** 插值后的蛇身位置（像素坐标，格中心） */
function interpCells(engine: SnakeEngine, alpha: number, cell: number, ox: number, oy: number): Vec[] {
  const pts: Vec[] = [];
  const snake = engine.snake;
  for (let i = 0; i < snake.length; i++) {
    const cur = snake[i];
    // 下一节（i+1 是 cur 追踪的位置）；头部用移动方向外推
    let px: number, py: number;
    if (i === 0) {
      // 头部：从上一格向当前格插值。上一格 = 当前 - dir
      const prevX = wrap(cur.x - engine.dir.x, engine.cols);
      const prevY = wrap(cur.y - engine.dir.y, engine.rows);
      px = lerp(prevX, cur.x, alpha);
      py = lerp(prevY, cur.y, alpha);
      // 穿墙时直接跳变
      if (Math.abs(px - cur.x) > 1.5) px = cur.x;
      if (Math.abs(py - cur.y) > 1.5) py = cur.y;
    } else {
      const ahead = snake[i - 1];
      px = lerp(cur.x, ahead.x, alpha);
      py = lerp(cur.y, ahead.y, alpha);
      if (Math.abs(ahead.x - cur.x) > 1.5) { px = cur.x; }
      if (Math.abs(ahead.y - cur.y) > 1.5) { py = cur.y; }
    }
    pts.push({ x: ox + (px + 0.5) * cell, y: oy + (py + 0.5) * cell });
  }
  return pts;
}

function wrap(v: number, max: number) {
  if (v < 0) return max - 1;
  if (v >= max) return 0;
  return v;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  engine: SnakeEngine,
  theme: Theme,
  layout: RenderState,
  alpha: number,
  now: number,
) {
  const { cell, ox, oy, boardW, boardH } = layout;

  // ---- 棋盘背景 ----
  ctx.fillStyle = theme.board;
  ctx.fillRect(ox - 1, oy - 1, boardW + 2, boardH + 2);

  // ---- 网格 ----
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= engine.cols; x++) {
    ctx.moveTo(ox + x * cell + 0.5, oy);
    ctx.lineTo(ox + x * cell + 0.5, oy + boardH);
  }
  for (let y = 0; y <= engine.rows; y++) {
    ctx.moveTo(ox, oy + y * cell + 0.5);
    ctx.lineTo(ox + boardW, oy + y * cell + 0.5);
  }
  ctx.stroke();

  // 边框
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ox - 1, oy - 1, boardW + 2, boardH + 2);

  // ---- 障碍物 ----
  for (const o of engine.obstacles) {
    const px = ox + o.x * cell;
    const py = oy + o.y * cell;
    ctx.fillStyle = theme.obstacle;
    roundRectPath(ctx, px + cell * 0.08, py + cell * 0.08, cell * 0.84, cell * 0.84, cell * 0.22);
    ctx.fill();
  }

  // ---- 食物 ----
  for (const f of engine.foods) {
    const cx = ox + (f.pos.x + 0.5) * cell;
    const cy = oy + (f.pos.y + 0.5) * cell;
    const isGold = f.kind === 'gold';
    const baseColor = isGold ? theme.gold : theme.apple;
    const ringColor = isGold ? theme.goldRing : theme.appleRing;

    // 呼吸缩放
    const pulse = 1 + Math.sin((now - f.bornAt) / 300) * 0.08;
    // 金苹果即将过期时闪烁
    let blink = 1;
    if (isGold && f.expiresAt !== Infinity) {
      const remain = f.expiresAt - now;
      if (remain < 2000) blink = Math.sin(now / 90) > 0 ? 1 : 0.35;
    }
    ctx.globalAlpha = blink;

    // 外圈光环
    ctx.fillStyle = ringColor;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.52 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 果实
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.30 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(cx - cell * 0.09, cy - cell * 0.10, cell * 0.075 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 叶子/梗
    ctx.strokeStyle = isGold ? '#8a6d2f' : '#7a4a2a';
    ctx.lineWidth = Math.max(1.2, cell * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx, cy - cell * 0.28 * pulse);
    ctx.quadraticCurveTo(cx + cell * 0.04, cy - cell * 0.38 * pulse, cx + cell * 0.10, cy - cell * 0.40 * pulse);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  // ---- 蛇 ----
  const pts = interpCells(engine, alpha, cell, ox, oy);
  const n = pts.length;
  const phasing = engine.isPhasing(now);
  const dead = !engine.alive;

  // 死亡抖动
  let shakeX = 0, shakeY = 0;
  if (dead) {
    const t = now - engine.diedAt;
    if (t < 500) {
      const k = (1 - t / 500) * cell * 0.12;
      shakeX = (Math.random() - 0.5) * k;
      shakeY = (Math.random() - 0.5) * k;
    }
  }

  const bodyW = cell * 0.78;
  const segR = cell * 0.24;

  // 相位透明
  if (phasing) ctx.globalAlpha = 0.55 + Math.sin(now / 80) * 0.15;

  // 从尾到头画（头在最上层）
  for (let i = n - 1; i >= 0; i--) {
    const p = pts[i];
    const t = engine.tailT(i);
    const isHead = i === 0;
    const color = isHead
      ? theme.snakeHead
      : mixColor(theme.snakeBody, theme.snakeTail, Math.pow(t, 1.4) * 0.85);

    const size = isHead ? bodyW * 1.06 : bodyW * (1 - t * 0.12);
    ctx.fillStyle = dead ? mixColor(color, '#888888', 0.4) : color;
    roundRectPath(
      ctx,
      p.x - size / 2 + shakeX, p.y - size / 2 + shakeY,
      size, size, isHead ? segR * 1.3 : segR,
    );
    ctx.fill();
  }

  // 眼睛（头上）
  if (n > 0) {
    const head = pts[0];
    const d = engine.dir;
    const ex = head.x + shakeX;
    const ey = head.y + shakeY;
    const eyeOff = cell * 0.16;
    const eyeFwd = cell * 0.10;
    const eyeR = Math.max(1.6, cell * 0.075);
    // 垂直于方向的两个眼睛
    const perpX = -d.y;
    const perpY = d.x;
    const e1x = ex + d.x * eyeFwd + perpX * eyeOff;
    const e1y = ey + d.y * eyeFwd + perpY * eyeOff;
    const e2x = ex + d.x * eyeFwd - perpX * eyeOff;
    const e2y = ey + d.y * eyeFwd - perpY * eyeOff;
    ctx.fillStyle = theme.board;
    ctx.beginPath(); ctx.arc(e1x, e1y, eyeR * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x, e2y, eyeR * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dead ? '#666' : theme.ink === '#2e3440' ? '#f4f1ea' : theme.bg;
    // 瞳孔颜色：用对比色
    ctx.fillStyle = pickPupilColor(theme);
    ctx.beginPath(); ctx.arc(e1x + d.x * eyeR * 0.5, e1y + d.y * eyeR * 0.5, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x + d.x * eyeR * 0.5, e2y + d.y * eyeR * 0.5, eyeR, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = 1;

  // ---- 护盾指示 ----
  if (engine.shieldReady && engine.alive && n > 0) {
    const head = pts[0];
    ctx.strokeStyle = 'rgba(90,160,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(head.x, head.y, cell * 0.72 + Math.sin(now / 240) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- 粒子 ----
  for (const p of engine.particles) {
    const t = p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    if (p.ring) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2 * t;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.6 - t * 0.6), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // ---- 漂浮文字 ----
  for (const f of engine.floats) {
    const age = now - f.bornAt;
    const t = age / 900;
    if (t > 1) continue;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = f.color;
    ctx.font = `700 ${f.size}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y - t * cell * 1.2);
  }
  ctx.globalAlpha = 1;
}

function pickPupilColor(theme: Theme): string {
  // 深色蛇头用浅瞳孔，浅色蛇头用深瞳孔
  const dark = ['#3c4250', '#2e3a48', '#1f2937', '#181818', '#0b1220', '#14324e', '#16281f', '#1a0b2e'];
  return dark.includes(theme.snakeHead) || luminance(theme.snakeHead) < 0.45 ? '#f5f3ec' : '#2b2f38';
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** 更新粒子物理 */
export function updateParticles(engine: SnakeEngine, dt: number) {
  for (const p of engine.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
  }
  engine.particles = engine.particles.filter((p) => p.life > 0);
}

/** 吃食爆裂粒子 */
export function burstParticles(
  engine: SnakeEngine, x: number, y: number, color: string, count = 14,
) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const sp = 0.06 + Math.random() * 0.12;
    engine.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 400 + Math.random() * 300,
      maxLife: 700,
      size: 3 + Math.random() * 4,
      color,
    });
  }
  engine.particles.push({
    x, y, vx: 0, vy: 0, life: 350, maxLife: 350, size: 16, color, ring: true,
  });
}
