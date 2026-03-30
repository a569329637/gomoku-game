/**
 * 五子棋游戏核心逻辑
 * 支持 AI 对战模式
 * 支持暗黑模式主题切换
 * 支持移动端响应式布局
 */

// 棋盘配置
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// ==================== 主题管理器 ====================

/**
 * 主题管理器
 * 负责主题切换、保存偏好、跟随系统主题
 */
const ThemeManager = {
  // 存储键名
  STORAGE_KEY: 'gomoku_theme',

  // 当前主题
  currentTheme: 'light',

  // 系统主题媒体查询
  mediaQuery: null,

  /**
   * 初始化主题
   * 优先级：用户偏好 > 系统主题 > 默认亮色
   */
  init() {
    // 获取系统主题媒体查询
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 获取用户保存的主题偏好
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);

    if (savedTheme) {
      // 如果有用户偏好，使用用户偏好
      this.setTheme(savedTheme, false);
    } else {
      // 否则跟随系统主题
      this.setTheme(this.mediaQuery.matches ? 'dark' : 'light', false);
    }

    // 监听系统主题变化
    this.mediaQuery.addEventListener('change', (e) => {
      // 只有当用户没有设置偏好时才跟随系统
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light', false);
      }
    });

    // 绑定主题切换按钮事件
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
  },

  /**
   * 设置主题
   * @param {string} theme - 主题名称 ('light' 或 'dark')
   * @param {boolean} save - 是否保存到 localStorage
   */
  setTheme(theme, save = true) {
    this.currentTheme = theme;

    // 更新 HTML 属性
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // 保存用户偏好
    if (save) {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  },

  /**
   * 切换主题
   */
  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  },

  /**
   * 获取当前主题
   * @returns {string} 当前主题名称
   */
  getTheme() {
    return this.currentTheme;
  }
};

// ==================== 计时器管理器 ====================

/**
 * 计时器管理器
 * 支持总时间模式和每步时间模式
 */
const TimerManager = {
  // 计时模式: 'none' | 'total' | 'per-move'
  mode: 'none',

  // 总时间模式配置（毫秒）
  totalConfig: {
    '5min': 5 * 60 * 1000,
    '10min': 10 * 60 * 1000,
    '15min': 15 * 60 * 1000
  },

  // 每步时间配置（毫秒）
  perMoveConfig: {
    '30s': 30 * 1000,
    '60s': 60 * 1000,
    '90s': 90 * 1000
  },

  // 当前选择的时间配置
  selectedTime: '10min',

  // 玩家剩余时间（毫秒）
  blackTime: 0,
  whiteTime: 0,

  // 每步剩余时间
  perMoveTime: 0,

  // 计时器 ID
  timerId: null,

  // 是否运行中
  isRunning: false,

  // 游戏开始时间戳
  lastTickTime: 0,

  /**
   * 初始化计时器
   * @param {string} mode - 计时模式
   * @param {string} timeConfig - 时间配置
   */
  init(mode = 'none', timeConfig = '10min') {
    this.mode = mode;
    this.selectedTime = timeConfig;
    this.stop();
    this.reset();
    this.updateDisplay();
  },

  /**
   * 重置计时器
   */
  reset() {
    if (this.mode === 'total') {
      this.blackTime = this.totalConfig[this.selectedTime] || this.totalConfig['10min'];
      this.whiteTime = this.totalConfig[this.selectedTime] || this.totalConfig['10min'];
    } else if (this.mode === 'per-move') {
      this.perMoveTime = this.perMoveConfig[this.selectedTime] || this.perMoveConfig['30s'];
    }
    this.updateDisplay();
  },

  /**
   * 开始计时
   * @param {number} player - 当前玩家
   */
  start(player) {
    if (this.mode === 'none' || this.isRunning) return;

    this.isRunning = true;
    this.lastTickTime = Date.now();

    if (this.mode === 'per-move') {
      // 每步模式：重置每步时间
      this.perMoveTime = this.perMoveConfig[this.selectedTime] || this.perMoveConfig['30s'];
    }

    this.timerId = setInterval(() => this.tick(player), 100);
  },

  /**
   * 停止计时
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  },

  /**
   * 计时
   * @param {number} player - 当前玩家
   */
  tick(player) {
    const now = Date.now();
    const elapsed = now - this.lastTickTime;
    this.lastTickTime = now;

    if (this.mode === 'total') {
      // 总时间模式
      if (player === BLACK) {
        this.blackTime = Math.max(0, this.blackTime - elapsed);
      } else {
        this.whiteTime = Math.max(0, this.whiteTime - elapsed);
      }

      // 检查超时
      if (this.blackTime <= 0 || this.whiteTime <= 0) {
        this.handleTimeout(this.blackTime <= 0 ? BLACK : WHITE);
      }
    } else if (this.mode === 'per-move') {
      // 每步时间模式
      this.perMoveTime = Math.max(0, this.perMoveTime - elapsed);

      if (this.perMoveTime <= 0) {
        this.handleTimeout(player);
      }
    }

    this.updateDisplay();
  },

  /**
   * 切换玩家
   * @param {number} newPlayer - 新的当前玩家
   */
  switchPlayer(newPlayer) {
    if (this.mode === 'none') return;

    this.stop();

    if (this.mode === 'per-move') {
      // 每步模式：重置每步时间
      this.perMoveTime = this.perMoveConfig[this.selectedTime] || this.perMoveConfig['30s'];
    }

    this.start(newPlayer);
  },

  /**
   * 处理超时
   * @param {number} timeoutPlayer - 超时的玩家
   */
  handleTimeout(timeoutPlayer) {
    this.stop();

    // 触发超时事件
    if (this.onTimeout) {
      this.onTimeout(timeoutPlayer);
    }
  },

  /**
   * 超时回调函数
   */
  onTimeout: null,

  /**
   * 格式化时间显示
   * @param {number} ms - 毫秒数
   * @returns {string} 格式化的时间字符串
   */
  formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * 更新界面显示
   */
  updateDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay || this.mode === 'none') {
      if (timerDisplay) timerDisplay.classList.add('hidden');
      return;
    }

    timerDisplay.classList.remove('hidden');

    if (this.mode === 'total') {
      timerDisplay.innerHTML = `
        <div class="timer-player ${currentPlayer === BLACK ? 'active' : ''}">
          <span class="timer-label">黑棋</span>
          <span class="timer-time ${this.blackTime < 30000 ? 'warning' : ''}">${this.formatTime(this.blackTime)}</span>
        </div>
        <div class="timer-vs">VS</div>
        <div class="timer-player ${currentPlayer === WHITE ? 'active' : ''}">
          <span class="timer-label">白棋</span>
          <span class="timer-time ${this.whiteTime < 30000 ? 'warning' : ''}">${this.formatTime(this.whiteTime)}</span>
        </div>
      `;
    } else if (this.mode === 'per-move') {
      timerDisplay.innerHTML = `
        <div class="timer-per-move">
          <span class="timer-label">剩余时间</span>
          <span class="timer-time ${this.perMoveTime < 10000 ? 'warning' : ''}">${this.formatTime(this.perMoveTime)}</span>
        </div>
      `;
    }
  },

  /**
   * 获取当前计时模式
   * @returns {string} 计时模式
   */
  getMode() {
    return this.mode;
  }
};

// ==================== 统计管理器 ====================

/**
 * 统计管理器
 * 记录游戏统计数据（胜场、平局、总对局数）
 */
const StatsManager = {
  // 存储键名
  STORAGE_KEY: 'gomoku_stats',

  // 统计数据
  stats: {
    blackWins: 0,
    whiteWins: 0,
    draws: 0,
    totalGames: 0
  },

  /**
   * 初始化统计数据
   */
  init() {
    this.load();
    this.updateDisplay();
  },

  /**
   * 从 localStorage 加载统计数据
   */
  load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.stats = JSON.parse(data);
      }
    } catch (e) {
      console.error('加载统计数据失败:', e);
    }
  },

  /**
   * 保存统计数据到 localStorage
   */
  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.error('保存统计数据失败:', e);
    }
  },

  /**
   * 记录胜利
   * @param {number} winner - 获胜方 (BLACK 或 WHITE)
   */
  recordWin(winner) {
    if (winner === BLACK) {
      this.stats.blackWins++;
    } else {
      this.stats.whiteWins++;
    }
    this.stats.totalGames++;
    this.save();
    this.updateDisplay();
  },

  /**
   * 记录平局
   */
  recordDraw() {
    this.stats.draws++;
    this.stats.totalGames++;
    this.save();
    this.updateDisplay();
  },

  /**
   * 重置统计数据
   */
  reset() {
    this.stats = {
      blackWins: 0,
      whiteWins: 0,
      draws: 0,
      totalGames: 0
    };
    this.save();
    this.updateDisplay();
  },

  /**
   * 获取统计数据
   * @returns {Object} 统计数据对象
   */
  getStats() {
    return { ...this.stats };
  },

  /**
   * 更新界面显示
   */
  updateDisplay() {
    // 更新模式选择界面的统计显示
    const statsDisplay = document.getElementById('stats-display');
    if (statsDisplay) {
      statsDisplay.innerHTML = `
        <div class="stats-item">
          <span class="stats-label">黑棋胜</span>
          <span class="stats-value">${this.stats.blackWins}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">白棋胜</span>
          <span class="stats-value">${this.stats.whiteWins}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">平局</span>
          <span class="stats-value">${this.stats.draws}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">总对局</span>
          <span class="stats-value">${this.stats.totalGames}</span>
        </div>
      `;
    }

    // 更新游戏界面的统计显示
    const gameStats = document.getElementById('game-stats');
    if (gameStats) {
      gameStats.innerHTML = `
        <span class="game-stats-item">黑${this.stats.blackWins} : 白${this.stats.whiteWins}</span>
      `;
    }
  }
};

// ==================== 音效管理器 ====================

/**
 * 音效管理器
 */
const SoundManager = {
  audioContext: null,
  enabled: true,

  /**
   * 初始化 AudioContext
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 确保 AudioContext 处于运行状态
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },

  /**
   * 播放单个音调
   * @param {number} frequency - 频率 (Hz)
   * @param {number} duration - 持续时间 (秒)
   * @param {string} type - 波形类型
   * @param {number} volume - 音量 (0-1)
   */
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  },

  /**
   * 播放落子音效 (800Hz 正弦波)
   */
  playMove() {
    this.playTone(800, 0.08, 'sine', 0.2);
  },

  /**
   * 播放获胜音效 (上升三音阶旋律 C5-E5-G5)
   */
  playWin() {
    if (!this.enabled || !this.audioContext) return;

    // C5 = 523.25Hz, E5 = 659.25Hz, G5 = 783.99Hz
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.3);
      }, index * 150);
    });
  },

  /**
   * 播放平局音效 (下降双音)
   */
  playDraw() {
    if (!this.enabled || !this.audioContext) return;

    // 下降双音: 400Hz -> 350Hz
    this.playTone(400, 0.2, 'sine', 0.25);
    setTimeout(() => {
      this.playTone(350, 0.3, 'sine', 0.2);
    }, 150);
  },

  /**
   * 切换音效开关
   * @returns {boolean} 当前音效状态
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

// 棋盘尺寸配置
const CELL_SIZE_CONFIG = {
  min: 22,   // 最小格子尺寸（像素）
  max: 40,   // 最大格子尺寸（像素）
  default: 40 // 默认格子尺寸
};

// 存档相关常量
const SAVE_KEY = 'gomoku_save';

// 游戏状态
let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let gameMode = 'pvp'; // 'pvp' 或 'pve'
let difficulty = 'medium'; // 'easy', 'medium', 'hard'
let aiPlayer = WHITE; // AI 执白棋
let moveHistory = []; // 落子历史记录
let timerMode = 'none'; // 'none', 'total', 'per-move'
let timerConfig = '10min'; // 默认时间配置

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
const restorePrompt = document.getElementById('restore-prompt');
const soundToggleBtn = document.getElementById('sound-toggle');

// ==================== 存档相关函数 ====================

/**
 * 保存游戏进度到 localStorage
 */
function saveGame() {
  try {
    const saveData = {
      board: JSON.parse(JSON.stringify(board)), // 深拷贝
      currentPlayer,
      gameOver,
      gameMode,
      difficulty,
      moveHistory: JSON.parse(JSON.stringify(moveHistory)), // 深拷贝
      timestamp: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error('保存游戏失败:', e);
  }
}

/**
 * 从 localStorage 加载游戏进度
 * @returns {Object|null} 存档数据或 null
 */
function loadGame() {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error('加载游戏失败:', e);
    return null;
  }
}

/**
 * 清除存档
 */
function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error('清除存档失败:', e);
  }
}

/**
 * 检查是否有有效的存档
 * @returns {boolean} 是否有有效存档
 */
function hasValidSave() {
  const saveData = loadGame();
  if (!saveData) return false;
  // 检查游戏是否未结束且有落子记录
  return !saveData.gameOver && saveData.moveHistory && saveData.moveHistory.length > 0;
}

/**
 * 显示恢复游戏提示
 */
function showRestorePrompt() {
  restorePrompt.classList.remove('hidden');
}

/**
 * 隐藏恢复游戏提示
 */
function hideRestorePrompt() {
  restorePrompt.classList.add('hidden');
}

/**
 * 恢复游戏
 */
async function restoreGame() {
  const saveData = loadGame();
  if (!saveData) {
    showModeSelection();
    return;
  }

  // 恢复游戏状态
  board = saveData.board;
  currentPlayer = saveData.currentPlayer;
  gameOver = saveData.gameOver;
  gameMode = saveData.gameMode;
  difficulty = saveData.difficulty;
  moveHistory = saveData.moveHistory;

  // 隐藏恢复提示，显示游戏界面
  hideRestorePrompt();
  showGameArea();

  // 渲染棋盘
  renderBoard();

  // 更新显示
  updatePlayerDisplay();

  // 人机模式下，如果轮到 AI 则自动触发 AI 走棋
  if (gameMode === 'pve' && currentPlayer === aiPlayer && !gameOver) {
    await aiMove();
  }
}

/**
 * 放弃存档，开始新游戏
 */
function discardSave() {
  clearSave();
  hideRestorePrompt();
  showModeSelection();
}

/**
 * 渲染整个棋盘（用于恢复游戏时）
 */
function renderBoard() {
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

      // 如果有棋子，渲染棋子
      if (board[y][x] !== EMPTY) {
        const piece = document.createElement('div');
        piece.className = `piece ${board[y][x] === BLACK ? 'black' : 'white'}`;
        cell.appendChild(piece);
      }

      cell.addEventListener('click', () => handleCellClick(x, y));
      boardElement.appendChild(cell);
    }
  }
}

// ==================== 游戏核心逻辑 ====================

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
  // 初始化音效系统
  SoundManager.init();

  // 清除存档（开始新游戏时）
  clearSave();

  board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
  currentPlayer = BLACK;
  gameOver = false;
  moveHistory = []; // 清空历史记录
  messageElement.textContent = '';
  aiThinkingElement.classList.add('hidden');

  // 初始化计时器
  const timeConfig = timerMode === 'per-move' ?
    document.getElementById('per-move-select')?.value || '30s' :
    document.getElementById('time-select')?.value || '10min';
  TimerManager.init(timerMode, timeConfig);
  TimerManager.onTimeout = handleTimeout;

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
  updateSoundButton();

  // 开始计时
  if (timerMode !== 'none') {
    TimerManager.start(currentPlayer);
  }
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
  // 记录落子历史
  moveHistory.push({ x, y, player: currentPlayer });
  renderPiece(x, y, currentPlayer);

  // 播放落子音效
  SoundManager.playMove();

  const winningPieces = checkWin(x, y);
  if (winningPieces) {
    gameOver = true;
    // 停止计时器
    TimerManager.stop();
    highlightWinningPieces(winningPieces);
    const winner = currentPlayer === BLACK ? '黑棋' : '白棋';
    messageElement.textContent = gameMode === 'pve' && currentPlayer === aiPlayer
      ? 'AI 获胜！'
      : `${winner} 获胜！`;
    // 游戏结束时清除存档
    clearSave();
    // 记录统计数据
    StatsManager.recordWin(currentPlayer);
    // 播放获胜音效
    SoundManager.playWin();
    return;
  }

  if (checkDraw()) {
    gameOver = true;
    // 停止计时器
    TimerManager.stop();
    messageElement.textContent = '平局！';
    // 游戏结束时清除存档
    clearSave();
    // 记录统计数据
    StatsManager.recordDraw();
    // 播放平局音效
    SoundManager.playDraw();
    return;
  }

  // 每次落子后保存游戏进度
  saveGame();

  currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
  updatePlayerDisplay();

  // 切换计时器
  TimerManager.switchPlayer(currentPlayer);

  // 人机模式下，AI 执行下一步
  if (gameMode === 'pve' && currentPlayer === aiPlayer && !gameOver) {
    await aiMove();
  }
}

/**
 * 处理超时
 * @param {number} timeoutPlayer - 超时的玩家
 */
function handleTimeout(timeoutPlayer) {
  gameOver = true;
  clearSave();

  const winner = timeoutPlayer === BLACK ? WHITE : BLACK;
  const winnerName = winner === BLACK ? '黑棋' : '白棋';
  const loserName = timeoutPlayer === BLACK ? '黑棋' : '白棋';

  messageElement.textContent = `${loserName} 超时，${winnerName} 获胜！`;
  StatsManager.recordWin(winner);
  SoundManager.playWin();
}

/**
 * AI 执行落子
 */
async function aiMove() {
  aiThinkingElement.classList.remove('hidden');

  // AI 思考时暂停玩家计时（总时间模式下）
  // 注意：每步时间模式下不需要暂停，因为 AI 也要计算时间

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
 * 更新音效按钮显示
 */
function updateSoundButton() {
  if (soundToggleBtn) {
    soundToggleBtn.textContent = SoundManager.enabled ? '🔊' : '🔇';
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
  // 停止计时器
  TimerManager.stop();
  gameArea.classList.add('hidden');
  modeSelection.classList.remove('hidden');
  difficultySelection.classList.add('hidden');
}

/**
 * 悔棋功能
 * 人机模式下撤销玩家和 AI 的落子，双人模式下只撤销一步
 */
function undoMove() {
  // 检查是否可以悔棋
  if (moveHistory.length === 0 || gameOver) {
    return;
  }

  // 人机模式：撤销两步（玩家和 AI 各一步）
  if (gameMode === 'pve') {
    // 如果最后一步是 AI 下的，需要撤销两步
    if (moveHistory.length >= 2) {
      // 撤销 AI 的落子
      undoLastMove();
      // 撤销玩家的落子
      undoLastMove();
    } else if (moveHistory.length === 1) {
      // 只有一步（玩家下的），撤销这一步
      undoLastMove();
    }
  } else {
    // 双人模式：只撤销一步
    undoLastMove();
  }

  // 清除消息
  messageElement.textContent = '';
}

/**
 * 撤销最后一步落子
 */
function undoLastMove() {
  if (moveHistory.length === 0) return;

  const lastMove = moveHistory.pop();

  // 清除棋盘数据
  board[lastMove.y][lastMove.x] = EMPTY;

  // 移除 DOM 中的棋子
  const cell = boardElement.querySelector(`[data-x="${lastMove.x}"][data-y="${lastMove.y}"]`);
  const piece = cell.querySelector('.piece');
  if (piece) {
    piece.remove();
  }

  // 恢复当前玩家
  currentPlayer = lastMove.player;
}

// ==================== 事件绑定 ====================

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


// 悔棋按钮事件
document.getElementById('undo').addEventListener('click', undoMove);

// 恢复游戏相关事件
document.getElementById('restore-btn').addEventListener('click', restoreGame);
document.getElementById('new-game-btn').addEventListener('click', discardSave);

// 音效开关按钮事件
if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', () => {
    SoundManager.toggle();
    updateSoundButton();
  });
}

// 重置统计按钮事件
const resetStatsBtn = document.getElementById('reset-stats');
if (resetStatsBtn) {
  resetStatsBtn.addEventListener('click', () => {
    if (confirm('确定要重置所有统计数据吗？')) {
      StatsManager.reset();
    }
  });
}

// 计时模式选择事件
document.querySelectorAll('.timer-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // 更新按钮状态
    document.querySelectorAll('.timer-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    timerMode = btn.dataset.timer;

    // 显示/隐藏时间配置
    const timeConfig = document.getElementById('time-config');
    const perMoveConfig = document.getElementById('per-move-config');

    if (timerMode === 'total') {
      timeConfig?.classList.remove('hidden');
      perMoveConfig?.classList.add('hidden');
    } else if (timerMode === 'per-move') {
      timeConfig?.classList.add('hidden');
      perMoveConfig?.classList.remove('hidden');
    } else {
      timeConfig?.classList.add('hidden');
      perMoveConfig?.classList.add('hidden');
    }
  });
});

// ==================== 初始化 ====================

// 初始化主题管理器
ThemeManager.init();

// 初始化统计管理器
StatsManager.init();

// 初始化：检查是否有存档
if (hasValidSave()) {
  showRestorePrompt();
} else {
  showModeSelection();
}

// ==================== 移动端响应式布局 ====================

/**
 * 计算并设置棋盘格子尺寸
 * 根据屏幕宽度动态调整，确保棋盘完整显示
 */
function calculateCellSize() {
  // 获取可用宽度（减去容器内边距）
  const containerPadding = 40; // 容器两侧内边距
  const boardPadding = 20; // 棋盘内边距
  const availableWidth = window.innerWidth - containerPadding - boardPadding;

  // 计算格子尺寸（15个格子）
  let cellSize = Math.floor(availableWidth / BOARD_SIZE);

  // 限制在最小和最大尺寸范围内
  cellSize = Math.max(CELL_SIZE_CONFIG.min, Math.min(CELL_SIZE_CONFIG.max, cellSize));

  // 计算棋子尺寸（比格子小一点）
  const pieceSize = Math.floor(cellSize * 0.85);

  // 设置 CSS 变量
  document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
  document.documentElement.style.setProperty('--piece-size', `${pieceSize}px`);
  document.documentElement.style.setProperty('--board-padding', `${Math.floor(cellSize * 0.25)}px`);
}

/**
 * 初始化响应式布局
 */
function initResponsiveLayout() {
  // 首次计算尺寸
  calculateCellSize();

  // 监听窗口大小变化
  let resizeTimeout;
  window.addEventListener('resize', () => {
    // 防抖处理
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(calculateCellSize, 100);
  });

  // 监听屏幕方向变化
  window.addEventListener('orientationchange', () => {
    // 方向变化后延迟计算，确保浏览器完成重绘
    setTimeout(calculateCellSize, 200);
  });
}

/**
 * 优化触摸事件
 * 防止双击缩放和长按弹出菜单
 */
function initTouchOptimizations() {
  // 阻止双击缩放
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // 阻止长按弹出菜单
  boardElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 优化触摸滚动
  document.body.addEventListener('touchmove', (e) => {
    // 允许正常滚动，但防止过度滚动
    if (e.target.closest('.board')) {
      e.preventDefault();
    }
  }, { passive: false });
}

// 初始化响应式布局和触摸优化
initResponsiveLayout();
initTouchOptimizations();
