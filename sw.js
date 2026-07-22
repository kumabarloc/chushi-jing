// 处世悬镜 PWA — Service Worker
// v0.6: 加版本号机制 + 核心资源改 network-first（保证改完代码后刷新即生效）

const VERSION = 'v0.4';
const CACHE_NAME = `chushi-${VERSION}`;

// 核心资源：网络优先（保证更新即时生效）
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './manifest.json',
];

// 静态资源：缓存优先（图标不常变，省流量）
const STATIC_ASSETS = [
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

const ALL_ASSETS = [...CORE_ASSETS, ...STATIC_ASSETS];

// 判断是否是核心资源（走 network-first）
function isCoreAsset(url) {
  return CORE_ASSETS.some(asset => {
    const path = asset.replace('./', '/');
    return url.pathname === path || url.pathname.endsWith(path);
  });
}

// 安装：预缓存所有静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ALL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理所有旧版本缓存，立即接管页面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 拦截请求
// - 核心资源：network-first（先拉服务器最新，失败用缓存）
// - 静态资源：cache-first（缓存命中直接返回，否则拉网络）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // 只处理同源请求
  if (url.origin !== self.location.origin) return;

  if (isCoreAsset(url)) {
    // network-first
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // cache-first
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});