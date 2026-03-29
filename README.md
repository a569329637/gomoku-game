# 五子棋游戏

一个基于 Web 的五子棋小游戏，使用原生 JavaScript 开发。

## 功能特性

- 15×15 标准棋盘
- 黑棋先行，双人对弈
- 自动判断胜负和平局
- 获胜棋子高亮动画
- 棋盘带有星位点

## 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- Vite 构建工具

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 开始游戏

### 构建生产版本

```bash
npm run build
```

## 游戏规则

1. 黑棋先行，双方轮流落子
2. 先在横、竖、斜任意方向连成五子者获胜
3. 棋盘下满则为平局

## 项目结构

```
gomoku-game/
├── index.html      # 入口页面
├── main.js         # 游戏核心逻辑
├── style.css       # 样式文件
├── vite.config.js  # Vite 配置
└── package.json    # 项目配置
```

## License

MIT
