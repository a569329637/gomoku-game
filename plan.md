# 悔棋功能实现计划

## 需求来源
GitHub Issue #2: 添加悔棋功能

## 功能描述
允许玩家撤销上一步操作，支持多次悔棋。

## 实现步骤

### 1. 数据结构设计
- 添加 `moveHistory` 数组，存储每一步落子的历史记录
- 每条记录包含: `{ x, y, player }`

### 2. 修改核心逻辑 (main.js)

#### 2.1 新增状态变量
```javascript
let moveHistory = [];  // 落子历史记录
```

#### 2.2 修改 initGame 函数
- 初始化时清空历史记录: `moveHistory = []`

#### 2.3 修改 makeMove 函数
- 落子后将记录添加到历史: `moveHistory.push({ x, y, player: currentPlayer })`

#### 2.4 新增 undoMove 函数
```javascript
function undoMove() {
  // 检查是否可以悔棋
  if (moveHistory.length === 0 || gameOver) return;

  // 获取最后一步
  const lastMove = moveHistory.pop();

  // 清除棋盘上的棋子
  board[lastMove.y][lastMove.x] = EMPTY;

  // 移除 DOM 中的棋子
  const cell = boardElement.querySelector(`[data-x="${lastMove.x}"][data-y="${lastMove.y}"]`);
  const piece = cell.querySelector('.piece');
  if (piece) piece.remove();

  // 恢复当前玩家
  currentPlayer = lastMove.player;

  // 更新显示
  updatePlayerDisplay();
  messageElement.textContent = '';
}
```

#### 2.5 人机模式特殊处理
- 人机模式下悔棋需要撤销两步（玩家和 AI 各一步）
- 或者只撤销玩家的步骤，让 AI 重新下

### 3. 修改页面结构 (index.html)
- 在游戏信息区域添加「悔棋」按钮
```html
<button id="undo" class="btn btn-warning">悔棋</button>
```

### 4. 添加样式 (style.css)
```css
.btn-warning {
  background: #ff9800;
}
.btn-warning:hover {
  background: #e68a00;
}
.btn-warning:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

### 5. 绑定事件
```javascript
document.getElementById('undo').addEventListener('click', undoMove);
```

## 测试要点
1. 双人模式下可以悔棋
2. 人机模式下可以悔棋（撤销玩家和 AI 的落子）
3. 游戏结束后不能悔棋
4. 空棋盘时悔棋按钮无效
5. 可以连续悔棋多次
