// ============================================
// 处世悬镜 PWA — 主逻辑
// 状态机: random (随机阅读) ↔ chapter (章节阅读)
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
    pressTimer: null,
    pressStart: 0,
    isLongPress: false,
  };

  // ---- DOM ----
  const card = document.getElementById('card');
  const quoteText = document.getElementById('quote-text');
  const quoteCh = document.getElementById('quote-ch');
  const interp = document.getElementById('interp');
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
  // 章节工具（按 ch 字段切分 QUOTES）
  // ============================================

  // 章节列表（按首句 n 排序）
  function getChapterList() {
    const map = new Map();
    QUOTES.forEach(q => {
      if (!map.has(q.ch)) map.set(q.ch, []);
      map.get(q.ch).push(q);
    });
    return [...map.entries()]
      .sort((a, b) => a[1][0].n - b[1][0].n)
      .map(([name, quotes]) => ({ name, count: quotes.length, startIdx: QUOTES.indexOf(quotes[0]) }));
  }

  // 章节在 QUOTES 数组中的 [start, end) 区间（依赖 QUOTES 按章节顺序连续排列）
  function getChapterBounds(chName) {
    const start = QUOTES.findIndex(q => q.ch === chName);
    if (start === -1) return { start: -1, end: -1, count: 0 };
    let end = start + 1;
    while (end < QUOTES.length && QUOTES[end].ch === chName) end++;
    return { start, end, count: end - start };
  }

  // ============================================
  // 章节进度持久化（sessionStorage，关闭标签页即清）
  // ============================================
  function saveChapterProgress() {
    if (state.mode !== 'chapter' || !state.currentChapter) return;
    const { start, count } = getChapterBounds(state.currentChapter);
    const k = state.currentIdx - start;  // 0-indexed 在章节内的位置
    try { sessionStorage.setItem(`chushi:progress:${state.currentChapter}`, k); } catch (e) {}
  }

  function loadChapterProgress(chName) {
    try {
      const v = sessionStorage.getItem(`chushi:progress:${chName}`);
      return v !== null ? parseInt(v, 10) : 0;
    } catch (e) { return 0; }
  }

  function clearChapterProgress(chName) {
    try { sessionStorage.removeItem(`chushi:progress:${chName}`); } catch (e) {}
  }

  // ============================================
  // 随机选句（避免连续两句相同）
  // ============================================
  function randIdx() {
    if (QUOTES.length <= 1) return 0;
    let idx;
    do { idx = Math.floor(Math.random() * QUOTES.length); }
    while (idx === state.lastIdx);
    return idx;
  }

  // ============================================
  // 显示句子（mode-aware）
  // ============================================
  function showQuote(idx) {
    const q = QUOTES[idx];
    quoteText.textContent = q.text;
    quoteCh.textContent = q.ch;
    if (q.interp && q.interp.trim()) {
      interp.textContent = q.interp;
      interp.hidden = false;
    } else {
      interp.textContent = '';
      interp.hidden = true;
    }

    // 计数器 + 副标题：mode 决定显示内容
    if (state.mode === 'chapter') {
      const { start, count } = getChapterBounds(state.currentChapter);
      const k = idx - start;
      counter.textContent = `${state.currentChapter} ${k + 1}/${count}`;
    } else {
      counter.textContent = `${idx + 1} / ${QUOTES.length}`;
    }

    state.currentIdx = idx;
    state.lastIdx = idx;
    document.title = `${q.text.slice(0, 12)}… — 处世悬镜`;
  }

  // ============================================
  // 下一句（mode-aware）
  // ============================================
  function nextQuote() {
    if (state.isAnimating) return;
    state.isAnimating = true;
    paper.classList.add('fading');
    setTimeout(() => {
      if (state.mode === 'random') {
        showQuote(randIdx());
      } else {
        const { start, count } = getChapterBounds(state.currentChapter);
        const k = state.currentIdx - start;
        if (k < count - 1) {
          showQuote(start + k + 1);
          saveChapterProgress();
        } else {
          showChapterComplete();
        }
      }
      paper.classList.remove('fading');
      state.isAnimating = false;
    }, 250);
  }

  // ============================================
  // 章节完成提示
  // ============================================
  function showChapterComplete() {
    const { count } = getChapterBounds(state.currentChapter);
    const chName = state.currentChapter;
    quoteText.textContent = `「${chName}」已毕`;
    quoteCh.textContent = '';
    interp.textContent = `本章 ${count} 句，承蒙读完。`;
    interp.hidden = false;
    counter.textContent = '✓';
    showToast(`「${chName}」共 ${count} 句已毕`);

    // 1.6 秒后：清进度 + 退随机 + 打开目录
    setTimeout(() => {
      clearChapterProgress(chName);
      exitChapterMode();
      openDrawer();
    }, 1600);
  }

  // ============================================
  // 章节模式切换
  // ============================================
  function enterChapterMode(chName) {
    const { start, count } = getChapterBounds(chName);
    if (start === -1) return;
    state.mode = 'chapter';
    state.currentChapter = chName;
    const k = loadChapterProgress(chName);
    const idx = Math.min(k, count - 1);
    document.body.classList.add('chapter-mode');
    brandSub.textContent = chName;
    updateNavBtn('←', '返回随机');
    updateHint();
    updateChapterListHighlight();
    showQuote(start + idx);
  }

  function exitChapterMode() {
    state.mode = 'random';
    state.currentChapter = null;
    document.body.classList.remove('chapter-mode');
    brandSub.textContent = '南北朝 傅昭';
    updateNavBtn('≡', '目录');
    updateHint();
    updateChapterListHighlight();
  }

  // 工具栏 nav 按钮：mode 决定文字和行为
  function updateNavBtn(text, label) {
    btnNav.textContent = text;
    btnNav.setAttribute('aria-label', label);
    btnNav.setAttribute('title', label);
  }

  function updateHint() {
    if (state.mode === 'chapter') {
      hintText.textContent = '轻触下一句 · 长按复制';
    } else {
      hintText.textContent = '轻触换一句 · 长按复制';
    }
  }

  // ============================================
  // 抽屉控制
  // ============================================
  function openDrawer() {
    state.drawerOpen = true;
    drawer.hidden = false;
    drawerOverlay.hidden = false;
    // 强制 reflow 后再加 class，触发 transition
    void drawer.offsetWidth;
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    state.drawerOpen = false;
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    // 等过渡结束再 hidden
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
      <button class="chapter-item" data-ch="${ch.name}">
        <span class="ci-name">${ch.name}</span>
        <span class="ci-meta">${ch.count} 句</span>
      </button>
    `).join('');
  }

  function updateChapterListHighlight() {
    // 高亮当前章节 / 随机模式
    modeRandomBtn.classList.toggle('active', state.mode === 'random');
    chapterList.querySelectorAll('.chapter-item').forEach(btn => {
      btn.classList.toggle('active',
        state.mode === 'chapter' && btn.dataset.ch === state.currentChapter);
    });
  }

  // ============================================
  // 复制当前句
  // ============================================
  function copyCurrent() {
    const q = QUOTES[state.currentIdx];
    if (!q) return;
    const text = `${q.text}\n——《${q.ch}》\n\n【解读】${q.interp || '（无解读）'}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(showToast)
        .catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const q = QUOTES[state.currentIdx];
    const text = `${q.text}\n——《${q.ch}》\n\n【解读】${q.interp || '（无解读）'}`;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast();
    } catch (e) {
      console.error('Copy failed', e);
    }
    document.body.removeChild(ta);
  }

  function showToast(msg) {
    toast.textContent = msg || '已复制';
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 1500);
  }

  // ============================================
  // 长按检测
  // ============================================
  function onPressStart(e) {
    state.isLongPress = false;
    state.pressStart = Date.now();
    state.pressTimer = setTimeout(() => {
      state.isLongPress = true;
      if (navigator.vibrate) navigator.vibrate(10);
    }, 500);
  }

  function onPressEnd(e) {
    clearTimeout(state.pressTimer);
    const duration = Date.now() - state.pressStart;
    if (duration >= 500 && state.isLongPress) {
      copyCurrent();
      if (e && e.preventDefault) e.preventDefault();
    }
  }

  function onPressCancel() {
    clearTimeout(state.pressTimer);
    state.isLongPress = false;
  }

  // ============================================
  // 弹窗控制
  // ============================================
  function showModal() { infoModal.hidden = false; }
  function hideModal() { infoModal.hidden = true; }

  // ============================================
  // 事件绑定
  // ============================================

  // 点击卡片：换句
  card.addEventListener('click', (e) => {
    if (state.isLongPress) { state.isLongPress = false; return; }
    nextQuote();
  });

  // 长按复制
  card.addEventListener('touchstart', onPressStart, { passive: true });
  card.addEventListener('touchend', onPressEnd);
  card.addEventListener('touchcancel', onPressCancel);
  card.addEventListener('mousedown', onPressStart);
  card.addEventListener('mouseup', onPressEnd);
  card.addEventListener('mouseleave', onPressCancel);

  card.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      nextQuote();
    }
  });

  // 工具栏：nav 按钮（mode 决定行为）
  btnNav.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.mode === 'random') {
      toggleDrawer();
    } else {
      // 章节模式：nav = 返回随机
      exitChapterMode();
      showQuote(randIdx());
    }
  });

  // 工具栏：info 按钮
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

  // 抽屉内：随机模式按钮
  modeRandomBtn.addEventListener('click', () => {
    if (state.mode === 'chapter') {
      exitChapterMode();
      showQuote(randIdx());
    }
    closeDrawer();
  });

  // 抽屉内：章节点击（事件委托，列表是 JS 渲染的）
  chapterList.addEventListener('click', (e) => {
    const btn = e.target.closest('.chapter-item[data-ch]');
    if (!btn) return;
    const chName = btn.dataset.ch;
    enterChapterMode(chName);
    closeDrawer();
  });

  // iOS 双击放大防护
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // ESC：关弹窗/关抽屉
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