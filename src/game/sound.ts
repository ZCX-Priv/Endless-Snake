/** 轻量 WebAudio 音效合成器 */
class SoundFX {
  private ctx: AudioContext | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private beep(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slide = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  eat(combo: number) {
    const base = 520 + Math.min(combo, 10) * 45;
    this.beep(base, 0.09, 'sine', 0.10);
    this.beep(base * 1.5, 0.12, 'sine', 0.06);
  }

  gold() {
    this.beep(880, 0.10, 'triangle', 0.10);
    setTimeout(() => this.beep(1174, 0.10, 'triangle', 0.10), 70);
    setTimeout(() => this.beep(1568, 0.16, 'triangle', 0.10), 140);
  }

  die() {
    this.beep(220, 0.35, 'sawtooth', 0.10, -160);
    setTimeout(() => this.beep(140, 0.4, 'sawtooth', 0.08, -80), 120);
  }

  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.14, 'triangle', 0.09), i * 80));
  }

  pick() {
    this.beep(700, 0.08, 'triangle', 0.08);
  }

  shield() {
    this.beep(300, 0.2, 'square', 0.07, 120);
  }

  phase() {
    this.beep(400, 0.25, 'sine', 0.06, 300);
  }

  click() {
    this.beep(600, 0.05, 'sine', 0.05);
  }
}

export const sfx = new SoundFX();
