import type { Perk } from './types';

export const PERKS: Perk[] = [
  { id: 'speed-demon', name: 'Speed Demon', tag: 'HOT', desc: '移动速度 +12%，得分 +5%。越快越值钱。', icon: 'bolt', maxStacks: 3 },
  { id: 'combo-master', name: 'Combo Master', tag: 'CHAIN', desc: '连击窗口 +1.6 秒，连击上限 +2。', icon: 'link', maxStacks: 2 },
  { id: 'golden-touch', name: 'Golden Touch', tag: 'LUCK', desc: '金苹果出现率翻倍，金苹果得分 +50%。', icon: 'coin', maxStacks: 2 },
  { id: 'phase-trickster', name: 'Phase Trickster', tag: 'WILD', desc: '每 12 秒获得 2 秒相位，可穿过自身。', icon: 'ghost', maxStacks: 2 },
  { id: 'magnet-core', name: 'Magnet Core', tag: 'PULL', desc: '吸附 1 格内的苹果，自动滑向蛇头。', icon: 'magnet', maxStacks: 2 },
  { id: 'shield-shell', name: 'Shield Shell', tag: 'SAFE', desc: '每局抵挡一次致命碰撞。护盾破裂后 20 秒重生。', icon: 'shield', maxStacks: 2 },
  { id: 'slow-mo', name: 'Slow Mo', tag: 'CALM', desc: '速度 -10%，但所有得分 +15%。', icon: 'clock', maxStacks: 2 },
  { id: 'apple-bloom', name: 'Apple Bloom', tag: 'FARM', desc: '场上苹果上限 +1，苹果得分 +10%。', icon: 'bloom', maxStacks: 3 },
  { id: 'long-haul', name: 'Long Haul', tag: 'GROW', desc: '每个苹果额外 +1 节身体，长度分 +25%。', icon: 'ruler', maxStacks: 2 },
  { id: 'second-wind', name: 'Second Wind', tag: 'LIFE', desc: '死亡时以 5 节身体复活一次，清空连击。', icon: 'heart', maxStacks: 1 },
  { id: 'score-surge', name: 'Score Surge', tag: 'BUFF', desc: '连击 ≥ x2 时，所有得分 +30%。', icon: 'surge', maxStacks: 2 },
  { id: 'zen-garden', name: 'Zen Garden', tag: 'CHILL', desc: '金苹果存续时间 +4 秒，金苹果 +1 节。', icon: 'zen', maxStacks: 2 },
];

export function getPerk(id: string): Perk {
  return PERKS.find((p) => p.id === id)!;
}

/** 随机抽取 n 个不重复且未叠满的 perk */
export function draftPerks(owned: Map<string, number>, n = 3): Perk[] {
  const pool = PERKS.filter((p) => (owned.get(p.id) ?? 0) < p.maxStacks);
  const out: Perk[] = [];
  const copy = [...pool];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}
