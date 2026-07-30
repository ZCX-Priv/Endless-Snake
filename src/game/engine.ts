import { DOWN, LEFT, RIGHT, UP, type DifficultyDef, type Dir, type Food, type GameMode, type Ghost, type Particle, type Vec } from './types';

export interface EngineEvents {
  onEat: (food: Food, gained: number, combo: number) => void;
  onDie: (cause: 'wall' | 'self') => void;
  onShieldBreak: () => void;
  onRevive: () => void;
  onComboEnd: (combo: number) => void;
  onPhaseStart: () => void;
  onPhaseEnd: () => void;
  onLevelUp: (level: number) => void;
  onTick?: () => void;
}

export interface PerkState {
  stacks: Map<string, number>;
}

const noop = () => {};

export class SnakeEngine {
  cols: number;
  rows: number;
  mode: GameMode;
  diff: DifficultyDef;

  snake: Vec[] = [];
  dir: Dir = RIGHT;
  private dirQueue: Dir[] = [];
  foods: Food[] = [];
  obstacles: Vec[] = [];

  score = 0;
  applesEaten = 0;
  goldsEaten = 0;
  combo = 0; // 当前连击数
  bestCombo = 0;
  comboExpiresAt = 0;
  level = 1; // roguelite 进化等级

  alive = true;
  startedAt = 0;
  elapsedMs = 0;

  // perk-derived
  perks: PerkState = { stacks: new Map() };
  shieldReady = false;
  private shieldRegenAt = 0;
  phaseUntil = 0;
  private nextPhaseAt = 0;
  secondWindUsed = false;

  // fx state (read by renderer)
  particles: Particle[] = [];
  floats: { x: number; y: number; text: string; color: string; bornAt: number; size: number }[] = [];
  ghosts: Ghost[] = [];
  lastEatAt = 0;
  diedAt = 0;
  deathCause: 'wall' | 'self' | null = null;
  magnetPull: Vec | null = null; // 被吸附的苹果本帧位置偏移

  events: EngineEvents;
  private growPending = 0;
  private tickCount = 0;

  constructor(mode: GameMode, diff: DifficultyDef, events?: Partial<EngineEvents>) {
    this.mode = mode;
    this.diff = diff;
    this.cols = diff.cols;
    this.rows = diff.rows;
    this.events = {
      onEat: noop, onDie: noop, onShieldBreak: noop, onRevive: noop,
      onComboEnd: noop, onPhaseStart: noop, onPhaseEnd: noop,
      onLevelUp: noop, ...events,
    };
    this.reset();
  }

  reset() {
    const cx = Math.floor(this.cols / 2);
    const cy = Math.floor(this.rows / 2);
    this.snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    this.dir = RIGHT;
    this.dirQueue = [];
    this.foods = [];
    this.obstacles = [];
    this.score = 0;
    this.applesEaten = 0;
    this.goldsEaten = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.level = 1;
    this.alive = true;
    this.startedAt = performance.now();
    this.elapsedMs = 0;
    this.perks = { stacks: new Map() };
    this.shieldReady = false;
    this.phaseUntil = 0;
    this.nextPhaseAt = 0;
    this.secondWindUsed = false;
    this.particles = [];
    this.floats = [];
    this.ghosts = [];
    this.growPending = 0;
    this.tickCount = 0;
    this.deathCause = null;
    // 初始苹果
    const n = this.appleCap();
    for (let i = 0; i < n; i++) this.spawnFood('apple');
  }

  stack(id: string): number {
    return this.perks.stacks.get(id) ?? 0;
  }

  addPerk(id: string) {
    this.perks.stacks.set(id, this.stack(id) + 1);
    if (id === 'shield-shell' && !this.shieldReady) this.shieldReady = true;
  }

  // ---- derived stats ----
  appleCap(): number {
    return 2 + this.stack('apple-bloom');
  }
  comboWindow(): number {
    return 3600 + this.stack('combo-master') * 1600;
  }
  comboCap(): number {
    return 8 + this.stack('combo-master') * 2;
  }
  goldChance(): number {
    const base = 0.14;
    return base * (1 + this.stack('golden-touch') * 1.0);
  }
  goldLifetime(): number {
    return 7000 + this.stack('zen-garden') * 4000;
  }
  scoreMult(): number {
    let m = 1;
    m *= 1 + this.stack('slow-mo') * 0.15;
    m *= 1 + this.stack('speed-demon') * 0.05;
    if (this.combo >= 2) m *= 1 + this.stack('score-surge') * 0.30;
    return m;
  }
  appleScore(): number {
    return 10 * (1 + this.stack('apple-bloom') * 0.10);
  }
  goldScore(): number {
    return 50 * (1 + this.stack('golden-touch') * 0.5);
  }
  growPerApple(): number {
    return 1 + this.stack('long-haul');
  }
  tickInterval(): number {
    let t = this.diff.baseTick - this.applesEaten * this.diff.speedUpPerApple;
    t *= 1 - this.stack('speed-demon') * 0.12;
    t *= 1 + this.stack('slow-mo') * 0.10;
    const min = this.diff.minTick * (1 + this.stack('slow-mo') * 0.10);
    return Math.max(min, t);
  }
  comboMult(): number {
    return 1 + this.combo * 0.1;
  }
  isPhasing(now: number): boolean {
    return now < this.phaseUntil;
  }

  queueDir(d: Dir) {
    const last = this.dirQueue.length > 0 ? this.dirQueue[this.dirQueue.length - 1] : this.dir;
    // 不允许 180 度
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (this.dirQueue.length < 3) this.dirQueue.push(d);
  }

  handleKey(key: string) {
    switch (key) {
      case 'ArrowUp': case 'w': case 'W': this.queueDir(UP); break;
      case 'ArrowDown': case 's': case 'S': this.queueDir(DOWN); break;
      case 'ArrowLeft': case 'a': case 'A': this.queueDir(LEFT); break;
      case 'ArrowRight': case 'd': case 'D': this.queueDir(RIGHT); break;
    }
  }

  private cellOccupied(x: number, y: number, includeTail = true): boolean {
    const len = includeTail ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < len; i++) {
      if (this.snake[i].x === x && this.snake[i].y === y) return true;
    }
    return false;
  }

  private freeCells(): Vec[] {
    const occ = new Set<string>();
    for (const s of this.snake) occ.add(`${s.x},${s.y}`);
    for (const f of this.foods) occ.add(`${f.pos.x},${f.pos.y}`);
    for (const o of this.obstacles) occ.add(`${o.x},${o.y}`);
    const out: Vec[] = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!occ.has(`${x},${y}`)) out.push({ x, y });
      }
    }
    return out;
  }

  spawnFood(kind: 'apple' | 'gold', now = performance.now()) {
    const cells = this.freeCells();
    if (cells.length === 0) return;
    // 避免离蛇头太近
    const head = this.snake[0];
    const far = cells.filter((c) => Math.abs(c.x - head.x) + Math.abs(c.y - head.y) >= 4);
    const pool = far.length > 0 ? far : cells;
    const pos = pool[Math.floor(Math.random() * pool.length)];
    this.foods.push({
      pos, kind, bornAt: now,
      expiresAt: kind === 'gold' ? now + this.goldLifetime() : Infinity,
    });
  }

  /** 主循环推进一步，返回是否发生移动 */
  step(now: number): boolean {
    if (!this.alive) return false;
    this.tickCount++;
    this.elapsedMs = now - this.startedAt;

    // 连击过期
    if (this.combo > 0 && now > this.comboExpiresAt) {
      this.events.onComboEnd(this.combo);
      this.combo = 0;
    }

    // 金苹果过期
    const before = this.foods.length;
    this.foods = this.foods.filter((f) => f.kind === 'apple' || now < f.expiresAt);
    if (this.foods.length < before) {
      // 金苹果消失后补普通苹果
      if (this.foods.filter((f) => f.kind === 'apple').length < this.appleCap()) {
        this.spawnFood('apple', now);
      }
    }

    // 相位 perk
    if (this.stack('phase-trickster') > 0) {
      const interval = 12000 / this.stack('phase-trickster');
      if (this.nextPhaseAt === 0) this.nextPhaseAt = now + interval;
      if (now >= this.nextPhaseAt && now >= this.phaseUntil) {
        this.phaseUntil = now + 2000;
        this.nextPhaseAt = now + interval;
        this.events.onPhaseStart();
      }
      if (this.phaseUntil > 0 && now >= this.phaseUntil && this.phaseUntil !== Infinity) {
        // 结束事件只发一次：通过把 phaseUntil 置 0 标记
        this.phaseUntil = 0;
        this.events.onPhaseEnd();
      }
    }

    // 护盾重生
    if (this.stack('shield-shell') > 0 && !this.shieldReady && this.shieldRegenAt > 0 && now >= this.shieldRegenAt) {
      this.shieldReady = true;
      this.shieldRegenAt = 0;
    }

    // 方向队列
    if (this.dirQueue.length > 0) {
      const next = this.dirQueue.shift()!;
      if (!(next.x === -this.dir.x && next.y === -this.dir.y)) {
        this.dir = next;
      }
    }

    const head = this.snake[0];
    let nx = head.x + this.dir.x;
    let ny = head.y + this.dir.y;

    // 穿墙（无限）
    if (nx < 0) nx = this.cols - 1;
    if (nx >= this.cols) nx = 0;
    if (ny < 0) ny = this.rows - 1;
    if (ny >= this.rows) ny = 0;

    // 磁铁：拉动邻近苹果
    this.magnetPull = null;
    if (this.stack('magnet-core') > 0) {
      const range = 1 + this.stack('magnet-core');
      for (const f of this.foods) {
        const d = Math.abs(f.pos.x - nx) + Math.abs(f.pos.y - ny);
        if (d > 0 && d <= range) {
          // 朝蛇头拉近一格
          if (f.pos.x !== nx) f.pos.x += Math.sign(nx - f.pos.x);
          else if (f.pos.y !== ny) f.pos.y += Math.sign(ny - f.pos.y);
          this.magnetPull = { ...f.pos };
        }
      }
    }

    // 吃食判定
    const foodIdx = this.foods.findIndex((f) => f.pos.x === nx && f.pos.y === ny);
    const eating = foodIdx >= 0;

    // 自撞判定（相位时免疫；若本步会吃东西则尾巴不缩，需包含尾格）
    const phasing = this.isPhasing(now);
    if (!phasing && this.cellOccupied(nx, ny, eating)) {
      // 护盾
      if (this.shieldReady) {
        this.shieldReady = false;
        this.shieldRegenAt = now + 20000 / this.stack('shield-shell');
        this.events.onShieldBreak();
        // 护盾救命：不移动（停在原地），清掉方向队列
        this.dirQueue = [];
        return false;
      }
      if (this.stack('second-wind') > 0 && !this.secondWindUsed) {
        this.secondWindUsed = true;
        this.revive(now);
        this.events.onRevive();
        return false;
      }
      this.die('self', now);
      return false;
    }

    // 移动
    this.snake.unshift({ x: nx, y: ny });
    if (eating) {
      const food = this.foods.splice(foodIdx, 1)[0];
      this.eat(food, now);
      // 生长
      this.growPending += food.kind === 'gold'
        ? 1 + this.stack('zen-garden')
        : this.growPerApple();
    }
    if (this.growPending > 0) {
      this.growPending--;
    } else {
      this.snake.pop();
    }

    this.events.onTick?.();
    return true;
  }

  private eat(food: Food, now: number) {
    // 连击
    if (now <= this.comboExpiresAt || this.combo === 0) {
      this.combo = Math.min(this.combo + 1, this.comboCap());
    } else {
      this.combo = 1;
    }
    this.comboExpiresAt = now + this.comboWindow();
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.lastEatAt = now;

    const base = food.kind === 'gold' ? this.goldScore() : this.appleScore();
    const gained = Math.round(base * this.comboMult() * this.scoreMult());
    this.score += gained;

    if (food.kind === 'gold') this.goldsEaten++;
    else this.applesEaten++;

    // 长度分（long-haul）
    if (this.stack('long-haul') > 0) {
      this.score += Math.round(this.snake.length * 0.25 * this.stack('long-haul'));
    }

    this.events.onEat(food, gained, this.combo);

    // roguelite 升级：每 5 个苹果一级
    if (this.mode === 'roguelite') {
      const newLevel = Math.floor(this.applesEaten / 5) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.events.onLevelUp(newLevel);
      }
    }

    // 补苹果
    const apples = this.foods.filter((f) => f.kind === 'apple').length;
    if (food.kind === 'apple' && apples < this.appleCap()) {
      this.spawnFood('apple', now);
    }
    // 概率生成金苹果
    if (food.kind === 'apple' && Math.random() < this.goldChance() && !this.foods.some((f) => f.kind === 'gold')) {
      this.spawnFood('gold', now);
    }
  }

  private revive(now: number) {
    // 以头部为中心保留 5 节，清场周围
    this.snake = this.snake.slice(0, 5);
    const head = this.snake[0];
    // 确保头部周围安全：移除与身体重叠检测由调用方保证；简单处理：把身体排成直线向后
    const d = this.dir;
    this.snake = [{ ...head }];
    for (let i = 1; i < 5; i++) {
      let bx = head.x - d.x * i;
      let by = head.y - d.y * i;
      if (bx < 0) bx += this.cols;
      if (bx >= this.cols) bx -= this.cols;
      if (by < 0) by += this.rows;
      if (by >= this.rows) by -= this.rows;
      this.snake.push({ x: bx, y: by });
    }
    this.combo = 0;
    this.dirQueue = [];
    this.phaseUntil = now + 1500; // 复活短暂无敌
  }

  private die(cause: 'wall' | 'self', now: number) {
    this.alive = false;
    this.deathCause = cause;
    this.diedAt = now;
    this.events.onDie(cause);
  }

  /** 渲染辅助：身体某节的颜色插值系数 0(头)..1(尾) */
  tailT(index: number): number {
    return this.snake.length <= 1 ? 0 : index / (this.snake.length - 1);
  }
}
