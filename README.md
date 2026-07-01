# 处世悬镜 PWA

> 南北朝傅昭《处世悬镜》108 句 memento PWA  
> 整理：河马 🦛，2026-07-01  
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
├── sw.js               # Service Worker（离线缓存）
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
└── README.md
```

**总大小 ~67KB**（数据 33KB + 样式 9KB + JS 5KB + HTML 3KB + 图标 33KB）

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
| 长按复制（含解读）| ✅ | 500ms 长按触发 |
| 关于弹窗 | ✅ | 显示作者 + 来源 + 整理者 |
| 计数器（n/108）| ✅ | 顶部右侧 |
| 离线可用（PWA）| ✅ | Service Worker 缓存 |
| 添加到主屏幕 | ✅ | manifest.json + icons |
| 键盘控制 | ✅ | 空格/回车换句 |
| iOS 安全区适配 | ✅ | env(safe-area-inset-*) |
| **空解读自动隐藏** | ✅ | 原文已直白时不显示解读区 |
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
- **逐句解读：河马自译 v0.3**（空优先规则，67 句空 + 41 句简译）
  - v0.1 用了 sohu 网友译文，v0.2 修 4 处 typo，v0.3 全面重写为河马自译精简版

## 📝 版本历史

- **v0.1** (2026-06-30): 初版，10 文件 / 120KB，sohu 网友译文
- **v0.2** (2026-06-30): 修复 4 处译文质量问题 (曲之 #7/#9/#10/#12)
- **v0.3** (2026-07-01): 译文全面重写，67 句空 + 41 句简译，data.js 从 33KB 缩到 16KB
- **v0.3 deployed** (2026-07-01): GitHub + Cloudflare Pages 部署成功

## 🛠 更新代码流程

```bash
cd chushi-pwa
# 改完后:
git add -A && git commit -m "..." && git push
# Cloudflare Pages 自动重新部署, 3-5 分钟生效
```

## 🌐 部署

✅ 已部署到 Cloudflare Pages (GitHub 自动集成)
- URL: https://chushi-jing.pages.dev/
- 仓库: github.com/kumabarloc/chushi-jing
