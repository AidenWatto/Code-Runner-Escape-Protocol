import { ArrowLeft, Mail, School, Code } from 'lucide-react';

interface StudentScreenProps {
  onBack: () => void;
}

export function StudentScreen({ onBack }: StudentScreenProps) {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-6 font-mono text-sm"
        >
          <ArrowLeft size={16} /> Back to Menu
        </button>

        <div className="text-xs text-sky-500/60 font-mono uppercase tracking-[0.3em] mb-2">
          // project_author
        </div>
        <h1 className="text-3xl font-black font-mono text-slate-100 mb-6">STUDENT</h1>
        <div className="h-px w-32 bg-sky-500 mb-8" />

        {/* Profile card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-sky-600/20 border border-sky-600/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Code size={28} className="text-sky-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-100">Aranya Vij</h2>
              <p className="text-sky-400 font-mono text-sm mt-1">Computer Science Applicant</p>
              <div className="flex flex-col gap-1.5 mt-3 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <School size={14} className="text-slate-500" /> Redmond High School
                </span>
                <a
                  href="mailto:aranyavij9@gmail.com"
                  className="flex items-center gap-2 hover:text-sky-400 transition-colors"
                >
                  <Mail size={14} className="text-slate-500" /> aranyavij9@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* About the project */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 mb-6">
          <h3 className="text-sky-400 font-mono text-sm mb-3 uppercase tracking-wider">About the Project</h3>
          <blockquote className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-sky-600/50 pl-4">
            "I designed Escape Protocol as an experiment in combining computational thinking with
            interactive game mechanics. The project helped me explore procedural generation, game
            state management, logic systems, and player interaction."
          </blockquote>
        </div>

        {/* What I explored */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 mb-6">
          <h3 className="text-sky-400 font-mono text-sm mb-3 uppercase tracking-wider">What I Explored</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Procedural generation',
              'Game logic',
              'State management',
              'Algorithmic thinking',
              'Puzzle design',
              'Interactive systems',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-slate-400 font-mono"
              >
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Technical concepts */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5">
          <h3 className="text-sky-400 font-mono text-sm mb-3 uppercase tracking-wider">Technical Concepts Implemented</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <Concept
              term="Procedural Level Generation"
              desc="Seeded RNG + BFS connectivity verification ensures every generated level is solvable."
            />
            <Concept
              term="Collision Detection"
              desc="Grid-based collision with continuous obstacle positioning for moving hazards."
            />
            <Concept
              term="State Management"
              desc="Centralized game state with React hooks managing screen transitions, stats, and persistence."
            />
            <Concept
              term="Logic Puzzle Engine"
              desc="Seven distinct puzzle generators using algorithmic construction (sequences, BFS pathfinding, sorting)."
            />
            <Concept
              term="Local Persistence"
              desc="Browser localStorage for profile, achievements, and leaderboard — no backend required."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Concept({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="border-l-2 border-slate-700 pl-3">
      <span className="text-slate-200 font-mono">{term}</span>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
  );
}
