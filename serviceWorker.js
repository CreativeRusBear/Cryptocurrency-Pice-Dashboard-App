const staticAssets = [
	'./index.html',
	'./src/cryptoprice-dash/cryptoprice-dash.js',
	'./build/default/index.html',
	'./build/default/src/cryptoprice-dash/cryptoprice-dash.js',
];

self.addEventListener('install', async () => {
	const cache = await caches.open('static-cache');
	cache.addAll(staticAssets);
});

self.addEventListener('fetch', evt => {
	const req = evt.request;
	const url = new URL(req.url);

	if (url.origin === location.url) {
		evt.respondWith(cacheFirst(req));
	} else {
		evt.respondWith(networkFirst(req));
	}
});

async function cacheFirst (req) {
	const cachedResponse = caches.match(req);
	return cachedResponse || fetch(req);
}

async function networkFirst (req) {
	const cache = await caches.open('dynamic-cache');

	try {
		const res = await fetch(req);
		cache.put(res, res.clone());
	} catch (error) {
		return await cache.match(req);
	}
}