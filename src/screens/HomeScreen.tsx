import { useState } from 'react';
import {
  Terminal,
  Trophy,
  BookOpen,
  Award,
  User,
  Play,
  Settings,
  Info,
  Volume2,
  VolumeX,
  ChevronRight,
  Zap,
  Code2,
} from 'lucide-react';
import type { PlayerProfile } from '@/game/types';
import type { GameSettings } from '@/game/storage';
import { sfx } from '@/game/audio';

interface HomeScreenProps {
  profile: PlayerProfile;
  settings: GameSettings;
  onStart: () => void;
  onContinue: () => void;
  onNavigate: (screen: string) => void;
  onToggleSound: () => void;
  onUpdateName: (name: string) => void;
}

export function HomeScreen({
  profile,
  settings,
  onStart,
  onContinue,
  onNavigate,
  onToggleSound,
  onUpdateName,
}: HomeScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const handleClick = (action: () => void) => {
    action();
    sfx.click();
  };

  const secondaryButtons = [
    {
      label: 'How to Play',
      description: 'Learn the fundamentals',
      icon: BookOpen,
      action: () => onNavigate('how-to-play'),
    },
    {
      label: 'Achievements',
      description: 'View your progress',
      icon: Award,
      action: () => onNavigate('achievements'),
    },
    {
      label: 'Leaderboard',
      description: 'Compare local scores',
      icon: Trophy,
      action: () => onNavigate('leaderboard'),
    },
    {
      label: 'Student',
      description: 'Student profile',
      icon: User,
      action: () => onNavigate('student'),
    },
    {
      label: 'About',
      description: 'About Code Runner',
      icon: Info,
      action: () => onNavigate('about'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b11] text-slate-100 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56,189,248,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56,189,248,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-sky-500/[0.07] blur-[120px]" />

        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-blue-600/[0.04] blur-[100px]" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#070b11_85%)]" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Code2 size={19} className="text-sky-400" />
          </div>

          <div>
            <div className="text-sm font-semibold tracking-wide text-slate-200">
              CODE RUNNER
            </div>
            <div className="text-[9px] text-slate-600 font-mono tracking-[0.2em] uppercase">
              Escape Protocol
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onToggleSound();
              sfx.click();
            }}
            aria-label="Toggle sound"
            className="w-10 h-10 rounded-lg border border-white/[0.07] bg-white/[0.025] flex items-center justify-center text-slate-500 hover:text-sky-400 hover:border-sky-500/30 hover:bg-sky-500/[0.05] transition-all"
          >
            {settings.soundOn ? (
              <Volume2 size={17} />
            ) : (
              <VolumeX size={17} />
            )}
          </button>

          <button
            onClick={() => {
              setShowSettings(!showSettings);
              sfx.click();
            }}
            aria-label="Settings"
            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
              showSettings
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                : 'border-white/[0.07] bg-white/[0.025] text-slate-500 hover:text-sky-400 hover:border-sky-500/30'
            }`}
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* Settings */}
      {showSettings && (
        <div className="absolute top-[76px] right-6 sm:right-10 z-30 w-[300px] rounded-xl border border-white/[0.08] bg-[#0c121b]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              Player Configuration
            </div>
          </div>

          <div className="p-4">
            <label className="block text-xs text-slate-400 mb-2">
              Player Name
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) =>
                  setNameInput(e.target.value.slice(0, 12))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateName(nameInput);
                    setShowSettings(false);
                    sfx.click();
                  }
                }}
                className="flex-1 min-w-0 h-9 px-3 rounded-md bg-black/20 border border-white/[0.08] text-sm text-slate-200 font-mono outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all"
                placeholder="RUNNER"
              />

              <button
                onClick={() => {
                  onUpdateName(nameInput);
                  setShowSettings(false);
                  sfx.click();
                }}
                className="px-4 h-9 rounded-md bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        {/* Hero */}
        <section className="grid lg:grid-cols-[1fr_300px] gap-6 items-stretch">
          <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm p-7 sm:p-10 overflow-hidden">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/[0.05] blur-3xl rounded-full" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-sky-500/20 bg-sky-500/[0.06] text-[10px] font-mono tracking-[0.18em] uppercase text-sky-400 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                System Online
              </div>

              <p className="text-xs font-mono text-slate-600 mb-3">
                // initialize_system
              </p>

              <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.04em] text-white leading-none">
                CODE
                <span className="text-sky-400"> RUNNER</span>
              </h1>

              <div className="flex items-center gap-3 mt-4">
                <div className="h-px w-12 bg-sky-500/60" />
                <h2 className="text-sm sm:text-base font-mono tracking-[0.25em] uppercase text-slate-400">
                  Escape Protocol
                </h2>
              </div>

              <p className="mt-5 text-sm text-slate-500 max-w-md leading-relaxed">
                Think fast. Debug faster. Complete the challenges,
                collect fragments, and escape the protocol.
              </p>

              {/* Primary actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => handleClick(onStart)}
                  className="group h-12 px-6 rounded-lg bg-sky-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-sky-400 hover:shadow-lg hover:shadow-sky-500/20 transition-all"
                >
                  <Zap size={17} fill="currentColor" />
                  Start New Run
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>

                <button
                  onClick={() => handleClick(onContinue)}
                  className="h-12 px-6 rounded-lg border border-white/[0.09] bg-white/[0.025] text-slate-300 font-medium text-sm flex items-center justify-center gap-3 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all"
                >
                  <Terminal size={17} />
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* Player card */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-mono">
                  Active Runner
                </span>

                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400/20 to-blue-600/10 border border-sky-500/20 flex items-center justify-center">
                  <User size={19} className="text-sky-400" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-200 truncate">
                    {profile.name || 'RUNNER'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                    Player Profile
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-600 mb-2">
                Current Status
              </div>

              <div className="text-sm text-slate-400">
                Ready for deployment
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3 mt-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
            <div className="text-[9px] uppercase tracking-[0.18em] font-mono text-slate-600">
              Best Score
            </div>
            <div className="text-xl font-semibold text-slate-200 mt-2 font-mono">
              {profile.highestScore.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
            <div className="text-[9px] uppercase tracking-[0.18em] font-mono text-slate-600">
              Levels
            </div>
            <div className="text-xl font-semibold text-slate-200 mt-2 font-mono">
              {profile.levelsCompleted}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
            <div className="text-[9px] uppercase tracking-[0.18em] font-mono text-slate-600">
              Fragments
            </div>
            <div className="text-xl font-semibold text-slate-200 mt-2 font-mono">
              {profile.totalFragments}
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600">
              Navigation
            </span>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {secondaryButtons.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  onClick={() => handleClick(item.action)}
                  className="group text-left rounded-xl border border-white/[0.06] bg-white/[0.018] p-4 hover:bg-white/[0.04] hover:border-sky-500/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-white/[0.05] flex items-center justify-center group-hover:bg-sky-500/10 group-hover:border-sky-500/20 transition-all">
                      <Icon
                        size={15}
                        className="text-slate-500 group-hover:text-sky-400 transition-colors"
                      />
                    </div>

                    <ChevronRight
                      size={14}
                      className="text-slate-700 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>

                  <div className="mt-4 text-sm font-medium text-slate-300">
                    {item.label}
                  </div>

                  <div className="mt-1 text-[10px] text-slate-600 leading-relaxed">
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-700">
          <span>CODE RUNNER // ESCAPE PROTOCOL</span>
          <span>System Ready • v1.0</span>
        </footer>
      </main>
    </div>
  );
}
