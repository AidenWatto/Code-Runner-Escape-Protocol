import { RotateCcw, Play, Home, Skull } from 'lucide-react';
import type { GameStats } from '@/game/types';
import { STAGE_NAMES } from '@/game/constants';

interface GameOverScreenProps {
  stats: GameStats;
  level: number;
  onRetry: () => void;
  onNewRun: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ stats, level, onRetry, onNewRun, onMenu }: GameOverScreenProps) {
  const accuracy = stats.puzzlesAttempted > 0
    ? Math.round((stats.puzzlesSolved / stats.puzzlesAttempted) * 100)
    : 0;
  const stageName = STAGE_NAMES[Math.min(level - 1, STAGE_NAMES.length - 1)] || `LEVEL ${level}`;

  return (
    <div className="min-h-screen bg-[#0a0e14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Danger glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 text-center max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-center justify-center">
            <Skull size={32} className="text-red-500" />
          </div>
        </div>

        <div className="text-xs text-red-500/60 font-mono uppercase tracking-[0.4em] mb-2">
          // connection_lost
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-mono text-red-400 mb-3 tracking-tight">
          SYSTEM FAILURE
        </h1>
        <p className="text-slate-500 font-mono text-sm mb-8 italic">
          Your connection to the core was lost.
        </p>

        {/* Stats */}
        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-5 mb-6 text-left">
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <StatRow label="Final Score" value={stats.score.toLocaleString()} color="text-amber-400" />
            <StatRow label="Level Reached" value={stageName} color="text-sky-400" />
            <StatRow label="Fragments" value={String(stats.fragmentsCollected)} color="text-yellow-400" />
            <StatRow label="Puzzles Solved" value={String(stats.puzzlesSolved)} color="text-slate-300" />
            <StatRow label="Accuracy" value={`${accuracy}%`} color="text-slate-300" />
            <StatRow label="Damage Taken" value={String(stats.damageTaken)} color="text-red-400" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 bg-sky-600/20 border border-sky-500 text-sky-300 hover:bg-sky-600/30 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <RotateCcw size={16} /> Try Again
          </button>
          <button
            onClick={onNewRun}
            className="flex items-center justify-center gap-2 bg-slate-900/60 border border-slate-700 text-slate-300 hover:border-slate-600 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <Play size={16} /> New Run
          </button>
          <button
            onClick={onMenu}
            className="flex items-center justify-center gap-2 bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <Home size={16} /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</div>
      <div className={`${color} font-bold`}>{value}</div>
    </div>
  );
}
