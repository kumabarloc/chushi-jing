// ============================================
// 处世悬镜 PWA — 主逻辑
// ============================================

(function() {
  'use strict';

  // ---- 状态 ----
  const state = {
    currentIdx: -1,
    lastIdx: -1,
    isAnimating: false,
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
  const paper = card.querySelector('.paper');
  const btnInfo = document.getElementById('btn-info');
  const infoModal = document.getElementById('info-modal');
  const btnCloseInfo = document.getElementById('btn-close-info');
  const toast = document.getElementById('toast');

  // ---- 工具 ----
  function randIdx() {
    if (QUOTES.length <= 1) return 0;
    let idx;
    do {
      idx = Math.floor(Math.random() * QUOTES.length);
    } while (idx === state.lastIdx);  // 避免连续两句相同
    return idx;
  }

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
    counter.textContent = `${idx + 1} / ${QUOTES.length}`;
    state.currentIdx = idx;
    state.lastIdx = idx;
    document.title = `${q.text.slice(0, 12)}… — 处世悬镜`;
  }

  function nextQuote() {
    if (state.isAnimating) return;
    state.isAnimating = true;
    paper.classList.add('fading');
    setTimeout(() => {
      showQuote(randIdx());
      paper.classList.remove('fading');
      state.isAnimating = false;
    }, 250);
  }

  // ---- 复制当前句 ----
  function copyCurrent() {
    const q = QUOTES[state.currentIdx];
    if (!q) return;
    const text = `${q.text}\n——《${q.ch}》\n\n【解读】${q.interp}`;
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
    const text = `${q.text}\n——《${q.ch}》\n\n【解读】${q.interp}`;
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

  function showToast() {
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 1500);
  }

  // ---- 长按检测 ----
  function onPressStart(e) {
    state.isLongPress = false;
    state.pressStart = Date.now();
    state.pressTimer = setTimeout(() => {
      state.isLongPress = true;
      // 触感反馈（支持的设备）
      if (navigator.vibrate) navigator.vibrate(10);
    }, 500);
  }

  function onPressEnd(e) {
    clearTimeout(state.pressTimer);
    const duration = Date.now() - state.pressStart;
    if (duration >= 500 && state.isLongPress) {
      // 长按 = 复制
      copyCurrent();
      // 阻止后续 click 触发换句
      if (e && e.preventDefault) e.preventDefault();
    }
  }

  function onPressCancel() {
    clearTimeout(state.pressTimer);
    state.isLongPress = false;
  }

  // ---- 弹窗控制 ----
  function showModal() { infoModal.hidden = false; }
  function hideModal() { infoModal.hidden = true; }

  // ---- 事件绑定 ----

  // 点击换句（用 click 不用 touchend，兼容性好）
  card.addEventListener('click', (e) => {
    if (state.isLongPress) {
      state.isLongPress = false;
      return;
    }
    nextQuote();
  });

  // 长按复制（touch + mouse）
  card.addEventListener('touchstart', onPressStart, { passive: true });
  card.addEventListener('touchend', onPressEnd);
  card.addEventListener('touchcancel', onPressCancel);
  card.addEventListener('mousedown', onPressStart);
  card.addEventListener('mouseup', onPressEnd);
  card.addEventListener('mouseleave', onPressCancel);

  // 键盘：空格/回车换句，ESC 关弹窗
  card.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      nextQuote();
    }
  });

  // 工具栏
  btnInfo.addEventListener('click', (e) => {
    e.stopPropagation();
    showModal();
  });
  btnCloseInfo.addEventListener('click', hideModal);
  infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) hideModal();
  });

  // 防止 iOS 双击放大
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // ---- Service Worker 注册（PWA 离线支持） ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('[SW] registered:', reg.scope))
        .catch(err => console.warn('[SW] failed:', err));
    });
  }

  // ---- 启动 ----
  showQuote(randIdx());

})();
