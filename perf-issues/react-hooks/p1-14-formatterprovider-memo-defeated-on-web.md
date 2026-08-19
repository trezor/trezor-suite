Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Check which app you are in before adding or removing a memo"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/hooks/suite/useFormattersConfig.ts:7-18`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/suite/useFormattersConfig.ts#L7-L18) — no `useMemo` around the returned config object.

Consumed at [`packages/suite/src/support/suite/Main.tsx:28`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/Main.tsx#L28) (the hook call) and [line 46](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/suite/Main.tsx#L46) (`<FormatterProvider config={formattersConfig}>`), which wraps the whole web/desktop app at [`packages/suite-web/src/MainWeb.tsx:30-48`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-web/src/MainWeb.tsx#L30-L48).

The memo this defeats: [`suite-common/formatters/src/FormatterProvider.tsx:86-93`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/formatters/src/FormatterProvider.tsx#L86-L93). What a miss costs: [`suite-common/formatters/src/makeFormatter.tsx:50-57`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/formatters/src/makeFormatter.tsx#L50-L57) returns a brand-new component function on every call.

Correct in-repo sibling: [`suite-native/formatters-config/src/hooks/useFormattersConfig.ts:12-26`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/formatters-config/src/hooks/useFormattersConfig.ts#L12-L26).

## Before

```ts
// packages/suite/src/hooks/suite/useFormattersConfig.ts:7-18 — no useMemo
export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);

    return {
        locale,
        baseCurrency,
        bitcoinAmountUnit,
        is24HourFormat: true,
    };
};
```

```tsx
// suite-common/formatters/src/FormatterProvider.tsx:83-100 — this memo is already correctly
// written; it just never receives a stable `config` to hold onto
export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const intl = useIntl();

    const contextValue = useMemo(() => {
        const extendedConfig = {
            ...config,
            intl,
        };

        return getFormatters(extendedConfig);
    }, [config, intl]);

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
```

## After

```ts
// packages/suite/src/hooks/suite/useFormattersConfig.ts
import { useMemo } from 'react';

import { selectLanguage } from '@suite/settings';
import { type FormatterProviderConfig } from '@suite-common/formatters';
import { selectBaseCurrency, selectBitcoinAmountUnit } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite/useSelector';

export const useFormattersConfig = (): FormatterProviderConfig => {
    const locale = useSelector(selectLanguage);
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const baseCurrency = useSelector(selectBaseCurrency);

    return useMemo(
        () => ({
            locale,
            baseCurrency,
            bitcoinAmountUnit,
            is24HourFormat: true,
        }),
        [locale, baseCurrency, bitcoinAmountUnit],
    );
};
```

This mirrors the native hook exactly (same dependency list, same shape). No change needed in `FormatterProvider.tsx` — its own `useMemo` is already correctly structured and will start holding as soon as `config` is stable.

## Why it matters

`getFormatters()` calls six `prepare*Formatter` functions (`prepareCryptoAmountFormatter`, `prepareDisplaySymbolFormatter`, `prepareBaseCurrencyAmountFormatter`, `prepareDateFormatter`, `prepareTimeFormatter`, `prepareDateTimeFormatter`), each of which calls `makeFormatter(...)` and gets back a _new React component function_. `MainWeb` is a plain, non-`memo`'d component whose body re-runs whenever its own hooks (`useTor`, `useConnectPopupWeb`, `useConnectPopupWebextension`, `useDebugLanguageShortcut`) cause a re-render; every such re-render calls `useFormattersConfig()` again, returns a fresh object, and misses `FormatterProvider`'s memo — so all six formatter "components" get new identities on that render. Every `<CryptoAmountFormatter>`, `<DateFormatter>`, etc. anywhere below `Main` — every displayed amount, balance, date and time in the entire web/desktop app — is then a different component type on the next render, so React unmounts and remounts it instead of re-rendering it: lost local state and effects in whatever the formatter wraps, and layout thrash, triggered by something as unrelated as a Tor status change.

## Notes

- Compile requirement: adds `import { useMemo } from 'react';` to `packages/suite/src/hooks/suite/useFormattersConfig.ts`, which currently has no `'react'` import at all.
- Which app: this is a `packages/suite` (web/desktop) file — uncompiled, so manual `useMemo` is the only mechanism available at runtime, per the skill's "check which app you are in" rule. `suite-native/formatters-config/src/hooks/useFormattersConfig.ts:12-26` is the correct in-repo sibling and does exactly the right thing already (`useMemo(..., [baseCurrencyCode, bitcoinAmountUnit, locale])`); the fix above mirrors it line for line.
- `FormatterProvider.tsx` itself (in `suite-common/formatters`, ships to both apps) needs no change — its own `useMemo` deps (`[config, intl]`) are already correct; it was only ever fed an unstable `config`.
- Honest sizing: this is flagged P1 for blast radius (essentially every formatted value in the app), not measured frequency — whether `MainWeb` re-renders once per session or many times per minute in a running app was not instrumented here.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
