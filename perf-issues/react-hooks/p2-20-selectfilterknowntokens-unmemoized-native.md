Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`suite-common/token-definitions/src/tokenDefinitionsSelectors.ts:44-51`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsSelectors.ts#L44-L51) — `selectFilterKnownTokens`, a plain function, not memoized.

Consumer evidence (the native screen this re-renders): [`suite-native/module-accounts-import/src/components/AccountImportConfirmFormScreen.tsx:60-68`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-import/src/components/AccountImportConfirmFormScreen.tsx#L60-L68)

## Before

```ts
// suite-common/token-definitions/src/tokenDefinitionsSelectors.ts:44-51
export const selectFilterKnownTokens = (
    state: TokenDefinitionsRootState,
    symbol: NetworkSymbol,
    tokens: TokenInfo[],
) =>
    returnStableArrayIfEmpty(
        tokens.filter(token => selectCoinDefinition(state, symbol, token.contract as TokenAddress)),
    );
```

```tsx
// suite-native/module-accounts-import/src/components/AccountImportConfirmFormScreen.tsx:60-68
const knownTokens = useSelector((state: TokenDefinitionsRootState) =>
    selectFilterKnownTokens(state, symbol, accountInfo.tokens ?? []),
);

const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
    selectAccountsByNetworkAndDeviceState(state, PORTFOLIO_TRACKER_DEVICE_STATE, symbol),
);

const nonEmptyTokens = knownTokens.filter(info => parseFloat(info.balance ?? '0') > 0);
```

`selectFilterKnownTokens` is a plain function, not wrapped in `createSelector`/`createWeakMapSelector`. `returnStableArrayIfEmpty` only stabilizes the case where the filtered result is empty; any account with at least one known token gets a fresh `.filter()` array on every call. `useSelector` invokes its selector on every dispatch to diff the result, and native `useSelector` (bare `react-redux`, no `shallowEqual` wrapper) uses reference equality, so a fresh array re-renders the component regardless of whether the token list actually changed.

## After

```ts
// suite-common/token-definitions/src/tokenDefinitionsSelectors.ts
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
// ...
import { filterKnownTokens, isTokenDefinitionKnown } from './tokenDefinitionsUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<TokenDefinitionsRootState>();

export const selectFilterKnownTokens = createMemoizedSelector(
    [
        (state: TokenDefinitionsRootState, symbol: NetworkSymbol) =>
            getSimpleCoinDefinitionsByNetwork(state.tokenDefinitions, symbol),
        (_state: TokenDefinitionsRootState, symbol: NetworkSymbol) => symbol,
        (_state: TokenDefinitionsRootState, _symbol: NetworkSymbol, tokens: TokenInfo[]) => tokens,
    ],
    (coinDefinitions, symbol, tokens) =>
        returnStableArrayIfEmpty(filterKnownTokens(coinDefinitions, symbol, tokens)),
);
```

`filterKnownTokens` (`tokenDefinitionsUtils.ts:42-46`, already in this same file's directory) does exactly this filter over a plain `SimpleTokenStructure`, so the combiner reuses it instead of re-deriving `isTokenDefinitionKnown` inline; `getSimpleCoinDefinitionsByNetwork` (this same file, lines 11-14) already extracts the one slice that actually changes when token definitions are (re)loaded (`state.tokenDefinitions[symbol].coin.data`), instead of the whole `state`. The result now recomputes only when `tokens`, `symbol`, or that specific coin-definitions slice change — not on every dispatch.

At the call site, hoist the `?? []` fallback to a module-level constant so a stable reference reaches the selector whenever `accountInfo.tokens` is absent:

```tsx
// suite-native/module-accounts-import/src/components/AccountImportConfirmFormScreen.tsx
const EMPTY_TOKENS: TokenInfo[] = [];

// ...
const knownTokens = useSelector((state: TokenDefinitionsRootState) =>
    selectFilterKnownTokens(state, symbol, accountInfo.tokens ?? EMPTY_TOKENS),
);
```

## Why it matters

`AccountImportConfirmFormScreen` is the account-import confirmation step; while it's mounted, `knownTokens` (and the `nonEmptyTokens` derived from it) get a fresh array reference on every store dispatch, not just on token-definition updates — including blockchain/discovery events for any other enabled account on the device, not only the one being imported. Each of those re-renders the screen and hands its `FlashList` a new `data` array reference, which is more disruptive to `FlashList`'s row recycling than a plain re-render.

## Notes

- Compile requirement: add `createWeakMapSelector` to the existing `import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';`, and add `filterKnownTokens` to the existing `import { isTokenDefinitionKnown } from './tokenDefinitionsUtils';` (that import stays — `isTokenDefinitionKnown` is still used by `selectCoinDefinition`, unchanged, a few lines below). No import changes needed in the native screen beyond none — `TokenInfo` is already imported there.
- Native rule: `AccountImportConfirmFormScreen.tsx` is `suite-native` (React-Compiler-compiled), so the fix cannot be "wrap `knownTokens`/`nonEmptyTokens` in a `useMemo` at the call site" — it has to land in the selector itself, per the rule of fixing the unstable reference at its source. Once `selectFilterKnownTokens` returns a stable reference, the render-body `nonEmptyTokens = knownTokens.filter(...)` derivation is exactly the kind of render-body work the compiler already auto-memoizes correctly on its own — it only needs `knownTokens` itself to stop changing identity for no reason.
- Correct in-repo siblings for this exact combination (strongest evidence this is the right shape): [`suite-native/graph/src/selectors.ts:28-59`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/selectors.ts#L28-L59) (`selectPortfolioGraphAccountItems`) and [`suite-native/trading-state/src/selectors/commonSelectors.ts:287-296`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/trading-state/src/selectors/commonSelectors.ts#L287-L296) (inside `selectAccountsWithTokensToSellSectionListByTradingType`) both already call `getSimpleCoinDefinitionsByNetwork` + `filterKnownTokens` inside a `createWeakMapSelector` combiner for the same "which of this account's tokens are known" computation. `selectFilterKnownTokens` is the one selector in this family that was never converted.
- `returnStableArrayIfEmpty` was already doing its job for the genuinely-empty-result case; the gap this fix closes is the non-empty case, a real `.filter()` result, which it was never designed to cover.
- Honest sizing: single call site, one screen, for the account-import flow's lifetime — not a root provider, not a keystroke handler. Severity is P2 (real and unbounded for that screen's duration), not P1.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
