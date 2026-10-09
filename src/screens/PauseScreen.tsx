import { Play, RotateCcw, BookOpen, Home } from 'lucide-react';

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onHowToPlay: () => void;
  onQuit: () => void;
}

export function PauseScreen({ onResume, onRestart, onHowToPlay, onQuit }: PauseScreenProps) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-xs w-full">
        <div className="text-center mb-6">
          <div className="text-xs text-slate-500 font-mono uppercase tracking-[0.4em] mb-1">
            // system_paused
          </div>
          <h2 className="text-2xl font-black font-mono text-slate-200">PAUSED</h2>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 bg-sky-600/20 border border-sky-500 text-sky-300 hover:bg-sky-600/30 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <Play size={16} /> Resume
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700 text-slate-300 hover:border-slate-600 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <RotateCcw size={16} /> Restart Level
          </button>
          <button
            onClick={onHowToPlay}
            className="flex items-center justify-center gap-2 bg-slate-800/60 border border-slate-700 text-slate-300 hover:border-slate-600 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <BookOpen size={16} /> How to Play
          </button>
          <button
            onClick={onQuit}
            className="flex items-center justify-center gap-2 bg-slate-800/40 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-lg py-3 font-mono text-sm transition-colors"
          >
            <Home size={16} /> Quit to Menu
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs font-mono mt-4">
          Press ESC to resume
        </p>
      </div>
    </div>
  );
}
