import type { Achievement } from './types';

export const CELL_SIZE = 36;

export const COLORS = {
  bg: '#0a0e14',
  gridLine: '#15202b',
  floor: '#0d1117',
  wall: '#1c2733',
  wallHighlight: '#243343',
  door: '#3a3a1a',
  doorLocked: '#4a3a1a',
  exit: '#22c55e',
  exitGlow: '#16a34a',
  player: '#38bdf8',
  playerGlow: '#0ea5e9',
  fragment: '#fbbf24',
  terminal: '#a78bfa',
  terminalActive: '#c4b5fd',
  terminalSolved: '#22c55e',
  drone: '#ef4444',
  dronePath: '#7f1d1d',
  laser: '#ef4444',
  laserBeam: '#fca5a5',
  firewall: '#f97316',
  corruption: '#8b5cf6',
  sweep: '#f43f5e',
  warning: '#fbbf24',
  danger: '#ef4444',
  success: '#22c55e',
  text: '#e2e8f0',
  textDim: '#64748b',
  accent: '#38bdf8',
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_breach', name: 'First Breach', description: 'Complete your first level', icon: 'DoorOpen' },
  { id: 'clean_run', name: 'Clean Run', description: 'Complete a level without taking damage', icon: 'Shield' },
  { id: 'speed_runner', name: 'Speed Runner', description: 'Finish a level with 40%+ time remaining', icon: 'Gauge' },
  { id: 'debugger', name: 'Debugger', description: 'Solve 10 debugging challenges', icon: 'Bug' },
  { id: 'collector', name: 'Collector', description: 'Collect 50 data fragments', icon: 'Database' },
  { id: 'perfect_logic', name: 'Perfect Logic', description: 'Complete a level without a puzzle mistake', icon: 'Brain' },
  { id: 'combo_master', name: 'Combo Master', description: 'Reach a x5 combo', icon: 'Flame' },
  { id: 'system_escaped', name: 'System Escaped', description: 'Complete all 5 stages', icon: 'Rocket' },
];

export const STAGE_NAMES = [
  'INITIAL BREACH',
  'FIREWALL',
  'LOGIC LOCK',
  'CORRUPTION',
  'SYSTEM CORE',
];

export const DIFFICULTY_PARAMS = {
  // level: [cols, rows, timeLimit, numTerminals, numObstacles, numFragments, difficulty]
  1: { cols: 15, rows: 11, timeLimit: 90, terminals: 1, obstacles: 0, fragments: 4, difficulty: 1 },
  2: { cols: 17, rows: 13, timeLimit: 100, terminals: 2, obstacles: 2, fragments: 5, difficulty: 2 },
  3: { cols: 19, rows: 13, timeLimit: 110, terminals: 2, obstacles: 4, fragments: 6, difficulty: 3 },
  4: { cols: 21, rows: 15, timeLimit: 120, terminals: 3, obstacles: 6, fragments: 7, difficulty: 4 },
  5: { cols: 23, rows: 15, timeLimit: 140, terminals: 3, obstacles: 8, fragments: 8, difficulty: 5 },
};

export function getLevelParams(level: number) {
  if (level <= 5) return DIFFICULTY_PARAMS[level as 1 | 2 | 3 | 4 | 5];
  // procedural scaling beyond level 5
  const base = DIFFICULTY_PARAMS[5];
  const extra = level - 5;
  return {
    cols: Math.min(base.cols + extra * 2, 33),
    rows: Math.min(base.rows + extra, 21),
    timeLimit: Math.max(base.timeLimit - extra * 4, 60),
    terminals: Math.min(base.terminals + Math.floor(extra / 2), 5),
    obstacles: Math.min(base.obstacles + extra, 14),
    fragments: Math.min(base.fragments + extra, 12),
    difficulty: Math.min(base.difficulty + extra, 10),
  };
}
