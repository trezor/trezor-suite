Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Minimal required dependencies"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/views/wallet/send/Outputs/TokenSelect/SelectTokenAssetModal/hooks/useBuildTokenOptions.tsx:68-84`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Outputs/TokenSelect/SelectTokenAssetModal/hooks/useBuildTokenOptions.tsx#L68-L84)

Consumer: [`packages/suite/src/views/wallet/send/Outputs/TokenSelect/SelectTokenAssetModal/SelectTokenAssetModal.tsx:72-75`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Outputs/TokenSelect/SelectTokenAssetModal/SelectTokenAssetModal.tsx#L72-L75) — the Send-form "select token" modal opened from `TokenSelect.tsx`.

## Before

```tsx
return useMemo(() => {
    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        baseCurrencyCode,
        account.symbol,
        fiatRates,
    );

    const sortedTokensWithRates = tokensWithRates.sort(sortTokensWithRates);

    return buildTokenOptions(
        account,
        sortedTokensWithRates,
        coinDefinitions,
        expandedHiddenTokensGroups,
    );
}, [account, baseCurrencyCode, fiatRates, coinDefinitions, expandedHiddenTokensGroups]);
```

## After

```tsx
return useMemo(() => {
    const tokensWithRates = enhanceTokensWithRates(
        account.tokens,
        baseCurrencyCode,
        account.symbol,
        fiatRates,
    );

    const sortedTokensWithRates = tokensWithRates.sort(sortTokensWithRates);

    return buildTokenOptions(
        account,
        sortedTokensWithRates,
        coinDefinitions,
        expandedHiddenTokensGroups,
    );
}, [
    account.tokens,
    account.symbol,
    baseCurrencyCode,
    fiatRates,
    coinDefinitions,
    expandedHiddenTokensGroups,
]);
```

`buildTokenOptions` still receives the full `account` object as an argument — only the dependency array narrows to the two fields the memo body reads before calling it.

## Why it matters

`sortTokensWithRates` allocates a `BigNumber` per comparison, and this modal's own token count scales with the account's ERC-20/SPL list. Keyed on the whole `account`, the memo recomputes on every account refresh while the picker is open even though the token list and rates usually haven't changed — the memo is present in the code but structurally cannot hit, because `account` gets a fresh reference on every relevant blockchain sync tick.

## Notes

- Compile requirement: none — `account.tokens`/`account.symbol` are already read inside the memo body today, no new import.
- `packages/suite` is not React-Compiler-covered, so this has to be narrowed by hand.
- **Read past the memo body before filing this as written.** `buildTokenOptions` (this file, lines 22-53) passes the closed-over `account` object itself into `createAccountOption(account)` and `createHiddenTokensOption({ account, ... })` (`packages/suite/src/components/suite/asset-picker/utils/index.ts:24-38,62-67`), and each returned option carries that same `account` reference by field, not a copy. `SelectTokenAssetModal.tsx:151-153` renders the `'account'`-type option through `AssetRowAccountWithBalance`, whose `AccountAmount` sub-component reads `account.balance` directly off that embedded object (`AccountAmount.tsx:14-17`) rather than through its own live selector. So narrowing the outer dependency to `account.tokens`/`account.symbol` trades "recomputes on every unrelated field change" for "the picker's own account-row balance can lag a live balance-only account update for as long as the picker stays open, until the next tokens/symbol-triggered recompute." The token-row path (`AssetRowToken.tsx`) only reads `account.symbol` off the embedded object, already covered, so this caveat is scoped to the account-level balance row specifically. Worth deciding explicitly when filing — add `account.balance` (and any other field `AccountAmount` grows to read) to the dependency array, or accept the staleness window given this is a short-lived modal — but shipping the narrow array silently is not a free lunch, since it is a behavior change the current (unfixed) code does not have.
- Same fix pattern, same file tree, as `p2-11-tokenselect-revalidation-keyed-on-whole-account.md` (sibling draft, not yet filed).

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
