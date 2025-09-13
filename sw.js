// sw.js
// ★デプロイ毎に v番号を上げる
const CACHE_NAME = 'zoodrops-v3';

// オフラインで最低限必要なファイル（まずはこれだけでOK。増やしたら追記）
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // 画像・音（あるものだけでOK。増えたらここに足す）
  './assets/giraffe.png',
  './assets/elephant.png',
  './assets/zebra.png',
  './assets/tiger.png',
  './assets/kangaroo.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  // 任意：効果音やBGMを使う場合
  // './assets/sfx/move.ogg', './assets/sfx/rotate.ogg', ...
  // './assets/bgm.mp3',
];

// インストール：新しいキャッシュを作成（skipWaitingで即時適用を前倒し）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 有効化：古いキャッシュを削除（clients.claimで既存タブにも即適用）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 取得：キャッシュ優先＋なければネット→成功したらキャッシュへ保存
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POSTなどはスルー

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      // 同一オリジンかつ成功したものだけキャッシュに入れる
      const url = new URL(req.url);
      if (res.ok && url.origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(()=>{});
      }
      return res;
    } catch (e) {
      // オフライン時のフォールバック（index.html を返す）
      return caches.match('./index.html');
    }
  })());
});
