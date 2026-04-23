# @suite-native/test-utils

Provider wrapper and render helpers for suite-native tests that do **not** need a Redux store.

If your test needs a store (selectors, dispatched actions), use [`@suite-native/test-utils-store`](../test-utils-store/README.md) instead — it wraps these helpers with a Redux `<Provider>`.

## What it provides

- `ProviderForTests` — wraps children in a composable provider stack. `SafeAreaProvider` and `StylesProvider` are always on; the rest (`intl`, `navigation`, `services`, `formatter`, `bottomSheet`) are opt-in via the `providers` prop.
- `renderWithProviders(element, options?)` — `@testing-library/react-native`'s `render` with `ProviderForTests` pre-applied.
- `renderHookWithProviders(callback, options?)` — same for hook tests.
- `ALL_PROVIDERS` — convenience constant containing every opt-in provider key.
- `extraDependenciesNativeMock` — native-side `extraDependencies` mock for slices that need it in tests.
- Re-exports all of `@testing-library/react-native`.

Both render helpers accept the standard render options plus:

- `providers?: ProviderKey[]` — opt-in providers to include (default: `[]`, i.e. only the always-on base).
- `formattersConfig?: FormatterProviderConfig` — only applied when `'formatter'` is in `providers`.

## Example

```tsx
import { renderWithProviders } from '@suite-native/test-utils';

const { getByText } = renderWithProviders(<MyStatelessComponent label="Hello" />, {
    providers: ['intl'],
});
expect(getByText('Hello')).toBeOnTheScreen();
```

Pick the smallest `providers` list that makes the component render. Only add heavier providers (`navigation`, `services`, `formatter`, `bottomSheet`) if the component or a hook it calls actually needs them.
