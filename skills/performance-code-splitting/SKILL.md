---
name: performance-code-splitting
description: Code splitting for Trezor Suite web and desktop — what belongs behind `import()` or `React.lazy`, where the boundary goes, how a failed chunk load and its retry behave, and the production-build measurement that proves a split. Use when adding a dependency or a feature that not every user opens, when writing `import()` or `React.lazy`, or when checking how a change affects bundle size.
---

# Code Splitting

The boot set is everything a user downloads and evaluates before the app renders: on web the `main`
entry plus the `app` chunk group, measured in gzip because it is served over the wire; on desktop the
renderer's initial chunks, measured raw because the asar ships them uncompressed. Every static import
reachable from the composition root lands there, including thunks, middlewares and providers that only
one feature uses. Routes are already split on web
([webComponents.ts](../../suite-app/web-app/src/support/webComponents.ts)); the rules below are about
everything else.

## Prefer a dependency the bundler can shrink

Before adding an external package, look it up in a tool such as
[Bundlephobia](https://bundlephobia.com/): raw (minified) and gzip size, whether it is tree-shakeable
and whether it has side effects. Always prefer a package that:

- **Ships ES modules, not CommonJS.** Tree-shaking needs static `import` / `export`; expect a
  CommonJS package to land in the bundle whole.
- **Is tree-shakeable**: unused exports are removed during bundling, so the cost is what is imported,
  not what the package publishes.
- **Has no side effects, or at least declares `sideEffects` in its `package.json`.** Without the
  field the bundler keeps every module the imported entry pulls in, used or not.

The tool measures the package alone; the production build below shows what it adds to the boot set.

## Split what a user may never reach, not what first paint needs

A library or feature behind a user action or a feature gate is a candidate: a QR scanner, charts,
markdown, an SDK that one provider or thunk calls, modals, generated schemas. What the first screen
renders unconditionally is not: lazy loading the boot spinner only adds a white screen and one more
round trip.

- **A dependency the boot path reaches synchronously cannot be split; replace it** with something
  already in the boot set: a second validation library with `zod`, a head manager with React 19
  `<title>` hoisting, a Node polyfill with `@noble/*`.
- **Bytes leave only with the last importer.** A module stays in the boot set while any static path
  to it remains: a barrel re-export (`export *` of a chart component keeps `recharts` in the boot
  set), another consumer of the same library, or a workspace package without a `sideEffects` field.
  Trace every static path before writing `import()`; a split with a leak left behind is a no-op.
- **Desktop keeps its route map static**
  ([desktopComponents.ts](../../suite-app/desktop-app-renderer/src/support/desktopComponents.ts),
  note 2): lazy routes there showed dashboard content ~380 ms later on first visit. Split libraries
  and modals on desktop, not pages.

## Put `import()` at the point of use and keep the public API

The boundary belongs inside the function that uses the dependency, in the module that owns it — the
provider class, util, client module or DI composition root — after any cheap early return, so no caller
changes. `await import()` at module scope is not a split: it runs when the module is evaluated, which
for a boot module is at boot. Types stay static as `import type`. A function that becomes async returns
the `Result` its callers already handle instead of throwing; a DI contract the load crosses is widened
to carry the failure.

```ts
// bad - a static import puts the whole SDK in the boot set for the one thunk that uses it
import { buildApprovedNamespaces } from '@walletconnect/utils';

export const sessionProposalApproveThunk = createThunk(type, () => {
    const approvedNamespaces = buildApprovedNamespaces({ proposal, supportedNamespaces });
});

// good - walletConnectThunks.ts - imported inside the thunk, right before it is used
export const sessionProposalApproveThunk = createThunk(type, async () => {
    const { buildApprovedNamespaces } = await import('@walletconnect/utils');
    const approvedNamespaces = buildApprovedNamespaces({ proposal, supportedNamespaces });
});
```

For a component, move the heavy part into its own module and keep everything around it — the sized
box, tabs, buttons, the form cell — eager, so layout and controls survive both loading and failure.
`Suspense` sits at the render site, after the gate (`useSelector`, the open check): a lazy component
rendered unconditionally fetches on every boot. Drop the raw component from the barrel and mark it "do
not use directly"
([TransactionsGraph.tsx](../../packages/suite/src/components/suite/graph/TransactionsGraph/TransactionsGraph.tsx)),
and move a provider that exists only for the lazy dependency across the boundary with it.

```tsx
// good - consumers render the loader, the graph and its chart library arrive in their own chunk
const TransactionsGraph = lazy(() =>
    import('./TransactionsGraph').then(module => ({ default: module.TransactionsGraph })),
);

export const TransactionsGraphLoader = (props: TransactionsGraphProps) => (
    <Suspense fallback={null}>
        <TransactionsGraph {...props} />
    </Suspense>
);
```

## Keep `import()` statically analyzable

- **Destructure at the `await import()`, or name the exports with `webpackExports`** when the promise
  is passed around. A helper that returns the whole namespace keeps every export in the chunk: one SDK
  shipped its unused uploader and downloader that way, +7.8 KB gzip.
- **Never import a barrel and index it at runtime.** `import('date-fns/locale')` plus `module[lang]`
  keeps all 96 locales (~2 MB) instead of the 16 supported; a map of literal
  `import('date-fns/locale/cs')` calls does not
  ([useDateFnsLocale.ts](../../suite/intl/src/hooks/useDateFnsLocale.ts)). Files in one directory may
  use a template literal with `/* webpackChunkName: "translations/[request]" */`
  ([useIntlMessages.ts](../../suite/intl/src/hooks/useIntlMessages.ts)).
- **Group many small boundaries with `webpackChunkName`** so a feature does not fragment into a chunk
  per component: pages share their area's group (`"wallet"`, `"settings"`). The name never reaches the
  filename (`chunkFilename` is `js/[id].[contenthash:8].js` in
  [createBaseConfig.ts](../../suite-app/app/webpack/createBaseConfig.ts)); identify a chunk by what it
  contains.

## Cache the load, never the failure

A loader keeps the in-flight promise so concurrent callers share one download, and clears it on
rejection so the next call downloads again.

```ts
// good - one client per app, a failed load is not cached
clientPromise ??= createClient().catch(error => {
    clientPromise = null;
    throw error;
});
```

- **A react-query `queryFn` must reject.** Catching the `import()` and resolving a fallback caches the
  fallback for the session under `staleTime: Infinity`; rejecting leaves retry and `refetchOnReconnect`
  to react-query while the consumer renders `data ?? fallback`
  ([useDateFnsLocale.ts](../../suite/intl/src/hooks/useDateFnsLocale.ts)).
- **`React.lazy` caches a rejection for the life of that component.** A retry needs a fresh `lazy()`:
  pin the wrapper per mount with `useState(() => Lazy)` and re-arm the module-level one from a
  `useEffect` of the stand-in the loader resolves on failure. Re-arming inside the loader's `catch`
  re-renders the uncommitted tree every time a load settles: 67 chunk requests in 269 ms on one mount.
  A plain `lazy()` with no retry leaves the component dead until reload.
- **A fire-and-forget preload swallows its own rejection** (`preload().catch(() => undefined)`); the
  first real use reports the failure.

```tsx
// good - PlainTextMarkdown.tsx - the stand-in the loader resolves when the chunk fails to load
export type LazyMarkdownProps = Options & { onLoadFailure: () => void };

export const PlainTextMarkdown = ({ children, onLoadFailure }: LazyMarkdownProps) => {
    // An effect runs after the commit, so the retry is armed for the next mount, not this one
    useEffect(() => {
        onLoadFailure();
    }, [onLoadFailure]);

    return <PlainText>{children}</PlainText>;
};
```

```tsx
// good - Markdown.tsx - one download per mount, the next mount retries a failed load
const loadReactMarkdown = (): Promise<{ default: ComponentType<LazyMarkdownProps> }> =>
    import(/* webpackExports: ['default'] */ 'react-markdown').catch(() => ({
        default: PlainTextMarkdown,
    }));

let ReactMarkdown = lazy(loadReactMarkdown);

export const Markdown = (options: Options) => {
    const [MountedReactMarkdown] = useState(() => ReactMarkdown);

    // Never called from the loader: a fresh lazy created there downloads again right away
    const rearmReactMarkdown = () => {
        if (ReactMarkdown === MountedReactMarkdown) {
            ReactMarkdown = lazy(loadReactMarkdown);
        }
    };

    return (
        <Suspense fallback={null}>
            <MountedReactMarkdown {...options} onLoadFailure={rearmReactMarkdown} />
        </Suspense>
    );
};
```

## A failed chunk follows the existing error contract

Where callers expect a `Result`, return its error variant; where they already handle a rejection,
reject; a component degrades in place (plain text, a disabled control of the same size). A bare
rejection where callers never handled one leaves the UI stuck: a click that does nothing, a modal that
never closes. A component that must mount in the same commit as the action opening it stays eager: a
modal that calls `preserveModal()` when it mounts is closed by `CLOSE_UI_WINDOW` if it mounts one
download later.

## The fallback keeps the size, a preload keeps the timing

- `fallback={null}` inside an always-rendered wrapper when nothing rendered during loading before; a
  placeholder of the final size, computed from the content, when the lazy part has one (a calendar's
  rows for the month and locale, a control's height). A skeleton that duplicates the component's own
  loading state shows, disappears and shows again.
- **User-activation work must not wait for a download.** An OAuth popup or a clipboard write started by
  a click is blocked when the chunk is fetched after the click: preload when the surface offering the
  action mounts. A synchronous consumer preloads at composition. A chunk that post-processes a network
  response starts alongside it: `Promise.all([fetchConfig(), preloadParser()])`.

## Platforms differ

- Connect core runs in the desktop main process, so a split inside it changes only web; desktop has no
  lazy routes, so a component already inside a lazy web route still saves on desktop. Report both.
- `suite-native` ships one Metro bundle in release, so `import()` in shared code buys nothing there, and
  in development a package that resolves to `.cjs` fails at startup with "Requiring unknown module"
  unless `cjsAsyncChunkPackages` in [metro.config.js](../../suite-native-app/app/metro.config.js) lists
  it. `@metro-ignore` only hides the failure. Check the native dev build for any `import()` added to
  shared code.

## Prove it with a production build

- Build both apps in production and compare the boot set and all JS, raw and gzip, against `develop`
  (`yarn workspace @suite-app/web-app analyze`, `yarn suite:build:web:preview`). A split is relocation,
  not deletion: expect +1–2 KB gzip of loader overhead per chunk, and read more as lost tree-shaking.
  A dependency shared between the boot chunk and a lazy chunk is duplicated into every lazy chunk that
  needs it once it leaves the boot set.
- Boot membership comes from chunk groups (web: the `main` entrypoint plus the `app` group; desktop: the
  `main` entrypoint), never from a module id grepped out of a chunk: a boot chunk referencing an id is
  what `import()` compiles to. The vite dev server does not reproduce the production graph.
- A static import anywhere in the graph defeats the split silently. Delay the lazy module with a
  `setTimeout` in the loader and watch whether the library loads before it.
- Unit tests mock the module to throw (`jest.doMock` under `jest.isolateModulesAsync` or after
  `jest.resetModules()`), assert the error contract and that the next call loads again; a lazy component
  loads once per mount across re-renders and again on the next mount. For a map of loaders
  (`'ja-JP': () => import('date-fns/locale/ja')`), test that every key loads the module it names: all
  loaders share one type, so `'ja-JP'` pointing at the Spanish locale still compiles. Then hide the
  chunk file of the production build, confirm the degraded behaviour, restore it and confirm the
  feature loads again without a page reload.

## Related skills

- [Long and non-essential tasks](../performance-scheduling/SKILL.md) — when to defer a preload or
  background work.
- [React hooks](../performance-react-hooks/SKILL.md) — memoization, dependency arrays, render loops.
- [Packages](../packages/SKILL.md) — workspace manifests and dependency declarations.
