import { useEffect, useRef, useCallback } from 'react';
import { SnakeEngine } from '../game/engine';
import { computeLayout, drawGame, updateParticles, burstParticles, type RenderState } from '../game/renderer';
import type { Theme } from '../game/themes';
import { sfx } from '../game/sound';

interface Props {
  engine: SnakeEngine;
  theme: Theme;
  running: boolean;      // 是否推进逻辑
  paused: boolean;
  onGameOver: () => void;
  onLevelUp: (level: number) => void;
  onScoreChange: () => void;
}

export function GameCanvas({ engine, theme, running, paused, onGameOver, onLevelUp, onScoreChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<RenderState | null>(null);
  const rafRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(0);
  const deadHandledRef = useRef(false);

  // 绑定引擎事件（粒子、音效）
  useEffect(() => {
    deadHandledRef.current = false;
    engine.events.onEat = (food, gained, combo) => {
      const layout = layoutRef.current;
      if (layout) {
        const cx = layout.ox + (food.pos.x + 0.5) * layout.cell;
        const cy = layout.oy + (food.pos.y + 0.5) * layout.cell;
        burstParticles(engine, cx, cy, food.kind === 'gold' ? theme.gold : theme.apple, food.kind === 'gold' ? 22 : 12);
        engine.floats.push({
          x: cx, y: cy - layout.cell * 0.5,
          text: `+${gained}`,
          color: food.kind === 'gold' ? theme.gold : theme.ink,
          bornAt: performance.now(),
          size: Math.max(13, layout.cell * 0.55),
        });
        if (combo >= 3) {
          engine.floats.push({
            x: cx, y: cy - layout.cell * 1.4,
            text: `x${(1 + combo * 0.1).toFixed(1)}`,
            color: theme.danger,
            bornAt: performance.now(),
            size: Math.max(11, layout.cell * 0.42),
          });
        }
      }
      if (food.kind === 'gold') sfx.gold(); else sfx.eat(combo);
      onScoreChange();
    };
    engine.events.onDie = () => {
      sfx.die();
      if (!deadHandledRef.current) {
        deadHandledRef.current = true;
        setTimeout(onGameOver, 900);
      }
    };
    engine.events.onShieldBreak = () => {
      sfx.shield();
      const layout = layoutRef.current;
      if (layout && engine.snake[0]) {
        const cx = layout.ox + (engine.snake[0].x + 0.5) * layout.cell;
        const cy = layout.oy + (engine.snake[0].y + 0.5) * layout.cell;
        burstParticles(engine, cx, cy, '#5aa0ff', 18);
        engine.floats.push({ x: cx, y: cy - layout.cell, text: 'SHIELD!', color: '#5aa0ff', bornAt: performance.now(), size: 14 });
      }
    };
    engine.events.onRevive = () => {
      sfx.levelUp();
      engine.floats.push({
        x: 0, y: 0, text: '', color: '', bornAt: 0, size: 0,
      });
    };
    engine.events.onPhaseStart = () => sfx.phase();
    engine.events.onLevelUp = (level) => {
      sfx.levelUp();
      onLevelUp(level);
    };
  }, [engine, theme, onGameOver, onLevelUp, onScoreChange]);

  // 键盘
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      engine.handleKey(e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine]);

  // 触摸滑动
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let sx = 0, sy = 0;
    const start = (e: TouchEvent) => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    };
    const move = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        engine.handleKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      } else {
        engine.handleKey(dy > 0 ? 'ArrowDown' : 'ArrowUp');
      }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      e.preventDefault();
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
    };
  }, [engine]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutRef.current = computeLayout(w, h, engine.cols, engine.rows, Math.max(18, Math.min(w, h) * 0.04));
  }, [engine]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  // 主循环
  useEffect(() => {
    lastRef.current = performance.now();
    accRef.current = 0;
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      const layout = layoutRef.current;
      if (!canvas || !layout) return;
      const ctx = canvas.getContext('2d')!;
      const dt = Math.min(now - lastRef.current, 100);
      lastRef.current = now;

      const interval = engine.tickInterval();
      if (running && !paused && engine.alive) {
        accRef.current += dt;
        let guard = 0;
        while (accRef.current >= interval && guard < 4) {
          engine.step(now);
          accRef.current -= interval;
          guard++;
        }
        if (guard >= 4) accRef.current = 0;
      }
      const alpha = running && !paused && engine.alive ? Math.min(accRef.current / interval, 1) : 1;

      updateParticles(engine, dt);
      // 清理过期漂浮文字
      engine.floats = engine.floats.filter((f) => now - f.bornAt < 900);

      // 背景
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      drawGame(ctx, engine, theme, layout, alpha, now);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine, theme, running, paused]);

  return (
    <div ref={wrapRef} className="game-canvas-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
