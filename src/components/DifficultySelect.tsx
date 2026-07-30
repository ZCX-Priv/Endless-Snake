import { useEffect, useState } from 'react';
import type { Theme } from '../game/themes';
import { DIFFICULTIES, type Difficulty } from '../game/types';
import { sfx } from '../game/sound';

interface Props {
  theme: Theme;
  modeName: string;
  onPick: (d: Difficulty) => void;
  onBack: () => void;
}

export function DifficultySelect({ theme, modeName, onPick, onBack }: Props) {
  const [sel, setSel] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { setSel((s) => (s + DIFFICULTIES.length - 1) % DIFFICULTIES.length); sfx.click(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { setSel((s) => (s + 1) % DIFFICULTIES.length); sfx.click(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(DIFFICULTIES[sel].id); }
      else if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sel, onPick, onBack]);

  return (
    <div className="menu-screen" style={{ background: theme.bg }}>
      <div className="menu-inner narrow">
        <div className="diff-head">
          <div className="draft-kicker" style={{ color: theme.danger }}>{modeName}</div>
          <h2 className="diff-title" style={{ color: theme.ink }}>选择难度</h2>
          <p style={{ color: theme.inkSoft }}>↑↓ 选择 · ENTER 开始 · ESC 返回</p>
        </div>
        <div className="diff-list">
          {DIFFICULTIES.map((d, i) => (
            <button
              key={d.id}
              className={`diff-row ${i === sel ? 'selected' : ''}`}
              style={{
                background: i === sel ? theme.card : 'transparent',
                borderColor: i === sel ? theme.accent : theme.cardBorder,
              }}
              onClick={() => { setSel(i); onPick(d.id); }}
              onMouseEnter={() => { setSel(i); sfx.click(); }}
            >
              <span className="diff-name" style={{ color: theme.ink }}>{d.name}</span>
              <span className="diff-label" style={{ color: theme.inkSoft }}>{d.label}</span>
              <span className="diff-arrow" style={{ color: theme.accent }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
