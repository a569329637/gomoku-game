# 暗黑模式实现计划

## 目标
为五子棋游戏添加暗黑模式主题切换功能，包括：
1. 使用 CSS 变量实现主题切换
2. 记住用户的主题偏好（localStorage）
3. 自动跟随系统主题设置

## 实现步骤

### 第一步：定义 CSS 变量
在 `style.css` 中添加 CSS 变量，分别定义亮色和暗色主题：
- 背景颜色（渐变背景）
- 文字颜色
- 卡片背景
- 按钮颜色
- 棋盘颜色
- 边框颜色

### 第二步：添加主题切换按钮
在 `index.html` 中添加主题切换按钮，放在标题旁边或右上角

### 第三步：实现主题切换逻辑
在 `main.js` 中添加：
- ThemeManager 模块管理主题状态
- 监听系统主题变化
- 保存/读取用户偏好到 localStorage
- 切换主题功能

### 第四步：美化暗黑模式 UI
确保暗黑模式下：
- 背景使用深色渐变
- 文字使用浅色
- 卡片使用深色背景
- 按钮使用适配的颜色
- 棋盘保持木质感但稍暗

## CSS 变量设计

### 亮色主题（默认）
```css
:root {
  --bg-gradient-start: #667eea;
  --bg-gradient-end: #764ba2;
  --text-primary: #333;
  --text-secondary: #555;
  --text-muted: #666;
  --card-bg: rgba(255, 255, 255, 0.95);
  --card-shadow: rgba(0, 0, 0, 0.3);
  --board-bg: #dcb35c;
  --board-line: #8b7355;
  --border-color: #eee;
  --btn-primary: #4CAF50;
  --btn-primary-hover: #45a049;
  --btn-secondary: #2196F3;
  --btn-secondary-hover: #1976D2;
  --btn-warning: #ff9800;
  --btn-warning-hover: #e68a00;
  --message-text: #fff;
}
```

### 暗色主题
```css
[data-theme="dark"] {
  --bg-gradient-start: #1a1a2e;
  --bg-gradient-end: #16213e;
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --text-muted: #888;
  --card-bg: rgba(30, 30, 50, 0.95);
  --card-shadow: rgba(0, 0, 0, 0.5);
  --board-bg: #b8964a;
  --board-line: #6b5344;
  --border-color: #333;
  --btn-primary: #66BB6A;
  --btn-primary-hover: #81C784;
  --btn-secondary: #42A5F5;
  --btn-secondary-hover: #64B5F6;
  --btn-warning: #FFA726;
  --btn-warning-hover: #FFB74D;
  --message-text: #e0e0e0;
}
```

## 代码修改清单

### index.html
1. 在 `<h1>五子棋</h1>` 旁添加主题切换按钮
2. 添加 `theme-toggle` 按钮样式

### style.css
1. 在文件开头定义 CSS 变量
2. 替换所有硬编码颜色为 CSS 变量
3. 添加主题切换按钮样式
4. 添加过渡动画效果

### main.js
1. 添加 ThemeManager 模块
2. 初始化时检查系统主题和用户偏好
3. 绑定主题切换按钮事件

## 测试要点
- [ ] 点击切换按钮可正常切换主题
- [ ] 刷新页面后主题保持
- [ ] 跟随系统主题变化
- [ ] 所有 UI 元素在暗黑模式下可见且美观
