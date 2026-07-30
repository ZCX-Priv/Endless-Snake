import type { Theme } from '../game/themes';
import { THEMES } from '../game/themes';
import type { GameMode } from '../game/types';
import { getHighScore } from '../game/storage';
import { sfx } from '../game/sound';

interface Props {
  theme: Theme;
  themeId: string;
  onSelectTheme: (id: string) => void;
  onStart: (mode: GameMode) => void;
}

export function MainMenu({ theme, themeId, onSelectTheme, onStart }: Props) {
  const classicBest = getHighScore('classic');
  const rogueBest = getHighScore('roguelite');

  return (
    <div className="menu-screen" style={{ background: theme.bg }}>
      <div className="menu-inner">
        {/* Logo 区 */}
        <div className="menu-logo-row">
          <SnakeLogo theme={theme} />
          <div>
            <h1 className="menu-title" style={{ color: theme.ink }}>
              ENDLESS<br />SNAKE
            </h1>
            <p className="menu-tagline" style={{ color: theme.inkSoft }}>
              无限贪吃蛇 · 像素级复刻
            </p>
          </div>
        </div>

        {/* 模式卡片 */}
        <div className="mode-cards">
          <button
            className="mode-card"
            style={{ background: theme.card, borderColor: theme.cardBorder }}
            onClick={() => { sfx.click(); onStart('classic'); }}
            onMouseEnter={() => sfx.click()}
          >
            <div className="mode-card-badge" style={{ background: theme.accent, color: theme.bg }}>CLASSIC</div>
            <div className="mode-card-title" style={{ color: theme.ink }}>经典模式</div>
            <div className="mode-card-desc" style={{ color: theme.inkSoft }}>
              纯粹的贪吃蛇。吃苹果、连击、刷分，速度越来越快。
            </div>
            <div className="mode-card-best" style={{ color: theme.inkSoft }}>
              BEST <span style={{ color: theme.ink }}>{classicBest.toLocaleString()}</span>
            </div>
            <div className="mode-card-cta" style={{ color: theme.accent }}>ENTER →</div>
          </button>

          <button
            className="mode-card mode-card-rogue"
            style={{ background: theme.card, borderColor: theme.cardBorder }}
            onClick={() => { sfx.click(); onStart('roguelite'); }}
            onMouseEnter={() => sfx.click()}
          >
            <div className="mode-card-badge" style={{ background: theme.danger, color: '#fff' }}>ROGUELITE</div>
            <div className="mode-card-title" style={{ color: theme.ink }}>肉鸽模式</div>
            <div className="mode-card-desc" style={{ color: theme.inkSoft }}>
              每 5 个苹果进化一次，三选一强化，构筑你的蛇引擎。
            </div>
            <div className="mode-card-best" style={{ color: theme.inkSoft }}>
              BEST <span style={{ color: theme.ink }}>{rogueBest.toLocaleString()}</span>
            </div>
            <div className="mode-card-cta" style={{ color: theme.danger }}>ENTER →</div>
          </button>
        </div>

        {/* 主题选择 */}
        <div className="theme-section">
          <div className="theme-section-head">
            <span className="theme-section-title" style={{ color: theme.ink }}>THEMES</span>
            <span className="theme-section-sub" style={{ color: theme.inkSoft }}>选择一个世界</span>
          </div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-swatch ${t.id === themeId ? 'active' : ''}`}
                style={{
                  background: t.bg,
                  borderColor: t.id === themeId ? t.danger : t.cardBorder,
                }}
                onClick={() => { sfx.pick(); onSelectTheme(t.id); }}
                title={t.name}
              >
                <span className="swatch-snake">
                  <i style={{ background: t.snakeTail }} />
                  <i style={{ background: mixDot(t.snakeBody, t.snakeTail, 0.4) }} />
                  <i style={{ background: t.snakeBody }} />
                  <i style={{ background: t.snakeHead }} className="swatch-head" />
                </span>
                <span className="swatch-apple" style={{ background: t.apple }} />
                <span className="swatch-name" style={{ color: t.ink }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 操作说明 */}
        <div className="menu-help" style={{ color: theme.inkSoft }}>
          <span><b style={{ color: theme.ink }}>↑↓←→ / WASD</b> 移动</span>
          <span><b style={{ color: theme.ink }}>SPACE</b> 暂停</span>
          <span><b style={{ color: theme.ink }}>M</b> 静音</span>
          <span><b style={{ color: theme.ink }}>手机</b> 滑动控制</span>
        </div>
      </div>
    </div>
  );
}

function mixDot(c1: string, c2: string, t: number): string {
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(c1); const [r2, g2, b2] = p(c2);
  const l = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${l(r1, r2)},${l(g1, g2)},${l(b1, b2)})`;
}

function SnakeLogo({ theme }: { theme: Theme }) {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="menu-logo">
      <rect x="8" y="56" width="22" height="22" rx="7" fill={theme.snakeTail} />
      <rect x="34" y="56" width="22" height="22" rx="7" fill={theme.snakeBody} opacity="0.85" />
      <rect x="60" y="56" width="22" height="22" rx="7" fill={theme.snakeBody} />
      <rect x="60" y="30" width="22" height="22" rx="8" fill={theme.snakeHead} />
      <circle cx="71" cy="38" r="3.4" fill={theme.bg} />
      <circle cx="72" cy="38" r="1.8" fill={theme.snakeHead === '#f5c542' ? '#181818' : theme.ink} />
      <circle cx="24" cy="22" r="9" fill={theme.apple} />
      <circle cx="24" cy="22" r="13" fill="none" stroke={theme.appleRing} strokeWidth="4" />
      <path d="M24 13 q3 -5 7 -5" stroke="#7a4a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
