# Area 6 — Non-essential background work: message system, definitions, telemetry, updates

Scanned: `suite-common/message-system/src/**` (thunks, constants, selectors, utils, validation, cachedEnvData), `suite-common/token-definitions/src/**` (thunks, middleware, reducer, selectors, utils, phishing/**), `suite-common/logger/src/**` (logsSlice, logsMiddleware, logsSelectors, utils, hooks/useCommonApplicationLogs), `suite-common/sentry/src/**` (redactSentryEvent, ignoreErrors, constants), `suite/sentry/src/config.ts`, `packages/suite-web/src/sentry.ts`, `packages/suite-desktop-ui/src/sentry.ts`, `suite-native/sentry/src/sentry.ts`, `packages/suite/src/utils/suite/sentry.ts`, `packages/suite/src/middlewares/suite/{sentryMiddleware,logsMiddleware,messageSystemMiddleware,analyticsMiddleware}.ts`, `suite-native/message-system/src/messageSystemMiddleware.ts`, `suite/desktop-update/src/**`, `packages/suite-desktop-ui/src/support/DesktopUpdater*`, `packages/suite/src/actions/suite/{initAction,analyticsActions,guideActions,storageActions}.ts`, `packages/suite/src/hooks/guide/**`, `packages/suite/src/components/guide/GuideSearch.tsx`, `packages/suite/src/utils/suite/{guide,analytics,logsUtils}.ts`, `packages/suite/src/support/suite/{ConnectedIntlProvider,preloadStore}.tsx|ts`, `packages/suite/src/hooks/suite/useLocales.ts`, `packages/suite/src/selectors/suite/logsSelectors.ts`, `packages/analytics-uploader/src/{analytics,utils}.ts`, `suite/trading/src/{tradingMiddleware,geolocation}.ts`, `packages/suite-web/src/MainWeb.tsx`, `packages/suite-desktop-ui/src/MainDesktop.tsx`, `suite-native/app-init/src/appInitThunks.ts`, `suite-native/analytics-redux/src/analyticsThunks.ts`, `suite-native/discovery/src/discoveryMiddleware.ts`, `suite-native/module-accounts-import/src/accountsImportThunks.ts`, `packages/suite/src/storage/migrations/index.ts` (skimmed for cursor loops)
Findings: 2

---

## F6.1 — Back off the token-definitions retry timer in `tokenDefinitionsThunks.ts` and run the tick in an idle callback

- **Anchor:** `suite-common/token-definitions/src/tokenDefinitionsThunks.ts:102` (additional: `suite-common/token-definitions/src/tokenDefinitionsThunks.ts:62`, `suite-common/token-definitions/src/tokenDefinitionsThunks.ts:106`)
- **Class:** non-essential (with a timeout-misuse component: a self-rescheduling `setTimeout` used as the scheduler)
- **Platform:** shared (web, desktop and native all run this exact thunk — `packages/suite/src/actions/suite/initAction.ts:98`, `suite-native/app-init/src/appInitThunks.ts:90`, `suite-native/discovery/src/discoveryMiddleware.ts:92`, `suite-native/module-accounts-import/src/accountsImportThunks.ts:87`)
- **What grows:** the number of enabled networks that carry `coin-definitions` / `nft-definitions` (`getSupportedDefinitionTypes`, `tokenDefinitionsUtils.ts:48`) whose last fetch **failed**. The filter at `:62` keeps a definition type in the work list whenever it has neither `data` nor `isLoading` — and the rejected reducer case (`tokenDefinitionsReducer.ts:50-63`) writes exactly `{ error: true, data: undefined, isLoading: false }`. So every errored network/type pair is re-fetched **every 60 s for the whole lifetime of the app, with no backoff and no cap**. Each retry re-downloads and re-parses a definitions file: I measured `ethereum.simple.coin.definitions.v1.json` at 229 KB, `solana...` at 290 KB, `binance-smart-chain...` at 156 KB, so a user with, say, 6 EVM networks enabled on a flaky link re-parses on the order of 1 MB of JSON on the UI thread once a minute, forever.
- **When it runs:** armed at app start on all three platforms and re-armed by itself every 60 s; also re-armed on `changeNetworks` and after every imported-account creation on native. The timer is set _before_ the `await` at `:106`, so a tick that takes longer than 60 s overlaps with the next one.
- **Blocking-what:** nothing — that is the point. Token definitions are only needed when the user opens an account that holds tokens; they are the textbook "definition download" that Rule 2 says belongs in an idle callback. As written, the tick lands wherever the 60 s timer happens to fire: mid-scroll of the transaction list, mid-typing in the send form, mid-animation on native (Hermes JS thread, where a 250 KB `JSON.parse` is a visible hitch).
- **Before:**

```ts
export const periodicCheckTokenDefinitionsThunk = createThunk<
    void,
    void,
    {
        state: PeriodicCheckTokenDefinitionsThunkState;
        extra: PeriodicCheckTokenDefinitionsThunkDeps;
    }
>(`${TOKEN_DEFINITIONS_MODULE}/periodicCheckTokenDefinitionsThunk`, async (_, { dispatch }) => {
    if (tokenDefinitionsTimeout) {
        clearTimeout(tokenDefinitionsTimeout);
    }

    tokenDefinitionsTimeout = setTimeout(() => {
        dispatch(periodicCheckTokenDefinitionsThunk());
    }, 60_000);

    await dispatch(initTokenDefinitionsThunk());
});
```

and the filter that makes a failed fetch retry forever:

```ts
if (tokenDefinitions) {
    // Filter out definition types that have data or are in a loading state
    definitionTypes = definitionTypes.filter(type => {
        const definition = tokenDefinitions[type];

        return !(definition && (definition.data || definition.isLoading));
    });
}
```

- **Proposed fix:** keep the timer as the _trigger_ but do not let the tick run inline — wrap the `dispatch(periodicCheckTokenDefinitionsThunk())` body in `requestIdleCallback(cb, { timeout: 5000 })` on web/desktop (5 s so a permanently busy app still refreshes definitions well inside the 60 s cadence) and in `InteractionManager.runAfterInteractions` on native; both need the shared helper this repo does not have yet (`requestIdleCallback` has no Safari support, RN has neither API). Independently, give the failure path exponential backoff (60 s → 2 m → 4 m, capped at ~30 m) instead of a flat 60 s, so an offline session stops re-downloading and re-parsing megabytes. The call site is already `async`, so awaiting an idle-scheduled promise is a drop-in change; the initial dispatch from `initAction.ts:98` should stay eager (definitions are wanted before fiat rates) and only the _self-rescheduled_ ticks should be idle-gated.
- **Risk / ordering:** the initial load must keep its current ordering (the comment at `initAction.ts:97` states definitions have to land before fiat rates), so only re-arm ticks may be deferred. `tokenDefinitionsTimeout` is a module-level singleton with no cancel path — an idle handle needs the same clear-on-re-entry treatment or two schedulers can end up live at once. Adding backoff changes observable retry timing for tests that assert the 60 s interval. Nothing downstream assumes a definitions refresh lands in a particular tick; the reducer is keyed by symbol/type and is idempotent.
- **Confidence:** high — I read the thunk, the reducer's `rejected` case, and all four dispatch sites, and confirmed the errored-state filter keeps retrying; the only estimated part is how often real users sit in the error state.
- **Priority:** P2 (n is bounded by the number of enabled networks, but the work repeats forever on a colder-but-permanently-live background path)

---

## F6.2 — Yield between guide articles in `useGuideSearch.ts` instead of scanning all of them in one task per keystroke

- **Anchor:** `packages/suite/src/hooks/guide/useGuideSearch.ts:66` (additional: `packages/suite/src/hooks/guide/useGuideSearch.ts:46`, `packages/suite/src/hooks/guide/useGuideSearch.ts:107`)
- **Class:** long-task
- **Platform:** web, desktop (the guide sidebar exists only in the Suite renderer)
- **What grows:** the number of guide articles under `packages/suite-data/files/guide/en-us` — 51 markdown files, 204 KB total today, and it grows every time the docs team adds a page. `search()` maps over **every** page in `pageMap` and runs `searchInFile` on each; `searchInFile` (`:46-59`) makes roughly six full passes over each article's text: `normalize('NFD')`, an accent-stripping regex, two markdown-stripping regexes, a global `.match()`, and a `.search()`. `loadPageMarkdownFile` is a dynamic `import()`, so from the second keystroke onward all 51 promises are already resolved in the module cache and all 51 `searchInFile` calls drain in a single microtask checkpoint — one uninterruptible task.
- **When it runs:** every keystroke in the guide search box, debounced by 300 ms (`:107`). The very first keystroke additionally fires 51 simultaneous dynamic imports, whose module evaluation also lands on the main thread.
- **Blocking-what:** the user typing in the guide search input. Every character re-does the whole scan; the input, the caret and the result list all wait for it.
- **Before:**

```ts
const search = async (query: string, pageMap: PageMap): Promise<SearchResult[]> => {
    const querySanitized = sanitizeQuery(query);
    const results =
        querySanitized.length < MIN_QUERY_LENGTH
            ? []
            : await Promise.all(
                  Object.keys(pageMap).map(url =>
                      loadPageMarkdownFile(url)
                          .catch(() => '')
                          .then(md => searchInFile(url, querySanitized, md)),
                  ),
              );
```

- **Proposed fix:** two levers, both cheap. (1) Replace the single `Promise.all` fan-out with a chunked loop — scan ~8 articles, `await yieldToMain()`, continue — so a keystroke arriving mid-scan is handled between batches instead of after all 51; 8 is roughly one 5 ms slice of the measured work and keeps the number of yields low enough that the `setTimeout(0)` fallback never reaches the five-nested-timeout 5 ms clamp. `search` is already `async` and already called from a cancellable effect, so this is a local change. (2) Hoist the per-article invariant work out of the keystroke path entirely: `searchInFile` re-runs `removeAccents` + both markdown-stripping regexes on the _same_ markdown for every query, when only `new RegExp(query)` changes — cache the sanitized text per url on first load so each keystroke only pays the two regex scans. Feeding the results through `startTransition` would also stop the result list re-render from piling onto the same task.
- **Risk / ordering:** the effect already has an `active` guard and clears its debounce timer on cleanup, so a chunked loop just needs to check `active` between batches and bail — that is strictly better than today, where a superseded search still runs to completion. Results are sorted after collection, so batch order does not affect ranking. No cancel path exists for the in-flight dynamic imports, but that is unchanged by this fix.
- **Confidence:** medium — the mechanism is verified by reading the hook, `loadPageMarkdownFile` (`useGuideLoadArticle.ts:5`) and the consumer (`GuideSearch.tsx:51`), and I measured the corpus at 204 KB / 51 files. What I did **not** do is profile it: ~1.2 MB of string work per keystroke plausibly lands in the 10–30 ms range on a desktop machine, i.e. under the 50 ms long-task bar on fast hardware and over it on slow hardware. Treat the size of the win as unmeasured.
- **Priority:** P3 (n is content-bounded rather than user-data-bounded, and the guide search is a cold path)

---

## Checked and deliberately dropped (so this ground is not re-walked)

- **`packages/suite/src/actions/suite/initAction.ts:66` — `await dispatch(initMessageSystemThunk())`.** This awaits `PollingController.restart`, which awaits the _first_ `fetchConfigThunk` before starting the interval, and that fetch has a 30 s ceiling (`FETCH_TIMEOUT_IN_MS`, `messageSystemConstants.ts:39`), with a bundled local JWS as fallback. It genuinely holds boot. **Dropped on purpose:** `initAction.ts:78-79` reads `selectActiveKillswitchMessage` immediately afterwards and returns before Connect init — this is precisely the "killswitch check must gate the UI" prerequisite the brief says to drop. (Noting it anyway because the _30 s_ timeout, not the await, is the arguable defect: the local config could gate the UI immediately and the remote one re-gate on arrival.)
- **`packages/suite-web/src/MainWeb.tsx:52` and `packages/suite-desktop-ui/src/MainDesktop.tsx:61` — `initSentry()` before the first `root.render`.** Real work before first paint (global handlers, fetch/XHR/history instrumentation, and, once analytics consent is stored, `browserTracingIntegration` + `browserProfilingIntegration`). Dropped: deferring it means losing boot-time crash reports, and the pageload transaction has to start at pageload to measure anything. Net-negative change.
- **`suite/sentry/src/config.ts:71` — `beforeSend = event => redactSentryEvent(redactUserPath(redactCoinjoinData(event)))`.** `redactUserPath` does a full `JSON.stringify` → regex → `JSON.parse` of the event _before_ `redactSentryEvent` applies the consent gate and the 100-events/hour cap, so events that will be discarded still pay for it. Real waste, but bounded (`maxBreadcrumbs: 40`, `normalizeDepth: 4`, `suiteLog` sliced to 30) and the fix is reordering, not a scheduling primitive.
- **Token-definitions download size.** I checked the actual payloads on `data.trezor.io` rather than assuming: 229 KB / 290 KB / 156 KB, i.e. a few ms of `JSON.parse`. The "definition parse is a long task" hypothesis is **false** — the retry cadence (F6.1), not the parse, is the defect.
- **`packages/suite/src/storage/migrations/index.ts`** (cursor loops over all accounts/txs at `:918`, `:963`). Dropped: these run inside an IndexedDB `versionchange` transaction, which auto-commits the moment you await anything non-IDB — chunk+yield is not applicable there.
- **`packages/suite/src/support/suite/preloadStore.ts:63`.** Already parallel via `Promise.all`; the unbounded part (hydrating all txs into the store) is the already-filed `packages/suite/src/reducers/store.ts:191`.
- **`suite-common/logger/src/logsSlice.ts:17` / `logsSelectors.ts:51` / `packages/suite/src/utils/suite/logsUtils.ts:31`.** Log ring buffer is hard-capped at `MAX_ENTRIES = 200`; the un-memoized `prettifyLog` on every render of the log modal is a memoization issue, which belongs to performance-react-hooks.
- **`packages/analytics-uploader/src/analytics.ts:76` — `flushQueue`.** Fires the queued reports in one loop, but the queue only buffers events between app start and consent resolution (tens at most), and each `report` only kicks off a `fetch`.
- **`packages/suite-desktop-ui/src/support/DesktopUpdater.tsx:70` — `desktopApi.checkForUpdates` in a mount effect.** The renderer only sends an IPC message; the fetching happens in the Electron main process, which is outside the threads this skill covers.
- **`packages/suite/src/middlewares/suite/messageSystemMiddleware.ts:39` and the native twin at `suite-native/message-system/src/messageSystemMiddleware.ts:45`.** `getValidMessages` iterates `config.actions`, which is a couple of dozen entries from a signed config — bounded, and it only runs on device/transport/network/geolocation changes.
- **`suite/trading/src/tradingMiddleware.ts:23` (geolocation fetch), `packages/suite-desktop-ui/src/support/DesktopUpdater/JustUpdated.tsx:24` (changelog fetch), `packages/suite/src/support/suite/ConnectedIntlProvider.tsx:14` and `packages/suite/src/hooks/suite/useLocales.ts:37` (translation / date-fns locale loading).** All single bounded fetches on paths where the user is waiting for exactly that data.
