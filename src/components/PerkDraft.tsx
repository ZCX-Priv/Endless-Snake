import { useEffect, useState } from 'react';
import type { Perk } from '../game/types';
import type { Theme } from '../game/themes';
import { sfx } from '../game/sound';

interface Props {
  theme: Theme;
  level: number;
  choices: Perk[];
  owned: Map<string, number>;
  onPick: (perk: Perk) => void;
}

const ICONS: Record<string, string> = {
  bolt: '⚡', link: '⛓', coin: '◉', ghost: '◌', magnet: '∩',
  shield: '⛨', clock: '◷', bloom: '✿', ruler: '↔', heart: '♥',
  surge: '↗', zen: '☯',
};

export function PerkDraft({ theme, level, choices, owned, onPick }: Props) {
  const [selected, setSelected] = useState(0);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 60);
    return () => clearTimeout(t);
  }, [choices]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setSelected((s) => (s + choices.length - 1) % choices.length);
        sfx.click();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setSelected((s) => (s + 1) % choices.length);
        sfx.click();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPick(choices[selected]);
      } else if (['1', '2', '3'].includes(e.key)) {
        const i = parseInt(e.key) - 1;
        if (i < choices.length) onPick(choices[i]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [choices, selected, onPick]);

  return (
    <div className="overlay draft-overlay">
      <div className={`draft-panel ${entering ? 'entering' : ''}`}>
        <div className="draft-head">
          <div className="draft-kicker" style={{ color: theme.danger }}>EVOLUTION {String(level).padStart(2, '0')}</div>
          <div className="draft-title" style={{ color: theme.ink }}>选择一项强化</div>
          <div className="draft-sub" style={{ color: theme.inkSoft }}>DRAFT 1 OF 3 · 按 1/2/3 或 ←→ + ENTER</div>
        </div>
        <div className="draft-cards">
          {choices.map((p, i) => {
            const stacks = owned.get(p.id) ?? 0;
            return (
              <button
                key={p.id}
                className={`draft-card ${i === selected ? 'selected' : ''}`}
                style={{
                  background: theme.card,
                  borderColor: i === selected ? theme.danger : theme.cardBorder,
                  animationDelay: `${i * 90}ms`,
                }}
                onClick={() => onPick(p)}
                onMouseEnter={() => { setSelected(i); sfx.click(); }}
              >
                <div className="draft-card-top">
                  <span className="draft-icon" style={{ color: theme.accent }}>{ICONS[p.icon] ?? '◆'}</span>
                  <span className="draft-tag" style={{ background: theme.danger, color: '#fff' }}>{p.tag}</span>
                </div>
                <div className="draft-name" style={{ color: theme.ink }}>{p.name}</div>
                <div className="draft-desc" style={{ color: theme.inkSoft }}>{p.desc}</div>
                <div className="draft-foot">
                  <span className="draft-key" style={{ borderColor: theme.cardBorder, color: theme.inkSoft }}>{i + 1}</span>
                  <span className="draft-stacks" style={{ color: theme.inkSoft }}>
                    {stacks > 0 ? `已叠 ${stacks} 层` : `最多 ${p.maxStacks} 层`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
