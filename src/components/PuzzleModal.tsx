import { useState } from 'react';
import type { PuzzleData, PuzzleType } from '@/game/types';
import { sfx } from '@/game/audio';

interface PuzzleModalProps {
  terminalId: number;
  nodeLabel: string;
  puzzleType: PuzzleType;
  puzzleData: PuzzleData;
  onSolve: (terminalId: number) => void;
  onFail: (terminalId: number) => void;
  onClose: () => void;
}

export function PuzzleModal({
  terminalId,
  nodeLabel,
  puzzleType,
  puzzleData,
  onSolve,
  onFail,
  onClose,
}: PuzzleModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleSubmit = () => {
    if (selected === null || locked) return;
    setSubmitted(true);
    if (selected === puzzleData.answer) {
      sfx.puzzleSuccess();
      setTimeout(() => onSolve(terminalId), 800);
    } else {
      sfx.puzzleError();
      setLocked(true);
      setTimeout(() => {
        onFail(terminalId);
        setLocked(false);
        setSubmitted(false);
        setSelected(null);
      }, 1500);
    }
  };

  const isCorrect = submitted && selected === puzzleData.answer;
  const isWrong = submitted && selected !== null && selected !== puzzleData.answer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Terminal header */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-mono text-sm text-green-400">{nodeLabel}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
            {puzzleType} protocol
          </span>
        </div>

        {/* Terminal body */}
        <div className="p-5">
          {/* Prompt */}
          <div className="bg-black/40 border border-slate-800 rounded-lg p-4 mb-4">
            <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {puzzleData.prompt}
            </pre>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {puzzleData.options.map((opt, i) => {
              let cls = 'border-slate-700 bg-slate-800/50 hover:border-sky-600 hover:bg-slate-800';
              if (submitted && i === puzzleData.answer) {
                cls = 'border-green-500 bg-green-950/50';
              } else if (isWrong && i === selected) {
                cls = 'border-red-500 bg-red-950/50';
              } else if (selected === i && !submitted) {
                cls = 'border-sky-500 bg-sky-950/30';
              } else if (submitted) {
                cls = 'border-slate-800 bg-slate-900 opacity-50';
              }

              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => {
                    setSelected(i);
                    sfx.click();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all font-mono text-sm ${cls}`}
                >
                  <span className="text-slate-500 mr-3">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span className="text-slate-200 whitespace-pre-wrap">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {isCorrect && (
            <div className="mt-4 text-center font-mono">
              <span className="text-green-400 text-lg font-bold tracking-wider">
                ACCESS GRANTED
              </span>
            </div>
          )}
          {isWrong && (
            <div className="mt-4 text-center font-mono">
              <span className="text-red-400 text-lg font-bold tracking-wider">
                ACCESS DENIED — TIME PENALTY
              </span>
            </div>
          )}

          {/* Hint */}
          {showHint && !submitted && (
            <div className="mt-3 text-xs text-slate-500 italic font-mono bg-slate-800/30 rounded p-2">
              HINT: {puzzleData.hint}
            </div>
          )}

          {/* Actions */}
          {!submitted && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowHint(!showHint);
                  sfx.click();
                }}
                className="px-3 py-2 text-xs font-mono text-slate-400 border border-slate-700 rounded hover:text-slate-200 transition-colors"
              >
                {showHint ? 'Hide Hint' : 'Hint'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={selected === null}
                className="flex-1 px-4 py-2 font-mono text-sm text-sky-400 border border-sky-700 rounded hover:bg-sky-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Submit
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-mono text-slate-500 border border-slate-700 rounded hover:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
