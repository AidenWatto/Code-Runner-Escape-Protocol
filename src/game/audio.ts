// Lightweight Web Audio API sound effects — no external assets

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.15,
  delay = 0,
): void {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = ac.currentTime + delay;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

export const sfx = {
  step: () => tone(180, 0.04, 'square', 0.04),
  collect: () => {
    tone(660, 0.08, 'sine', 0.12);
    tone(880, 0.08, 'sine', 0.10, 0.06);
  },
  terminalOpen: () => {
    tone(440, 0.06, 'square', 0.08);
    tone(550, 0.06, 'square', 0.08, 0.05);
  },
  puzzleSuccess: () => {
    tone(523, 0.1, 'sine', 0.12);
    tone(659, 0.1, 'sine', 0.12, 0.08);
    tone(784, 0.15, 'sine', 0.12, 0.16);
  },
  puzzleError: () => {
    tone(200, 0.12, 'sawtooth', 0.1);
    tone(150, 0.15, 'sawtooth', 0.1, 0.08);
  },
  damage: () => tone(120, 0.2, 'sawtooth', 0.15),
  levelComplete: () => {
    tone(523, 0.1, 'sine', 0.12);
    tone(659, 0.1, 'sine', 0.12, 0.1);
    tone(784, 0.1, 'sine', 0.12, 0.2);
    tone(1047, 0.25, 'sine', 0.14, 0.3);
  },
  gameOver: () => {
    tone(300, 0.3, 'sawtooth', 0.12);
    tone(200, 0.4, 'sawtooth', 0.12, 0.2);
    tone(100, 0.5, 'sawtooth', 0.12, 0.4);
  },
  victory: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.15, 'sine', 0.14, i * 0.12));
  },
  achievement: () => {
    tone(880, 0.1, 'sine', 0.12);
    tone(1100, 0.15, 'sine', 0.12, 0.08);
  },
  combo: () => tone(800 + Math.random() * 200, 0.05, 'sine', 0.08),
  click: () => tone(400, 0.04, 'square', 0.06),
  unlock: () => {
    tone(440, 0.06, 'square', 0.1);
    tone(660, 0.1, 'square', 0.1, 0.06);
  },
};
