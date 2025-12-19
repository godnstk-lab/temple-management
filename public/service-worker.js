// 매우 간단한 Service Worker - Next.js와 충돌 방지
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치됨');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화됨');
  event.waitUntil(self.clients.claim());
});

// fetch는 기본 동작만 수행
self.addEventListener('fetch', (event) => {
  // 그냥 네트워크 요청만 전달
  event.respondWith(fetch(event.request));
});