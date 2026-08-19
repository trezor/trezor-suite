Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/views/wallet/tokens/TokensNavigation.tsx:126-131`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/TokensNavigation.tsx#L126-L131)

Parents that own the search box driving this component's re-renders, both holding `searchQuery` in state and passing it down as a prop `TokensNavigation` binds to its own `<Input value={searchQuery}>` (`TokensNavigation.tsx:184`):

- [`packages/suite/src/views/wallet/tokens/index.tsx:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L20) (state), [`:67-73`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/tokens/index.tsx#L67-L73) (passed down)
- [`packages/suite/src/views/wallet/nfts/index.tsx:14`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/nfts/index.tsx#L14) (state), [`:36-41`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/nfts/index.tsx#L36-L41) (passed down)

## Before

```tsx
const tokens = getTokens({
    tokens: selectedAccount.account.tokens || [],
    symbol: selectedAccount.account.symbol,
    tokenDefinitions,
    isNft,
});
```

## After

```tsx
const tokens = useMemo(
    () =>
        getTokens({
            tokens: selectedAccount.account.tokens || [],
            symbol: selectedAccount.account.symbol,
            tokenDefinitions,
            isNft,
        }),
    [selectedAccount.account.tokens, selectedAccount.account.symbol, tokenDefinitions, isNft],
);
```

## Why it matters

This call only feeds the tab-count badges (`normalTokens.length`, `erc4626Tokens.length`, `tokens.hiddenWithBalance.length` in `getSubTabConfig`) — verified that `getTokens` here is never passed a `searchQuery` argument at all, unlike the filtered call the active table makes with the same helper — yet every keystroke in the sibling token/NFT search box changes the parent's `searchQuery` state, which re-renders `TokensNavigation` as a normal prop update and re-runs this unmemoized `getTokens` call over the account's full token list on every one of those keystrokes.

## Notes

- Compile requirement: add `useMemo` to the file's existing `import { type Dispatch, type SetStateAction, useEffect } from 'react';` — no other React import is present.
- `packages/suite` is not React-Compiler-covered, so this has to be memoized by hand.
- `selectedAccount.account.tokens || []` stays inside the memo callback exactly as today, so the fallback's fresh-array identity never reaches the dependency array — `selectedAccount.account.tokens` (the pre-fallback value) is what's listed, which is the same "fallback inside the memo body, not in the deps" shape the scan's own "Checked, clean" pass confirmed elsewhere in this area (`UtxoReceiveAddressModal.tsx`).
- `HiddenTokensTable.tsx:23-35` (verified) has the identical shape — an unmemoized `getTokens` call whose result (`tokens`, used for `hiddenTokensCount`/`unverifiedTokensCount`) also doesn't depend on `searchQuery` — and is already named, not filed, in `perf-issues/scheduling/p1-12-token-search-rebuilds-the-unvirtualised-table-per-keystroke.md`'s Notes ("Also left alone: the unmemoised `getTokens` for the tab counts at `TokensNavigation.tsx:126`... making it cheaper is a complexity fix, not a scheduling one"). That doc and this one are additive: it targets the per-keystroke _table row rebuild_; this one targets the _tab-count badge_ computation next to it, which — as verified above — doesn't even receive the value forcing its re-execution. Worth triaging together since a shared fix likely covers both call sites, but this doc stands alone.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
