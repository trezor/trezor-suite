# @trezor/lazy-loading

Helpers for loading modules lazily with `import()`, so they stay out of the initial bundle.

Write the `import()` literally at the call site in both helpers below. A bundler cannot follow a
path it only sees at runtime: webpack turns it into a context over every file that matches, and
Vite's dynamic-import-vars plugin rejects anything that is not a relative path with an extension.
Keeping the call literal is also what preserves `webpackChunkName`, so related boundaries can share
one chunk instead of fragmenting into one per component.

## `loadModule`

Returns a `Result` instead of rejecting: a failed download becomes a `LazyLoadingError`, and the
failure is logged as a warning.

```ts
const createEvoluDepsResult = await loadModule(() =>
    import('./createEvoluDeps').then(({ createEvoluDeps }) => createEvoluDeps),
);

if (!createEvoluDepsResult.success) {
    return createEvoluDepsResult;
}
```

Pick the export inside the import, as above. The bundler can then drop the module's other exports
from the chunk; a returned module object keeps them all.

## `lazyComponentByName`

`React.lazy` for a component that may also be fetched before it renders, with the export named
separately so a call site reads as a map entry. It returns `{ LazyComponent, load, preload }`.

```tsx
const FOREGROUND_APPS = {
    'firmware-custom': lazyComponentByName(
        () =>
            import(/* webpackChunkName: "modals-firmware" */ '#src/views/firmware/FirmwareCustom'),
        'FirmwareCustom',
    ),
};
```

The boundary and `load` run the very same `import()`, so the bundler resolves them to one chunk and
one module promise: a component that was preloaded has nothing left to fetch when it is finally
rendered, and the two cannot drift onto different chunks.

- `LazyComponent` renders behind a `Suspense` boundary, as any lazy component does. Once `load()`
  or `preload()` has finished, it renders at once without suspending, so the boundary's fallback
  never flashes (React holds a shown fallback for at least 300 ms).
- `preload()` starts the fetch and returns, for a hover or a focus ahead of the click. It is
  deliberately silent on failure: a bundler drops a chunk it could not fetch from its registry, so
  the render that needs the component asks for it again and reports the failure itself.
- `load()` awaits the chunk and rejects the way the `import()` does, for a caller that wants to
  show a loading state and own the error.

Unlike `loadModule`, the export is picked here by a runtime key, so the bundler cannot tell which of
the module's exports are used and keeps them all. That costs nothing for a module that exports one
component, and a great deal for a barrel — point the import at the module that defines the
component, not at its package's `index.ts`.
