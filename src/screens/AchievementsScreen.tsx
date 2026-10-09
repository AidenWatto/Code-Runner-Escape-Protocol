import { ArrowLeft, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { PlayerProfile } from '@/game/types';
import { ACHIEVEMENTS } from '@/game/constants';

interface AchievementsScreenProps {
  profile: PlayerProfile;
  onBack: () => void;
}

export function AchievementsScreen({ profile, onBack }: AchievementsScreenProps) {
  const earned = new Set(profile.achievements);
  const earnedCount = ACHIEVEMENTS.filter((a) => earned.has(a.id)).length;

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-6 font-mono text-sm"
        >
          <ArrowLeft size={16} /> Back to Menu
        </button>

        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-3xl font-black font-mono text-slate-100">ACHIEVEMENTS</h1>
          <span className="text-slate-500 font-mono text-sm">
            {earnedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="h-px w-32 bg-sky-500 mb-2" />
        <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((ach) => {
            const isEarned = earned.has(ach.id);
            const IconComp = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[ach.icon] || LucideIcons.Award;
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                  isEarned
                    ? 'bg-sky-950/30 border-sky-600/50'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isEarned ? 'bg-sky-600/20 text-sky-400' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {isEarned ? <IconComp size={20} /> : <LucideIcons.Lock size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-mono text-sm font-bold ${isEarned ? 'text-slate-200' : 'text-slate-500'}`}>
                    {ach.name}
                  </h3>
                  <p className={`text-xs ${isEarned ? 'text-slate-400' : 'text-slate-600'}`}>
                    {ach.description}
                  </p>
                </div>
                {isEarned && <Check size={16} className="text-sky-400 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Profile stats */}
        <div className="mt-8 bg-slate-900/60 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sky-400 font-mono text-sm mb-4">PLAYER STATS</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <Stat label="High Score" value={profile.highestScore.toLocaleString()} />
            <Stat label="Levels Done" value={String(profile.levelsCompleted)} />
            <Stat label="Fragments" value={String(profile.totalFragments)} />
            <Stat label="Puzzles Solved" value={String(profile.puzzlesSolved)} />
            <Stat label="Accuracy" value={`${Math.round(profile.puzzleAccuracy * 100)}%`} />
            <Stat label="Best Time" value={profile.bestTime > 0 ? `${profile.bestTime}s` : '—'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">{label}</div>
      <div className="text-slate-200 font-mono font-bold text-lg">{value}</div>
    </div>
  );
}
