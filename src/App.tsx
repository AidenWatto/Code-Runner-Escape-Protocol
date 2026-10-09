import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/game/useGame';
import { loadLeaderboard } from '@/game/storage';
import { GameCanvas } from '@/components/GameCanvas';
import { HUD } from '@/components/HUD';
import { PuzzleModal } from '@/components/PuzzleModal';
import { HomeScreen } from '@/screens/HomeScreen';
import { HowToPlayScreen } from '@/screens/HowToPlayScreen';
import { AchievementsScreen } from '@/screens/AchievementsScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { StudentScreen } from '@/screens/StudentScreen';
import { AboutScreen } from '@/screens/AboutScreen';
import { GameOverScreen } from '@/screens/GameOverScreen';
import { VictoryScreen } from '@/screens/VictoryScreen';
import { PauseScreen } from '@/screens/PauseScreen';

function App() {
  const game = useGame();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const prevScreenRef = useRef<string>('home');

  // ESC to pause/resume
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (game.screen === 'game') {
          game.pauseGame();
        } else if (game.screen === 'pause') {
          game.resumeGame();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [game.screen, game.pauseGame, game.resumeGame]);

  // Track screen for pause overlay
  useEffect(() => {
    prevScreenRef.current = game.screen;
  }, [game.screen]);

  // Navigate from pause to how-to-play and back
  const handlePauseHowToPlay = useCallback(() => {
    // Keep paused state, just show how-to-play temporarily
    game.setScreen('how-to-play');
  }, [game.setScreen]);

  const handleBackFromPauseHowTo = useCallback(() => {
    game.setScreen('pause');
  }, [game.setScreen]);

  // Render current screen
  switch (game.screen) {
    case 'home':
      return (
        <HomeScreen
          profile={game.profile}
          settings={game.settings}
          onStart={game.startNewRun}
          onContinue={game.continueRun}
          onNavigate={(s) => game.setScreen(s as typeof game.screen)}
          onToggleSound={game.toggleSound}
          onUpdateName={game.updateProfileName}
        />
      );

    case 'how-to-play':
      // If we came from pause, return to pause
      return (
        <HowToPlayScreen
          onBack={prevScreenRef.current === 'pause' ? handleBackFromPauseHowTo : () => game.setScreen('home')}
        />
      );

    case 'achievements':
      return (
        <AchievementsScreen
          profile={game.profile}
          onBack={() => game.setScreen('home')}
        />
      );

    case 'leaderboard':
      return (
        <LeaderboardScreen
          entries={loadLeaderboard()}
          onBack={() => game.setScreen('home')}
        />
      );

    case 'student':
      return <StudentScreen onBack={() => game.setScreen('home')} />;

    case 'about':
      return <AboutScreen onBack={() => game.setScreen('home')} />;

    case 'game':
      if (!game.level) return null;
      return (
        <div className="fixed inset-0 bg-[#0a0e14] overflow-hidden">
          <div ref={canvasContainerRef} className="absolute inset-0">
            <GameCanvas
              level={game.level}
              onFragmentCollect={game.handleFragmentCollect}
              onTerminalInteract={game.handleTerminalInteract}
              onDamage={game.handleDamage}
              onExit={game.handleExit}
              onCombo={game.handleCombo}
              paused={game.paused || game.puzzle !== null}
            />
          </div>
          <HUD
            level={game.currentLevelNum}
            stageName={game.stageName}
            integrity={game.integrity}
            time={game.timeRemaining}
            score={game.stats.score + game.totalRunScore}
            combo={game.stats.combo}
            fragmentsCollected={game.stats.fragmentsCollected}
            totalFragments={game.stats.totalFragments}
            onPause={game.pauseGame}
          />
          {game.puzzle && (
            <PuzzleModal
              terminalId={game.puzzle.terminalId}
              nodeLabel={game.puzzle.nodeLabel}
              puzzleType={game.puzzle.puzzleType}
              puzzleData={game.puzzle.puzzleData}
              onSolve={game.handlePuzzleSolve}
              onFail={game.handlePuzzleFail}
              onClose={() => {
                game.setPuzzle(null);
              }}
            />
          )}
          {game.achievementToast && (
            <AchievementToast name={game.achievementToast} />
          )}
        </div>
      );

    case 'pause':
      return (
        <>
          {/* Render game underneath */}
          {game.level && (
            <div className="fixed inset-0 bg-[#0a0e14] overflow-hidden opacity-50">
              <div ref={canvasContainerRef} className="absolute inset-0">
                <GameCanvas
                  level={game.level}
                  onFragmentCollect={game.handleFragmentCollect}
                  onTerminalInteract={game.handleTerminalInteract}
                  onDamage={game.handleDamage}
                  onExit={game.handleExit}
                  onCombo={game.handleCombo}
                  paused={true}
                />
              </div>
            </div>
          )}
          <PauseScreen
            onResume={game.resumeGame}
            onRestart={game.restartLevel}
            onHowToPlay={handlePauseHowToPlay}
            onQuit={game.quitToMenu}
          />
        </>
      );

    case 'game-over':
      if (!game.gameOver) return null;
      return (
        <GameOverScreen
          stats={game.gameOver.stats}
          level={game.currentLevelNum}
          onRetry={game.restartLevel}
          onNewRun={game.startNewRun}
          onMenu={game.quitToMenu}
        />
      );

    case 'victory':
      if (!game.gameOver) return null;
      return (
        <VictoryScreen
          stats={game.gameOver.stats}
          onPlayAgain={game.startNewRun}
          onNewRun={game.startNewRun}
          onAchievements={() => game.setScreen('achievements')}
          onMenu={game.quitToMenu}
        />
      );

    default:
      return (
        <HomeScreen
          profile={game.profile}
          settings={game.settings}
          onStart={game.startNewRun}
          onContinue={game.continueRun}
          onNavigate={(s) => game.setScreen(s as typeof game.screen)}
          onToggleSound={game.toggleSound}
          onUpdateName={game.updateProfileName}
        />
      );
  }
}

function AchievementToast({ name }: { name: string }) {
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="bg-slate-900 border border-sky-500 rounded-lg px-6 py-4 text-center shadow-2xl animate-pulse">
        <div className="text-xs text-sky-500 font-mono uppercase tracking-widest mb-1">
          // achievement_unlocked
        </div>
        <div className="text-sky-300 font-mono font-bold text-lg">{name}</div>
      </div>
    </div>
  );
}

export default App;
