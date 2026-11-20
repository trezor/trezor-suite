# @trezor/lazy-loading

Helpers for loading modules lazily with `import()`, so they stay out of the initial bundle.

`loadModule` returns a `Result` instead of rejecting: a failed download becomes a `LazyLoadingError`, and the failure is logged as a warning.

```ts
const createEvoluDepsResult = await loadModule(() =>
    import('./createEvoluDeps').then(({ createEvoluDeps }) => createEvoluDeps),
);

if (!createEvoluDepsResult.success) {
    return createEvoluDepsResult;
}
```

Pick the export inside the import, as above. Webpack can then drop the module's other exports from the chunk; a returned module object keeps them all.
