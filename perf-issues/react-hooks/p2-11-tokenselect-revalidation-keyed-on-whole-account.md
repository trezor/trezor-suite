Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Minimal required dependencies"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/views/wallet/send/Outputs/TokenSelect/TokenSelect.tsx:70-75`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Outputs/TokenSelect/TokenSelect.tsx#L70-L75)

Co-anchor — what the effect's `account`-shaped check actually reads: [`suite-common/wallet-utils/src/accountUtils.ts:1045-1053`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/accountUtils.ts#L1045-L1053), `hasNetworkFeatures`, which only branches on `account.symbol`/`account.accountType` via `getNetworkAccountFeatures`.

## Before

```tsx
useEffect(() => {
    if (hasNetworkFeatures(account, 'tokens') && !isSetMaxActive) {
        const amountValue = getValues(`outputs.${outputId}.amount`);
        if (amountValue) setAmount(outputId, amountValue);
    }
}, [account, outputId, tokenWatch, setAmount, getValues, isSetMaxActive]);
```

## After

```tsx
useEffect(() => {
    if (hasNetworkFeatures(account, 'tokens') && !isSetMaxActive) {
        const amountValue = getValues(`outputs.${outputId}.amount`);
        if (amountValue) setAmount(outputId, amountValue);
    }
}, [
    account.symbol,
    account.accountType,
    outputId,
    tokenWatch,
    setAmount,
    getValues,
    isSetMaxActive,
]);
```

`hasNetworkFeatures(account, 'tokens')` inside the body keeps receiving the full `account` object — `getNetworkAccountFeatures` reads both `symbol` and `accountType` off it (`Pick<Account, 'symbol' | 'accountType'>`), so both stay in the dependency array; only the wider `account` reference itself is dropped.

## Why it matters

`account` gets a fresh object reference on every relevant blockchain sync tick, and as written this effect re-runs the amount re-validation on every one of those ticks while a Send output row is mounted — not only when the user actually changes the selected token via `tokenWatch`, which is already the intended trigger. `account.symbol`/`account.accountType` are stable for the lifetime of one send-form session on one account, so the network-features check they gate never actually changes value between those spurious re-runs; the repeated `getValues`/`setAmount` call is pure repeated work.

## Notes

- Compile requirement: none — `account.symbol` and `account.accountType` are already-accessible properties, no new import.
- `packages/suite` is not React-Compiler-covered, so this dependency has to be narrowed by hand.
- `tokenWatch` remains the reactive trigger for "the user changed token"; `account` was only ever in the array for the network-features gate.
- Same fix pattern, same file tree, as `p2-12-usebuildtokenoptions-keyed-on-whole-account.md` (sibling draft, not yet filed) — both narrow a wide `account` dependency down to the fields a helper (`hasNetworkFeatures` here, `enhanceTokensWithRates` there) actually reads, while still passing the full object into the helper call itself.
- Confidence caveat carried over from the audit: it's clear the dependency is wider than the check needs, but how visible the repeated `setAmount` call is to the user depends on whether `setAmount` itself has further re-render side effects — not traced as part of this doc.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
