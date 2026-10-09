import { Play, Award, Rocket, Home } from 'lucide-react';
import type { GameStats } from '@/game/types';

interface VictoryScreenProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onNewRun: () => void;
  onAchievements: () => void;
  onMenu: () => void;
}

export function VictoryScreen({ stats, onPlayAgain, onNewRun, onAchievements, onMenu }: VictoryScreenProps) {
  const accuracy = stats.puzzlesAttempted > 0
    ? Math.round((stats.puzzlesSolved / stats.puzzlesAttempted) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0e14] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Success glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.12) 0%, transparent 60%)',
        }}
      />

      {/* Particle confetti effect via CSS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-sky-400 rounded-full opacity-60"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out ${i * 0.2}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-30px) translateX(10px); }
        }
      `}</style>

      <div className="relative z-10 text-center max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-950/40 border border-green-700/50 rounded-2xl flex items-center justify-center">
            <Rocket size={32} className="text-green-400" />
          </div>
        </div>

        <div className="text-xs text-green-500/60 font-mono uppercase tracking-[0.4em] mb-2">
          // connection_restored
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-mono text-green-400 mb-3 tracking-tight">
          SYSTEM ESCAPED
        </h1>
        <p className="text-slate-400 font-mono text-sm mb-8">
          You broke through all 5 security layers.
        </p>

        {/* Stats */}
        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-5 mb-6 text-left">
          <div className="space-y-3 font-mono text-sm">
            <ScoreRow label="Final Score" value={stats.score.toLocaleString()} color="text-amber-400" big />
            <div className="h-px bg-slate-800 my-2" />
            <ScoreRow label="Puzzles Solved" value={String(stats.puzzlesSolved)} color="text-slate-300" />
            <ScoreRow label="Puzzle Accuracy" value={`${accuracy}%`} color="text-slate-300" />
            <ScoreRow label="Fragments Collected" value={String(stats.fragmentsCollected)} color="text-yellow-400" />
            <ScoreRow label="Damage Taken" value={`${stats.damageTaken}`} color="text-red-400" />
            <ScoreRow label="Max Combo" value={`×${stats.maxCombo}`} color="text-orange-400" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 bg-green-600/20 border border-green-500 text-green-300 hover:bg-green-600/30 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <Play size={16} /> Play Again
          </button>
          <button
            onClick={onNewRun}
            className="flex items-center justify-center gap-2 bg-slate-900/60 border border-slate-700 text-slate-300 hover:border-slate-600 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <Rocket size={16} /> New Run
          </button>
          <div className="flex gap-2">
            <button
              onClick={onAchievements}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-lg py-3 font-mono text-xs transition-colors"
            >
              <Award size={14} /> Achievements
            </button>
            <button
              onClick={onMenu}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-lg py-3 font-mono text-xs transition-colors"
            >
              <Home size={14} /> Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 text-xs uppercase tracking-wider">{label}</span>
      <span className={`${color} font-bold ${big ? 'text-2xl' : ''}`}>{value}</span>
    </div>
  );
}
