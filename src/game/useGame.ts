import { useCallback, useEffect, useRef, useState } from 'react';
import type { LevelData, PuzzleType, PuzzleData, GameStats, PlayerProfile, Screen } from '@/game/types';
import { generateLevel } from '@/game/levelgen';
import { generatePuzzle } from '@/game/puzzles';
import { GameEngine } from '@/game/engine';
import { STAGE_NAMES, ACHIEVEMENTS } from '@/game/constants';
import { sfx, setSoundEnabled } from '@/game/audio';
import { loadProfile, saveProfile, loadSettings, saveSettings, addToLeaderboard } from '@/game/storage';

interface PuzzleState {
  terminalId: number;
  nodeLabel: string;
  puzzleType: PuzzleType;
  puzzleData: PuzzleData;
}

interface GameOverState {
  stats: GameStats;
  reason: 'failure' | 'victory';
}

export function useGame() {
  const [screen, setScreen] = useState<Screen>('home');
  const [level, setLevel] = useState<LevelData | null>(null);
  const [currentLevelNum, setCurrentLevelNum] = useState(1);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [stats, setStats] = useState<GameStats>({
    level: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    fragmentsCollected: 0,
    totalFragments: 0,
    puzzlesSolved: 0,
    puzzlesAttempted: 0,
    damageTaken: 0,
    levelTime: 0,
  });
  const [integrity, setIntegrity] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [paused, setPaused] = useState(false);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverState | null>(null);
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const [settings, setSettings] = useState(() => loadSettings());
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [debugPuzzlesSolved, setDebugPuzzlesSolved] = useState(0);
  const [levelCleanRun, setLevelCleanRun] = useState(true);
  const [levelPerfectLogic, setLevelPerfectLogic] = useState(true);
  const [totalRunScore, setTotalRunScore] = useState(0);
  const [totalRunFragments, setTotalRunFragments] = useState(0);
  const [totalRunPuzzles, setTotalRunPuzzles] = useState(0);
  const [totalRunDamage, setTotalRunDamage] = useState(0);

  const engineRef = useRef<GameEngine | null>(null);
  const timerRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  // Apply sound setting
  useEffect(() => {
    setSoundEnabled(settings.soundOn);
  }, [settings.soundOn]);

  const toggleSound = useCallback(() => {
    const next = { ...settings, soundOn: !settings.soundOn };
    setSettings(next);
    saveSettings(next);
  }, [settings]);

  // Timer loop
  useEffect(() => {
    if (screen !== 'game' || paused || puzzle !== null) return;
    lastTickRef.current = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTimeRemaining((prev) => {
        const next = prev - dt;
        if (next <= 0) {
          // Time up — game over
          handleGameOver('failure');
          return 0;
        }
        return next;
      });
    }, 100);
    timerRef.current = interval as unknown as number;
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, paused, puzzle]);

  const checkAchievements = useCallback((updated: PlayerProfile) => {
    const newAchievements: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (updated.achievements.includes(ach.id)) continue;
      let earned = false;
      switch (ach.id) {
        case 'first_breach':
          earned = updated.levelsCompleted >= 1;
          break;
        case 'collector':
          earned = updated.totalFragments >= 50;
          break;
        case 'debugger':
          earned = debugPuzzlesSolved >= 10 || updated.puzzlesSolved >= 10;
          break;
        case 'combo_master':
          earned = stats.maxCombo >= 5;
          break;
        case 'system_escaped':
          earned = updated.levelsCompleted >= 5;
          break;
        case 'clean_run':
        case 'speed_runner':
        case 'perfect_logic':
          // checked at level complete
          break;
      }
      if (earned) {
        newAchievements.push(ach.id);
      }
    }
    if (newAchievements.length > 0) {
      const updated2 = {
        ...updated,
        achievements: [...updated.achievements, ...newAchievements],
      };
      setProfile(updated2);
      saveProfile(updated2);
      newAchievements.forEach((id) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        if (ach) {
          sfx.achievement();
          setAchievementToast(ach.name);
          setTimeout(() => setAchievementToast(null), 3000);
        }
      });
    }
  }, [debugPuzzlesSolved, stats.maxCombo]);

  const startNewRun = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    setCurrentLevelNum(1);
    setIntegrity(100);
    setStats({
      level: 1,
      score: 0,
      combo: 0,
      maxCombo: 0,
      fragmentsCollected: 0,
      totalFragments: 0,
      puzzlesSolved: 0,
      puzzlesAttempted: 0,
      damageTaken: 0,
      levelTime: 0,
    });
    setTotalRunScore(0);
    setTotalRunFragments(0);
    setTotalRunPuzzles(0);
    setTotalRunDamage(0);
    setDebugPuzzlesSolved(0);
    setLevelCleanRun(true);
    setLevelPerfectLogic(true);
    setGameOver(null);
    setPaused(false);
    const lvl = generateLevel(1, newSeed);
    setLevel(lvl);
    setTimeRemaining(lvl.timeLimit);
    setScreen('game');
  }, []);

  const continueRun = useCallback(() => {
    const lvl = profile.lastLevel;
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    setCurrentLevelNum(lvl);
    setIntegrity(100);
    setStats({
      level: lvl,
      score: 0,
      combo: 0,
      maxCombo: 0,
      fragmentsCollected: 0,
      totalFragments: 0,
      puzzlesSolved: 0,
      puzzlesAttempted: 0,
      damageTaken: 0,
      levelTime: 0,
    });
    setTotalRunScore(0);
    setTotalRunFragments(0);
    setTotalRunPuzzles(0);
    setTotalRunDamage(0);
    setLevelCleanRun(true);
    setLevelPerfectLogic(true);
    setGameOver(null);
    setPaused(false);
    const generated = generateLevel(lvl, newSeed);
    setLevel(generated);
    setTimeRemaining(generated.timeLimit);
    setScreen('game');
  }, [profile.lastLevel]);

  const handleFragmentCollect = useCallback((id: number) => {
    sfx.collect();
    setStats((prev) => ({
      ...prev,
      fragmentsCollected: prev.fragmentsCollected + 1,
      score: prev.score + 100,
    }));
  }, []);

  const handleCombo = useCallback(() => {
    sfx.combo();
    setStats((prev) => {
      const newCombo = prev.combo + 1;
      const bonus = newCombo >= 2 ? 50 * newCombo : 0;
      return {
        ...prev,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        score: prev.score + bonus,
      };
    });
  }, []);

  const handleDamage = useCallback((amount: number) => {
    sfx.damage();
    setIntegrity((prev) => Math.max(0, prev - amount));
    setStats((prev) => ({
      ...prev,
      damageTaken: prev.damageTaken + amount,
      combo: 0, // reset combo on damage
    }));
    setLevelCleanRun(false);
  }, []);

  const handleTerminalInteract = useCallback((terminalId: number) => {
    if (!level) return;
    const terminal = level.terminals.find((t) => t.id === terminalId);
    if (!terminal || terminal.solved) return;
    sfx.terminalOpen();
    const puzzleData = generatePuzzle(terminal.puzzleType, seed + terminalId * 137, level.difficulty);
    terminal.puzzleData = puzzleData;
    setPuzzle({
      terminalId,
      nodeLabel: `SYSTEM NODE ${String(terminalId + 7).padStart(2, '0')}`,
      puzzleType: terminal.puzzleType,
      puzzleData,
    });
  }, [level, seed]);

  const handlePuzzleSolve = useCallback((terminalId: number) => {
    sfx.unlock();
    // Unlock the gate
    if (level) {
      const terminal = level.terminals.find((t) => t.id === terminalId);
      if (terminal) {
        terminal.solved = true;
        level.grid[terminal.gateY][terminal.gateX].locked = false;
      }
    }
    setStats((prev) => ({
      ...prev,
      puzzlesSolved: prev.puzzlesSolved + 1,
      puzzlesAttempted: prev.puzzlesAttempted + 1,
      score: prev.score + 400,
      combo: prev.combo + 1,
      maxCombo: Math.max(prev.maxCombo, prev.combo + 1),
    }));
    if (level && level.terminals.find((t) => t.id === terminalId)?.puzzleType === 'debug') {
      setDebugPuzzlesSolved((n) => n + 1);
    }
    setPuzzle(null);
  }, [level]);

  const handlePuzzleFail = useCallback((terminalId: number) => {
    setStats((prev) => ({
      ...prev,
      puzzlesAttempted: prev.puzzlesAttempted + 1,
      score: Math.max(0, prev.score - 50),
      combo: 0,
    }));
    setLevelPerfectLogic(false);
    // Time penalty
    setTimeRemaining((prev) => Math.max(0, prev - 10));
    // Integrity penalty
    setIntegrity((prev) => Math.max(0, prev - 5));
  }, []);

  const handleExit = useCallback(() => {
    if (!level) return;
    sfx.levelComplete();

    const timeBonus = Math.floor(timeRemaining * 5);
    const fragBonus = stats.fragmentsCollected * 50;
    const puzzleBonus = stats.puzzlesSolved * 200;
    const damagePenalty = stats.damageTaken * 5;
    const levelScore = timeBonus + fragBonus + puzzleBonus + stats.score - damagePenalty;

    // Update run totals
    const newTotalScore = totalRunScore + levelScore;
    const newTotalFragments = totalRunFragments + stats.fragmentsCollected;
    const newTotalPuzzles = totalRunPuzzles + stats.puzzlesSolved;
    const newTotalDamage = totalRunDamage + stats.damageTaken;

    setTotalRunScore(newTotalScore);
    setTotalRunFragments(newTotalFragments);
    setTotalRunPuzzles(newTotalPuzzles);
    setTotalRunDamage(newTotalDamage);

    // Check per-level achievements
    const newAchievements: string[] = [];
    if (levelCleanRun && !profile.achievements.includes('clean_run')) {
      newAchievements.push('clean_run');
    }
    if (timeRemaining > level.timeLimit * 0.4 && !profile.achievements.includes('speed_runner')) {
      newAchievements.push('speed_runner');
    }
    if (levelPerfectLogic && !profile.achievements.includes('perfect_logic')) {
      newAchievements.push('perfect_logic');
    }

    // Update profile
    const updated: PlayerProfile = {
      ...profile,
      highestScore: Math.max(profile.highestScore, newTotalScore),
      levelsCompleted: Math.max(profile.levelsCompleted, currentLevelNum),
      bestTime: Math.max(profile.bestTime, level.timeLimit - timeRemaining),
      totalFragments: profile.totalFragments + stats.fragmentsCollected,
      puzzlesSolved: profile.puzzlesSolved + stats.puzzlesSolved,
      puzzlesAttempted: profile.puzzlesAttempted + stats.puzzlesAttempted,
      lastLevel: currentLevelNum < 5 ? currentLevelNum + 1 : currentLevelNum,
      achievements: [...profile.achievements, ...newAchievements],
    };
    updated.puzzleAccuracy = updated.puzzlesAttempted > 0
      ? updated.puzzlesSolved / updated.puzzlesAttempted
      : 0;

    setProfile(updated);
    saveProfile(updated);

    // Show achievement toasts
    newAchievements.forEach((id) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) {
        sfx.achievement();
        setAchievementToast(ach.name);
        setTimeout(() => setAchievementToast(null), 3000);
      }
    });

    if (currentLevelNum >= 5) {
      // Victory!
      sfx.victory();
      addToLeaderboard({
        name: profile.name,
        score: newTotalScore,
        level: currentLevelNum,
        time: level.timeLimit - timeRemaining,
        date: Date.now(),
      });
      setGameOver({
        stats: {
          ...stats,
          score: newTotalScore,
          fragmentsCollected: newTotalFragments,
          puzzlesSolved: newTotalPuzzles,
          damageTaken: newTotalDamage,
        },
        reason: 'victory',
      });
      setScreen('victory');
    } else {
      // Next level
      const nextLevel = currentLevelNum + 1;
      const newSeed = Math.floor(Math.random() * 100000);
      setSeed(newSeed);
      setCurrentLevelNum(nextLevel);
      const nextLvl = generateLevel(nextLevel, newSeed);
      setLevel(nextLvl);
      setTimeRemaining(nextLvl.timeLimit);
      setStats((prev) => ({
        ...prev,
        level: nextLevel,
        fragmentsCollected: 0,
        totalFragments: nextLvl.fragments.length,
        combo: 0,
      }));
      setLevelCleanRun(true);
      setLevelPerfectLogic(true);
      setIntegrity(100);
    }
  }, [level, timeRemaining, stats, profile, currentLevelNum, levelCleanRun, levelPerfectLogic, totalRunScore, totalRunFragments, totalRunPuzzles, totalRunDamage]);

  const handleGameOver = useCallback((reason: 'failure' | 'victory') => {
    sfx.gameOver();
    // Add to leaderboard if score > 0
    if (totalRunScore > 0) {
      addToLeaderboard({
        name: profile.name,
        score: totalRunScore,
        level: currentLevelNum,
        time: level ? level.timeLimit - timeRemaining : 0,
        date: Date.now(),
      });
    }
    setGameOver({
      stats: {
        ...stats,
        score: totalRunScore,
        fragmentsCollected: totalRunFragments,
        puzzlesSolved: totalRunPuzzles,
        damageTaken: totalRunDamage,
      },
      reason,
    });
    setScreen(reason === 'failure' ? 'game-over' : 'victory');
  }, [totalRunScore, totalRunFragments, totalRunPuzzles, totalRunDamage, profile.name, currentLevelNum, level, timeRemaining, stats]);

  // Check integrity for game over
  useEffect(() => {
    if (integrity <= 0 && screen === 'game') {
      handleGameOver('failure');
    }
  }, [integrity, screen, handleGameOver]);

  const pauseGame = useCallback(() => {
    setPaused(true);
    setScreen('pause');
  }, []);

  const resumeGame = useCallback(() => {
    setPaused(false);
    setScreen('game');
  }, []);

  const restartLevel = useCallback(() => {
    if (!level) return;
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    const regenerated = generateLevel(currentLevelNum, newSeed);
    setLevel(regenerated);
    setTimeRemaining(regenerated.timeLimit);
    setIntegrity(100);
    setStats((prev) => ({
      ...prev,
      combo: 0,
      fragmentsCollected: 0,
      totalFragments: regenerated.fragments.length,
      damageTaken: 0,
    }));
    setLevelCleanRun(true);
    setLevelPerfectLogic(true);
    setPaused(false);
    setScreen('game');
  }, [level, currentLevelNum]);

  const quitToMenu = useCallback(() => {
    setPaused(false);
    setLevel(null);
    setGameOver(null);
    setScreen('home');
  }, []);

  const goToScreen = useCallback((s: Screen) => {
    sfx.click();
    setScreen(s);
  }, []);

  const updateProfileName = useCallback((name: string) => {
    const updated = { ...profile, name: name.slice(0, 12) || 'RUNNER' };
    setProfile(updated);
    saveProfile(updated);
  }, [profile]);

  // Set total fragments when level loads
  useEffect(() => {
    if (level) {
      setStats((prev) => ({ ...prev, totalFragments: level.fragments.length }));
    }
  }, [level]);

  return {
    screen,
    setScreen: goToScreen,
    level,
    currentLevelNum,
    stageName: STAGE_NAMES[Math.min(currentLevelNum - 1, STAGE_NAMES.length - 1)] || `LEVEL ${currentLevelNum}`,
    stats,
    integrity,
    timeRemaining,
    paused,
    puzzle,
    setPuzzle,
    gameOver,
    profile,
    settings,
    achievementToast,
    totalRunScore,
    startNewRun,
    continueRun,
    handleFragmentCollect,
    handleCombo,
    handleDamage,
    handleTerminalInteract,
    handlePuzzleSolve,
    handlePuzzleFail,
    handleExit,
    pauseGame,
    resumeGame,
    restartLevel,
    quitToMenu,
    toggleSound,
    updateProfileName,
  };
}
