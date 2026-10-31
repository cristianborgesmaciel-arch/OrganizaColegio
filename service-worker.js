/* ============================================================
   OrganizaColégio — Service Worker
   Cache da interface (PWA) e funcionamento offline.
   Estratégia: rede primeiro, cache como reserva.
   ============================================================ */

const CACHE_NAME = "organizacolegio-v5";
const FONT_CACHE = "organizacolegio-fonts-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter(
              (chave) =>
                chave.startsWith("organizacolegio-") &&
                chave !== CACHE_NAME &&
                chave !== FONT_CACHE
            )
            .map((chave) => caches.delete(chave))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requisicao = event.request;

  if (requisicao.method !== "GET") return;

  const url = new URL(requisicao.url);

  // Fontes do Google: cache primeiro, atualizando em segundo plano.
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const emCache = await cache.match(requisicao);

        const rede = fetch(requisicao)
          .then((resposta) => {
            if (resposta && (resposta.ok || resposta.type === "opaque")) {
              cache.put(requisicao, resposta.clone());
            }
            return resposta;
          })
          .catch(() => emCache);

        return emCache || rede;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(requisicao)
      .then((resposta) => {
        if (resposta && resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(requisicao, copia));
        }
        return resposta;
      })
      .catch(() =>
        caches.match(requisicao).then((emCache) => {
          if (emCache) return emCache;
          if (requisicao.mode === "navigate") {
            return caches.match("./index.html").then((index) => {
              return index || caches.match("./");
            });
          }
          return Response.error();
        })
      )
  );
});
