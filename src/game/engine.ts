import type { LevelData, Obstacle, PlayerState } from './types';
import { COLORS } from './constants';

export interface EngineCallbacks {
  onFragmentCollect: (id: number) => void;
  onTerminalInteract: (terminalId: number) => void;
  onDamage: (amount: number) => void;
  onExit: () => void;
  onCombo: () => void;
}

interface EngineState {
  level: LevelData;
  player: PlayerState;
  // smooth position for rendering
  renderX: number;
  renderY: number;
  // input
  keys: Set<string>;
  // timing
  lastTime: number;
  // movement cooldown for grid-based movement
  moveCooldown: number;
  // obstacle states
  obstacleStates: Map<number, { active: boolean; timer: number }>;
  // slow effect from corruption
  slowTimer: number;
  // damage cooldown (invulnerability frames)
  damageCooldown: number;
  // callbacks
  callbacks: EngineCallbacks;
  // running
  running: boolean;
  // particles
  particles: Particle[];
  // cell transition animation
  playerAnimProgress: number;
  playerPrevX: number;
  playerPrevY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class GameEngine {
  state: EngineState;

  constructor(level: LevelData, callbacks: EngineCallbacks) {
    this.state = {
      level,
      player: { x: level.spawn.x, y: level.spawn.y, integrity: 100 },
      renderX: level.spawn.x,
      renderY: level.spawn.y,
      keys: new Set(),
      lastTime: 0,
      moveCooldown: 0,
      obstacleStates: new Map(),
      slowTimer: 0,
      damageCooldown: 0,
      callbacks,
      running: false,
      particles: [],
      playerAnimProgress: 1,
      playerPrevX: level.spawn.x,
      playerPrevY: level.spawn.y,
    };

    // init obstacle states
    level.obstacles.forEach((_, i) => {
      this.state.obstacleStates.set(i, { active: false, timer: 0 });
    });
  }

  start(): void {
    this.state.running = true;
    this.state.lastTime = performance.now();
  }

  stop(): void {
    this.state.running = false;
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.state.keys.add(key);
    } else {
      this.state.keys.delete(key);
    }
  }

  clearKeys(): void {
    this.state.keys.clear();
  }

  // Called when a puzzle is solved — unlock the gate
  unlockGate(terminalId: number): void {
    const terminal = this.state.level.terminals.find((t) => t.id === terminalId);
    if (terminal) {
      terminal.solved = true;
      const cell = this.state.level.grid[terminal.gateY][terminal.gateX];
      cell.locked = false;
    }
  }

  private canMoveTo(x: number, y: number): boolean {
    const { grid, cols, rows } = this.state.level;
    if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
    const cell = grid[y][x];
    if (cell.type === 'wall') return false;
    if (cell.type === 'door' && cell.locked) return false;
    return true;
  }

  private tryMove(dx: number, dy: number): void {
    const nx = this.state.player.x + dx;
    const ny = this.state.player.y + dy;
    if (this.canMoveTo(nx, ny)) {
      this.state.playerPrevX = this.state.player.x;
      this.state.playerPrevY = this.state.player.y;
      this.state.player.x = nx;
      this.state.player.y = ny;
      this.state.playerAnimProgress = 0;

      // Check exit
      if (nx === this.state.level.exit.x && ny === this.state.level.exit.y) {
        this.state.callbacks.onExit();
        return;
      }

      // Check fragment collection
      for (const frag of this.state.level.fragments) {
        if (!frag.collected && frag.x === nx && frag.y === ny) {
          frag.collected = true;
          this.state.callbacks.onFragmentCollect(frag.id);
          this.spawnParticles(nx, ny, COLORS.fragment, 8);
          this.state.callbacks.onCombo();
        }
      }

      // Check terminal proximity
      for (const terminal of this.state.level.terminals) {
        if (!terminal.solved && terminal.x === nx && terminal.y === ny) {
          this.state.callbacks.onTerminalInteract(terminal.id);
        }
      }
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 0.02 + Math.random() * 0.03;
      this.state.particles.push({
        x: x + 0.5,
        y: y + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  private updateObstacles(dt: number): void {
    const { level } = this.state;
    for (let i = 0; i < level.obstacles.length; i++) {
      const obs = level.obstacles[i];
      const st = this.state.obstacleStates.get(i)!;
      st.timer += dt;

      if (obs.kind === 'drone') {
        // Move drone along its axis, bounce at range
        const axis = obs.axis;
        const oldVal = axis === 'x' ? obs.x : obs.y;
        let newVal = oldVal + (obs.dir === 1 || obs.dir === 2 ? 1 : -1) * obs.speed * dt;

        // Check bounds and range
        const minVal = axis === 'x' ? Math.max(1, obs.originX - obs.range) : Math.max(1, obs.originY - obs.range);
        const maxVal = axis === 'x' ? Math.min(level.cols - 2, obs.originX + obs.range) : Math.min(level.rows - 2, obs.originY + obs.range);

        if (newVal <= minVal) {
          newVal = minVal;
          obs.dir = obs.dir === 0 ? 2 : 1; // switch direction
        }
        if (newVal >= maxVal) {
          newVal = maxVal;
          obs.dir = obs.dir === 2 ? 0 : 3;
        }

        if (axis === 'x') {
          obs.x = newVal;
        } else {
          obs.y = newVal;
        }
        st.active = true;
      } else if (obs.kind === 'laser' || obs.kind === 'firewall') {
        const cycle = obs.onTime + obs.offTime;
        const t = (st.timer + obs.phase) % cycle;
        st.active = t < obs.onTime;
      } else if (obs.kind === 'sweep') {
        const axis = obs.axis;
        const oldVal = axis === 'x' ? obs.x : obs.y;
        let newVal = oldVal + (obs.dir === 1 ? 1 : -1) * obs.speed * dt;

        if (newVal <= obs.min) {
          newVal = obs.min;
          obs.dir = 1;
        }
        if (newVal >= obs.max) {
          newVal = obs.max;
          obs.dir = 3;
        }

        if (axis === 'x') {
          obs.x = newVal;
        } else {
          obs.y = newVal;
        }
        st.active = true;
      } else if (obs.kind === 'corruption') {
        st.active = true;
      }
    }
  }

  private checkObstacleCollisions(dt: number): void {
    if (this.state.damageCooldown > 0) {
      this.state.damageCooldown -= dt;
      return;
    }

    const px = this.state.player.x;
    const py = this.state.player.y;
    const { level } = this.state;

    let damaged = false;
    let slow = false;

    for (let i = 0; i < level.obstacles.length; i++) {
      const obs = level.obstacles[i];
      const st = this.state.obstacleStates.get(i)!;

      if (!st.active) continue;

      if (obs.kind === 'corruption') {
        if (Math.round(obs.x) === px && Math.round(obs.y) === py) {
          slow = true;
        }
        continue;
      }

      // For moving obstacles, check if close to player
      const distX = Math.abs(obs.x - px);
      const distY = Math.abs(obs.y - py);
      if (distX < 0.6 && distY < 0.6) {
        if (obs.kind === 'drone') {
          damaged = true;
        } else if (obs.kind === 'laser') {
          // Laser affects the cell it's on AND adjacent cells in a line
          damaged = true;
        } else if (obs.kind === 'firewall') {
          damaged = true;
        } else if (obs.kind === 'sweep') {
          damaged = true;
        }
      }
    }

    if (damaged) {
      let dmg = 20;
      const obs = level.obstacles.find((o, i) => {
        const st = this.state.obstacleStates.get(i)!;
        if (!st.active) return false;
        return Math.abs(o.x - px) < 0.6 && Math.abs(o.y - py) < 0.6;
      });
      if (obs) {
        if (obs.kind === 'laser') dmg = 15;
        else if (obs.kind === 'sweep') dmg = 20;
        else if (obs.kind === 'firewall') dmg = 15;
      }
      this.state.player.integrity -= dmg;
      this.state.damageCooldown = 1.0;
      this.state.callbacks.onDamage(dmg);
      this.spawnParticles(px, py, COLORS.danger, 6);
    }

    if (slow) {
      this.state.slowTimer = 0.5;
    }
  }

  update(time: number): void {
    if (!this.state.running) return;

    const dt = Math.min((time - this.state.lastTime) / 1000, 0.05);
    this.state.lastTime = time;

    // Update player animation
    if (this.state.playerAnimProgress < 1) {
      this.state.playerAnimProgress = Math.min(1, this.state.playerAnimProgress + dt * 8);
    }

    // Update slow effect
    if (this.state.slowTimer > 0) {
      this.state.slowTimer -= dt;
    }

    // Movement cooldown
    this.state.moveCooldown -= dt;
    if (this.state.moveCooldown <= 0) {
      const moveDelay = this.state.slowTimer > 0 ? 0.25 : 0.12;
      let moved = false;
      const keys = this.state.keys;

      if (keys.has('w') || keys.has('arrowup')) {
        this.tryMove(0, -1);
        moved = true;
      } else if (keys.has('s') || keys.has('arrowdown')) {
        this.tryMove(0, 1);
        moved = true;
      } else if (keys.has('a') || keys.has('arrowleft')) {
        this.tryMove(-1, 0);
        moved = true;
      } else if (keys.has('d') || keys.has('arrowright')) {
        this.tryMove(1, 0);
        moved = true;
      }

      if (moved) {
        this.state.moveCooldown = moveDelay;
      }
    }

    // Update obstacles
    this.updateObstacles(dt);

    // Check collisions
    this.checkObstacleCollisions(dt);

    // Update particles
    this.state.particles = this.state.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      return p.life > 0;
    });
  }

  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    const { level } = this.state;
    const cellSize = Math.min(
      Math.floor(canvasWidth / level.cols),
      Math.floor(canvasHeight / level.rows),
    );
    const offsetX = (canvasWidth - level.cols * cellSize) / 2;
    const offsetY = (canvasHeight - level.rows * cellSize) / 2;

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.cols; x++) {
        const cell = level.grid[y][x];
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;

        if (cell.type === 'wall') {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.fillStyle = COLORS.wallHighlight;
          ctx.fillRect(px, py, cellSize, 2);
          ctx.fillRect(px, py, 2, cellSize);
        } else if (cell.type === 'door') {
          if (cell.locked) {
            ctx.fillStyle = COLORS.doorLocked;
            ctx.fillRect(px, py, cellSize, cellSize);
            // lock icon
            ctx.strokeStyle = COLORS.warning;
            ctx.lineWidth = 2;
            ctx.strokeRect(px + cellSize * 0.3, py + cellSize * 0.3, cellSize * 0.4, cellSize * 0.4);
          } else {
            ctx.fillStyle = COLORS.door;
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = COLORS.success;
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
          }
        } else if (cell.type === 'exit') {
          // Glowing exit portal
          const pulse = Math.sin(performance.now() / 300) * 0.15 + 0.85;
          ctx.fillStyle = `rgba(34, 197, 94, ${pulse * 0.3})`;
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.strokeStyle = COLORS.exit;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 3, py + 3, cellSize - 6, cellSize - 6);
          ctx.fillStyle = COLORS.exitGlow;
          ctx.beginPath();
          ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // floor
          ctx.fillStyle = COLORS.floor;
          ctx.fillRect(px, py, cellSize, cellSize);
          // grid lines
          ctx.strokeStyle = COLORS.gridLine;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
      }
    }

    // Draw terminals
    for (const terminal of level.terminals) {
      const px = offsetX + terminal.x * cellSize;
      const py = offsetY + terminal.y * cellSize;
      const color = terminal.solved ? COLORS.terminalSolved : COLORS.terminal;
      ctx.fillStyle = color;
      ctx.fillRect(px + cellSize * 0.2, py + cellSize * 0.2, cellSize * 0.6, cellSize * 0.6);
      // terminal screen
      ctx.fillStyle = '#000';
      ctx.fillRect(px + cellSize * 0.25, py + cellSize * 0.25, cellSize * 0.5, cellSize * 0.3);
      if (!terminal.solved) {
        const blink = Math.sin(performance.now() / 200) > 0;
        if (blink) {
          ctx.fillStyle = color;
          ctx.fillRect(px + cellSize * 0.3, py + cellSize * 0.3, cellSize * 0.1, cellSize * 0.1);
        }
      } else {
        ctx.fillStyle = COLORS.success;
        ctx.font = `${cellSize * 0.3}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('OK', px + cellSize / 2, py + cellSize * 0.5);
      }
    }

    // Draw data fragments
    for (const frag of level.fragments) {
      if (frag.collected) continue;
      const px = offsetX + frag.x * cellSize + cellSize / 2;
      const py = offsetY + frag.y * cellSize + cellSize / 2;
      const bob = Math.sin(performance.now() / 300 + frag.id) * 2;
      ctx.fillStyle = COLORS.fragment;
      ctx.save();
      ctx.translate(px, py + bob);
      ctx.rotate(performance.now() / 1000);
      ctx.fillRect(-cellSize * 0.12, -cellSize * 0.12, cellSize * 0.24, cellSize * 0.24);
      ctx.restore();
      // glow
      ctx.fillStyle = `rgba(251, 191, 36, 0.15)`;
      ctx.beginPath();
      ctx.arc(px, py + bob, cellSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw obstacles
    for (let i = 0; i < level.obstacles.length; i++) {
      const obs = level.obstacles[i];
      const st = this.state.obstacleStates.get(i)!;
      this.renderObstacle(ctx, obs, st.active, offsetX, offsetY, cellSize);
    }

    // Draw player with smooth interpolation
    const t = this.state.playerAnimProgress;
    const easedT = 1 - Math.pow(1 - t, 3);
    const rx = this.state.playerPrevX + (this.state.player.x - this.state.playerPrevX) * easedT;
    const ry = this.state.playerPrevY + (this.state.player.y - this.state.playerPrevY) * easedT;
    const ppx = offsetX + rx * cellSize + cellSize / 2;
    const ppy = offsetY + ry * cellSize + cellSize / 2;

    // player glow
    ctx.fillStyle = `rgba(56, 189, 248, 0.2)`;
    ctx.beginPath();
    ctx.arc(ppx, ppy, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // damage flash
    if (this.state.damageCooldown > 0.7) {
      ctx.fillStyle = COLORS.danger;
    } else {
      ctx.fillStyle = COLORS.player;
    }
    ctx.beginPath();
    ctx.arc(ppx, ppy, cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // inner highlight
    ctx.fillStyle = `rgba(255,255,255,0.4)`;
    ctx.beginPath();
    ctx.arc(ppx - cellSize * 0.08, ppy - cellSize * 0.08, cellSize * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw particles
    for (const p of this.state.particles) {
      const ppx2 = offsetX + p.x * cellSize;
      const ppy2 = offsetY + p.y * cellSize;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(ppx2 - p.size / 2, ppy2 - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private renderObstacle(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    active: boolean,
    offsetX: number,
    offsetY: number,
    cellSize: number,
  ): void {
    const px = offsetX + obs.x * cellSize + cellSize / 2;
    const py = offsetY + obs.y * cellSize + cellSize / 2;

    switch (obs.kind) {
      case 'drone': {
        // Draw patrol path
        ctx.strokeStyle = COLORS.dronePath;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        if (obs.axis === 'x') {
          const minPx = offsetX + Math.max(1, obs.originX - obs.range) * cellSize + cellSize / 2;
          const maxPx = offsetX + Math.min(this.state.level.cols - 2, obs.originX + obs.range) * cellSize + cellSize / 2;
          ctx.moveTo(minPx, py);
          ctx.lineTo(maxPx, py);
        } else {
          const minPy = offsetY + Math.max(1, obs.originY - obs.range) * cellSize + cellSize / 2;
          const maxPy = offsetY + Math.min(this.state.level.rows - 2, obs.originY + obs.range) * cellSize + cellSize / 2;
          ctx.moveTo(px, minPy);
          ctx.lineTo(px, maxPy);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Drone body
        ctx.fillStyle = COLORS.drone;
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // scanning eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'laser': {
        if (active) {
          // Draw laser beam across the cell and adjacent cells
          ctx.fillStyle = `rgba(239, 68, 68, 0.3)`;
          ctx.fillRect(px - cellSize * 0.5, py - cellSize * 0.5, cellSize, cellSize);
          ctx.strokeStyle = COLORS.laserBeam;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px - cellSize * 0.5, py);
          ctx.lineTo(px + cellSize * 0.5, py);
          ctx.moveTo(px, py - cellSize * 0.5);
          ctx.lineTo(px, py + cellSize * 0.5);
          ctx.stroke();
          // center emitter
          ctx.fillStyle = COLORS.laser;
          ctx.beginPath();
          ctx.arc(px, py, cellSize * 0.15, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // inactive emitter
          ctx.fillStyle = `rgba(239, 68, 68, 0.3)`;
          ctx.beginPath();
          ctx.arc(px, py, cellSize * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'firewall': {
        if (active) {
          ctx.fillStyle = `rgba(249, 115, 22, 0.4)`;
          ctx.fillRect(px - cellSize * 0.5, py - cellSize * 0.5, cellSize, cellSize);
          // animated flames
          const flicker = Math.sin(performance.now() / 80) * 2;
          ctx.fillStyle = COLORS.firewall;
          ctx.fillRect(px - cellSize * 0.35, py - cellSize * 0.35 + flicker, cellSize * 0.7, cellSize * 0.7);
        } else {
          ctx.fillStyle = `rgba(249, 115, 22, 0.15)`;
          ctx.fillRect(px - cellSize * 0.4, py - cellSize * 0.4, cellSize * 0.8, cellSize * 0.8);
        }
        break;
      }
      case 'corruption': {
        // Static corruption zone with visual noise
        ctx.fillStyle = `rgba(139, 92, 246, 0.2)`;
        ctx.fillRect(px - cellSize * 0.5, py - cellSize * 0.5, cellSize, cellSize);
        // glitchy squares
        for (let i = 0; i < 3; i++) {
          const gx = px - cellSize * 0.3 + Math.random() * cellSize * 0.6;
          const gy = py - cellSize * 0.3 + Math.random() * cellSize * 0.6;
          ctx.fillStyle = COLORS.corruption;
          ctx.globalAlpha = Math.random() * 0.4 + 0.2;
          ctx.fillRect(gx, gy, 3, 3);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'sweep': {
        ctx.fillStyle = `rgba(244, 63, 94, 0.3)`;
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.sweep;
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // sweep trail
        ctx.strokeStyle = `rgba(244, 63, 94, 0.15)`;
        ctx.lineWidth = cellSize * 0.15;
        ctx.beginPath();
        if (obs.axis === 'x') {
          ctx.moveTo(offsetX + obs.min * cellSize + cellSize / 2, py);
          ctx.lineTo(px, py);
        } else {
          ctx.moveTo(px, offsetY + obs.min * cellSize + cellSize / 2);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        break;
      }
    }
  }
}
