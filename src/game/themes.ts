export interface Theme {
  id: string;
  name: string;
  /** 页面/棋盘背景 */
  bg: string;
  /** 棋盘区域背景（略深或略浅于页面） */
  board: string;
  /** 网格线颜色 */
  grid: string;
  /** 蛇头颜色 */
  snakeHead: string;
  /** 蛇身颜色 */
  snakeBody: string;
  /** 蛇身尾部渐变色 */
  snakeTail: string;
  /** 普通苹果 */
  apple: string;
  appleRing: string;
  /** 金苹果 */
  gold: string;
  goldRing: string;
  /** 主文字颜色 */
  ink: string;
  /** 次要文字 */
  inkSoft: string;
  /** 强调色（按钮、徽章） */
  accent: string;
  /** 危险/警告 */
  danger: string;
  /** 卡片背景 */
  card: string;
  /** 卡片边框 */
  cardBorder: string;
  /** 障碍物 */
  obstacle: string;
}

export const THEMES: Theme[] = [
  {
    id: 'default', name: 'DEFAULT',
    bg: '#f4f1ea', board: '#f8f6f0', grid: 'rgba(60,66,80,0.055)',
    snakeHead: '#3c4250', snakeBody: '#3c4250', snakeTail: '#8b8fa0',
    apple: '#e04a3a', appleRing: 'rgba(224,74,58,0.28)',
    gold: '#e8a83c', goldRing: 'rgba(232,168,60,0.30)',
    ink: '#2e3440', inkSoft: '#9aa0ad', accent: '#3c4250', danger: '#d94f3d',
    card: '#fbfaf6', cardBorder: '#e3ded2', obstacle: '#b9bcc4',
  },
  {
    id: 'forest', name: 'FOREST',
    bg: '#16281f', board: '#1b3026', grid: 'rgba(255,255,255,0.045)',
    snakeHead: '#3ecfa5', snakeBody: '#35b78f', snakeTail: '#2a7a63',
    apple: '#f2c14e', appleRing: 'rgba(242,193,78,0.28)',
    gold: '#ffd97a', goldRing: 'rgba(255,217,122,0.32)',
    ink: '#e8f2ec', inkSoft: '#7fa392', accent: '#3ecfa5', danger: '#e06c5a',
    card: '#20362b', cardBorder: '#2c4638', obstacle: '#4a5f55',
  },
  {
    id: 'desert', name: 'DESERT',
    bg: '#f2e3c4', board: '#f7ebd2', grid: 'rgba(120,80,30,0.06)',
    snakeHead: '#e07b2a', snakeBody: '#e58a3a', snakeTail: '#f0b26a',
    apple: '#d94f3d', appleRing: 'rgba(217,79,61,0.28)',
    gold: '#e8a83c', goldRing: 'rgba(232,168,60,0.32)',
    ink: '#5a3a1e', inkSoft: '#b08d5f', accent: '#e07b2a', danger: '#c2452f',
    card: '#fbf3e0', cardBorder: '#e5d3ac', obstacle: '#cbb489',
  },
  {
    id: 'ocean', name: 'OCEAN',
    bg: '#14324e', board: '#183a59', grid: 'rgba(255,255,255,0.05)',
    snakeHead: '#2fbfa5', snakeBody: '#2aa892', snakeTail: '#1f7a6c',
    apple: '#f2c14e', appleRing: 'rgba(242,193,78,0.28)',
    gold: '#ffd97a', goldRing: 'rgba(255,217,122,0.32)',
    ink: '#e6f1f7', inkSoft: '#7ba0b8', accent: '#2fbfa5', danger: '#e06c5a',
    card: '#1d4265', cardBorder: '#2a557c', obstacle: '#3d5a72',
  },
  {
    id: 'sunset', name: 'SUNSET',
    bg: '#f4835f', board: '#f78f6d', grid: 'rgba(255,255,255,0.08)',
    snakeHead: '#8b5cf6', snakeBody: '#9d6ff5', snakeTail: '#c09df7',
    apple: '#ffd166', appleRing: 'rgba(255,209,102,0.35)',
    gold: '#ffe29a', goldRing: 'rgba(255,226,154,0.4)',
    ink: '#4a1f2e', inkSoft: '#a35a52', accent: '#8b5cf6', danger: '#b93a2a',
    card: '#f9a07e', cardBorder: '#e07854', obstacle: '#d96b4a',
  },
  {
    id: 'neon', name: 'NEON',
    bg: '#1a0b2e', board: '#211040', grid: 'rgba(216,80,255,0.07)',
    snakeHead: '#e050ff', snakeBody: '#c93ef0', snakeTail: '#8a2bb0',
    apple: '#2ee6c8', appleRing: 'rgba(46,230,200,0.30)',
    gold: '#ffd166', goldRing: 'rgba(255,209,102,0.35)',
    ink: '#f3e8ff', inkSoft: '#9a6fc0', accent: '#e050ff', danger: '#ff5a7a',
    card: '#2a1650', cardBorder: '#3d2270', obstacle: '#4a2d78',
  },
  {
    id: 'arcade', name: 'ARCADE',
    bg: '#181818', board: '#1f1f1f', grid: 'rgba(255,255,255,0.05)',
    snakeHead: '#f5c542', snakeBody: '#eab308', snakeTail: '#a16207',
    apple: '#ef4444', appleRing: 'rgba(239,68,68,0.30)',
    gold: '#fde68a', goldRing: 'rgba(253,230,138,0.35)',
    ink: '#f5f5f4', inkSoft: '#8a8a8a', accent: '#f5c542', danger: '#ef4444',
    card: '#262626', cardBorder: '#3a3a3a', obstacle: '#525252',
  },
  {
    id: 'nordic', name: 'NORDIC',
    bg: '#c9d8e4', board: '#d3e0ea', grid: 'rgba(40,60,80,0.06)',
    snakeHead: '#2e3a48', snakeBody: '#3b4a5c', snakeTail: '#7d8ea0',
    apple: '#e04a3a', appleRing: 'rgba(224,74,58,0.28)',
    gold: '#e8a83c', goldRing: 'rgba(232,168,60,0.32)',
    ink: '#26313e', inkSoft: '#7d8ea0', accent: '#2e3a48', danger: '#c2452f',
    card: '#dde7f0', cardBorder: '#b8c9d8', obstacle: '#93a7b8',
  },
  {
    id: 'paper', name: 'PAPER',
    bg: '#f5f1e6', board: '#faf7ee', grid: 'rgba(60,50,30,0.06)',
    snakeHead: '#1f2937', snakeBody: '#374151', snakeTail: '#9ca3af',
    apple: '#dc2626', appleRing: 'rgba(220,38,38,0.26)',
    gold: '#d97706', goldRing: 'rgba(217,119,6,0.30)',
    ink: '#1f2937', inkSoft: '#a8a29e', accent: '#1f2937', danger: '#dc2626',
    card: '#fffdf6', cardBorder: '#e7e0cd', obstacle: '#c9c2ae',
  },
  {
    id: 'midnight', name: 'MIDNIGHT',
    bg: '#0b1220', board: '#101a2e', grid: 'rgba(255,255,255,0.05)',
    snakeHead: '#34d399', snakeBody: '#2bb886', snakeTail: '#1d7a5c',
    apple: '#fbbf24', appleRing: 'rgba(251,191,36,0.28)',
    gold: '#fde68a', goldRing: 'rgba(253,230,138,0.32)',
    ink: '#e2e8f0', inkSoft: '#64748b', accent: '#34d399', danger: '#f87171',
    card: '#16223a', cardBorder: '#24344f', obstacle: '#334155',
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
