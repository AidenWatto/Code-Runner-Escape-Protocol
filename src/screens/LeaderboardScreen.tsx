import { ArrowLeft, Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '@/game/types';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  onBack: () => void;
}

export function LeaderboardScreen({ entries, onBack }: LeaderboardScreenProps) {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-6 font-mono text-sm"
        >
          <ArrowLeft size={16} /> Back to Menu
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Trophy className="text-amber-400" size={28} />
          <h1 className="text-3xl font-black font-mono text-slate-100">LEADERBOARD</h1>
        </div>
        <div className="h-px w-32 bg-amber-500 mb-2" />
        <p className="text-slate-500 font-mono text-xs mb-6">// LOCAL STORAGE — NOT GLOBAL</p>

        {entries.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-12 text-center">
            <Trophy size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 font-mono text-sm">No runs recorded yet.</p>
            <p className="text-slate-600 font-mono text-xs mt-1">Complete a run to appear on the leaderboard.</p>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 text-left">Rank</th>
                  <th className="py-3 px-4 text-left">Player</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-4 text-center">Level</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${
                      i === 0 ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          i === 0
                            ? 'text-amber-400'
                            : i === 1
                            ? 'text-slate-300'
                            : i === 2
                            ? 'text-orange-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {i === 0 ? '#1' : i === 1 ? '#2' : i === 2 ? '#3' : `#${i + 1}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{entry.name}</td>
                    <td className="py-3 px-4 text-right text-amber-400 font-bold">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400">{entry.level}</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {Math.floor(entry.time)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
