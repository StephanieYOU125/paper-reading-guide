const CACHE='paper-guide-v1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./icon.svg','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));});
