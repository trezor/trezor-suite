# P3 scheduling cleanups — four bounded call sites, and one where the skill's own example is wrong for this repo

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — sections _"Break a long task up and yield to the main thread"_ and _"Schedule non-essential work in an idle callback"_. Five findings that are each too small to carry an issue of their own: in every case `n` is bounded by content the app ships or fetches, or the cost is a single process spawn, or the win is a re-ordering of latency rather than a removed long task. They are collected so the ground is not re-walked.

Item 1 is the skill's own `bad` example, quoted verbatim in `SKILL.md`. The finding there is that **the repo deliberately does not follow it**: the mechanical `requestIdleCallback` wrap the skill shows would break a documented ordering guarantee, and the work it defers is a few field assignments. That belongs back in `SKILL.md`, not in `Preloader.tsx`.

Items 2 and 3 are suite-native, so the writer brief's `InteractionManager` correction applies to both. On the pinned `react-native@0.85.3` ([`suite-native/app/package.json:145`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/package.json#L145)) `InteractionManager` is `InteractionManagerStub` — every member `@deprecated`, `runAfterInteractions` a bare `setImmediate`, `setDeadline` literally `// Do nothing.`. Neither item proposes it; the levers used are re-ordering the network round trips (item 2) and `useDeferredValue` (item 3), both of which work on Hermes.

---

### 1. `Preloader.tsx:70` — the skill's idle-callback example is a call site the repo has a documented reason not to change

**Where.** [`packages/suite/src/components/suite/Preloader/Preloader.tsx:70`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L70) dispatches `analyticsActions.init()` from a mount effect, under a three-line comment ([`:67`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L67)–[`:69`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L69)) explaining why it must not move. The next effect ([`:73`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L73)–[`:77`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L77)) starts the whole app boot chain, and the render gate at [`:89`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L89) picks the consent screen. `SKILL.md` quotes lines 70–71 as its `bad` example at [`skills/performance-scheduling/SKILL.md:51`](https://github.com/trezor/trezor-suite/blob/develop/skills/performance-scheduling/SKILL.md#L51), with the comment stripped.

**Before** — `Preloader.tsx:66`–`:71`:

```tsx
useEffect(() => {
    // Analytics needs to be resolved before we show anything to the user. Until this is solved,
    // we do not init anything. Especially nothing related to the devices/connect. With THP,
    // the autoconnect flow may be automatically triggered, resulting in Suite vs. Device Screen inconsistency.
    dispatch(analyticsActions.init());
}, [dispatch]);
```

**After** — no change to `Preloader.tsx`. The change belongs in the skill, which should stop pointing at a call site the repo has decided against and use a genuine idle candidate from this sweep instead — the metadata fetch at [`packages/suite/src/actions/suite/initAction.ts:123`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L123), which is `p2-01`:

```ts
// bad - initAction.ts - metadata for every known device is fetched on the boot path
dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices());

// good - the user sees the app first; the timeout guarantees it still runs
runWhenIdle(() => dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices()), {
    timeout: 2000,
});
```

(`runWhenIdle` is the shared `@trezor/utils` helper introduced by whichever of this sweep's issues lands first.)

**Why it is P3 — and why the mechanical fix is wrong here.** The thunk is bounded and cheap: six selector reads, one options object, `services.analytics.init(...)`, `allowSentryReport`, `setSentryUser`, one dispatch ([`analyticsActions.ts:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts#L66)–[`:103`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts#L103)); `QueuedAnalytics.init` itself is field assignment plus a queue flush ([`packages/analytics-uploader/src/analytics.ts:45`](https://github.com/trezor/trezor-suite/blob/develop/packages/analytics-uploader/src/analytics.ts#L45)). No loop, nothing that grows. Deferring it recovers microseconds and costs the ordering the comment describes: effect 1 must run before effect 2, because effect 2 reaches `TrezorConnect.init` and, with THP, autoconnect. In an idle callback effect 2 wins that race, and device discovery starts before the analytics instance and the Sentry user exist.

Two honest corrections to the comment, so a reviewer can judge it rather than take it:

- **It is not the consent gate that is at risk.** `analytics.confirmed` is restored from IndexedDB into the _preloaded_ state before the tree first renders ([`preloadStore.ts:73`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/preloadStore.ts#L73) → [`store.ts:190`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/store.ts#L190) → the `storageLoad` matcher at [`analyticsReducer.ts:53`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/analytics-redux/src/redux/analyticsReducer.ts#L53)), and `init()` writes the same `confirmed` value back that it read. So `isAnalyticsConsentConfirmed` is already correct on the first render, with or without this dispatch.
- **Analytics events are not lost, Sentry attribution is.** Suite constructs its analytics with `useQueue: true` ([`suite/analytics/src/createAnalytics.ts:17`](https://github.com/trezor/trezor-suite/blob/develop/suite/analytics/src/createAnalytics.ts#L17)), so reports fired before `init` are queued and flushed. What has no queue is `allowSentryReport(isAnalyticsEnabled)` and `setSentryUser(instanceId)` at [`analyticsActions.ts:93`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts#L93)–[`:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts#L94) — boot-time Sentry events would go out unattributed and possibly past the wrong consent gate.

So the ordering constraint is real but narrower than written, and the deferral still buys nothing measurable. **Recommendation: close the code side, fix the skill.**

---

### 2. `useAllTradesReloadTimer.ts:38` — the trade refresh serialises one HTTP round trip per watched trade

**Where.** [`suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.ts:38`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.ts#L38) awaits `watchTradeThunk` inside a nested loop over [`:36`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.ts#L36)'s account groups. Each thunk awaits a `tradeApi.watchTrade` call ([`suite-common/trading/src/thunks/common/watchTradeThunk.ts:37`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/thunks/common/watchTradeThunk.ts#L37)), so the last trade in the list refreshes `n` round trips after the first. `n` is every persisted trade in a non-final status ([`suite-native/trading-state/src/selectors/commonSelectors.ts:406`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/trading-state/src/selectors/commonSelectors.ts#L406)). The loop runs on the first mount of `useWatchAllTrades`, then every 120 s while mounted, and on manual refresh ([`useWatchAllTrades.ts:31`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useWatchAllTrades.ts#L31)–[`:39`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useWatchAllTrades.ts#L39)).

**Before** — `useAllTradesReloadTimer.ts:35`–`:46`:

```ts
// Refresh all trades that need watching
for (const { account, trades } of tradesByAccount) {
    for (const trade of trades) {
        await dispatch(
            tradingThunks.watchTradeThunk({
                account,
                trade,
                refreshCount: resetCount,
            }),
        );
    }
}
```

**After** — parallel within an account, sequential across accounts:

```ts
// Accounts stay sequential because watchTradeThunk sets a per-account key on shared
// TradeApi state; trades within one account share the descriptor, so they can overlap.
for (const { account, trades } of tradesByAccount) {
    await Promise.all(
        trades.map(trade =>
            dispatch(
                tradingThunks.watchTradeThunk({
                    account,
                    trade,
                    refreshCount: resetCount,
                }),
            ),
        ),
    );
}
```

**Why it is P3.** The awaits already yield the JS thread, so nothing is blocked — this is latency serialisation, not a long task, and the user is looking at stale statuses rather than a frozen screen. `n` has no hard cap (trades are persisted and non-final ones are never collected), but I could not establish a realistic figure for a typical user, and the refresh loop stops after 40 resets anyway ([`useReloadTimer.ts:11`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useReloadTimer.ts#L11)). The constraint that keeps this from being a flat `Promise.all` is real: `tradeApi.createApiKey(account.descriptor)` at [`watchTradeThunk.ts:56`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/thunks/common/watchTradeThunk.ts#L56) mutates static state on `TradeApi` ([`tradeApi.ts:116`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/tradeApi.ts#L116)), so two accounts in flight at once would race on the key. Grouping by account is what the selector already hands us, so the fix costs nothing structurally. A reviewer should push on whether the sequencing was deliberate rate-limiting — nothing in the code says so, and if it was, the answer is a comment rather than the current shape. The existing test file asserts trade selection and the timer reset ([`useAllTradesReloadTimer.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.test.ts)), none of which the batching changes.

---

### 3. `InactiveTokensTab.tsx:62` — the Stellar token search filters and re-keys the list on every keystroke, with `n = 37`

**Where.** [`suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx:62`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx#L62) filters `inactiveTokens` from `searchQuery`, which `SearchInput` writes on every character with no debounce ([`:137`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx#L137)) — unlike `@suite-native/search`'s `SearchForm`, which debounces by 200 ms. Every keystroke hands `FlashList` a fresh `data` array ([`:131`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx#L131)) and invalidates `renderItem`, which depends on `filteredTokens.length` ([`:126`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx#L126)), in the same synchronous render.

**Before** — `InactiveTokensTab.tsx:59`–`:73`:

```tsx
const [searchQuery, setSearchQuery] = useState('');
const isComposingFeesRef = useRef(false);

const filteredTokens = useMemo(() => {
    if (!searchQuery) return inactiveTokens;

    const query = searchQuery.toLowerCase();

    return inactiveTokens.filter(
        token =>
            token.symbol?.toLowerCase().includes(query) ||
            token.name?.toLowerCase().includes(query) ||
            token.contract.toLowerCase().includes(query),
    );
}, [inactiveTokens, searchQuery]);
```

**After** — the input keeps keystroke priority, the list re-filters at transition priority (`useDeferredValue` added to the `react` import on line 1):

```tsx
const [searchQuery, setSearchQuery] = useState('');
const deferredSearchQuery = useDeferredValue(searchQuery);
const isComposingFeesRef = useRef(false);

const filteredTokens = useMemo(() => {
    if (!deferredSearchQuery) return inactiveTokens;

    const query = deferredSearchQuery.toLowerCase();

    return inactiveTokens.filter(
        token =>
            token.symbol?.toLowerCase().includes(query) ||
            token.name?.toLowerCase().includes(query) ||
            token.contract.toLowerCase().includes(query),
    );
}, [inactiveTokens, deferredSearchQuery]);
```

**Why it is P3 — and the scan's sizing was wrong.** The scan assumed a "multi-thousand-entry" list. It is not. `inactiveTokens` derives from `selectCoinDefinitions(state, 'xlm')` ([`useInactiveStellarTokens.ts:51`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-stellar-token-management/src/hooks/useInactiveStellarTokens.ts#L51)–[`:77`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-stellar-token-management/src/hooks/useInactiveStellarTokens.ts#L77)), which is the `simple` definitions payload fetched at [`tokenDefinitionsUtils.ts:118`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsUtils.ts#L118). I fetched both variants of `stellar.simple.coin.definitions.v1.json` at HEAD: **37 entries, 2,369 bytes** on `stable`, the same 37 on `develop`. Three `toLowerCase().includes()` over 37 items is not a long task on any device, and never will be at that order of magnitude. So the argument for this change is not jank; it is (a) consistency with the house pattern, since every other suite-native search box goes through the debounced `SearchForm`, and (b) headroom, since the list size is set by a remote file outside the app's control. **A reviewer can reasonably reject this as cosmetic**, and should, unless the Stellar asset list is expected to grow by orders of magnitude. The one thing it does buy today is that `FlashList` re-keying its window stops landing on the keystroke's frame. `SearchInput` here is uncontrolled — no `value` prop is passed at [`:136`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountAssets/InactiveTokensTab.tsx#L136) — so the typed characters are painted natively and never waited on React either way. Nothing outside render reads `filteredTokens`, so no cancel path is needed; the empty state and the first/last row rounding tolerate a one-frame-stale value.

---

### 4. `useGuideSearch.ts:66` — the guide search scans all 51 articles in one uninterruptible pass per keystroke

**Where.** [`packages/suite/src/hooks/guide/useGuideSearch.ts:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideSearch.ts#L66) fans out over every page in `pageMap` with `Promise.all`. `loadPageMarkdownFile` is a dynamic `import()` ([`useGuideLoadArticle.ts:5`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideLoadArticle.ts#L5)), so from the second keystroke on all promises resolve from the module cache and every `searchInFile` ([`:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideSearch.ts#L46)–[`:59`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideSearch.ts#L59)) drains in a single microtask checkpoint. The effect debounces by 300 ms ([`:7`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideSearch.ts#L7), used at [`:114`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideSearch.ts#L114)) and guards its result with `active` ([`:105`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideSearch.ts#L105), [`:110`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/guide/useGuideSearch.ts#L110)), but a superseded scan still runs to completion.

**Before** — `useGuideSearch.ts:61`–`:72`:

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

**After** — chunked, with an unconditional yield and a bail-out between batches:

```ts
const CHUNK_SIZE = 8;

const search = async (
    query: string,
    pageMap: PageMap,
    isActive: () => boolean,
): Promise<SearchResult[]> => {
    const querySanitized = sanitizeQuery(query);

    if (querySanitized.length < MIN_QUERY_LENGTH) return [];

    const urls = Object.keys(pageMap);
    const results: ReturnType<typeof searchInFile>[] = [];

    for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
        const batch = await Promise.all(
            urls.slice(i, i + CHUNK_SIZE).map(url =>
                loadPageMarkdownFile(url)
                    .catch(() => '')
                    .then(md => searchInFile(url, querySanitized, md)),
            ),
        );

        if (!isActive()) return [];

        results.push(...batch);

        await yieldToMain();
    }
```

with the caller at `:108` passing the guard it already keeps:

```ts
search(query, pageMap, () => active);
```

**Why it is P3 — `n` is bounded, and does not grow on its own.** The corpus is exactly **51 markdown files** under `packages/suite-data/files/guide/en-us` (51 `"type":"page"` nodes in [`packages/suite-data/files/guide/index.json`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-data/files/guide/index.json)), **64,249 bytes concatenated** — about 63 KB, not the 204 KB the scan reported, which was disk allocation for 51 small files. It grows only when the docs team adds a page, so this is content-bounded, not user-data-bounded: there is no wallet size, no transaction history, no account count behind it. `searchInFile` makes roughly six passes over each article, so a keystroke is on the order of a few hundred KB of string work — plausibly under the 50 ms long-task bar on a desktop machine and over it on slow hardware. **This is unmeasured; treat the size of the win as unknown.** The concrete, non-speculative gains are the two the shape gives for free: a superseded search now stops instead of finishing, and a keystroke arriving mid-scan is handled after ~8 articles instead of after 51. `CHUNK_SIZE` of 8 keeps the yield count at seven, comfortably under the five-nested-`setTimeout` clamp that the Safari fallback path would otherwise hit. Sorting happens after collection, so batch order does not affect ranking. The second lever the scan identified — caching each article's sanitized text, since only `new RegExp(query)` changes between keystrokes — is a strictly bigger win and is deliberately left out of the `After` here to keep the diff to one shape change; it should be a follow-up. Nothing tests this hook.

---

### 5. `info.ts:63` — `getComputerName` spawns a subprocess synchronously on the desktop `TrezorConnect.init` path

**Where.** [`packages/suite-desktop-core/src/libs/info.ts:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/info.ts#L63) and [`:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/info.ts#L66) call `execSync` on macOS and Linux. The only call site is [`packages/suite-desktop-core/src/modules/trezor-connect.ts:145`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L145), inside the `method === 'init'` branch of the ipc-proxy handler, two lines after an `await getStoredFirmwares()` ([`:141`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L141)) and twelve before `await TrezorConnect.init(settings)` ([`:157`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/trezor-connect.ts#L157)).

**Before** — `info.ts:55`–`:75`:

```ts
export const getComputerName = () => {
    try {
        let name;
        switch (process.platform) {
            case 'win32':
                name = process.env.COMPUTERNAME;
                break;
            case 'darwin':
                name = execSync('scutil --get ComputerName').toString().trim();
                break;
            case 'linux':
                name = execSync('hostnamectl --pretty').toString().trim();
                break;
        }

        return name || os.hostname();
    } catch {
        // Fallback - executed binaries might not be available
        return os.hostname() || capitalizeFirstLetter(process.platform);
    }
};
```

**After** — async, and resolved once per app run:

```ts
const execFileAsync = promisify(execFile);

export const getComputerName = async () => {
    try {
        let name;
        switch (process.platform) {
            case 'win32':
                name = process.env.COMPUTERNAME;
                break;
            case 'darwin':
                name = (await execFileAsync('scutil', ['--get', 'ComputerName'])).stdout.trim();
                break;
            case 'linux':
                name = (await execFileAsync('hostnamectl', ['--pretty'])).stdout.trim();
                break;
        }

        return name || os.hostname();
    } catch {
        // Fallback - executed binaries might not be available
        return os.hostname() || capitalizeFirstLetter(process.platform);
    }
};
```

with the call site memoized through the existing `@trezor/utils` helper, so a renderer reload does not re-spawn:

```ts
const lazyComputerName = createLazy(getComputerName);
```

```ts
settings.thp.hostName = await lazyComputerName.getOrInit();
```

**Why it is P3.** `n` is one — this is not an asymptotic problem but a synchronous fork/exec on the **Electron main process**, the single thread that services every IPC channel. While it is parked in the kernel, `handshake/*`, `bridge/get-status`, `tray/get-settings` and every `ipc-proxy` call queue behind it, and the renderer is simultaneously blocked on the very `TrezorConnect.init` promise this sits inside. `hostnamectl --pretty` round-trips to systemd over D-Bus; on a machine without systemd it pays the full spawn before throwing into the `catch`. Windows already takes the `process.env.COMPUTERNAME` path and is unaffected, and `os.hostname()` is a syscall that stays synchronous. **No measurement is claimed here.** The `await` must land above line 157, which is trivially satisfied since the handler is already `async`. The value is user-visible — it becomes the THP host name the device shows when pairing — so memoizing means an OS computer-name change mid-session is missed until restart, which is acceptable. `getComputerName` is exported and would become `Promise<string>`; it has exactly one consumer, so the blast radius is that one line. `getComputerInfo` and `getBuildInfo` in the same file are untouched: they are debug-mode only and use pure `os` calls.

---

## Notes

- **The After hunks have not been compiled.** All five are written against the surrounding types by reading. Item 5 additionally needs `execFile`/`promisify` imports in `info.ts` and `createLazy` in `trezor-connect.ts`; item 3 needs `useDeferredValue` on line 1; item 4 needs `yieldToMain`.
- **`skills/performance-scheduling/SKILL.md` needs two corrections, and this document is the case for both.** First, its `bad`/`good` pair at [`:51`](https://github.com/trezor/trezor-suite/blob/develop/skills/performance-scheduling/SKILL.md#L51)–[`:62`](https://github.com/trezor/trezor-suite/blob/develop/skills/performance-scheduling/SKILL.md#L62) names a call site the repo deliberately keeps (item 1); the prose at [`:47`](https://github.com/trezor/trezor-suite/blob/develop/skills/performance-scheduling/SKILL.md#L47) states it as fact. Second, [`:11`](https://github.com/trezor/trezor-suite/blob/develop/skills/performance-scheduling/SKILL.md#L11) calls `InteractionManager.runAfterInteractions` React Native's nearest equivalent to `requestIdleCallback`; on the pinned RN it is `setImmediate` with a nicer name and no interaction, frame or deadline awareness. Both are sweep-wide, not specific to this document.
- **Only item 4 needs a shared helper.** `yieldToMain` lands in `packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils` — a published-package addition, introduced by whichever of this sweep's issues lands first. Item 5 reuses `createLazy`, which is already exported ([`packages/utils/src/index.ts:25`](https://github.com/trezor/trezor-suite/blob/develop/packages/utils/src/index.ts#L25)). Items 1–3 add no dependency. `packages/suite`, `packages/suite-desktop-core` and both suite-native packages are private, so nothing else here is a published-API change.
- **What the user could notice.** Item 3 makes the token list lag the input by a frame or two — intended, and imperceptible at 37 rows. Item 4 makes results arrive in the same 300 ms-debounced window as today, just interleaved with the yields; the only visible change is that a search abandoned mid-scan stops producing work. Items 1, 2 and 5 change nothing the user sees except that trade statuses and the desktop init settle sooner.
- **Where a reviewer should push back first.** Item 3 is the weakest and should probably be dropped on its own merits (`n = 37`, verified). Item 2's parallelism claim rests on `createApiKey` being safe within a single account descriptor — verified by reading [`tradeApi.ts:116`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/trading/src/tradeApi.ts#L116), but worth a second pair of eyes because the failure mode is a wrong API key on a live trade, not a slow list. Item 4's win is unmeasured. Item 5 is the one I would keep regardless of the rest.
- **What was deliberately not changed.** Item 4's per-article sanitization cache (the bigger win) and item 3's alternative of adopting `SearchForm`'s 200 ms debounce are both left as follow-ups, so each item stays one shape change. `getComputerInfo`'s `os.cpus()` walk in the same file is untouched — it is debug-only and does not spawn anything.
- **Tests.** Only item 2 has an existing test ([`useAllTradesReloadTimer.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-trading/src/hooks/general/useAllTradesReloadTimer.test.ts)); it asserts trade selection and the timer reset, neither of which batching changes. Nothing covers `Preloader`, `InactiveTokensTab`, `useGuideSearch` or `libs/info.ts`, so none of these has a regression net and each needs manual verification.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
