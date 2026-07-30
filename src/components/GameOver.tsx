import { useEffect, useState } from 'react';
import type { Theme } from '../game/themes';
import type { RunStats, ScoreEntry } from '../game/types';
import { getPerk } from '../game/perks';
import { sfx } from '../game/sound';

interface Props {
  theme: Theme;
  stats: RunStats;
  isNewBest: boolean;
  board: ScoreEntry[];
  onSubmitName: (name: string) => void;
  submitted: boolean;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOver({ theme, stats, isNewBest, board, onSubmitName, submitted, onRetry, onMenu }: Props) {
  const [name, setName] = useState('YOU');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (submitted || stats.score === 0)) onRetry();
      if (e.key === 'Escape') onMenu();
      if ((e.key === 'r' || e.key === 'R') && (submitted || stats.score === 0)) onRetry();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onRetry, onMenu, submitted, stats.score]);

  const mins = Math.floor(stats.timeMs / 60000);
  const secs = Math.floor((stats.timeMs % 60000) / 1000);

  return (
    <div className="overlay gameover-overlay">
      <div className={`gameover-panel ${show ? 'show' : ''}`} style={{ background: theme.card, borderColor: theme.cardBorder }}>
        <div className="gameover-kicker" style={{ color: theme.danger }}>RUN OVER</div>
        <div className="gameover-title" style={{ color: theme.ink }}>游戏结束</div>

        <div className="gameover-score" style={{ color: theme.ink }}>
          {stats.score.toLocaleString('en-US')}
          {isNewBest && <span className="new-best" style={{ background: theme.gold }}>NEW BEST!</span>}
        </div>

        <div className="gameover-stats" style={{ borderColor: theme.cardBorder }}>
          <div className="go-stat">
            <span style={{ color: theme.inkSoft }}>苹果</span>
            <b style={{ color: theme.ink }}>{stats.apples}</b>
          </div>
          <div className="go-stat">
            <span style={{ color: theme.inkSoft }}>金苹果</span>
            <b style={{ color: theme.gold }}>{stats.golds}</b>
          </div>
          <div className="go-stat">
            <span style={{ color: theme.inkSoft }}>最高连击</span>
            <b style={{ color: theme.ink }}>×{stats.bestCombo}</b>
          </div>
          <div className="go-stat">
            <span style={{ color: theme.inkSoft }}>长度</span>
            <b style={{ color: theme.ink }}>{stats.length}</b>
          </div>
          <div className="go-stat">
            <span style={{ color: theme.inkSoft }}>存活</span>
            <b style={{ color: theme.ink }}>{mins}:{String(secs).padStart(2, '0')}</b>
          </div>
        </div>

        {stats.perks.length > 0 && (
          <div className="gameover-perks">
            {stats.perks.map((id) => (
              <span key={id} className="perk-chip" style={{ background: theme.bg, color: theme.inkSoft, borderColor: theme.cardBorder }}>
                {getPerk(id).name}
              </span>
            ))}
          </div>
        )}

        {/* 名字提交 + 排行榜 */}
        {!submitted && stats.score > 0 ? (
          <div className="name-row">
            <input
              className="name-input"
              style={{ background: theme.bg, color: theme.ink, borderColor: theme.cardBorder }}
              value={name}
              maxLength={5}
              onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') { sfx.pick(); onSubmitName(name || 'YOU'); } e.stopPropagation(); }}
              autoFocus
            />
            <button
              className="btn btn-primary"
              style={{ background: theme.accent, color: theme.bg }}
              onClick={() => { sfx.pick(); onSubmitName(name || 'YOU'); }}
            >
              上榜
            </button>
          </div>
        ) : (
          <div className="mini-board">
            {board.slice(0, 5).map((e, i) => {
              const isMe = e.score === stats.score && Date.now() - e.date < 60000;
              return (
                <div
                  key={`${e.name}-${e.date}`}
                  className="mini-board-row"
                  style={{
                    borderColor: theme.cardBorder,
                    background: isMe ? theme.goldRing : 'transparent',
                    borderRadius: isMe ? 8 : 0,
                  }}
                >
                  <span style={{ color: theme.inkSoft }}>#{i + 1}</span>
                  <span style={{ color: theme.ink }}>{e.name}{isMe ? ' ←' : ''}</span>
                  <b style={{ color: theme.ink }}>{e.score.toLocaleString()}</b>
                </div>
              );
            })}
          </div>
        )}

        <div className="gameover-actions">
          <button className="btn btn-primary" style={{ background: theme.accent, color: theme.bg }} onClick={() => { sfx.click(); onRetry(); }}>
            再来一局 <span className="key-hint">R</span>
          </button>
          <button className="btn btn-ghost" style={{ color: theme.inkSoft, borderColor: theme.cardBorder }} onClick={() => { sfx.click(); onMenu(); }}>
            回主菜单 <span className="key-hint">ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
}
