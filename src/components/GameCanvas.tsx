import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/game/engine';
import type { LevelData } from '@/game/types';
import { sfx } from '@/game/audio';

interface GameCanvasProps {
  level: LevelData;
  onFragmentCollect: (id: number) => void;
  onTerminalInteract: (terminalId: number) => void;
  onDamage: (amount: number) => void;
  onExit: () => void;
  onCombo: () => void;
  paused: boolean;
}

export function GameCanvas({
  level,
  onFragmentCollect,
  onTerminalInteract,
  onDamage,
  onExit,
  onCombo,
  paused,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const [touchActive, setTouchActive] = useState(false);

  // Create engine when level changes
  useEffect(() => {
    const engine = new GameEngine(level, {
      onFragmentCollect,
      onTerminalInteract,
      onDamage,
      onExit,
      onCombo,
    });
    engineRef.current = engine;
    engine.start();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      engine.update(time);
      const c = canvasRef.current;
      if (c) {
        engine.render(ctx, c.width, c.height);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // Pause / resume
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) {
      engine.stop();
    } else {
      engine.start();
      engine.state.lastTime = performance.now();
    }
  }, [paused]);

  // Expose unlockGate to parent via ref-like pattern
  useEffect(() => {
    // no-op: gate unlocking is handled by direct grid mutation in useGame
  }, []);

  // Keyboard input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (paused) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        engineRef.current?.setKey(key, true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      engineRef.current?.setKey(key, false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [paused]);

  // Resize canvas to fit container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Touch controls
  const handleTouchMove = useCallback((dx: number, dy: number) => {
    const engine = engineRef.current;
    if (!engine || paused) return;
    engine.clearKeys();
    if (dx < 0) engine.setKey('a', true);
    else if (dx > 0) engine.setKey('d', true);
    if (dy < 0) engine.setKey('w', true);
    else if (dy > 0) engine.setKey('s', true);
    // Clear shortly after for grid movement
    setTimeout(() => engine.clearKeys(), 100);
  }, [paused]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0a0e14]">
      <canvas ref={canvasRef} className="block max-w-full max-h-full" />

      {/* Touch controls */}
      {touchActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
          <TouchControls onPress={handleTouchMove} />
        </div>
      )}
      <button
        className="absolute top-2 right-2 md:hidden text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded"
        onClick={() => setTouchActive(!touchActive)}
      >
        {touchActive ? 'Hide' : 'Show'} Controls
      </button>
    </div>
  );
}

function TouchControls({ onPress }: { onPress: (dx: number, dy: number) => void }) {
  const btn = (label: string, dx: number, dy: number) => (
    <button
      className="w-12 h-12 bg-slate-800/80 text-slate-300 rounded-lg flex items-center justify-center active:bg-slate-700 text-xl font-bold"
      onPointerDown={(e) => {
        e.preventDefault();
        onPress(dx, dy);
        sfx.step();
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-3 gap-1 opacity-80">
      <div />
      {btn('↑', 0, -1)}
      <div />
      {btn('←', -1, 0)}
      <div />
      {btn('→', 1, 0)}
      <div />
      {btn('↓', 0, 1)}
      <div />
    </div>
  );
}
