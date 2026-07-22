# 更新日志

> 处世悬镜 PWA 的版本演进。所有改动记录在此。

---

## v0.4 — 2026-07-22 — 动效全面升级

按 Apple / Emil Kowalski 设计原则重做动效，让 PWA 触感接近原生 app。

### ✨ 新增

- **WAAPI crossfade + blur bridge 换句** — 出场 180ms 上飘 + blur 4px 桥接，换内容，入场 380ms 强 ease-out 落定。比 v0.3 的 `setTimeout(250)` 有真实空间感，且可中断
- **Hold-to-confirm 长按进度** — 卡片底部 3px 印泥红线从左铺到右，500ms 触发复制。中途松手/拖动 snap back
- **Pointer Events 统一输入** — 替代 touchstart/end + mousedown/up 双套监听，移动/桌面/触屏一体
- **`prefers-reduced-motion` 支持** — 系统开了"减少动效"时自动降级为纯 opacity 切换，无 transform 无 blur
- **`touch-action: manipulation`** — 干掉 300ms tap delay（替代之前的 lastTouchEnd hack）

### 🔧 改进

- **按压反馈** — `scale(0.99)` → `scale(0.97)`，时长 `0.1s ease` → `120ms cubic-bezier(0.23, 1, 0.32, 1)`（Emil 推荐值）
- **抽屉开合** — `0.3s ease` → `350ms cubic-bezier(0.32, 0.72, 0, 1)`（Ionic 同款 iOS 曲线）
- **按钮反馈** — `.tool-btn` 也加 `scale(0.94)`，明确 transition 属性（避免 `transition: all`）
- **拖动取消长按** — 手指移动 >12px 自动取消，progress snap back（v0.3 是 mouseleave 取消）
- **iOS 双击放大防护** — 300ms touchend hack 移除，改用 CSS `touch-action: manipulation`

### 🐛 修复

- **换句期间被锁死** — v0.3 用 `isAnimating` flag 防止重叠触发，但快速点击会被吃掉；v0.4 用 WAAPI `cancel()` 中断
- **CSS `transition: all`** — 改为明确属性，避免不必要的样式重算

### 📊 数据

- `app.js`: 472 → 524 行 (+52)
- `style.css`: 655 → 790 行 (+135)
- `index.html`: 111 → 113 行 (+2)
- 总大小变化：~+8KB（gzip 后）

### 🎯 设计原则

参考：
- [Apple — Designing Fluid Interfaces (WWDC 2018)](https://developer.apple.com/videos/play/wwdc2018/803/)
- [Emil Kowalski — animations.dev](https://animations.dev/)
- 本地副本：`~/.openclaw/workspace/tools/emil-design/`

核心心法（Emil 原话）：
> "An interface feels alive when motion starts from the current on-screen value, inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant."

---

## v0.6 — 2026-07-01 — 译文重构

- 删除 67 句冗余解读（原文已直白）
- 重写 41 句简译，平均 10.2 字（sohu 原版 80-100 字，缩短 87%）
- `data.js`: 33KB → 16KB (-50%)
- 跨句污染扫描: 0 条
- 修复 SW 缓存策略

## v0.5 — 2026-06-30 — 章节阅读模式

- 左侧抽屉显示 9 章列表
- 整章列表一次性渲染，可滚动
- 点句复制 / 章节模式隐藏原卡片
- 去掉"本章已毕"标记（太多余）

## v0.3 — 2026-06-30 — 古典纸感

- 米黄底 `#F4E8D0` + 思源宋体 + 红色印章"镜"
- 点击/轻触换句 + 长按 500ms 复制 + 空格/回车（键盘）
- Service Worker 离线可用
- 部署链路：GitHub → Cloudflare Pages

---

*GitHub: https://github.com/kumabarloc/chushi-jing*
*线上版本: https://chushi-jing.pages.dev/*