/**
 * 五子棋游戏核心逻辑
 * 支持 AI 对战模式
 */

// 棋盘配置
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// 游戏状态
let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let gameMode = 'pvp'; // 'pvp' 或 'pve'
let difficulty = 'medium'; // 'easy', 'medium', 'hard'
let aiPlayer = WHITE; // AI 执白棋

// AI 搜索深度配置
const AI_DEPTH = {
  easy: 1,
  medium: 2,
  hard: 3
};

// 评分权重
const SCORE_WEIGHTS = {
  FIVE: 100000,      // 连五
  LIVE_FOUR: 10000,  // 活四
  RUSH_FOUR: 1000,   // 冲四
  LIVE_THREE: 1000,  // 活三
  SLEEP_THREE: 100,  // 眠三
  LIVE_TWO: 100,     // 活二
  SLEEP_TWO: 10,     // 眠二
  LIVE_ONE: 10       // 活一
};

// DOM 元素
const boardElement = document.getElementById('board');
const playerElement = document.getElementById('player');
const messageElement = document.getElementById('message');
const restartButton = document.getElementById('restart');
const modeSelection = document.getElementById('mode-selection');
const gameArea = document.getElementById('game-area');
const difficultySelection = document.getElementById('difficulty-selection');
const aiThinkingElement = document.getElementById('ai-thinking');

// 星位点坐标
const starPoints = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11]
];

/**
 * 初始化游戏
 */
function initGame() {
  board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
  currentPlayer = BLACK;
  gameOver = false;
  messageElement.textContent = '';
  aiThinkingElement.classList.add('hidden');

  boardElement.innerHTML = '';

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;

      if (starPoints.some(([sx, sy]) => sx === x && sy === y)) {
        cell.classList.add('star');
      }

      cell.addEventListener('click', () => handleCellClick(x, y));
      boardElement.appendChild(cell);
    }
  }

  updatePlayerDisplay();
}

/**
 * 处理格子点击事件
 */
async function handleCellClick(x, y) {
  if (gameOver || board[y][x] !== EMPTY) {
    return;
  }

  // 人机模式下，如果不是玩家回合则不处理
  if (gameMode === 'pve' && currentPlayer === aiPlayer) {
    return;
  }

  await makeMove(x, y);
}

/**
 * 执行落子
 */
async function makeMove(x, y) {
  board[y][x] = currentPlayer;
  renderPiece(x, y, currentPlayer);

  const winningPieces = checkWin(x, y);
  if (winningPieces) {
    gameOver = true;
    highlightWinningPieces(winningPieces);
    const winner = currentPlayer === BLACK ? '黑棋' : '白棋';
    messageElement.textContent = gameMode === 'pve' && currentPlayer === aiPlayer
      ? 'AI 获胜！'
      : `${winner} 获胜！`;
    return;
  }

  if (checkDraw()) {
    gameOver = true;
    messageElement.textContent = '平局！';
    return;
  }

  currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
  updatePlayerDisplay();

  // 人机模式下，AI 执行下一步
  if (gameMode === 'pve' && currentPlayer === aiPlayer && !gameOver) {
    await aiMove();
  }
}

/**
 * AI 执行落子
 */
async function aiMove() {
  aiThinkingElement.classList.remove('hidden');

  // 使用 setTimeout 让 UI 有时间更新
  await new Promise(resolve => setTimeout(resolve, 100));

  const move = findBestMove();

  aiThinkingElement.classList.add('hidden');

  if (move) {
    await makeMove(move.x, move.y);
    // 标记 AI 最后落子
    const lastPiece = boardElement.querySelector(`[data-x="${move.x}"][data-y="${move.y}"] .piece`);
    if (lastPiece) {
      lastPiece.classList.add('ai-last');
      // 移除之前的标记
      document.querySelectorAll('.piece.ai-last').forEach(p => {
        if (p !== lastPiece) p.classList.remove('ai-last');
      });
    }
  }
}

/**
 * 寻找最佳落子位置（极大极小值算法 + Alpha-Beta 剪枝）
 */
function findBestMove() {
  const depth = AI_DEPTH[difficulty];
  let bestScore = -Infinity;
  let bestMove = null;

  // 获取候选位置
  const candidates = getCandidates();

  // 如果是第一步，直接下中心点
  if (candidates.length === 0) {
    return { x: 7, y: 7 };
  }

  for (const [x, y] of candidates) {
    board[y][x] = aiPlayer;
    const score = minimax(depth - 1, -Infinity, Infinity, false);
    board[y][x] = EMPTY;

    if (score > bestScore) {
      bestScore = score;
      bestMove = { x, y };
    }
  }

  return bestMove;
}

/**
 * 极大极小值算法 + Alpha-Beta 剪枝
 */
function minimax(depth, alpha, beta, isMaximizing) {
  // 检查是否有获胜者
  const winner = checkGameWinner();
  if (winner === aiPlayer) return SCORE_WEIGHTS.FIVE;
  if (winner === getOpponent(aiPlayer)) return -SCORE_WEIGHTS.FIVE;

  if (depth === 0) {
    return evaluateBoard();
  }

  const candidates = getCandidates();
  if (candidates.length === 0) {
    return evaluateBoard();
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const [x, y] of candidates) {
      board[y][x] = aiPlayer;
      const score = minimax(depth - 1, alpha, beta, false);
      board[y][x] = EMPTY;
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    const opponent = getOpponent(aiPlayer);
    for (const [x, y] of candidates) {
      board[y][x] = opponent;
      const score = minimax(depth - 1, alpha, beta, true);
      board[y][x] = EMPTY;
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

/**
 * 获取候选落子位置（只考虑已有棋子周围的位置）
 */
function getCandidates() {
  const candidates = new Set();
  const range = 2;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] !== EMPTY) {
        for (let dy = -range; dy <= range; dy++) {
          for (let dx = -range; dx <= range; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === EMPTY) {
              candidates.add(`${nx},${ny}`);
            }
          }
        }
      }
    }
  }

  // 按评估分数排序，优先搜索高分位置
  const candidatesArray = Array.from(candidates).map(s => {
    const [x, y] = s.split(',').map(Number);
    return [x, y];
  });

  candidatesArray.sort((a, b) => {
    const scoreA = evaluatePosition(a[0], a[1]);
    const scoreB = evaluatePosition(b[0], b[1]);
    return scoreB - scoreA;
  });

  // 限制候选数量以提高性能
  return candidatesArray.slice(0, 15);
}

/**
 * 评估单个位置的分数
 */
function evaluatePosition(x, y) {
  let score = 0;

  // 模拟 AI 落子
  board[y][x] = aiPlayer;
  score += evaluatePoint(x, y, aiPlayer);
  board[y][x] = EMPTY;

  // 模拟对手落子
  const opponent = getOpponent(aiPlayer);
  board[y][x] = opponent;
  score += evaluatePoint(x, y, opponent) * 0.9; // 防守权重稍低
  board[y][x] = EMPTY;

  return score;
}

/**
 * 评估整个棋盘的分数
 */
function evaluateBoard() {
  let score = 0;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] === aiPlayer) {
        score += evaluatePoint(x, y, aiPlayer);
      } else if (board[y][x] === getOpponent(aiPlayer)) {
        score -= evaluatePoint(x, y, getOpponent(aiPlayer));
      }
    }
  }

  return score;
}

/**
 * 评估某个位置的棋型分数
 */
function evaluatePoint(x, y, player) {
  let totalScore = 0;
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dx, dy] of directions) {
    const lineScore = evaluateLine(x, y, dx, dy, player);
    totalScore += lineScore;
  }

  return totalScore;
}

/**
 * 评估一条线上的棋型
 */
function evaluateLine(x, y, dx, dy, player) {
  let count = 1;
  let block = 0;
  let empty = 0;

  // 正方向
  let nx = x + dx;
  let ny = y + dy;
  while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
    if (board[ny][nx] === player) {
      count++;
    } else if (board[ny][nx] === EMPTY) {
      empty++;
      break;
    } else {
      block++;
      break;
    }
    nx += dx;
    ny += dy;
  }

  // 负方向
  nx = x - dx;
  ny = y - dy;
  while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
    if (board[ny][nx] === player) {
      count++;
    } else if (board[ny][nx] === EMPTY) {
      empty++;
      break;
    } else {
      block++;
      break;
    }
    nx -= dx;
    ny -= dy;
  }

  // 根据棋型打分
  if (count >= 5) {
    return SCORE_WEIGHTS.FIVE;
  }

  if (block === 0) { // 活棋
    switch (count) {
      case 4: return SCORE_WEIGHTS.LIVE_FOUR;
      case 3: return SCORE_WEIGHTS.LIVE_THREE;
      case 2: return SCORE_WEIGHTS.LIVE_TWO;
      case 1: return SCORE_WEIGHTS.LIVE_ONE;
    }
  } else if (block === 1) { // 眠棋
    switch (count) {
      case 4: return SCORE_WEIGHTS.RUSH_FOUR;
      case 3: return SCORE_WEIGHTS.SLEEP_THREE;
      case 2: return SCORE_WEIGHTS.SLEEP_TWO;
    }
  }

  return 0;
}

/**
 * 检查游戏是否有获胜者
 */
function checkGameWinner() {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] !== EMPTY) {
        if (checkWin(x, y)) {
          return board[y][x];
        }
      }
    }
  }
  return null;
}

/**
 * 获取对手
 */
function getOpponent(player) {
  return player === BLACK ? WHITE : BLACK;
}

/**
 * 渲染棋子
 */
function renderPiece(x, y, player) {
  const cell = boardElement.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  const piece = document.createElement('div');
  piece.className = `piece ${player === BLACK ? 'black' : 'white'}`;
  cell.appendChild(piece);
}

/**
 * 更新当前玩家显示
 */
function updatePlayerDisplay() {
  if (gameMode === 'pve') {
    playerElement.textContent = currentPlayer === aiPlayer ? 'AI (白棋)' : '玩家 (黑棋)';
  } else {
    playerElement.textContent = currentPlayer === BLACK ? '黑棋' : '白棋';
  }
}

/**
 * 检查获胜
 */
function checkWin(x, y) {
  const player = board[y][x];
  const directions = [
    [[0, 1], [0, -1]],
    [[1, 0], [-1, 0]],
    [[1, 1], [-1, -1]],
    [[1, -1], [-1, 1]]
  ];

  for (const [dir1, dir2] of directions) {
    const pieces = [[x, y]];

    for (const [dx, dy] of [dir1, dir2]) {
      let nx = x + dx;
      let ny = y + dy;

      while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
        pieces.push([nx, ny]);
        nx += dx;
        ny += dy;
      }
    }

    if (pieces.length >= 5) {
      return pieces;
    }
  }

  return null;
}

/**
 * 检查平局
 */
function checkDraw() {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] === EMPTY) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 高亮显示获胜的棋子
 */
function highlightWinningPieces(pieces) {
  for (const [x, y] of pieces) {
    const cell = boardElement.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    const piece = cell.querySelector('.piece');
    if (piece) {
      piece.classList.add('winning');
    }
  }
}

/**
 * 显示游戏界面
 */
function showGameArea() {
  modeSelection.classList.add('hidden');
  gameArea.classList.remove('hidden');
}

/**
 * 显示模式选择界面
 */
function showModeSelection() {
  gameArea.classList.add('hidden');
  modeSelection.classList.remove('hidden');
  difficultySelection.classList.add('hidden');
}

// 绑定事件
document.getElementById('pvp-mode').addEventListener('click', () => {
  gameMode = 'pvp';
  showGameArea();
  initGame();
});

document.getElementById('pve-mode').addEventListener('click', () => {
  difficultySelection.classList.remove('hidden');
});

document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    gameMode = 'pve';
    difficulty = btn.dataset.difficulty;
    showGameArea();
    initGame();
  });
});

restartButton.addEventListener('click', initGame);

document.getElementById('back-to-menu').addEventListener('click', showModeSelection);

// 初始化显示模式选择界面
showModeSelection();
