import type { SnakeEngine } from '../game/engine';
import type { Theme } from '../game/themes';

interface Props {
  engine: SnakeEngine;
  theme: Theme;
  modeLabel: string;
  subLabel: string;
  score: number;
  highScore: number;
}

export function HUD({ engine, theme, modeLabel, subLabel, score, highScore }: Props) {
  const now = performance.now();
  const comboActive = engine.combo > 0 && now < engine.comboExpiresAt;
  const comboFrac = comboActive
    ? Math.max(0, (engine.comboExpiresAt - now) / engine.comboWindow())
    : 0;

  return (
    <>
      {/* 左上：模式徽章 */}
      <div className="hud hud-topleft">
        <div className="mode-badge" style={{ background: theme.accent, color: theme.bg }}>
          {modeLabel}
        </div>
        <div className="mode-sub" style={{ color: theme.inkSoft }}>{subLabel}</div>
      </div>

      {/* 右上：分数 */}
      <div className="hud hud-topright">
        <div className="score-value" style={{ color: theme.ink }}>
          {score.toLocaleString('en-US')}
        </div>
        <div className="score-label" style={{ color: theme.inkSoft }}>SCORE</div>
        {highScore > 0 && (
          <div className="score-best" style={{ color: theme.inkSoft }}>
            BEST {highScore.toLocaleString('en-US')}
          </div>
        )}
      </div>

      {/* 左下：长度 + 连击 */}
      <div className="hud hud-bottomleft">
        <div className="stat-card" style={{ background: theme.card, borderColor: theme.cardBorder }}>
          <div className="stat-label" style={{ color: theme.inkSoft }}>LEN</div>
          <div className="stat-value" style={{ color: theme.ink }}>{engine.snake.length}</div>
        </div>
        <div
          className={`stat-card combo-card ${comboActive && engine.combo >= 2 ? 'combo-hot' : ''}`}
          style={{
            background: comboActive && engine.combo >= 2 ? theme.gold : theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <div className="stat-label" style={{ color: comboActive && engine.combo >= 2 ? '#7a5410' : theme.inkSoft }}>
            COMBO
          </div>
          <div className="stat-value" style={{ color: comboActive && engine.combo >= 2 ? '#5a3d08' : theme.ink }}>
            ×{engine.comboMult().toFixed(1)}
          </div>
          {comboActive && (
            <div className="combo-bar">
              <div
                className="combo-bar-fill"
                style={{ width: `${comboFrac * 100}%`, background: comboActive && engine.combo >= 2 ? '#7a5410' : theme.inkSoft }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 相位/护盾状态图标 */}
      <div className="hud hud-bottomright">
        {engine.shieldReady && (
          <div className="status-chip" style={{ background: 'rgba(90,160,255,0.15)', color: '#5aa0ff', borderColor: 'rgba(90,160,255,0.4)' }}>
            SHIELD
          </div>
        )}
        {engine.stack('second-wind') > 0 && !engine.secondWindUsed && (
          <div className="status-chip" style={{ background: 'rgba(224,90,90,0.12)', color: theme.danger, borderColor: 'rgba(224,90,90,0.35)' }}>
            2ND WIND
          </div>
        )}
      </div>
    </>
  );
}
