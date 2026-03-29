/**
 * 五子棋游戏核心逻辑
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

// DOM 元素
const boardElement = document.getElementById('board');
const playerElement = document.getElementById('player');
const messageElement = document.getElementById('message');
const restartButton = document.getElementById('restart');

// 星位点坐标（用于显示棋盘上的星位）
const starPoints = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11]
];

/**
 * 初始化游戏
 */
function initGame() {
  // 重置游戏状态
  board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
  currentPlayer = BLACK;
  gameOver = false;
  messageElement.textContent = '';

  // 清空棋盘
  boardElement.innerHTML = '';

  // 创建棋盘格子
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;

      // 添加星位点
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
 * @param {number} x - 横坐标
 * @param {number} y - 纵坐标
 */
function handleCellClick(x, y) {
  // 如果游戏已结束或该位置已有棋子，则不处理
  if (gameOver || board[y][x] !== EMPTY) {
    return;
  }

  // 放置棋子
  board[y][x] = currentPlayer;
  renderPiece(x, y, currentPlayer);

  // 检查获胜
  const winningPieces = checkWin(x, y);
  if (winningPieces) {
    gameOver = true;
    highlightWinningPieces(winningPieces);
    messageElement.textContent = `${currentPlayer === BLACK ? '黑棋' : '白棋'} 获胜！`;
    return;
  }

  // 检查平局
  if (checkDraw()) {
    gameOver = true;
    messageElement.textContent = '平局！';
    return;
  }

  // 切换玩家
  currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
  updatePlayerDisplay();
}

/**
 * 在指定位置渲染棋子
 * @param {number} x - 横坐标
 * @param {number} y - 纵坐标
 * @param {number} player - 玩家（黑棋或白棋）
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
  playerElement.textContent = currentPlayer === BLACK ? '黑棋' : '白棋';
}

/**
 * 检查获胜
 * @param {number} x - 最后落子的横坐标
 * @param {number} y - 最后落子的纵坐标
 * @returns {Array|null} 获胜的棋子坐标数组，如果没有获胜则返回 null
 */
function checkWin(x, y) {
  const player = board[y][x];
  const directions = [
    [[0, 1], [0, -1]],   // 垂直
    [[1, 0], [-1, 0]],   // 水平
    [[1, 1], [-1, -1]],  // 对角线
    [[1, -1], [-1, 1]]   // 反对角线
  ];

  for (const [dir1, dir2] of directions) {
    const pieces = [[x, y]];

    // 沿两个方向搜索
    for (const [dx, dy] of [dir1, dir2]) {
      let nx = x + dx;
      let ny = y + dy;

      while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
        pieces.push([nx, ny]);
        nx += dx;
        ny += dy;
      }
    }

    // 如果有5个或以上连续棋子，则获胜
    if (pieces.length >= 5) {
      return pieces;
    }
  }

  return null;
}

/**
 * 检查平局
 * @returns {boolean} 是否平局
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
 * @param {Array} pieces - 获胜棋子的坐标数组
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

// 绑定重新开始按钮事件
restartButton.addEventListener('click', initGame);

// 初始化游戏
initGame();
