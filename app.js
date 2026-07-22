// ============================================
// 处世悬镜 PWA — 主逻辑
// 模式: random (单句随机) ↔ chapter (整章列表阅读)
// v0.7: v0.3 + 动效全面升级（Apple/Emil 规则）
// ============================================

(function() {
  'use strict';

  // ---- 状态 ----
  const state = {
    mode: 'random',           // 'random' | 'chapter'
    currentChapter: null,     // null | '识之' | ...
    currentIdx: -1,
    lastIdx: -1,
    isAnimating: false,
    drawerOpen: false,
  };

  // v0.4: 长按检测（闭包变量替代 state.pressTimer/pressStart/isLongPress）
  let pressTimer = null;
  let pressStartX = 0;
  let pressStartY = 0;
  const PRESS_HOLD_MS = 500;     // 长按阈值
  const PRESS_CANCEL_DIST = 12;  // 拖动超过这个距离（px）取消长按

  // v0.4: reduced-motion 检测
  const motionReduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- DOM ----
  const card = document.getElementById('card');
  const chapterReader = document.getElementById('chapter-reader');
  const quoteText = document.getElementById('quote-text');
  const quoteCh = document.getElementById('quote-ch');
  const counter = document.getElementById('counter');
  const brandSub = document.getElementById('brand-sub');
  const hintText = document.querySelector('.hint-text');
  const paper = card.querySelector('.paper');
  const btnNav = document.getElementById('btn-nav');
  const btnInfo = document.getElementById('btn-info');
  const infoModal = document.getElementById('info-modal');
  const btnCloseInfo = document.getElementById('btn-close-info');
  const toast = document.getElementById('toast');
  const drawer = document.getElementById('drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const chapterList = document.getElementById('chapter-list');
  const modeRandomBtn = document.getElementById('mode-random');

  // ============================================
  // 工具：HTML 转义（防止 text 里有特殊字符破坏结构）
  // ============================================
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  // ============================================
  // 章节工具（按 ch 字段切分 QUOTES）
  // ============================================
  function getChapterList() {
    const map = new Map();
    QUOTES.forEach(q => {
      if (!map.has(q.ch)) map.set(q.ch, []);
      map.get(q.ch).push(q);
    });
    return [...map.entries()]
      .sort((a, b) => a[1][0].n - b[1][0].n)
      .map(([name, quotes]) => ({ name, count: quotes.length }));
  }

  function getChapterBounds(chName) {
    const start = QUOTES.findIndex(q => q.ch === chName);
    if (start === -1) return { start: -1, end: -1, count: 0 };
    let end = start + 1;
    while (end < QUOTES.length && QUOTES[end].ch === chName) end++;
    return { start, end, count: end - start };
  }

  function getChapterQuotes(chName) {
    const { start, end } = getChapterBounds(chName);
    return QUOTES.slice(start, end);
  }

  // ============================================
  // 随机选句
  // ============================================
  function randIdx() {
    if (QUOTES.length <= 1) return 0;
    let idx;
    do { idx = Math.floor(Math.random() * QUOTES.length); }
    while (idx === state.lastIdx);
    return idx;
  }

  // ============================================
  // 显示单句（仅随机模式）
  // ============================================
  function showQuote(idx) {
    const q = QUOTES[idx];
    quoteText.textContent = q.text;
    quoteCh.textContent = q.ch;
    counter.textContent = `${idx + 1} / ${QUOTES.length}`;
    state.currentIdx = idx;
    state.lastIdx = idx;
    document.title = `${q.text.slice(0, 12)}… — 处世悬镜`;
  }

  // ============================================
  // 渲染整章列表（章节模式）
  // ============================================
  function renderChapter(chName) {
    const quotes = getChapterQuotes(chName);
    const html = `
      <div class="chapter-header">
        <h2 class="chapter-name">${escapeHtml(chName)}</h2>
        <div class="chapter-meta">共 ${quotes.length} 句 · 傅昭《处世悬镜》</div>
      </div>

      <div class="chapter-verses">
        ${quotes.map(q => `
          <div class="verse" data-n="${q.n}">
            <div class="verse-num">${q.n}</div>
            <div class="verse-body">
              <p class="verse-text">${escapeHtml(q.text)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    chapterReader.innerHTML = html;
  }

  // ============================================
  // v0.4: 下一句 — WAAPI crossfade + blur bridge
  // ============================================
  //
  // Apple-style 两段动效：
  //   1. 出场（180ms, ease-in）：从中心微微上飘 + blur 4px 桥接
  //   2. 换内容
  //   3. 入场（380ms, 强 ease-out）：从下方升起 + blur 退场 + 落定
  //
  // 比 v0.3 的 setTimeout 改进：
  //   - 中断性：用户连点不会被锁定
  //   - 真实空间感：blur bridge 避免 "两个对象重叠"
  //   - reduced-motion 降级：纯 opacity 切换，无 transform 无 blur
  function nextQuote() {
    if (state.mode !== 'random') return;
    if (state.isAnimating) return;
    state.isAnimating = true;

    if (motionReduced()) {
      // 无障碍模式：纯 opacity 切换
      const fadeOut = paper.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 80, easing: 'ease', fill: 'forwards' }
      );
      fadeOut.onfinish = () => {
        showQuote(randIdx());
        const fadeIn = paper.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 120, easing: 'ease', fill: 'forwards' }
        );
        fadeIn.onfinish = () => { state.isAnimating = false; };
      };
      return;
    }

    // 阶段 1：出场（短 + ease-in + blur bridge）
    const fadeOut = paper.animate([
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
      { opacity: 0, transform: 'translateY(-8px) scale(0.99)', filter: 'blur(4px)' }
    ], {
      duration: 180,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',  // ease-in for exit
      fill: 'forwards'
    });

    fadeOut.onfinish = () => {
      // 阶段 2：换内容
      showQuote(randIdx());

      // 阶段 3：入场（长 + 强 ease-out + blur 退场）
      const fadeIn = paper.animate([
        { opacity: 0, transform: 'translateY(8px) scale(0.99)', filter: 'blur(4px)' },
        { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
      ], {
        duration: 380,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',  // 强 ease-out for entry
        fill: 'forwards'
      });
      fadeIn.onfinish = () => { state.isAnimating = false; };
    };
  }

  // ============================================
  // 模式切换
  // ============================================
  function enterChapterMode(chName) {
    const { count } = getChapterBounds(chName);
    if (count === 0) return;
    state.mode = 'chapter';
    state.currentChapter = chName;

    // UI 切换
    document.documentElement.classList.add('chapter-mode');
    card.hidden = true;
    chapterReader.hidden = false;

    renderChapter(chName);

    brandSub.textContent = chName;
    updateNavBtn('←', '返回随机');
    updateCounter();
    updateChapterListHighlight();

    // 滚到顶部
    window.scrollTo(0, 0);
  }

  function exitChapterMode() {
    state.mode = 'random';
    state.currentChapter = null;

    document.documentElement.classList.remove('chapter-mode');
    card.hidden = false;
    chapterReader.hidden = true;

    brandSub.textContent = '南北朝 傅昭';
    updateNavBtn('≡', '目录');

    // 重置单句（如果还没初始化）
    if (state.currentIdx === -1) {
      showQuote(randIdx());
    } else {
      updateCounter();
    }
    updateChapterListHighlight();
    window.scrollTo(0, 0);
  }

  function updateNavBtn(text, label) {
    btnNav.textContent = text;
    btnNav.setAttribute('aria-label', label);
    btnNav.setAttribute('title', label);
  }

  function updateCounter() {
    if (state.mode === 'chapter') {
      const { count } = getChapterBounds(state.currentChapter);
      counter.textContent = `${state.currentChapter} · ${count} 句`;
    } else if (state.currentIdx >= 0) {
      counter.textContent = `${state.currentIdx + 1} / ${QUOTES.length}`;
    } else {
      counter.textContent = `1 / ${QUOTES.length}`;
    }
  }

  // ============================================
  // 抽屉控制
  // ============================================
  function openDrawer() {
    state.drawerOpen = true;
    drawer.hidden = false;
    drawerOverlay.hidden = false;
    void drawer.offsetWidth;  // 强制 reflow
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    state.drawerOpen = false;
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    setTimeout(() => {
      if (!state.drawerOpen) {
        drawer.hidden = true;
        drawerOverlay.hidden = true;
      }
    }, 300);
  }

  function toggleDrawer() {
    if (state.drawerOpen) closeDrawer();
    else openDrawer();
  }

  // ============================================
  // 章节列表渲染
  // ============================================
  function renderChapterList() {
    const chapters = getChapterList();
    chapterList.innerHTML = chapters.map(ch => `
      <button class="chapter-item" data-ch="${escapeHtml(ch.name)}">
        <span class="ci-name">${escapeHtml(ch.name)}</span>
        <span class="ci-meta">${ch.count} 句</span>
      </button>
    `).join('');
  }

  function updateChapterListHighlight() {
    modeRandomBtn.classList.toggle('active', state.mode === 'random');
    chapterList.querySelectorAll('.chapter-item').forEach(btn => {
      btn.classList.toggle('active',
        state.mode === 'chapter' && btn.dataset.ch === state.currentChapter);
    });
  }

  // ============================================
  // 复制
  // ============================================
  function buildQuoteText(q) {
    return `${q.text}\n——《${q.ch}》`;
  }

  function doCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error('No clipboard API'));
  }

  function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('已复制');
    } catch (e) {
      console.error('Copy failed', e);
    }
    document.body.removeChild(ta);
  }

  // 随机模式：长按当前句复制
  function copyCurrent() {
    const q = QUOTES[state.currentIdx];
    if (!q) return;
    const text = buildQuoteText(q);
    doCopy(text).then(() => showToast('已复制')).catch(() => fallbackCopyText(text));
  }

  // 章节模式：点击 verse 复制
  function copyVerse(n) {
    const q = QUOTES.find(q => q.n === n);
    if (!q) return;
    const text = buildQuoteText(q);
    doCopy(text).then(() => showToast('已复制')).catch(() => fallbackCopyText(text));
  }

  function showToast(msg) {
    toast.textContent = msg || '已复制';
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 1500);
  }

  // ============================================
  // v0.4: 取消长按的辅助函数（统一处理 timer + classList）
  // ============================================
  function cancelPress() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    paper.classList.remove('pressed');
    paper.classList.remove('pressing');
    paper.classList.remove('cancelled');
  }

  // ============================================
  // 关于弹窗
  // ============================================
  function showModal() { infoModal.hidden = false; }
  function hideModal() { infoModal.hidden = true; }

  // ============================================
  // 事件绑定
  // ============================================

  // v0.4: Pointer Events 统一处理（替代 touchstart/end + mousedown/up 两套）
  //   - pointerdown 立即反馈（不等 click 100ms 延迟）
  //   - setPointerCapture 跟踪手指/鼠标拖出元素边界
  //   - pointermove 检测拖动距离 → 超阈取消长按
  //   - pointerup 按 timer 状态分流：还在 → 点击换句；不在 → 长按已触发
  card.addEventListener('pointerdown', (e) => {
    if (state.mode !== 'random') return;
    // 1. 即时视觉反馈（Pointerdown，不是 click！）
    paper.classList.add('pressed');
    // 2. Pointer capture（即使手指/鼠标移出元素也能跟踪）
    try { card.setPointerCapture(e.pointerId); } catch (err) {}
    // 3. 记录起始位置（用于 pointermove 计算拖动距离）
    pressStartX = e.clientX;
    pressStartY = e.clientY;
    // 4. 启动 press progress（CSS transition + class toggle）
    paper.classList.add('pressing');
    // 5. 500ms 后判定为长按
    pressTimer = setTimeout(() => {
      pressTimer = null;
      paper.classList.remove('pressed');
      paper.classList.remove('pressing');
      copyCurrent();
      if (navigator.vibrate) navigator.vibrate(10);
      // 触发"已完成"反馈动画
      paper.classList.add('fired');
      setTimeout(() => paper.classList.remove('fired'), 600);
    }, PRESS_HOLD_MS);
  });

  card.addEventListener('pointermove', (e) => {
    if (!pressTimer) return;
    const dx = e.clientX - pressStartX;
    const dy = e.clientY - pressStartY;
    if (Math.sqrt(dx * dx + dy * dy) > PRESS_CANCEL_DIST) {
      // 拖动距离过大 → 取消（progress snap back）
      paper.classList.add('cancelled');
      clearTimeout(pressTimer);
      pressTimer = null;
      setTimeout(() => paper.classList.remove('pressed', 'pressing', 'cancelled'), 220);
    }
  });

  card.addEventListener('pointerup', () => {
    // 如果长按 timer 还在 → 是点击 → 换句
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
      paper.classList.remove('pressed');
      paper.classList.remove('pressing');
      nextQuote();
    }
    // 否则长按已触发（已在 pointerdown timeout 里处理）
  });

  card.addEventListener('pointercancel', () => {
    cancelPress();
  });

  // 键盘快捷键（保留）
  card.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      nextQuote();
    }
  });

  // 章节模式：点击 verse = 复制（事件委托，渲染后自动绑定）
  chapterReader.addEventListener('click', (e) => {
    if (state.mode !== 'chapter') return;
    const verse = e.target.closest('.verse');
    if (!verse) return;
    const n = parseInt(verse.dataset.n, 10);
    if (n) copyVerse(n);
  });

  // 工具栏 nav 按钮
  btnNav.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.mode === 'random') {
      toggleDrawer();
    } else {
      exitChapterMode();
    }
  });

  // 关于弹窗
  btnInfo.addEventListener('click', (e) => {
    e.stopPropagation();
    showModal();
  });
  btnCloseInfo.addEventListener('click', hideModal);
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) hideModal();
  });

  // 抽屉
  btnCloseDrawer.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  modeRandomBtn.addEventListener('click', () => {
    if (state.mode === 'chapter') exitChapterMode();
    closeDrawer();
  });

  chapterList.addEventListener('click', (e) => {
    const btn = e.target.closest('.chapter-item[data-ch]');
    if (!btn) return;
    enterChapterMode(btn.dataset.ch);
    closeDrawer();
  });

  // v0.4: iOS 双击放大防护 已移除
//   之前用 300ms touchend hack 会干扰其他事件
//   现在用 CSS `touch-action: manipulation` 干掉 tap delay（见 style.css）

  // ESC 关弹窗/抽屉
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!infoModal.hidden) hideModal();
      else if (state.drawerOpen) closeDrawer();
    }
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('[SW] registered:', reg.scope))
        .catch(err => console.warn('[SW] failed:', err));
    });
  }

  // ============================================
  // 启动
  // ============================================
  renderChapterList();
  showQuote(randIdx());

})();