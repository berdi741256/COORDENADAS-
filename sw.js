const CACHE="coordenadas-v5", TILES="coordenadas-mapas";
const FILES=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./vendor/maplibre-gl.js","./vendor/maplibre-gl.css"];
const TILE_HOSTS=["server.arcgisonline.com","tile.opentopomap.org","s3.amazonaws.com"];
const MAX_TILES=4000;
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE&&x!==TILES).map(x=>caches.delete(x)))));self.clients.claim();});
async function trim(){const c=await caches.open(TILES);const k=await c.keys();if(k.length>MAX_TILES){for(const r of k.slice(0,k.length-MAX_TILES))await c.delete(r);}}
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(TILE_HOSTS.some(h=>u.hostname.endsWith(h))){
    e.respondWith(caches.open(TILES).then(async c=>{
      const hit=await c.match(e.request);if(hit)return hit;
      try{const r=await fetch(e.request);if(r.ok){c.put(e.request,r.clone());if(Math.random()<0.05)trim();}return r;}
      catch(err){return new Response("",{status:504});}
    }));
    return;
  }
  if(e.request.mode==="navigate"||u.pathname.endsWith("/index.html")){
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put("./index.html",c));}return r;})
      .catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
