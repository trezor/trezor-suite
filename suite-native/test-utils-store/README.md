# @suite-native/test-utils-store

Render helpers and store factories for suite-native tests that need a Redux store.

For tests that do **not** need a store (pure components, hooks without store access), use [`@suite-native/test-utils`](../test-utils/README.md) instead — this package depends on it and re-exports `@testing-library/react-native`.

## Render helpers

### `renderWithStoreProvider(element, options?)`

Renders a React element wrapped in a Redux `<Provider>` and the basic test providers (theme, formatters, intl).

```tsx
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

const { getByText } = renderWithStoreProvider(<MyComponent />, {
    preloadedState: { wallet: { settings: { localCurrency: 'eur' } } },
});
```

### `renderHookWithStoreProvider(callback, options?)`

Same wrapping, for hook tests.

```tsx
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

const { result } = renderHookWithStoreProvider(() => useMyHook());
```

Both helpers accept the standard `@testing-library/react-native` options plus:

- `preloadedState?: object` — initial state merged over defaults.
- `services` (optional) — services supplied to the test composition, including an optional pre-built `store` that takes precedence over `preloadedState`.
- `wrapper?: ComponentType` — additional inner wrapper (e.g. a form provider).

Each test declares the state slices and service dependencies its subject needs. The render helpers infer the supplied services through generics, preserving the store state and dispatch types.

The helpers create services once per render call. Both the Redux provider and the services provider use that same store, which is preserved across rerenders.

## Store factories

Two factories with different trade-offs. Pick by what your test needs to do:

|                                | `createStoreFromPreloadedState`        | `createLightStore`                                  |
| ------------------------------ | -------------------------------------- | --------------------------------------------------- |
| Reducers                       | Static (no-op, return initial state)   | Real reducers you pass in                           |
| Responds to dispatched actions | No                                     | Yes                                                 |
| Setup cost                     | Zero — just pass state                 | You assemble the reducer map                        |
| Use when                       | Component/hook test only _reads_ state | Test _dispatches_ actions and asserts state changes |

### `createStoreFromPreloadedState(preloadedState?)`

Called internally by `renderWithStoreProvider` when no `services.store` is supplied. The inferred state is preserved by a static reducer that ignores every action. This is the fast path used by most render tests.

### `createLightStore({ reducer, preloadedState })`

Thin wrapper over `configureStore` with `serializableCheck` and `immutableCheck` disabled and typed `preloadedState` via `PreloadedStatePartial`. Use this to build a store with selected real reducers, then pass it to `renderWithStoreProvider` via `services.store`.

```tsx
import {
    createLightStore,
    renderWithStoreProvider,
    createStaticReducer,
} from '@suite-native/test-utils-store';

const store = createLightStore({
    reducer: {
        wallet: combineReducers({
            trading: tradingSlice.reducer, // real reducer — responds to actions
            settings: createStaticReducer(initialSettings), // static — read-only
        }),
    },
    preloadedState: { wallet: { trading: initialTradingState } },
});

renderWithStoreProvider(<MyComponent />, { services: { store } });
```

### `createStaticReducer(initialState)`

Helper for building a reducer map for `createLightStore` when you want most slices to be read-only and only a few to respond to actions.

## Types

- `PreloadedStatePartial<T>` — deep-partial of state that preserves functions and arrays as-is (unlike a naive `DeepPartial`). Used by `createLightStore` and re-exported for test-side preloaded-state typing.
- `RenderOptionsExtended` / `RenderHookOptionsExtended<Props>` — the option types accepted by the render helpers.
