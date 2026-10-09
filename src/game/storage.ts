import type { PlayerProfile, LeaderboardEntry } from './types';

const PROFILE_KEY = 'cr_ep_profile';
const LEADERBOARD_KEY = 'cr_ep_leaderboard';
const SETTINGS_KEY = 'cr_ep_settings';

const DEFAULT_PROFILE: PlayerProfile = {
  name: 'RUNNER',
  highestScore: 0,
  levelsCompleted: 0,
  bestTime: 0,
  totalFragments: 0,
  puzzleAccuracy: 0,
  puzzlesSolved: 0,
  puzzlesAttempted: 0,
  achievements: [],
  lastLevel: 1,
};

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage full or unavailable
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addToLeaderboard(entry: LeaderboardEntry): LeaderboardEntry[] {
  const board = loadLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, 20);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
  return trimmed;
}

export interface GameSettings {
  soundOn: boolean;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { soundOn: true };
    return JSON.parse(raw) as GameSettings;
  } catch {
    return { soundOn: true };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
