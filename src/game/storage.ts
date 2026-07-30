import type { GameMode, ScoreEntry } from './types';

const PREFIX = 'endless-snake:';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch { /* ignore */ }
  },
};

export function getHighScore(mode: GameMode): number {
  return storage.get<number>(`highscore:${mode}`, 0);
}

export function setHighScore(mode: GameMode, score: number) {
  if (score > getHighScore(mode)) storage.set(`highscore:${mode}`, score);
}

export function getLeaderboard(mode: GameMode): ScoreEntry[] {
  return storage.get<ScoreEntry[]>(`board:${mode}`, defaultBoard(mode));
}

function defaultBoard(mode: GameMode): ScoreEntry[] {
  const now = Date.now();
  const base: [string, number][] = mode === 'classic'
    ? [['ACE', 12840], ['NOVA', 9620], ['PIXEL', 7310], ['ECHO', 5180], ['JUNO', 3450]]
    : [['ACE', 1563], ['NOVA', 1280], ['PIXEL', 1076], ['ECHO', 890], ['JUNO', 634]];
  return base.map(([name, score], i) => ({ name, score, mode, date: now - i * 86400000 }));
}

export function submitScore(mode: GameMode, name: string, score: number): ScoreEntry[] {
  const board = getLeaderboard(mode);
  board.push({ name: name.toUpperCase().slice(0, 5) || 'YOU', score, mode, date: Date.now() });
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, 8);
  storage.set(`board:${mode}`, trimmed);
  return trimmed;
}
