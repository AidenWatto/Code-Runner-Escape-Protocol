export type Screen =
  | 'home'
  | 'how-to-play'
  | 'achievements'
  | 'leaderboard'
  | 'student'
  | 'about'
  | 'game'
  | 'game-over'
  | 'victory'
  | 'pause';

export type TileType = 'floor' | 'wall' | 'door' | 'exit';

export interface GridCell {
  type: TileType;
  locked: boolean;
}

export type ObstacleKind = 'drone' | 'laser' | 'firewall' | 'corruption' | 'sweep';

export interface Obstacle {
  kind: ObstacleKind;
  x: number;
  y: number;
  // movement
  dir: number; // 0:up 1:right 2:down 3:left
  speed: number;
  range: number;
  originX: number;
  originY: number;
  // laser/firewall timing
  onTime: number;
  offTime: number;
  phase: number; // time offset
  // sweep
  axis: 'x' | 'y';
  min: number;
  max: number;
}

export interface Terminal {
  id: number;
  x: number;
  y: number;
  solved: boolean;
  puzzleType: PuzzleType;
  puzzleData: PuzzleData | null;
  gateX: number;
  gateY: number;
}

export interface DataFragment {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface LevelData {
  level: number;
  seed: number;
  grid: GridCell[][];
  cols: number;
  rows: number;
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  terminals: Terminal[];
  fragments: DataFragment[];
  obstacles: Obstacle[];
  timeLimit: number;
  difficulty: number;
}

export type PuzzleType =
  | 'sequence'
  | 'boolean'
  | 'debug'
  | 'pattern'
  | 'pathfinding'
  | 'sorting'
  | 'conditional';

export interface PuzzleData {
  prompt: string;
  options: string[];
  answer: number; // index into options
  hint: string;
  context: Record<string, unknown>;
}

export interface PlayerState {
  x: number;
  y: number;
  integrity: number;
}

export interface GameStats {
  level: number;
  score: number;
  combo: number;
  maxCombo: number;
  fragmentsCollected: number;
  totalFragments: number;
  puzzlesSolved: number;
  puzzlesAttempted: number;
  damageTaken: number;
  levelTime: number;
}

export interface PlayerProfile {
  name: string;
  highestScore: number;
  levelsCompleted: number;
  bestTime: number;
  totalFragments: number;
  puzzleAccuracy: number;
  puzzlesSolved: number;
  puzzlesAttempted: number;
  achievements: string[];
  lastLevel: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  time: number;
  date: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}
