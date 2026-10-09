import type { PuzzleType, PuzzleData } from './types';

// Simple seeded RNG for deterministic puzzle generation
function seedRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 0x100000000;
    return s / 0x100000000;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function choose<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ---- Puzzle generators ----

function genSequence(rng: () => number, difficulty: number): PuzzleData {
  const types = ['arithmetic', 'fibonacci', 'geometric', 'squares', 'powers'];
  const type = choose(types, rng);

  let sequence: number[] = [];
  let answerVal = 0;
  let prompt = '';

  switch (type) {
    case 'arithmetic': {
      const start = Math.floor(rng() * 10) + 1;
      const step = Math.floor(rng() * 5) + 1 + difficulty;
      sequence = [start, start + step, start + 2 * step, start + 3 * step];
      answerVal = start + 4 * step;
      prompt = `What comes next? ${sequence.join(', ')}, ?`;
      break;
    }
    case 'fibonacci': {
      const a = Math.floor(rng() * 3) + 1;
      const b = a + Math.floor(rng() * 3) + 1;
      sequence = [a, b, a + b, a + 2 * b];
      answerVal = 2 * a + 3 * b;
      prompt = `What comes next? ${sequence.join(', ')}, ?`;
      break;
    }
    case 'geometric': {
      const start = Math.floor(rng() * 3) + 1;
      const ratio = Math.floor(rng() * 2) + 2;
      sequence = [start, start * ratio, start * ratio * ratio, start * ratio ** 3];
      answerVal = start * ratio ** 4;
      prompt = `What comes next? ${sequence.join(', ')}, ?`;
      break;
    }
    case 'squares': {
      const start = Math.floor(rng() * 4) + 2;
      sequence = [start ** 2, (start + 1) ** 2, (start + 2) ** 2, (start + 3) ** 2];
      answerVal = (start + 4) ** 2;
      prompt = `What comes next? ${sequence.join(', ')}, ?`;
      break;
    }
    case 'powers': {
      const base = Math.floor(rng() * 2) + 2;
      sequence = [base, base ** 2, base ** 3, base ** 4];
      answerVal = base ** 5;
      prompt = `What comes next? ${sequence.join(', ')}, ?`;
      break;
    }
  }

  const options = [answerVal];
  while (options.length < 4) {
    const delta = Math.floor(rng() * answerVal * 0.3) + 1;
    const wrong = answerVal + (rng() > 0.5 ? delta : -delta);
    if (wrong > 0 && !options.includes(wrong)) options.push(wrong);
  }
  const shuffled = shuffle(options, rng);
  return {
    prompt,
    options: shuffled.map(String),
    answer: shuffled.indexOf(answerVal),
    hint: `Look for the pattern: ${type} sequence.`,
    context: { type },
  };
}

function genBoolean(rng: () => number, difficulty: number): PuzzleData {
  const ops = difficulty >= 3 ? ['AND', 'OR', 'NOT'] : ['AND', 'OR'];
  const a = rng() > 0.5;
  const b = rng() > 0.5;
  const c = rng() > 0.5;

  let expr = '';
  let answer = false;

  const op1 = choose(ops, rng);
  const op2 = choose(ops, rng);

  if (op1 === 'NOT' && op2 === 'NOT') {
    expr = `NOT ${a ? 'TRUE' : 'FALSE'} ${op2} NOT ${b ? 'TRUE' : 'FALSE'}`;
    const v1 = !a;
    const v2 = !b;
    answer = v1 || v2;
  } else if (op1 === 'NOT') {
    expr = `NOT ${a ? 'TRUE' : 'FALSE'} ${op2} ${b ? 'TRUE' : 'FALSE'}`;
    const v1 = !a;
    answer = op2 === 'AND' ? v1 && b : v1 || b;
  } else if (op2 === 'NOT') {
    expr = `${a ? 'TRUE' : 'FALSE'} ${op1} NOT ${b ? 'TRUE' : 'FALSE'}`;
    const v2 = !b;
    answer = op1 === 'AND' ? a && v2 : a || v2;
  } else {
    if (difficulty >= 4) {
      expr = `${a ? 'TRUE' : 'FALSE'} ${op1} ${b ? 'TRUE' : 'FALSE'} ${op2} ${c ? 'TRUE' : 'FALSE'}`;
      const v1 = op1 === 'AND' ? a && b : a || b;
      answer = op2 === 'AND' ? v1 && c : v1 || c;
    } else {
      expr = `${a ? 'TRUE' : 'FALSE'} ${op1} ${b ? 'TRUE' : 'FALSE'}`;
      answer = op1 === 'AND' ? a && b : a || b;
    }
  }

  const answerStr = answer ? 'TRUE' : 'FALSE';
  const options = ['TRUE', 'FALSE'];
  return {
    prompt: `Evaluate: ${expr} = ?`,
    options,
    answer: options.indexOf(answerStr),
    hint: 'Apply operators left to right. NOT inverts. AND requires both true. OR requires at least one true.',
    context: { expr, answer },
  };
}

function genDebug(rng: () => number, difficulty: number): PuzzleData {
  const bugs: { code: string; bug: string; fix: string; wrong: string }[] = [
    {
      code: `for i in range(5):\n    print(i)`,
      bug: 'range(5)',
      fix: 'range(0, 5)',
      wrong: 'range(1, 5)',
    },
    {
      code: `total = 0\nfor n in [1,2,3]:\n    total += n\nprint(total)`,
      bug: 'total += n',
      fix: 'total = total + n',
      wrong: 'total = n',
    },
    {
      code: `if x = 5:\n    doSomething()`,
      bug: 'x = 5',
      fix: 'x == 5',
      wrong: 'x === 5',
    },
    {
      code: `while True:\n    x = input()\n    if x == "quit":\n        break`,
      bug: 'while True:',
      fix: 'while running:',
      wrong: 'while False:',
    },
    {
      code: `arr = [3,1,2]\narr.sort()\nprint(arr)`,
      bug: 'arr.sort()',
      fix: 'arr = sorted(arr)',
      wrong: 'arr.reverse()',
    },
    {
      code: `def add(a,b):\n    return a-b`,
      bug: 'return a-b',
      fix: 'return a + b',
      wrong: 'return a * b',
    },
    {
      code: `x = 10\nif x > 5 and x < 20\n    print("in range")`,
      bug: 'if x > 5 and x < 20',
      fix: 'if x > 5 and x < 20:',
      wrong: 'if x > 5 or x < 20',
    },
    {
      code: `names = ["Al","Bo","Cy"]\nfor n in names:\n    print(names[n])`,
      bug: 'print(names[n])',
      fix: 'print(n)',
      wrong: 'print(names)',
    },
    {
      code: `count = 0\nwhile count < 5:\n    count = count + 1`,
      bug: 'count = count + 1',
      fix: 'count += 1',
      wrong: 'count -= 1',
    },
    {
      code: `def isEven(n):\n    if n % 2 == 1:\n        return True\n    return False`,
      bug: 'n % 2 == 1',
      fix: 'n % 2 == 0',
      wrong: 'n % 2 != 0',
    },
    {
      code: `text = "hello"\nif text = "hello":\n    greet()`,
      bug: 'text = "hello"',
      fix: 'text == "hello"',
      wrong: 'text != "hello"',
    },
    {
      code: `nums = [1,2,3,4]\nevens = []\nfor n in nums:\n    if n % 2 == 0:\n        evens.append(n)`,
      bug: 'evens.append(n)',
      fix: 'evens += [n]',
      wrong: 'evens.append(nums)',
    },
  ];

  const filtered = bugs.filter((_, i) => difficulty >= 3 || i < 6);
  const chosen = choose(filtered, rng);
  const options = shuffle([chosen.fix, chosen.wrong, chosen.bug + ' (no change)'], rng);

  return {
    prompt: `Find the bug in this code:\n\n${chosen.code}\n\nWhich fix is correct?`,
    options,
    answer: options.indexOf(chosen.fix),
    hint: 'Look for assignment vs comparison, off-by-one, or operator errors.',
    context: { code: chosen.code, bug: chosen.bug },
  };
}

function genPattern(rng: () => number, difficulty: number): PuzzleData {
  const type = choose(['grid', 'binary', 'rotate'], rng);

  if (type === 'binary') {
    const len = 4 + difficulty;
    const seq: number[] = [];
    for (let i = 0; i < len; i++) seq.push(rng() > 0.5 ? 1 : 0);
    // repeat pattern
    const pattern = seq.slice(0, 3);
    for (let i = 0; i < len; i++) seq[i] = pattern[i % pattern.length];
    const answerVal = pattern[len % pattern.length];
    const display = seq.slice(0, len).join('');
    const options = ['0', '1'];
    return {
      prompt: `Binary pattern: ${display}, ?\nWhat's the next bit?`,
      options,
      answer: answerVal,
      hint: 'The pattern repeats. Find the cycle length.',
      context: { type },
    };
  }

  if (type === 'rotate') {
    const grids = [
      ['X..', '.X.', '..X'],
      ['..X', '.X.', 'X..'],
      ['.X.', 'X..', '.X.'],
      ['X..', '.X.', '..X'],
    ];
    const start = Math.floor(rng() * 2);
    const seq = [grids[start], grids[start + 1], grids[start + 2]];
    const answerGrid = grids[(start + 3) % 4];
    const options = grids.slice(0, 4).map((g) => g.join(' | '));
    const shuffled = shuffle(options, rng);
    return {
      prompt: `The pattern rotates each step:\n${seq.map((g) => g.join(' | ')).join('\n')}\n\nWhat's the next state?`,
      options: shuffled,
      answer: shuffled.indexOf(answerGrid.join(' | ')),
      hint: 'Track how the X moves — it rotates 90 degrees each step.',
      context: { type },
    };
  }

  // grid pattern
  const size = 3;
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) cells.push(rng() > 0.5);
  // make a pattern: toggle one cell each step
  const steps: boolean[][] = [];
  let current = [...cells];
  for (let i = 0; i < 3; i++) {
    steps.push([...current]);
    const idx = i; // toggle diagonally
    current[idx] = !current[idx];
  }
  const answerState = [...steps[2]];
  answerState[3] = !answerState[3];

  const format = (state: boolean[]) =>
    state.map((c) => (c ? '■' : '□')).join('');

  const wrong1 = [...answerState];
  wrong1[0] = !wrong1[0];
  const wrong2 = [...answerState];
  wrong2[6] = !wrong2[6];

  const options = shuffle(
    [format(answerState), format(wrong1), format(wrong2)],
    rng,
  );

  return {
    prompt: `Watch the pattern evolve:\n${steps.map(format).join(' → ')} → ?\nWhat's next?`,
    options,
    answer: options.indexOf(format(answerState)),
    hint: 'One cell changes at each step in a predictable order.',
    context: { type },
  };
}

function genPathfinding(rng: () => number, difficulty: number): PuzzleData {
  const type = 'pathfinding';
  const size = Math.min(4 + Math.floor(difficulty / 2), 6);
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      grid[r][c] = '.';
    }
  }
  // place walls
  const wallCount = Math.floor(size * size * 0.25);
  for (let i = 0; i < wallCount; i++) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    if (!(r === 0 && c === 0) && !(r === size - 1 && c === size - 1)) {
      grid[r][c] = '#';
    }
  }
  grid[0][0] = 'S';
  grid[size - 1][size - 1] = 'E';

  // compute shortest path via BFS
  const visited: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false),
  );
  const queue: { r: number; c: number; path: string }[] = [
    { r: 0, c: 0, path: '' },
  ];
  visited[0][0] = true;
  let foundPath = '';
  const dirs = [
    { dr: -1, dc: 0, ch: 'U' },
    { dr: 1, dc: 0, ch: 'D' },
    { dr: 0, dc: -1, ch: 'L' },
    { dr: 0, dc: 1, ch: 'R' },
  ];

  while (queue.length > 0) {
    const { r, c, path } = queue.shift()!;
    if (r === size - 1 && c === size - 1) {
      foundPath = path;
      break;
    }
    for (const d of dirs) {
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc] && grid[nr][nc] !== '#') {
        visited[nr][nc] = true;
        queue.push({ r: nr, c: nc, path: path + d.ch });
      }
    }
  }

  // If no path found, regenerate with fewer walls
  if (!foundPath) {
    // fallback: clear path along diagonal
    grid.forEach((row) => row.fill('.'));
    grid[0][0] = 'S';
    grid[size - 1][size - 1] = 'E';
    foundPath = 'D'.repeat(size - 1) + 'R'.repeat(size - 1)
      .split('').sort(() => 0).join('');
    // actually just go right then down
    foundPath = 'R'.repeat(size - 1) + 'D'.repeat(size - 1);
  }

  // Generate wrong options with similar length
  const options = [foundPath];
  while (options.length < 4) {
    const len = foundPath.length;
    let wrong = '';
    for (let i = 0; i < len; i++) {
      wrong += choose(['U', 'D', 'L', 'R'], rng);
    }
    if (!options.includes(wrong)) options.push(wrong);
  }

  const shuffled = shuffle(options, rng);
  const gridDisplay = grid.map((row) => row.join(' ')).join('\n');

  return {
    prompt: `Navigate from S to E. Avoid # walls.\n\n${gridDisplay}\n\nWhat's the shortest path? (U/D/L/R)`,
    options: shuffled,
    answer: shuffled.indexOf(foundPath),
    hint: 'Find the shortest route from S to E moving only up/down/left/right through open cells.',
    context: { type, grid, path: foundPath },
  };
}

function genSorting(rng: () => number, difficulty: number): PuzzleData {
  const count = Math.min(4 + difficulty, 7);
  const useStrings = difficulty >= 3 && rng() > 0.5;

  if (useStrings) {
    const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];
    const chosen = shuffle(words, rng).slice(0, count);
    const sorted = [...chosen].sort();
    const reverse = [...sorted].reverse();
    const shuffled = [...chosen];
    while (shuffled.join(',') === sorted.join(',') || shuffled.join(',') === reverse.join(',')) {
      shuffle(shuffled, rng);
    }
    const options = shuffle([
      sorted.join(', '),
      reverse.join(', '),
      shuffled.join(', '),
    ], rng);
    return {
      prompt: `Sort these strings alphabetically:\n${chosen.join(', ')}\n\nWhich is correctly sorted A→Z?`,
      options,
      answer: options.indexOf(sorted.join(', ')),
      hint: 'Compare character by character, left to right.',
      context: { type: 'string' },
    };
  }

  const nums: number[] = [];
  for (let i = 0; i < count; i++) nums.push(Math.floor(rng() * 100) + 1);
  const ascending = difficulty % 2 === 0;
  const sorted = [...nums].sort((a, b) => (ascending ? a - b : b - a));
  const reverse = [...sorted].reverse();
  let shuffledNums = shuffle(nums, rng);
  while (shuffledNums.join(',') === sorted.join(',') || shuffledNums.join(',') === reverse.join(',')) {
    shuffledNums = shuffle(nums, rng);
  }
  const options = shuffle([
    sorted.join(', '),
    reverse.join(', '),
    shuffledNums.join(', '),
  ], rng);

  return {
    prompt: `Sort these numbers in ${ascending ? 'ascending' : 'descending'} order:\n${nums.join(', ')}\n\nWhich is correct?`,
    options,
    answer: options.indexOf(sorted.join(', ')),
    hint: `Order from ${ascending ? 'smallest to largest' : 'largest to smallest'}.`,
    context: { type: 'number', ascending },
  };
}

function genConditional(rng: () => number, difficulty: number): PuzzleData {
  const scenarios: {
    code: string;
    question: string;
    answer: string;
    wrong: string[];
  }[] = [
    {
      code: `x = 7\nif x > 10:\n    result = "high"\nelif x > 5:\n    result = "mid"\nelse:\n    result = "low"`,
      question: 'What is the value of result?',
      answer: '"mid"',
      wrong: ['"high"', '"low"', 'error'],
    },
    {
      code: `n = 0\nwhile n < 3:\n    n += 1\nprint(n)`,
      question: 'What does this print?',
      answer: '3',
      wrong: ['0', '2', '4'],
    },
    {
      code: `for i in range(3):\n    print(i)`,
      question: 'How many lines are printed?',
      answer: '3',
      wrong: ['2', '4', '0'],
    },
    {
      code: `x = True\ny = False\nif x and not y:\n    z = "pass"\nelse:\n    z = "fail"`,
      question: 'What is z?',
      answer: '"pass"',
      wrong: ['"fail"', 'error', 'undefined'],
    },
    {
      code: `nums = [1,2,3,4,5]\nevens = [n for n in nums if n % 2 == 0]\nprint(len(evens))`,
      question: 'What does this print?',
      answer: '2',
      wrong: ['3', '5', '1'],
    },
    {
      code: `x = 5\nif x > 3:\n    x = x * 2\nif x > 10:\n    x = x - 3\nprint(x)`,
      question: 'What does this print?',
      answer: '7',
      wrong: ['10', '3', '13'],
    },
    {
      code: `a = [1,2,3]\nb = a\nb.append(4)\nprint(len(a))`,
      question: 'What does this print?',
      answer: '4',
      wrong: ['3', '5', 'error'],
    },
    {
      code: `def f(n):\n    if n <= 1: return 1\n    return n * f(n-1)\nprint(f(4))`,
      question: 'What does this print?',
      answer: '24',
      wrong: ['12', '16', '6'],
    },
    {
      code: `x = "hello"\nif len(x) > 3:\n    x = x.upper()\nprint(x)`,
      question: 'What does this print?',
      answer: '"HELLO"',
      wrong: ['"hello"', '"Hello"', 'error'],
    },
    {
      code: `count = 0\nfor i in range(10):\n    if i % 2 == 0:\n        count += 1\nprint(count)`,
      question: 'What does this print?',
      answer: '5',
      wrong: ['10', '4', '6'],
    },
  ];

  const filtered = scenarios.filter((_, i) => difficulty >= 3 || i < 5);
  const chosen = choose(filtered, rng);
  const options = shuffle([chosen.answer, ...chosen.wrong], rng);

  return {
    prompt: `${chosen.code}\n\n${chosen.question}`,
    options,
    answer: options.indexOf(chosen.answer),
    hint: 'Trace through the code step by step, tracking each variable.',
    context: { code: chosen.code },
  };
}

// ---- Main generator ----

const GENERATORS: Record<PuzzleType, (rng: () => number, difficulty: number) => PuzzleData> = {
  sequence: genSequence,
  boolean: genBoolean,
  debug: genDebug,
  pattern: genPattern,
  pathfinding: genPathfinding,
  sorting: genSorting,
  conditional: genConditional,
};

export const ALL_PUZZLE_TYPES: PuzzleType[] = [
  'sequence',
  'boolean',
  'debug',
  'pattern',
  'pathfinding',
  'sorting',
  'conditional',
];

export function generatePuzzle(
  type: PuzzleType,
  seed: number,
  difficulty: number,
): PuzzleData {
  const rng = seedRand(seed);
  return GENERATORS[type](rng, difficulty);
}

export function pickPuzzleType(
  level: number,
  seed: number,
  terminalIndex: number,
): PuzzleType {
  const rng = seedRand(seed + terminalIndex * 1000);
  // Level 1: simple puzzles
  if (level === 1) {
    return choose(['sequence', 'boolean', 'conditional'], rng) as PuzzleType;
  }
  if (level === 2) {
    return choose(['sequence', 'boolean', 'debug', 'sorting'], rng) as PuzzleType;
  }
  if (level === 3) {
    return choose(['boolean', 'debug', 'pattern', 'sorting', 'conditional'], rng) as PuzzleType;
  }
  if (level === 4) {
    return choose(['debug', 'pattern', 'pathfinding', 'sorting', 'conditional'], rng) as PuzzleType;
  }
  return choose(ALL_PUZZLE_TYPES, rng) as PuzzleType;
}
