import type { LevelData, GridCell, Terminal, DataFragment, Obstacle, PuzzleType } from './types';
import { getLevelParams } from './constants';
import { pickPuzzleType } from './puzzles';

function seedRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 0x100000000;
    return s / 0x100000000;
  };
}

function choose<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// BFS flood fill to check connectivity
function isConnected(
  grid: GridCell[][],
  cols: number,
  rows: number,
  start: { x: number; y: number },
  end: { x: number; y: number },
): boolean {
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );
  const queue: { x: number; y: number }[] = [start];
  visited[start.y][start.x] = true;

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    if (x === end.x && y === end.y) return true;
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
        const cell = grid[ny][nx];
        if (cell.type !== 'wall' || cell.locked) {
          // locked doors are passable once unlocked; for connectivity check treat as passable
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }
  return false;
}

export function generateLevel(level: number, seed: number): LevelData {
  const params = getLevelParams(level);
  const { cols, rows, timeLimit, terminals: numTerminals, obstacles: numObstacles, fragments: numFragments, difficulty } = params;
  const rng = seedRand(seed);

  // Initialize grid — all floor
  const grid: GridCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'floor' as const, locked: false })),
  );

  // Border walls
  for (let x = 0; x < cols; x++) {
    grid[0][x] = { type: 'wall', locked: false };
    grid[rows - 1][x] = { type: 'wall', locked: false };
  }
  for (let y = 0; y < rows; y++) {
    grid[y][0] = { type: 'wall', locked: false };
    grid[y][cols - 1] = { type: 'wall', locked: false };
  }

  // Place internal walls using random walk clusters
  const wallBudget = Math.floor((cols - 2) * (rows - 2) * (0.12 + difficulty * 0.02));
  let wallsPlaced = 0;
  let attempts = 0;
  while (wallsPlaced < wallBudget && attempts < wallBudget * 4) {
    attempts++;
    const cx = Math.floor(rng() * (cols - 2)) + 1;
    const cy = Math.floor(rng() * (rows - 2)) + 1;
    // cluster size
    const clusterSize = Math.floor(rng() * 3) + 1;
    for (let i = 0; i < clusterSize && wallsPlaced < wallBudget; i++) {
      const dx = Math.floor(rng() * 3) - 1;
      const dy = Math.floor(rng() * 3) - 1;
      const x = Math.max(1, Math.min(cols - 2, cx + dx));
      const y = Math.max(1, Math.min(rows - 2, cy + dy));
      if (grid[y][x].type === 'floor') {
        grid[y][x] = { type: 'wall', locked: false };
        wallsPlaced++;
      }
    }
  }

  // Spawn point — top-left area
  const spawn = { x: 1, y: 1 };
  grid[spawn.y][spawn.x] = { type: 'floor', locked: false };
  // clear around spawn
  if (grid[spawn.y + 1][spawn.x].type === 'wall') grid[spawn.y + 1][spawn.x] = { type: 'floor', locked: false };
  if (grid[spawn.y][spawn.x + 1].type === 'wall') grid[spawn.y][spawn.x + 1] = { type: 'floor', locked: false };

  // Exit — bottom-right area
  const exit = { x: cols - 2, y: rows - 2 };
  grid[exit.y][exit.x] = { type: 'exit', locked: false };
  // clear around exit
  if (grid[exit.y - 1][exit.x].type === 'wall') grid[exit.y - 1][exit.x] = { type: 'floor', locked: false };
  if (grid[exit.y][exit.x - 1].type === 'wall') grid[exit.y][exit.x - 1] = { type: 'floor', locked: false };

  // Ensure connectivity — remove walls until connected
  let safety = 0;
  while (!isConnected(grid, cols, rows, spawn, exit) && safety < 100) {
    safety++;
    // find a wall on the path and remove it
    for (let y = 1; y < rows - 1 && !isConnected(grid, cols, rows, spawn, exit); y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (grid[y][x].type === 'wall') {
          // try removing
          grid[y][x] = { type: 'floor', locked: false };
          if (isConnected(grid, cols, rows, spawn, exit)) break;
          // put it back and try next
          grid[y][x] = { type: 'wall', locked: false };
        }
      }
    }
    // if still not connected, clear a straight corridor
    if (!isConnected(grid, cols, rows, spawn, exit)) {
      for (let x = 1; x < cols - 1; x++) grid[spawn.y][x] = { type: 'floor', locked: false };
      for (let y = 1; y < rows - 1; y++) grid[y][exit.x] = { type: 'floor', locked: false };
    }
  }

  // Collect available floor cells (not spawn, not exit)
  const floorCells: { x: number; y: number }[] = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[y][x].type === 'floor' && !(x === spawn.x && y === spawn.y) && !(x === exit.x && y === exit.y)) {
        floorCells.push({ x, y });
      }
    }
  }

  // Shuffle floor cells for placement
  const shuffledFloors = [...floorCells];
  for (let i = shuffledFloors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledFloors[i], shuffledFloors[j]] = [shuffledFloors[j], shuffledFloors[i]];
  }

  let floorIdx = 0;

  // Place terminals with gates (locked doors)
  const terminals: Terminal[] = [];
  const usedCells = new Set<string>();
  usedCells.add(`${spawn.x},${spawn.y}`);
  usedCells.add(`${exit.x},${exit.y}`);

  for (let i = 0; i < numTerminals && floorIdx < shuffledFloors.length; i++) {
    // Find a terminal spot — not too close to spawn
    let placed = false;
    while (floorIdx < shuffledFloors.length && !placed) {
      const cell = shuffledFloors[floorIdx++];
      const key = `${cell.x},${cell.y}`;
      const distFromSpawn = Math.abs(cell.x - spawn.x) + Math.abs(cell.y - spawn.y);
      if (distFromSpawn < 4) continue;
      if (usedCells.has(key)) continue;

      // Find a nearby floor cell to place a locked gate
      // Gate should block a corridor between terminal area and exit
      const gateCandidates: { x: number; y: number }[] = [];
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const gx = cell.x + dx;
        const gy = cell.y + dy;
        if (gx > 0 && gx < cols - 1 && gy > 0 && gy < rows - 1 && grid[gy][gx].type === 'floor') {
          // Check this gate position is closer to exit than the terminal
          const gateDist = Math.abs(gx - exit.x) + Math.abs(gy - exit.y);
          const termDist = Math.abs(cell.x - exit.x) + Math.abs(cell.y - exit.y);
          if (gateDist < termDist && !usedCells.has(`${gx},${gy}`)) {
            gateCandidates.push({ x: gx, y: gy });
          }
        }
      }
      if (gateCandidates.length === 0) continue;

      const gate = choose(gateCandidates, rng);
      const puzzleType: PuzzleType = pickPuzzleType(level, seed, i);
      grid[gate.y][gate.x] = { type: 'door', locked: true };

      terminals.push({
        id: i,
        x: cell.x,
        y: cell.y,
        solved: false,
        puzzleType,
        puzzleData: null,
        gateX: gate.x,
        gateY: gate.y,
      });
      usedCells.add(key);
      usedCells.add(`${gate.x},${gate.y}`);
      placed = true;
    }
  }

  // Re-verify connectivity through locked doors
  // (locked doors are treated as passable for connectivity, so the level is always solvable)

  // Place data fragments
  const fragments: DataFragment[] = [];
  for (let i = 0; i < numFragments && floorIdx < shuffledFloors.length; i++) {
    let placed = false;
    while (floorIdx < shuffledFloors.length && !placed) {
      const cell = shuffledFloors[floorIdx++];
      const key = `${cell.x},${cell.y}`;
      if (usedCells.has(key)) continue;
      fragments.push({ id: i, x: cell.x, y: cell.y, collected: false });
      usedCells.add(key);
      placed = true;
    }
  }

  // Place obstacles
  const obstacles: Obstacle[] = [];
  const obstacleKinds: Obstacle['kind'][] = level >= 4
    ? ['drone', 'laser', 'firewall', 'corruption', 'sweep']
    : level >= 3
    ? ['drone', 'laser', 'corruption']
    : level >= 2
    ? ['drone', 'laser']
    : [];

  for (let i = 0; i < numObstacles && obstacleKinds.length > 0; i++) {
    const kind = choose(obstacleKinds, rng);
    let placed = false;

    if (kind === 'drone') {
      // Drone patrols a horizontal or vertical line
      while (floorIdx < shuffledFloors.length && !placed) {
        const cell = shuffledFloors[floorIdx++];
        const key = `${cell.x},${cell.y}`;
        if (usedCells.has(key)) continue;
        const axis = rng() > 0.5 ? 'x' : 'y';
        const range = 2 + Math.floor(rng() * 3);
        const dir = Math.floor(rng() * 4);
        obstacles.push({
          kind: 'drone',
          x: cell.x,
          y: cell.y,
          dir,
          speed: 1.5 + difficulty * 0.3,
          range,
          originX: cell.x,
          originY: cell.y,
          onTime: 0,
          offTime: 0,
          phase: 0,
          axis: axis as 'x' | 'y',
          min: 0,
          max: 0,
        });
        usedCells.add(key);
        placed = true;
      }
    } else if (kind === 'laser') {
      // Laser grid — stationary, toggles on/off
      while (floorIdx < shuffledFloors.length && !placed) {
        const cell = shuffledFloors[floorIdx++];
        const key = `${cell.x},${cell.y}`;
        if (usedCells.has(key)) continue;
        const onTime = 1.5 + rng() * 1;
        const offTime = 1.5 + rng() * 1;
        obstacles.push({
          kind: 'laser',
          x: cell.x,
          y: cell.y,
          dir: 0,
          speed: 0,
          range: 0,
          originX: cell.x,
          originY: cell.y,
          onTime,
          offTime,
          phase: rng() * 2,
          axis: 'x',
          min: 0,
          max: 0,
        });
        usedCells.add(key);
        placed = true;
      }
    } else if (kind === 'firewall') {
      while (floorIdx < shuffledFloors.length && !placed) {
        const cell = shuffledFloors[floorIdx++];
        const key = `${cell.x},${cell.y}`;
        if (usedCells.has(key)) continue;
        const onTime = 2 + rng() * 2;
        const offTime = 2 + rng() * 2;
        obstacles.push({
          kind: 'firewall',
          x: cell.x,
          y: cell.y,
          dir: 0,
          speed: 0,
          range: 0,
          originX: cell.x,
          originY: cell.y,
          onTime,
          offTime,
          phase: rng() * 3,
          axis: 'x',
          min: 0,
          max: 0,
        });
        usedCells.add(key);
        placed = true;
      }
    } else if (kind === 'corruption') {
      // Corruption zone — stationary, slows player
      while (floorIdx < shuffledFloors.length && !placed) {
        const cell = shuffledFloors[floorIdx++];
        const key = `${cell.x},${cell.y}`;
        if (usedCells.has(key)) continue;
        obstacles.push({
          kind: 'corruption',
          x: cell.x,
          y: cell.y,
          dir: 0,
          speed: 0,
          range: 0,
          originX: cell.x,
          originY: cell.y,
          onTime: 0,
          offTime: 0,
          phase: 0,
          axis: 'x',
          min: 0,
          max: 0,
        });
        usedCells.add(key);
        placed = true;
      }
    } else if (kind === 'sweep') {
      // Security sweep — moves across a large section
      const axis = rng() > 0.5 ? 'x' : 'y';
      if (axis === 'x') {
        const y = Math.floor(rng() * (rows - 4)) + 2;
        obstacles.push({
          kind: 'sweep',
          x: 1,
          y,
          dir: 1,
          speed: 1 + difficulty * 0.2,
          range: 0,
          originX: 1,
          originY: y,
          onTime: 0,
          offTime: 0,
          phase: rng() * 3,
          axis: 'x',
          min: 1,
          max: cols - 2,
        });
      } else {
        const x = Math.floor(rng() * (cols - 4)) + 2;
        obstacles.push({
          kind: 'sweep',
          x,
          y: 1,
          dir: 2,
          speed: 1 + difficulty * 0.2,
          range: 0,
          originX: x,
          originY: 1,
          onTime: 0,
          offTime: 0,
          phase: rng() * 3,
          axis: 'y',
          min: 1,
          max: rows - 2,
        });
      }
      placed = true;
    }
  }

  return {
    level,
    seed,
    grid,
    cols,
    rows,
    spawn,
    exit,
    terminals,
    fragments,
    obstacles,
    timeLimit,
    difficulty,
  };
}
