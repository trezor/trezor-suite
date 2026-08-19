Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Never add a new `eslint-disable` for `exhaustive-deps`"_. Found by sweep, not named in the doc.

## Where

[`suite-native/module-accounts-import/src/screens/AccountImportLoadingScreen.tsx:56-88`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-import/src/screens/AccountImportLoadingScreen.tsx#L56-L88) — `safelyShowImportError` (56-73), called from `handleResult` (79-88).

Co-anchor: [`suite-native/module-accounts-import/src/useShowImportError.ts:81-91`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-import/src/useShowImportError.ts#L81-L91) — `onPressPrimaryButton: onRetry` is wired to the alert's "Try Again" button and fires on a user tap, arbitrarily later than when the closure below was captured.

## Before

```tsx
// suite-native/module-accounts-import/src/screens/AccountImportLoadingScreen.tsx:56-88
const safelyShowImportError = useCallback(
    async (onRetry?: () => Promise<void>) => {
        // Delay displaying the error message to avoid freezing the app on iOS. If an error occurs too quickly during the
        // transition from ScanQRCodeModalScreen, the error modal won't appear, resulting in a frozen app.
        await resolveAfter(1000);
        showImportError(error, () => {
            if (!onRetry) return;
            onRetry();

            // This is needed because handleResult calls safelyShowImportError, which calls handleResult,
            // so one of them is always going to be used before it was defined. However, the functionality is fine here so it's not a problem.
            // eslint-disable-next-line @typescript-eslint/no-use-before-define, react-hooks/immutability
            handleResult();
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error, showImportError],
);

useEffect(() => {
    fetchAccountInfo();
}, [fetchAccountInfo]);

const handleResult = () => {
    if (error || !accountInfo) {
        safelyShowImportError(fetchAccountInfo);
    } else {
        navigation.navigate(AccountsImportStackRoutes.AccountImportSummary, {
            accountInfo,
            networkSymbol,
        });
    }
};
```

`onRetry` here is `fetchAccountInfo`, an `async` function. It's invoked without `await`, and `handleResult()` — a plain, unmemoized closure captured whenever `safelyShowImportError`'s `useCallback` last recomputed (deps `[error, showImportError]`) — runs on the very next line, reading `error`/`accountInfo` from whatever render produced _that_ closure, not from the retry's eventual outcome.

## After

```tsx
const fetchAccountInfo = useCallback(async () => {
    try {
        const response = await dispatch(
            getAccountInfoThunk({ symbol: networkSymbol, baseCurrencyCode, xpubAddress }),
        ).unwrap();

        if (response) {
            setAccountInfo(response);
            setAccountInfoFetchResult('success');
        }

        return response ?? null;
    } catch (response) {
        setError(response);
        setAccountInfoFetchResult('error');

        return null;
    }
}, [dispatch, baseCurrencyCode, networkSymbol, xpubAddress]);

const safelyShowImportError = useCallback(async () => {
    // Delay displaying the error message to avoid freezing the app on iOS. If an error occurs too quickly during the
    // transition from ScanQRCodeModalScreen, the error modal won't appear, resulting in a frozen app.
    await resolveAfter(1000);
    showImportError(error, async () => {
        const retriedAccountInfo = await fetchAccountInfo();

        if (retriedAccountInfo) {
            navigation.navigate(AccountsImportStackRoutes.AccountImportSummary, {
                accountInfo: retriedAccountInfo,
                networkSymbol,
            });
        } else {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            safelyShowImportError();
        }
    });
}, [error, showImportError, fetchAccountInfo, navigation, networkSymbol]);

useEffect(() => {
    fetchAccountInfo();
}, [fetchAccountInfo]);

const handleResult = () => {
    if (error || !accountInfo) {
        safelyShowImportError();
    } else {
        navigation.navigate(AccountsImportStackRoutes.AccountImportSummary, {
            accountInfo,
            networkSymbol,
        });
    }
};
```

`fetchAccountInfo` now returns its own outcome (`AccountInfo | null`) instead of only writing to state, so the retry path can `await` it and act on the value it just produced — never on a `handleResult` reference captured from an earlier render.

## Why it matters

`AccountImportLoadingScreen` is the loading step for adding a watch-only account, and "Try Again" is the only recovery path a user has after a failed lookup. As written, tapping it fires the retry (`onRetry()`) without waiting for it, then immediately calls a `handleResult` reference that was captured whenever `safelyShowImportError`'s `useCallback` last recomputed — reading `error`/`accountInfo` from that earlier render, not from the retry that was just kicked off. Since the retry hasn't resolved yet at that point, the check can re-run against the same stale failure state and re-show the identical error alert before the retry had any chance to succeed, making a working retry look like it failed again.

## Notes

- Compile requirement: none beyond the code shown — `fetchAccountInfo` now returns `Promise<AccountInfo | null>` instead of `Promise<void>`, which only affects the two call sites shown here.
- Dropped the `onRetry?: () => Promise<void>` parameter from `safelyShowImportError`: it only ever had one caller (`handleResult`, always passing `fetchAccountInfo`), so hardcoding it removes the exact indirection that made the un-awaited call easy to miss, without losing any real flexibility.
- The `// eslint-disable-next-line react-hooks/exhaustive-deps` on `safelyShowImportError` is gone: its new dependency array (`error`, `showImportError`, `fetchAccountInfo`, `navigation`, `networkSymbol`) lists every bare identifier the body reads, now that the retry's outcome no longer routes through the separately-declared `handleResult`.
- One suppression remains, of a different rule, and it isn't new: `safelyShowImportError` still calls itself to re-show the alert if a retry fails again, which is a genuine forward self-reference and needs `@typescript-eslint/no-use-before-define`. The original file already carried this exact category of suppression for a two-hop `handleResult` → `safelyShowImportError` → `handleResult` cycle; this fix reduces it to a one-hop self-call for the same "keep offering retry until it works or the user leaves" behavior, not a new category of suppression for this file.
- `handleResult` itself is unchanged — it still reads `error`/`accountInfo` from component state and is still passed as `AccountImportLoader`'s `onComplete`, which is driven by that component's own loading-animation-gated completion signal (`AccountImportLoader.tsx:74`, `<Spinner loadingState={spinnerLoadingState} onComplete={onComplete} />` — not re-traced further here, out of this doc's scope). This fix only changes what happens after a manual retry, where the outcome is now read from `fetchAccountInfo`'s own return value instead of through that shared callback.
- `suite-native` is React-Compiler-compiled, but nothing here is a memoization fix — this is a control-flow/closure-correctness fix (await the retry, read its own result), unrelated to the compiler either way.
- Confidence: medium, carried over from the scan — the closure-staleness mechanism and the missing `await` are both directly verifiable from the code; whether the alert visibly reappears every time or only under specific state-update timing was not confirmed on-device.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
