# 处世悬镜 PWA

> 南北朝傅昭《处世悬镜》108 句 memento PWA  
> 整理：河马 🦛

**线上版本**：[https://chushi-jing.pages.dev/](https://chushi-jing.pages.dev/)  
**GitHub**：[github.com/kumabarloc/chushi-jing](https://github.com/kumabarloc/chushi-jing)  
**更新日志**：[CHANGELOG.md](./CHANGELOG.md)

---

## ✨ 最新版 v0.4 — 动效全面升级（2026-07-22）

按 Apple / Emil Kowalski 设计原则重做动效，让 PWA 触感接近原生 app：

- **WAAPI crossfade + blur bridge 换句**（出场 180ms + 入场 380ms，可中断）
- **Hold-to-confirm 长按进度**（印泥红线从左铺到右，500ms 触发复制）
- **Pointer Events 统一输入**（替代 touch/mouse 双套监听）
- **scale(0.97) 按压反馈 + 强 ease-out**
- **抽屉 iOS 曲线**（`cubic-bezier(0.32, 0.72, 0, 1)`）
- **`prefers-reduced-motion` 完整降级**（无障碍到位）
- **`touch-action: manipulation`**（干掉 300ms tap delay）

> 详见 [CHANGELOG.md](./CHANGELOG.md) · 设计参考：`~/.openclaw/workspace/tools/emil-design/`

---

## 📦 文件结构

```
chushi-pwa/
├── index.html          # 主页面（单页）
├── style.css           # 古典纸感样式 + Apple-style 动效
├── app.js              # 随机换句 + Pointer Events + WAAPI crossfade
├── data.js             # 108 句 JSON 数据
├── manifest.json       # PWA 配置（"添加到主屏幕"）
├── sw.js               # Service Worker（network-first 核心资源）
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
├── CHANGELOG.md        # 完整版本历史
└── README.md
```

**总大小 ~66KB**（数据 13KB + 样式 17KB + JS 17KB + HTML 4KB + 图标 33KB + sw 2KB）

---

## 🚀 本地预览

```bash
cd chushi-pwa
python3 -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/
```

> ⚠️ **不要直接双击 index.html**——Service Worker 需要 HTTP/HTTPS 协议才能注册。

---

## ✨ 功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 随机展示 108 句 | ✅ | 避免连续两句相同 |
| 点击/轻触换句 | ✅ v0.4 | `pointerdown` 即时反馈 + WAAPI crossfade |
| 长按复制（含出处）| ✅ v0.4 | 印泥红线进度 + `setPointerCapture` + 12px 拖动取消 |
| 关于弹窗 | ✅ | 显示作者 + 来源 + 整理者 |
| 计数器（n/108）| ✅ | 顶部右侧 |
| 离线可用（PWA）| ✅ | Service Worker 缓存 |
| 添加到主屏幕 | ✅ | manifest.json + icons |
| 键盘控制 | ✅ | 空格/回车换句 |
| iOS 安全区适配 | ✅ | env(safe-area-inset-*) |
| 核心资源 network-first | ✅ v0.6 | 普通刷新即生效，无需 Ctrl+Shift+R |
| **reduced-motion 降级** | ✅ v0.4 | `@media (prefers-reduced-motion: reduce)` |
| **Pointer Events 统一** | ✅ v0.4 | 移动 / 桌面 / 触屏一套搞定 |
| 章节筛选 | ❌ | v0.5 |
| 暗色/深色模式 | ❌ | v0.5 |
| 收藏功能 | ❌ | v2 |
| 分享为图片 | ❌ | v2 |
| 推送通知 | ❌ | iOS PWA 限制 |

---

## 🎨 设计要点

- **古典纸感**：米黄底 (`#F4E8D0`) + 宣纸纹理 (CSS gradient + 噪点)
- **字体栈**：思源宋体 → 华文楷体 → 系统中文字体 → serif
- **印章**：红色方块 (`#B23A2A`) + "镜"字（华文楷体）+ 内白边
- **动效**（v0.4 重做）：
  - 换句：WAAPI crossfade + blur bridge（180ms 出场 / 380ms 入场）
  - 按压：`scale(0.97)` + `cubic-bezier(0.23, 1, 0.32, 1)`（120ms）
  - 抽屉：`cubic-bezier(0.32, 0.72, 0, 1)`（350ms，iOS 曲线）
  - 长按进度：`clip-path: inset()` 500ms linear 铺满
- **响应式**：手机 22px / 平板 30px / 横屏自动收拢
- **tap delay**：`touch-action: manipulation`（v0.4 起，替代之前的 300ms hack）

---

## 📜 数据来源

- 简体原文：古文岛（古诗文网）
- 繁体原文：维基文库 2026-06-30 导出
- **v0.3 起：仅保留原文**，删除全部解读（用户决定）

---

## 📝 版本历史

完整记录见 **[CHANGELOG.md](./CHANGELOG.md)**，摘要：

| 版本 | 日期 | 关键变化 |
|------|------|---------|
| **v0.4** | 2026-07-22 | 动效全面升级（Apple/Emil 原则）+ reduced-motion + Pointer Events |
| v0.3 | 2026-07-01 | 译文全面重写，删除解读，data.js 33KB→16KB |
| v0.5–v0.6 | 2026-06-30 ~ 07-03 | 章节阅读模式 + SW network-first + 修复 Chrome 硬刷新 |

---

## 🛠 更新代码流程

```bash
cd chushi-pwa
# 1. 改完代码
# 2. 同步更新 sw.js 里的 VERSION（v0.4 → v0.5）
# 3. 提交推送:
git add -A && git commit -m "..." && git push
# Cloudflare Pages 自动重新部署, 1-3 分钟生效
# 4. 用户普通刷新即可看到新版本（核心资源走 network-first）
# 5. SW 激活时清掉旧缓存（VERSION 改了）
```

> ⚠️ **千万别忘了 bump sw.js 的 `VERSION`**——否则用户看到的是旧缓存。

---

## 🌐 部署

✅ 已部署到 Cloudflare Pages（GitHub 自动集成）
- URL: https://chushi-jing.pages.dev/
- 仓库: github.com/kumabarloc/chushi-jing
- 部署链路：GitHub main → Cloudflare Pages 自动 build → CDN