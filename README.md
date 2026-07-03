# 处世悬镜 PWA

> 南北朝傅昭《处世悬镜》108 句 memento PWA  
> 整理：河马 🦛，2026-07-03  
> **线上版本**: https://chushi-jing.pages.dev/  
> **GitHub**: https://github.com/kumabarloc/chushi-jing

## 📦 文件结构

```
chushi-pwa/
├── index.html          # 主页面（单页）
├── style.css           # 古典纸感样式
├── app.js              # 随机换句 + 长按复制 + Service Worker 注册
├── data.js             # 108 句 JSON 数据
├── manifest.json       # PWA 配置（"添加到主屏幕"）
├── sw.js               # Service Worker（network-first 核心资源 + cache-first 图标）
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
└── README.md
```

**总大小 ~58KB**（数据 13KB + 样式 15KB + JS 14KB + HTML 4KB + 图标 33KB + sw 2KB）

## 🚀 本地预览

```bash
cd chushi-pwa
python3 -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/
```

> ⚠️ **不要直接双击 index.html**——Service Worker 需要 HTTP/HTTPS 协议才能注册。

## ✨ 功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 随机展示 108 句 | ✅ | 避免连续两句相同 |
| 点击/轻触换句 | ✅ | |
| 长按复制（含出处）| ✅ | 500ms 长按触发 |
| 关于弹窗 | ✅ | 显示作者 + 来源 + 整理者 |
| 计数器（n/108）| ✅ | 顶部右侧 |
| 离线可用（PWA）| ✅ | Service Worker 缓存 |
| 添加到主屏幕 | ✅ | manifest.json + icons |
| 键盘控制 | ✅ | 空格/回车换句 |
| iOS 安全区适配 | ✅ | env(safe-area-inset-*) |
| **核心资源 network-first** | ✅ v0.6 | 改完代码后普通刷新即生效，无需 Ctrl+Shift+R |
| 暗色/深色模式 | ❌ | v2 |
| 章节筛选 | ❌ | v2 |
| 收藏功能 | ❌ | v2 |
| 分享为图片 | ❌ | v2 |
| 推送通知 | ❌ | iOS PWA 限制 |

## 🎨 设计要点

- **古典纸感**：米黄底 (`#F4E8D0`) + 宣纸纹理 (CSS gradient + 噪点)
- **字体栈**：思源宋体 → 华文楷体 → 系统中文字体 → serif
- **印章**：红色方块 (`#B23A2A`) + "镜"字（华文楷体）+ 内白边
- **动效**：换句时淡出 (250ms) → 切内容 → 淡入
- **响应式**：手机 22px / 平板 30px / 横屏自动收拢
- **不缩放**：viewport 锁定，避免 iOS 双击放大

## 📜 数据来源

- 简体原文：古文岛（古诗文网）
- 繁体原文：维基文库 2026-06-30 导出
- **v0.6 起：仅保留原文，删除全部解读**（用户决定）

## 📝 版本历史

- **v0.1** (2026-06-30): 初版，10 文件 / 120KB，sohu 网友译文
- **v0.2** (2026-06-30): 修复 4 处译文质量问题 (曲之 #7/#9/#10/#12)
- **v0.3** (2026-07-01): 译文全面重写，67 句空 + 41 句简译，data.js 从 33KB 缩到 16KB
- **v0.3 deployed** (2026-07-01): GitHub + Cloudflare Pages 部署成功
- **v0.6** (2026-07-03): **删除全部解读**（data.js 16KB→13KB）+ **修复 Chrome 硬刷新问题**（sw.js 加版本号 + 核心资源改 network-first），普通刷新即生效

## 🛠 更新代码流程

```bash
cd chushi-pwa
# 1. 改完代码
# 2. 同步更新 sw.js 里的 VERSION（如 v0.6 → v0.7）
# 3. 提交推送:
git add -A && git commit -m "..." && git push
# Cloudflare Pages 自动重新部署, 3-5 分钟生效
# 4. 用户普通刷新即可看到新版本（核心资源走 network-first）
```

## 🌐 部署

✅ 已部署到 Cloudflare Pages (GitHub 自动集成)
- URL: https://chushi-jing.pages.dev/
- 仓库: github.com/kumabarloc/chushi-jing