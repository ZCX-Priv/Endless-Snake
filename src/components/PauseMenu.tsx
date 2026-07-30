import { useEffect } from 'react';
import type { Theme } from '../game/themes';
import { sfx } from '../game/sound';

interface Props {
  theme: Theme;
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onQuit: () => void;
}

export function PauseMenu({ theme, muted, onResume, onRestart, onToggleMute, onQuit }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); onResume(); }
      if (e.key === 'r' || e.key === 'R') onRestart();
      if (e.key === 'm' || e.key === 'M') onToggleMute();
      if (e.key === 'q' || e.key === 'Q') onQuit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onResume, onRestart, onToggleMute, onQuit]);

  return (
    <div className="overlay pause-overlay">
      <div className="pause-panel" style={{ background: theme.card, borderColor: theme.cardBorder }}>
        <div className="pause-title" style={{ color: theme.ink }}>已暂停</div>
        <div className="pause-list">
          <button className="pause-item" style={{ color: theme.ink }} onClick={() => { sfx.click(); onResume(); }}>
            继续 <span className="key-hint">SPACE</span>
          </button>
          <button className="pause-item" style={{ color: theme.ink }} onClick={() => { sfx.click(); onRestart(); }}>
            重新开始 <span className="key-hint">R</span>
          </button>
          <button className="pause-item" style={{ color: theme.ink }} onClick={() => { sfx.click(); onToggleMute(); }}>
            {muted ? '取消静音' : '静音'} <span className="key-hint">M</span>
          </button>
          <button className="pause-item" style={{ color: theme.danger }} onClick={() => { sfx.click(); onQuit(); }}>
            放弃本局 <span className="key-hint">Q</span>
          </button>
        </div>
      </div>
    </div>
  );
}
