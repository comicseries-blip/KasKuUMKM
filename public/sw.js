const CACHE_NAME = 'kasku-umkm-v3'
const BASE = self.registration.scope
const INDEX = new URL('index.html', BASE).href
const APP_SHELL = ['', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']
  .map((p) => new URL(p, BASE).href)

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Navigasi: jaringan dahulu agar deployment baru tidak tertahan HTML lama.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(INDEX, response.clone()))
      return response
    }).catch(async () => (await caches.match(INDEX)) || Response.error()))
    return
  }

  // Asset statis: cache dahulu, lalu simpan salinan jaringan yang berhasil.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
    return response
  })))
})