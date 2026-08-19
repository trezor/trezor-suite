Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Distinguish a wasted memo from a render loop"_. Found by sweep, not named in the doc.

## Where

[`suite-native/intl/src/hooks/useTranslatedMessages.ts:23-34`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/intl/src/hooks/useTranslatedMessages.ts#L23-L34)

Consumed at [`suite-native/intl/src/IntlProvider.tsx:24-35`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/intl/src/IntlProvider.tsx#L24-L35) — `<ReactIntlProvider messages={messages}>{children}</ReactIntlProvider>`, where `children` is the entire app; `IntlProvider` sits at the root of the component tree.

Compounding factor, same provider: [`suite-native/intl/src/hooks/useSystemLocaleListener.ts:19-31`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/intl/src/hooks/useSystemLocaleListener.ts#L19-L31) — also called from `IntlProvider`, dispatches a possibly-different system locale on mount, so a cold start where the OS locale differs from the persisted one can add a _third_ full-tree render on top of the two below.

## Before

```ts
// suite-native/intl/src/hooks/useTranslatedMessages.ts:23-34
export const useTranslatedMessages = () => {
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const supportedLanguageLocale = useSelector(selectSupportedLanguageLocale);

    useEffect(() => {
        const localizedMessages = LANGUAGE_TRANSLATIONS_MAP[supportedLanguageLocale];

        setMessages({ ...englishFallback, ...localizedMessages });
    }, [supportedLanguageLocale]);

    return messages;
};
```

```tsx
// suite-native/intl/src/IntlProvider.tsx:24-35
export const IntlProvider = ({ children }: { children: React.ReactNode }) => {
    useSystemLocaleListener();

    const locale = useSelector(selectLocale);
    const messages = useTranslatedMessages();

    return (
        <ReactIntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={messages}>
            {children}
        </ReactIntlProvider>
    );
};
```

`LANGUAGE_TRANSLATIONS_MAP`'s entries (`useTranslatedMessages.ts:9-18`) are `require(...)`'d JSON, resolved synchronously at module load — there is no asynchronous work here to justify holding the merged result in an effect at all.

## After

```ts
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

// ...

export const useTranslatedMessages = () => {
    const supportedLanguageLocale = useSelector(selectSupportedLanguageLocale);

    return useMemo(
        () => ({ ...englishFallback, ...LANGUAGE_TRANSLATIONS_MAP[supportedLanguageLocale] }),
        [supportedLanguageLocale],
    );
};
```

This is `suite-native` (React-Compiler-compiled) code, where the standing rule is "the fix is never add `useMemo` — the compiler owns memoization." That rule is about not layering a redundant cache in front of a computation the compiler would already auto-memoize; it doesn't apply here the way it looks like it might. `useMemo` isn't being added on top of an existing, already-correct render-body expression — it's replacing a `useState`+`useEffect` pair, i.e. removing a piece of state and the effect that kept it in sync, which is the skill's own "state that can be computed from what you already have is not state" principle applied literally. The behavior change this buys — the first render already carries the correct `messages`, instead of `{}` corrected a commit later — is not something the compiler would have provided by leaving the `useState`/`useEffect` pair in place; the compiler auto-memoizes computations, it does not turn stored state back into derived state. Worth noting for whoever picks this up: a plain, non-memoized `const messages = { ...englishFallback, ...LANGUAGE_TRANSLATIONS_MAP[supportedLanguageLocale] };` (no `useMemo` at all) fixes the double-render just as correctly, since the compiler will auto-memoize that computed value on its own — `useMemo` vs. a bare `const` is a style choice on this file, not a correctness difference; it's shown here only to mirror the derive-during-render idiom the skill itself uses for this exact bug class.

## Why it matters

On mount, `messages` starts as `{}`. Every `<Translation>`/`formatMessage` call that renders before the effect resolves has no matching entry in an empty `messages` object, so `react-intl` treats each one as missing and calls its `onError` handler — `console.error` by default, which per this repo's own logging rules is Sentry-captured on every platform. The effect then fires, calls `setMessages`, and the entire subtree under `IntlProvider` — i.e. the whole app, since this provider sits at the root — re-renders a second time with the real messages. `useSystemLocaleListener`, mounted in the same provider, can independently dispatch a different system locale on that same cold start and force a third full-tree render before the UI settles. This lands at the single most latency-sensitive moment in the app's lifecycle — cold start, time-to-interactive — unconditionally, on every launch, not as a rare edge case.

## Notes

- Compile requirement: drop `useState`/`useEffect` from the existing `import { useEffect, useState } from 'react';` and replace with `import { useMemo } from 'react';`. No other import changes.
- Which app: `suite-native` (compiled) — see the After section for why keeping `useMemo` here is fixing a state/effect problem, not adding manual memoization the compiler would otherwise own; nothing about this proposal conflicts with the "don't add memoization on native" rule.
- `useSystemLocaleListener` (same file's sibling hook, called from the same `IntlProvider`) is a genuinely asynchronous `AppState` subscription, not a derivable value — it's a compounding factor on the same cold start, not a second instance of this bug, and isn't proposed for change here.
- Honest sizing: one hook, one call site (`IntlProvider`) — but that call site is the app-root i18n provider, so the P1 severity reflects blast radius (every component under it, on every launch), not fan-out count; the exact frequency/cost of the resulting `console.error` calls was not measured.
- Confidence: high — the lookup table's `require(...)`'d JSON entries are resolved synchronously at module load, so there's no async dependency the original effect could have been guarding against.
- Same defect class recurs at much smaller scale elsewhere in native code: `suite-native/module-accounts-management/src/hooks/useDayCoinPriceChange.ts:82-88` derives a percentage via a second `useEffect`+`setState` instead of computing it in render (one price card, not the app root); tracked as `p3-04` (sibling draft, not yet filed).

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
