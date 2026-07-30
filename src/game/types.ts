export type Vec = { x: number; y: number };
export type Dir = { x: number; y: number };

export const UP: Dir = { x: 0, y: -1 };
export const DOWN: Dir = { x: 0, y: 1 };
export const LEFT: Dir = { x: -1, y: 0 };
export const RIGHT: Dir = { x: 1, y: 0 };

export type GameMode = 'classic' | 'roguelite';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  cols: number;
  rows: number;
  baseTick: number; // ms per step at start
  minTick: number;
  speedUpPerApple: number; // ms reduced per apple
  label: string;
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'easy', name: 'CHILL', cols: 20, rows: 14, baseTick: 170, minTick: 110, speedUpPerApple: 1.2, label: '20×14 · 慢速' },
  { id: 'normal', name: 'NORMAL', cols: 24, rows: 16, baseTick: 140, minTick: 82, speedUpPerApple: 1.1, label: '24×16 · 标准' },
  { id: 'hard', name: 'INSANE', cols: 32, rows: 18, baseTick: 118, minTick: 64, speedUpPerApple: 1.0, label: '32×18 · 极速' },
];

export interface Food {
  pos: Vec;
  kind: 'apple' | 'gold';
  bornAt: number;
  expiresAt: number; // gold only
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
  ring?: boolean;
}

export interface FloatText {
  x: number; y: number;
  text: string;
  color: string;
  bornAt: number;
  size: number;
}

export interface Ghost {
  cells: Vec[];
  bornAt: number;
}

export interface Perk {
  id: string;
  name: string;
  tag: string;
  desc: string;
  icon: string; // emoji-free glyph key
  maxStacks: number;
}

export interface RunStats {
  apples: number;
  golds: number;
  bestCombo: number;
  score: number;
  length: number;
  timeMs: number;
  perks: string[];
}

export interface ScoreEntry {
  name: string;
  score: number;
  mode: GameMode;
  date: number;
}
