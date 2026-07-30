import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SnakeEngine } from './game/engine';
import { getTheme } from './game/themes';
import { DIFFICULTIES, type Difficulty, type GameMode, type RunStats, type ScoreEntry } from './game/types';
import { draftPerks } from './game/perks';
import { getHighScore, setHighScore, getLeaderboard, submitScore, storage } from './game/storage';
import { sfx } from './game/sound';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { DifficultySelect } from './components/DifficultySelect';
import { PerkDraft } from './components/PerkDraft';
import { GameOver } from './components/GameOver';
import { PauseMenu } from './components/PauseMenu';

type Screen =
  | { kind: 'menu' }
  | { kind: 'difficulty'; mode: GameMode }
  | { kind: 'game' };

function App() {
  const [themeId, setThemeId] = useState(() => storage.get<string>('theme', 'default'));
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [mode, setMode] = useState<GameMode>('classic');
  const [diffId, setDiffId] = useState<Difficulty>('normal');
  const diff = useMemo(() => DIFFICULTIES.find((d) => d.id === diffId)!, [diffId]);

  const [engine, setEngine] = useState<SnakeEngine | null>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(() => storage.get<boolean>('muted', false));

  const [score, setScore] = useState(0);
  const [highScore, setHigh] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // roguelite draft
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftChoices, setDraftChoices] = useState(() => draftPerks(new Map()));
  const draftLevelRef = useRef(1);

  // game over
  const [overOpen, setOverOpen] = useState(false);
  const [runStats, setRunStats] = useState<RunStats | null>(null);
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // 开局倒计时
  const [countdown, setCountdown] = useState(0);

  useEffect(() => { sfx.enabled = !muted; storage.set('muted', muted); }, [muted]);
  useEffect(() => { storage.set('theme', themeId); }, [themeId]);

  const startGame = useCallback((m: GameMode, d: Difficulty) => {
    const dd = DIFFICULTIES.find((x) => x.id === d)!;
    const eng = new SnakeEngine(m, dd);
    (window as unknown as { __engine: SnakeEngine }).__engine = eng;
    setMode(m);
    setDiffId(d);
    setEngine(eng);
    setScore(0);
    setHigh(getHighScore(m));
    setIsNewBest(false);
    setOverOpen(false);
    setDraftOpen(false);
    setSubmitted(false);
    setPaused(false);
    setScreen({ kind: 'game' });
    setRunning(false);
    setCountdown(3);
  }, []);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => {
      if (countdown === 1) {
        setCountdown(0);
        setRunning(true);
        if (engine) engine.startedAt = performance.now();
      } else {
        setCountdown(countdown - 1);
      }
      sfx.click();
    }, 700);
    return () => clearTimeout(t);
  }, [countdown, engine]);

  const endRun = useCallback(() => {
    if (!engine) return;
    const stats: RunStats = {
      apples: engine.applesEaten,
      golds: engine.goldsEaten,
      bestCombo: engine.bestCombo,
      score: engine.score,
      length: engine.snake.length,
      timeMs: engine.elapsedMs,
      perks: [...engine.perks.stacks.keys()],
    };
    const prevBest = getHighScore(mode);
    setIsNewBest(engine.score > prevBest && engine.score > 0);
    setHighScore(mode, engine.score);
    setHigh(Math.max(prevBest, engine.score));
    setRunStats(stats);
    setBoard(getLeaderboard(mode));
    setRunning(false);
    setOverOpen(true);
  }, [engine, mode]);

  const handleLevelUp = useCallback((level: number) => {
    if (!engine) return;
    draftLevelRef.current = level;
    setDraftChoices(draftPerks(engine.perks.stacks));
    setPaused(true);
    setDraftOpen(true);
  }, [engine]);

  const handlePickPerk = useCallback((perk: { id: string }) => {
    if (!engine) return;
    sfx.pick();
    engine.addPerk(perk.id);
    setDraftOpen(false);
    setPaused(false);
  }, [engine]);

  const handleSubmitName = useCallback((name: string) => {
    if (!runStats) return;
    const b = submitScore(mode, name, runStats.score);
    setBoard(b);
    setSubmitted(true);
  }, [mode, runStats]);

  // 全局按键：暂停/静音
  useEffect(() => {
    if (screen.kind !== 'game' || !engine) return;
    const handler = (e: KeyboardEvent) => {
      if (draftOpen || overOpen) return;
      if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key === 'Escape') {
        setPaused((p) => !p);
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((m) => !m);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen.kind, engine, draftOpen, overOpen]);

  const onScoreChange = useCallback(() => {
    if (!engine) return;
    setScore(engine.score);
  }, [engine]);

  // ---- 渲染 ----
  if (screen.kind === 'menu') {
    return (
      <MainMenu
        theme={theme}
        themeId={themeId}
        onSelectTheme={setThemeId}
        onStart={(m) => setScreen({ kind: 'difficulty', mode: m })}
      />
    );
  }

  if (screen.kind === 'difficulty') {
    return (
      <DifficultySelect
        theme={theme}
        modeName={screen.mode === 'classic' ? 'CLASSIC' : 'ROGUELITE'}
        onPick={(d) => startGame(screen.mode, d)}
        onBack={() => setScreen({ kind: 'menu' })}
      />
    );
  }

  if (!engine) return null;

  return (
    <div className="game-screen" style={{ background: theme.bg }}>
      <GameCanvas
        engine={engine}
        theme={theme}
        running={running}
        paused={paused}
        onGameOver={endRun}
        onLevelUp={handleLevelUp}
        onScoreChange={onScoreChange}
      />

      <HUD
        engine={engine}
        theme={theme}
        modeLabel={mode === 'classic' ? 'CLASSIC' : 'ROGUELITE'}
        subLabel={mode === 'classic'
          ? `${diff.name} · ${diff.cols}×${diff.rows}`
          : `EVOLUTION ${String(engine.level).padStart(2, '0')} · ${diff.cols}×${diff.rows}`}
        score={score}
        highScore={highScore}
      />

      {/* 倒计时 */}
      {countdown > 0 && (
        <div className="overlay countdown-overlay">
          <div className="countdown-num" style={{ color: theme.ink }} key={countdown}>{countdown}</div>
          <div className="countdown-hint" style={{ color: theme.inkSoft }}>
            ↑↓←→ / WASD 移动 · 穿墙不死 · 别咬到自己
          </div>
        </div>
      )}

      {/* 暂停 */}
      {paused && !draftOpen && !overOpen && countdown === 0 && (
        <PauseMenu
          theme={theme}
          muted={muted}
          onResume={() => setPaused(false)}
          onRestart={() => startGame(mode, diffId)}
          onToggleMute={() => setMuted((m) => !m)}
          onQuit={() => { setScreen({ kind: 'menu' }); setEngine(null); }}
        />
      )}

      {/* 肉鸽抽卡 */}
      {draftOpen && (
        <PerkDraft
          theme={theme}
          level={draftLevelRef.current}
          choices={draftChoices}
          owned={engine.perks.stacks}
          onPick={handlePickPerk}
        />
      )}

      {/* 结算 */}
      {overOpen && runStats && (
        <GameOver
          theme={theme}
          stats={runStats}
          isNewBest={isNewBest}
          board={board}
          onSubmitName={handleSubmitName}
          submitted={submitted}
          onRetry={() => startGame(mode, diffId)}
          onMenu={() => { setScreen({ kind: 'menu' }); setEngine(null); }}
        />
      )}
    </div>
  );
}

export default App;
