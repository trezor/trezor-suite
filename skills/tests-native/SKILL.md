---
name: tests-native
description: Use when writing component or hook tests in suite-native and need to choose between renderWithBasicProvider, renderWithStoreProvider, or store helpers like createStoreFromPreloadedState, createLightStore, or mergePreloadedState.
---

# Native Test Utilities

Two packages provide testing utilities for suite-native. Pick the one that fits your test:

| Need                                                                  | Package                          |
| --------------------------------------------------------------------- | -------------------------------- |
| Component or hook test with no Redux store                            | `@suite-native/test-utils`       |
| Component or hook test that reads from or dispatches to a Redux store | `@suite-native/test-utils-store` |

Never import directly from `@testing-library/react-native` — both packages re-export it.

## `@suite-native/test-utils`

Provides `renderWithBasicProvider` and `renderHookWithBasicProvider`, which wrap the component with theme, safe-area,
intl, and formatters providers. Also exports `BasicProviderForTests`, `extraDependenciesNativeMock`, and all of
`@testing-library/react-native`.

`BasicProviderForTests` is the underlying wrapper component used by both render helpers. Use it directly only when you
need to pass it as a `wrapper` option to a custom render or hook call — for example, when composing your own render
helper or when the testing-library API requires a `wrapper` component rather than a pre-rendered tree.

## `@suite-native/test-utils-store`

Extends `@suite-native/test-utils` with Redux support. Provides `renderWithStoreProvider` and
`renderHookWithStoreProvider` — both accept the same options: `preloadedState?: Record<string, unknown>` or a
pre-built `store?: TestStore`. Plus store factory helpers:

- `createStoreFromPreloadedState(preloadedState?)` — static (no-op) reducers; use when the test only reads state.
- `createLightStore({ reducer, preloadedState })` — real reducers; use when the test dispatches actions that must mutate
  state.
- `createStaticReducer(initialState)` — creates a no-op reducer for slices the test does not interact with.
- `mergePreloadedState(base, overrides)` — deep-merges a partial `overrides` into a complete typed `base` state object
  and returns it typed as `base`. Use this to build the `preloadedState` arg: start from a fully-constructed state
  (e.g. the result of `store.getState()` on a default store) and override only the slices the test cares about.
