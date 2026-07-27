# @suite-native/test-utils

Provider wrapper and render helpers for suite-native tests that do **not** need a Redux store.

If your test needs a store (selectors, dispatched actions), use [`@suite-native/test-utils-store`](../test-utils-store/README.md) instead — it wraps these helpers with a Redux `<Provider>`.

## What it provides

- `BasicProviderForTests` — wraps children in the providers needed to render atoms and intl-aware components outside a full app (theme, safe-area, intl, optional formatters).
- `renderWithBasicProvider(element, options?)` — `@testing-library/react-native`'s `render` with `BasicProviderForTests` pre-applied.
- `renderHookWithBasicProvider(callback, options?)` — same for hook tests.
- `extraDependenciesNativeMock` — native-side `extraDependencies` mock for slices that need it in tests.
- Re-exports all of `@testing-library/react-native`.

Both render helpers accept the standard render options plus a `formattersConfig?: FormatterProviderConfig` if the component under test renders formatted values.

## Example

```tsx
import { renderWithBasicProvider } from '@suite-native/test-utils';

const { getByText } = renderWithBasicProvider(<MyStatelessComponent label="Hello" />);
expect(getByText('Hello')).toBeOnTheScreen();
```
