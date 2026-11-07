---
name: performance-code-splitting
description: Code splitting for Trezor Suite web and desktop — what belongs behind `import()` or `React.lazy`, where the boundary goes, how a failed chunk load and its retry behave, and the production-build measurement that proves a split. Use when adding a dependency or feature only some users reach, when writing `import()` or `lazy()`, or when a bundle-size change is claimed.
---

# Code Splitting

The boot set is everything a user downloads and evaluates before the app renders: on web the `main`
entry plus the `app` chunk group, measured in gzip because it is served over the wire; on desktop the
renderer's initial chunks, measured raw because the asar ships them uncompressed. Every static import
reachable from the composition root lands there, including thunks, middlewares and providers that only
one feature uses ([#28882](https://github.com/trezor/trezor-suite/issues/28882)). Routes are already
split on web ([webComponents.ts](../../suite-app/web-app/src/support/webComponents.ts)); the rules below
are about everything else.

## Split what a user may never reach, not what first paint needs

A library or feature behind a user action or a feature gate is a candidate: the QR scanner
([#32641](https://github.com/trezor/trezor-suite/pull/32641)), charts
([#32654](https://github.com/trezor/trezor-suite/pull/32654)), markdown
([#34557](https://github.com/trezor/trezor-suite/pull/34557)), an SDK a provider or a thunk calls
([#32720](https://github.com/trezor/trezor-suite/pull/32720),
[#34552](https://github.com/trezor/trezor-suite/pull/34552),
[#34564](https://github.com/trezor/trezor-suite/pull/34564)), modals
([#34604](https://github.com/trezor/trezor-suite/pull/34604)), generated schemas
([#34587](https://github.com/trezor/trezor-suite/pull/34587)). What the first screen renders
unconditionally is not: lazy loading the boot spinner only adds a white screen and one more round
trip ([#32652](https://github.com/trezor/trezor-suite/pull/32652#discussion_r4070307910)).

- **A dependency the boot path reaches synchronously cannot be split; replace it** with something
  already in the boot set: `yup` → `zod` ([#34606](https://github.com/trezor/trezor-suite/pull/34606)),
  `react-helmet-async` → React 19 `<title>` hoisting
  ([#34605](https://github.com/trezor/trezor-suite/pull/34605)), the Node `crypto` polyfill →
  `@noble/*` ([#34584](https://github.com/trezor/trezor-suite/issues/34584)).
- **Bytes leave only with the last importer.** A module stays in the boot set while any static path
  to it remains: a barrel re-export (`export *` of `TransactionsGraph` kept `recharts` in the boot set
  until the barrel entry was removed, #32654), another consumer (`@noble/curves` stays on web through
  connect-core, [#34593](https://github.com/trezor/trezor-suite/pull/34593)), or a package without a
  `sideEffects` field ([#32665](https://github.com/trezor/trezor-suite/pull/32665)). Trace every static
  path before writing `import()`; a split with a leak left behind is a no-op.
- **Desktop keeps its route map static** ([desktopComponents.ts](../../suite-app/desktop-app-renderer/src/support/desktopComponents.ts),
  note 2): the lazy-route attempt measured dashboard content ~380 ms later on first visit
  ([#34594](https://github.com/trezor/trezor-suite/pull/34594)). Split libraries and modals on desktop,
  not pages.

## Put `import()` at the point of use and keep the public API

The boundary belongs inside the module that owns the dependency — the provider class, util, client
module or DI composition root — after any cheap early return, so no caller changes. Types stay static
as `import type`. A function that becomes async returns the `Result` its callers already handle instead
of throwing ([#34593](https://github.com/trezor/trezor-suite/pull/34593)); a DI contract the load crosses
is widened to carry the failure ([#34563](https://github.com/trezor/trezor-suite/pull/34563)).

```ts
// bad - the whole SDK in the boot set for the one thunk that uses it
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';

// good - walletConnectThunks.ts - loaded by the thunk that needs it, after its early returns
const { getSdkError, buildApprovedNamespaces } = await import('@walletconnect/utils');
```

For a component, move the heavy part into its own module (`SelectInner`, `QrCodeInner`,
`TimerangeCalendar`) and keep the chrome — the sized box, tabs, buttons, `FormCell` — eager, so layout and
controls survive both loading and failure. `Suspense` sits at the render site, after the gate
(`useSelector`, the open check): a lazy manager that `ModalSwitcher` renders unconditionally fetches on
every boot ([#34604](https://github.com/trezor/trezor-suite/pull/34604)). Drop the raw component from
the barrel and mark it "do not use directly"
([TransactionsGraphLoader.tsx](../../packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraphLoader.tsx)),
and move providers that exist only for the lazy dependency across the boundary too
(`SelectCacheProvider`, [#34559](https://github.com/trezor/trezor-suite/pull/34559)).

```tsx
// good - TransactionsGraphLoader.tsx - a named export mapped to default, nothing else in the chunk's way
const TransactionsGraph = lazy(() =>
    import('./TransactionsGraph').then(module => ({ default: module.TransactionsGraph })),
);
```

## Keep `import()` statically analyzable

- **Destructure at the `await import()`, or name the exports with `webpackExports`** when the promise
  is passed around. A helper returning the whole namespace shipped the SDK's unused uploader and
  downloader: +7.8 KB gzip ([#34552](https://github.com/trezor/trezor-suite/pull/34552)).
- **Never import a barrel and index it at runtime.** `import('date-fns/locale')` plus `module[lang]`
  kept all 96 locales (~2 MB) instead of 16; a map of literal `import('date-fns/locale/cs')` calls fixed
  it ([#32660](https://github.com/trezor/trezor-suite/pull/32660)). Files in one directory may use a
  template literal with `/* webpackChunkName: "translations/[request]" */`
  ([useIntlMessages.ts](../../suite/intl/src/hooks/useIntlMessages.ts)).
- **Group many small boundaries with `webpackChunkName`** so a feature does not fragment into a chunk
  per component: the modals split into nine groups (#34604), pages share their area's group
  (`"wallet"`, `"settings"`). The name never reaches the filename (`chunkFilename` is
  `js/[id].[contenthash:8].js` in
  [createBaseConfig.ts](../../packages/suite/webpack/createBaseConfig.ts)); identify a chunk by what it
  contains.

## Cache the load, never the failure

A loader keeps the in-flight promise so concurrent callers share one download, and clears it on
rejection so the next call downloads again.

```ts
// good - client.ts (@suite-common/tx-simulation) - one client per app, a failed load is not cached
blockaidClientPromise ??= createBlockaidClient().catch(error => {
    blockaidClientPromise = null;
    throw error;
});
```

- **A react-query `queryFn` must reject.** Catching the `import()` and resolving a fallback caches the
  fallback for the session under `staleTime: Infinity`; rejecting leaves retry and `refetchOnReconnect`
  to react-query while the consumer renders `data ?? fallback`
  ([#33319](https://github.com/trezor/trezor-suite/pull/33319#discussion_r4246069222),
  [useDateFnsLocale.ts](../../suite/intl/src/hooks/useDateFnsLocale.ts)).
- **`React.lazy` caches a rejection for the life of that component.** A retry needs a fresh `lazy()`:
  pin the wrapper per mount with `useState(() => Lazy)` and re-arm the module-level one from a
  `useEffect` of the stand-in the loader resolves on failure. Re-arming inside the loader's `catch`
  re-renders the uncommitted tree every time a load settles: 67 chunk requests in 269 ms on one mount
  ([#34559](https://github.com/trezor/trezor-suite/pull/34559)). A plain `lazy()` with no retry leaves
  the component dead until reload (#34604).
- **A fire-and-forget preload swallows its own rejection** (`preload().catch(() => undefined)`); the
  first real use reports the failure (#34552).

```tsx
// good - Markdown.tsx - one download per mount, the next mount retries a failed load
let ReactMarkdown: LazyExoticComponent<ComponentType<Options>>;

const loadReactMarkdown = () =>
    import(/* webpackExports: ['default'] */ 'react-markdown').catch(() => {
        const failedReactMarkdown = ReactMarkdown;
        const PlainTextMarkdown = ({ children }: Options) => {
            // Re-armed after the commit, not in the loader: a fresh lazy there downloads again
            useEffect(() => {
                if (ReactMarkdown === failedReactMarkdown) ReactMarkdown = lazy(loadReactMarkdown);
            }, []);

            return <PlainText>{children}</PlainText>;
        };

        return { default: PlainTextMarkdown };
    });

ReactMarkdown = lazy(loadReactMarkdown);

export const Markdown = (options: Options) => {
    const [MountedReactMarkdown] = useState(() => ReactMarkdown);

    return (
        <Suspense fallback={null}>
            <MountedReactMarkdown {...options} />
        </Suspense>
    );
};
```

## A failed chunk follows the existing error contract

Where callers expect a `Result`, return the error result (`CONNECTIVITY_ERROR` in #34552,
`ProofOfDelegatedSignFailed` in #34593); where they already handle a rejection, reject (`run()` →
Connect's `success: false`, [#34585](https://github.com/trezor/trezor-suite/pull/34585); react-query's
error state, #34587); a component degrades in place (plain text, #34557; a disabled control of the same
size, #34559). A bare rejection where callers never handled one leaves the UI stuck: a click that
does nothing, a modal that never closes. A component that must mount in the same commit as the action
opening it stays eager: the modals that set `preserve` from a
mount effect were reset by `CLOSE_UI_WINDOW` before they mounted, which the `t3w1-create-wallet` e2e
caught (#34604).

## The fallback keeps the size, a preload keeps the timing

- `fallback={null}` inside an always-rendered wrapper when nothing rendered during loading before; a
  placeholder of the final size, computed from the content, when the lazy part has one (the calendar's
  rows per month and locale, [#34596](https://github.com/trezor/trezor-suite/pull/34596); the control
  height, #34559). A skeleton that duplicates the component's own loading state shows, disappears and
  shows again ([#32654](https://github.com/trezor/trezor-suite/pull/32654#discussion_r4069466670)).
- **User-activation work must not wait for a download.** An OAuth popup or a clipboard write started by
  a click is blocked when the chunk is fetched after the click: preload when the surface offering the
  action mounts (#34552). A synchronous consumer preloads at composition (the Cardano address validator,
  [#34562](https://github.com/trezor/trezor-suite/pull/34562)). A chunk that post-processes a network
  response starts alongside it: `Promise.all([fetchConfig(), preloadJws()])`
  ([#34595](https://github.com/trezor/trezor-suite/pull/34595)).

## Platforms differ

- Connect core runs in the desktop main process, so a split inside it changes only web (#34585); desktop
  has no lazy routes, so a component already inside a lazy web route still saves on desktop (#34596).
  Report both.
- `suite-native` ships one Metro bundle in release, so `import()` in shared code buys nothing there, and
  in development a package that resolves to `.cjs` fails at startup with "Requiring unknown module"
  unless `cjsAsyncChunkPackages` in [metro.config.js](../../suite-native-app/app/metro.config.js) lists
  it ([#32775](https://github.com/trezor/trezor-suite/pull/32775)). `@metro-ignore` only hides the
  failure. Check the native dev build for any `import()` added to shared code.

## Prove it with a production build

- Build both apps in production and compare the boot set and all JS, raw and gzip, against `develop`
  (`yarn workspace @suite-app/web-app analyze`, `yarn suite:build:web:preview`). A split is relocation,
  not deletion: expect +1–2 KB gzip of loader overhead per chunk, and read more as lost tree-shaking.
  A dependency shared between the boot chunk and a lazy chunk is duplicated into every lazy chunk that
  needs it once it leaves the boot set (#34585).
- Boot membership comes from chunk groups (web: the `main` entrypoint plus the `app` group; desktop: the
  `main` entrypoint), never from a module id grepped out of a chunk: a boot chunk referencing an id is
  what `import()` compiles to. The vite dev server does not reproduce the production graph
  ([#32652](https://github.com/trezor/trezor-suite/pull/32652#discussion_r4071455247)).
- A static import anywhere in the graph defeats the split silently. Delay the lazy module with a
  `setTimeout` in the loader and watch whether the library loads before it
  ([#32652](https://github.com/trezor/trezor-suite/pull/32652#discussion_r4070831313)).
- Unit tests mock the module to throw (`jest.doMock` under `jest.isolateModulesAsync` or after
  `jest.resetModules()`), assert the error contract and that the next call loads again; a lazy component
  loads once per mount across re-renders and again on the next mount (#34557, #34559, #34564). A loader
  map keyed by an enum pins every key to its entry, since pointing `'ja-JP'` at the Spanish subpath
  compiles (#32660). Then hide the chunk file of the production build, confirm the degraded behaviour,
  restore it and confirm the feature loads again without a page reload.

## Related skills

- [Long and non-essential tasks](../performance-scheduling/SKILL.md) — when to defer a preload or
  background work.
- [React hooks](../performance-react-hooks/SKILL.md) — memoization, dependency arrays, render loops.
- [Packages](../packages/SKILL.md) — workspace manifests and dependency declarations.
