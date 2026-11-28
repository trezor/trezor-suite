/// <reference lib="webworker" />
/**
 * One worker source for webpack and Vite, dev and production.
 * - HTML: network first, so an online user never gets an older shell than the server has.
 * - Files with a content hash in their name (JS, assets, wasm): precached from the injected manifest
 *   (production builds only). A file without one would stay at the previous deploy under a newer shell.
 * - Fonts and videos in `static/`: precached under a revision of their content all the same,
 *   as an older one only looks different. A video is answered in the byte ranges `<video>` asks for.
 * - Unhashed scripts of web workers in `js/workers/`: network first, so they match the shell.
 * - The rest of `static/`: stale-while-revalidate.
 * - Token definitions on data.trezor.io, which startup waits for: stale-while-revalidate.
 *   The app gets the copy from the previous visit at once, and once the worker has stored a newer one,
 *   the tabs are told to load it again.
 * - Stale-while-revalidate updates a cached file only a while after serving it, at a low priority,
 *   so that the update does not compete with the requests the app starts with.
 * - Coin and token icons on data.trezor.io: cache first. Each is fetched again a week after it was stored.
 * - Dev builds: no manifest and no routes, the worker exists only so that its lifecycle can be exercised.
 *   Serwist's logs exist only there, and the `dev-logs` parameter of the worker's URL turns them on.
 */
import {
    BroadcastUpdatePlugin,
    CacheExpiration,
    CacheFirst,
    CacheableResponsePlugin,
    ExpirationPlugin,
    NetworkFirst,
    type PrecacheEntry,
    RangeRequestsPlugin,
    type RouteMatchCallbackOptions,
    Serwist,
} from 'serwist';

import { DeferredStaleWhileRevalidate } from './DeferredStaleWhileRevalidate';
import { type ServiceWorkerBuildInfo } from '../control/serviceWorkerBuildInfo';
import {
    SERVICE_WORKER_DEV_LOGS_PARAMETER,
    type ServiceWorkerClientMessage,
    ServiceWorkerClientMessageType,
    ServiceWorkerMessageType,
    getMessageType,
} from '../serviceWorkerProtocol';

declare const self: ServiceWorkerGlobalScope & {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const STATIC_CACHE_MAX_ENTRIES = 800;
/**
 * More than twice the files Suite fetches today (a list or two per network,
 * the Solana and Stellar metadata and the ranked list), so a new format version fits beside the old one.
 */
const TOKEN_DEFINITIONS_CACHE_MAX_ENTRIES = 64;
/** Where the token definitions are published, the Solana and Stellar token metadata among them. */
const TOKEN_DEFINITIONS_URL = new URL('https://data.trezor.io/suite/definitions/');
/**
 * How long after serving a cached file stale-while-revalidate starts updating it.
 * A start measured without a device sent its startup requests within 2 s, which leaves room for slower ones.
 */
const REVALIDATION_DELAY_MS = 10_000;
/** Coin and token icons, each in a few sizes. */
const ICONS_URL = new URL('https://data.trezor.io/suite/icons/');
/** Room for the icons of a wallet with many tokens and of the trading lists, a few kilobytes each. */
const ICONS_CACHE_MAX_ENTRIES = 1000;
const ICONS_CACHE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
/** How long tabs get to reload themselves before the worker navigates the ones still controlled. */
const RELOAD_FALLBACK_DELAY_MS = 5000;

/** The build replaces this placeholder, which may appear only once in the source. */
const manifest = self.__SW_MANIFEST;
const { scope } = self.registration;
const scopePath = new URL(scope).pathname;
const shellUrl = `${scopePath}index.html`;
// Serwist does not scope custom cache names, and all branch previews share one origin.
const shellCacheName = `suite-shell-${scope}`;
const workerScriptsCacheName = `suite-worker-scripts-${scope}`;
const staticCacheName = `suite-static-${scope}`;
const tokenDefinitionsCacheName = `suite-token-definitions-${scope}`;
const iconsCacheName = `suite-icons-${scope}`;
const isCachingEnabled = process.env.NODE_ENV === 'production';
const isDevLogsEnabled = new URL(self.location.href).searchParams.has(
    SERVICE_WORKER_DEV_LOGS_PARAMETER,
);

const isAppNavigation = ({ request, sameOrigin, url }: RouteMatchCallbackOptions) =>
    request.mode === 'navigate' &&
    sameOrigin &&
    url.pathname.startsWith(scopePath) &&
    !/^(connect-popup|static)\//.test(url.pathname.slice(scopePath.length));

const isWorkerScript = ({ sameOrigin, url }: RouteMatchCallbackOptions) =>
    sameOrigin && url.pathname.startsWith(`${scopePath}js/workers/`);

// Pages under `static/`, such as the OAuth receiver with the code in its URL, are never cached.
const isStaticFile = ({ request, sameOrigin, url }: RouteMatchCallbackOptions) =>
    request.mode !== 'navigate' && sameOrigin && url.pathname.startsWith(`${scopePath}static/`);

const isTokenDefinitionsFile = ({ url }: RouteMatchCallbackOptions) =>
    url.origin === TOKEN_DEFINITIONS_URL.origin &&
    url.pathname.startsWith(TOKEN_DEFINITIONS_URL.pathname);

const isIcon = ({ url }: RouteMatchCallbackOptions) =>
    url.origin === ICONS_URL.origin && url.pathname.startsWith(ICONS_URL.pathname);

const staticFilesStrategy = new DeferredStaleWhileRevalidate({
    cacheName: staticCacheName,
    revalidationDelayMs: REVALIDATION_DELAY_MS,
    //   fetchOptions: {
    //     'priority': 'low',
    //   },
    plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({
            maxEntries: STATIC_CACHE_MAX_ENTRIES,
            purgeOnQuotaError: true,
        }),
    ],
});

const tokenDefinitionsStrategy = new DeferredStaleWhileRevalidate({
    cacheName: tokenDefinitionsCacheName,
    revalidationDelayMs: REVALIDATION_DELAY_MS,
    plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        /**
         * Tells the tabs when an update stores a copy that differs from the cached one.
         * data.trezor.io does not expose the ETag to CORS, so the length and Last-Modified tell them apart.
         */
        new BroadcastUpdatePlugin({ headersToCheck: ['content-length', 'last-modified'] }),
        new ExpirationPlugin({
            maxEntries: TOKEN_DEFINITIONS_CACHE_MAX_ENTRIES,
            purgeOnQuotaError: true,
        }),
    ],
});

const serwist = new Serwist({
    precacheEntries: manifest,
    precacheOptions: {
        cleanupOutdatedCaches: true,
        concurrency: 10,
        // Cuts the byte range a `<video>` asks for out of the precached file.
        plugins: [new RangeRequestsPlugin()],
        // An install downloads every new file of a version, so the app's own requests go first.
        fetchOptions: { priority: 'low' },
    },
    skipWaiting: false,
    clientsClaim: true,
    navigationPreload: false,
    disableDevLogs: !isDevLogsEnabled,
    runtimeCaching: isCachingEnabled
        ? [
              {
                  matcher: isAppNavigation,
                  handler: new NetworkFirst({
                      cacheName: shellCacheName,
                      plugins: [
                          // Every route serves the same HTML, so one cached copy serves all of them.
                          { cacheKeyWillBeUsed: () => Promise.resolve(shellUrl) },
                          new CacheableResponsePlugin({ statuses: [200] }),
                      ],
                  }),
              },
              {
                  matcher: isWorkerScript,
                  handler: new NetworkFirst({
                      cacheName: workerScriptsCacheName,
                      plugins: [new CacheableResponsePlugin({ statuses: [200] })],
                  }),
              },
              { matcher: isStaticFile, handler: staticFilesStrategy },
              { matcher: isTokenDefinitionsFile, handler: tokenDefinitionsStrategy },
              {
                  matcher: isIcon,
                  handler: new CacheFirst({
                      cacheName: iconsCacheName,
                      /**
                       * `<img>` asks without CORS, which would leave the worker an opaque response:
                       * one it cannot tell a missing icon by, and that Chrome counts as megabytes of storage.
                       * data.trezor.io allows CORS from any origin, for requests without credentials.
                       */
                      fetchOptions: { mode: 'cors', credentials: 'omit' },
                      plugins: [
                          new CacheableResponsePlugin({ statuses: [200] }),
                          new ExpirationPlugin({
                              maxEntries: ICONS_CACHE_MAX_ENTRIES,
                              maxAgeSeconds: ICONS_CACHE_MAX_AGE_SECONDS,
                              purgeOnQuotaError: true,
                          }),
                      ],
                  }),
              },
          ]
        : [],
});

const sleep = (milliseconds: number) =>
    new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });

/**
 * Each tab reloads itself at its current URL. Navigating a tab to `client.url` instead would send it
 * back to the URL it was opened at, and for a URL with a fragment it is only a fragment navigation.
 * Tabs still controlled after a while, such as one that had not finished booting, are navigated.
 */
const reloadWindowClients = async () => {
    const reloadMessage: ServiceWorkerClientMessage = {
        type: ServiceWorkerClientMessageType.Reload,
    };
    const windowClients = await self.clients.matchAll({ type: 'window' });
    windowClients.forEach(windowClient => windowClient.postMessage(reloadMessage));

    await sleep(RELOAD_FALLBACK_DELAY_MS);

    const remainingWindowClients = await self.clients.matchAll({ type: 'window' });
    await Promise.allSettled(
        remainingWindowClients.map(windowClient => windowClient.navigate(windowClient.url)),
    );
};

/**
 * Removes this worker and everything it stored, then reloads every tab it controls.
 * It runs here rather than in a page: unregistering from one tab while another tab stays controlled
 * lets the next registration revive the old worker, with empty caches and no lifecycle events.
 */
const uninstall = async () => {
    // An update still pending would store its file again once the caches are gone.
    await Promise.all([
        staticFilesStrategy.cancelRevalidations(),
        tokenDefinitionsStrategy.cancelRevalidations(),
    ]);

    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter(cacheName => cacheName.endsWith(scope))
            .map(cacheName => caches.delete(cacheName)),
    );

    if (isCachingEnabled) {
        // The expiration plugin keeps its bookkeeping in IndexedDB, outside the caches.
        await Promise.all([
            new CacheExpiration(staticCacheName, { maxEntries: STATIC_CACHE_MAX_ENTRIES }).delete(),
            new CacheExpiration(tokenDefinitionsCacheName, {
                maxEntries: TOKEN_DEFINITIONS_CACHE_MAX_ENTRIES,
            }).delete(),
            new CacheExpiration(iconsCacheName, { maxEntries: ICONS_CACHE_MAX_ENTRIES }).delete(),
        ]);
    }

    await self.registration.unregister();
    await reloadWindowClients();
};

self.addEventListener('message', event => {
    const messageType = getMessageType(event.data);

    if (messageType === ServiceWorkerMessageType.GetBuildInfo) {
        const buildInfo: ServiceWorkerBuildInfo = {
            version: process.env.VERSION,
            commit: process.env.COMMITHASH,
            precachedEntryCount: manifest?.length ?? 0,
            isCachingEnabled,
        };
        event.ports[0]?.postMessage(buildInfo);
    }

    if (messageType === ServiceWorkerMessageType.Uninstall) {
        event.waitUntil(uninstall());
    }
});

serwist.addEventListeners();
