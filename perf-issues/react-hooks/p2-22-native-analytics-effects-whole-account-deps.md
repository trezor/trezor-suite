Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Minimal required dependencies"_. Found by sweep, not named in the doc.

## Where

[`suite-native/module-accounts-management/src/screens/AccountDetailContentScreen.tsx:24-39`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/screens/AccountDetailContentScreen.tsx#L24-L39)

[`suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx:58-69`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx#L58-L69) — same defect shape, a different screen.

Co-anchors establishing that both effects' whole-object dependency is a real, changing reference, not a stable one:

- [`AccountDetailScreen.tsx:36-38`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/screens/AccountDetailScreen.tsx#L36-L38) — `account` comes from `selectAccountByKey`, which returns a new reference whenever that account's Redux entry is genuinely replaced (new transaction, balance/history update, label change).
- [`useTransactionDetails.ts:28-33`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transaction-management/src/hooks/useTransactionDetails.ts#L28-L33) — `transaction` comes from `selectTransactionByAccountKeyAndTxid`, which is `createMemoizedSelector`-based ([`transactionsSelectors.ts:130`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsSelectors.ts#L130), a typed alias of `createWeakMapSelector`) — the same stability profile, so it only returns a new reference when the transaction record itself changes.

## Before

### 1. `AccountDetailContentScreen.tsx:24-39`

```tsx
const token = useSelector((state: TokensRootState) =>
    selectAccountTokenInfo(state, account.key, tokenContract),
);

useEffect(() => {
    if (account) {
        analytics.report({
            type: events.assetDetailEvent.name,
            payload: {
                assetSymbol: account.symbol,
                tokenSymbol: token?.symbol,
                tokenAddress: token?.contract,
            },
        });
    }
}, [account, token?.symbol, token?.contract, analytics, token]);
```

`account` is a required (non-optional) prop on this component, so `if (account)` is dead code, and the dependency array also lists both `token` and its two destructured fields — redundant, and a sign the array was widened rather than narrowed while chasing a lint warning.

### 2. `TransactionDetailScreen.tsx:58-69`

```tsx
useEffect(() => {
    if (transaction) {
        analytics.report({
            type: events.transactionDetailEvent.name,
            payload: {
                assetSymbol: transaction.symbol,
                tokenSymbol: tokenTransfer?.symbol,
                tokenAddress: tokenTransfer?.contract,
            },
        });
    }
}, [transaction, tokenTransfer, analytics]);
```

Unlike `account` above, `transaction` here genuinely can be `undefined` (this same component returns `null` a few lines later via `if (!transaction) return null;`), so the guard is load-bearing, not dead code.

## After

### 1. `AccountDetailContentScreen.tsx`

```tsx
useEffect(() => {
    analytics.report({
        type: events.assetDetailEvent.name,
        payload: {
            assetSymbol: account.symbol,
            tokenSymbol: token?.symbol,
            tokenAddress: token?.contract,
        },
    });
}, [account.symbol, token?.symbol, token?.contract, analytics]);
```

The dead `if (account)` guard is dropped, and the redundant `token`/`token?.symbol`/`token?.contract` triple is narrowed to the two primitive fields actually read. The dependency is `account.symbol`, not `account.key`: the effect body reads `account.symbol`, and `react-hooks/exhaustive-deps` tracks member-expression dependencies per exact accessed path — a sibling field like `account.key` wouldn't satisfy the `account.symbol` usage and would leave the array lying again. `account.symbol` is stable for the life of one account (a given account's coin never changes), so it's just as effective as `account.key` at stopping the effect from refiring on unrelated data updates to the same account.

### 2. `TransactionDetailScreen.tsx`

```tsx
useEffect(() => {
    const assetSymbol = transaction?.symbol;
    if (!assetSymbol) return;

    analytics.report({
        type: events.transactionDetailEvent.name,
        payload: {
            assetSymbol,
            tokenSymbol: tokenTransfer?.symbol,
            tokenAddress: tokenTransfer?.contract,
        },
    });
}, [transaction?.symbol, tokenTransfer?.symbol, tokenTransfer?.contract, analytics]);
```

`transaction` can't just lose its guard the way `account` above did, since it's genuinely nullable here. Hoisting `transaction?.symbol` into a local before the guard keeps the truthiness check on the same primitive that's already in the dependency array, instead of on the whole `transaction` object — a real transaction always has a non-empty `symbol`, so this preserves the original "only report once we actually have a transaction" behavior.

## Why it matters

Both effects report an analytics event meant to mean "the user opened this screen," but as written they refire on every change to the whole record they read a couple of fields from — turning the metric into "...and then some unrelated amount of data refreshed while they stayed there." Account Detail is one of the most frequently visited screens in the app, and its `account` object is by definition the one most likely to receive a balance or history update while it's open, so `assetDetailEvent` can fire repeatedly per visit. Transaction Detail's own record changes far less often — typically one pending→confirmed transition — so `transactionDetailEvent` duplicates at a much lower rate; same mechanism, colder path.

## Notes

- Compile requirement: none — every value in both new dependency arrays is already destructured/available in scope; no new imports in either file.
- Native: both files are `suite-native` (React-Compiler-compiled). This is a dependency-narrowing and redundant-dependency cleanup only; no memoization is added anywhere in this doc.
- Adjustment from the scan: the scan's own sketch for anchor 1 suggested depending on `account.key`, but the effect body reads `account.symbol` — depending on a different, sibling field of the same object wouldn't actually satisfy `exhaustive-deps` for the property that's read (see the After section above), so this doc depends on `account.symbol` instead, which is both what's read and equally stable per account.
- Went one step past the scan's own "medium confidence" note on anchor 2 and confirmed `selectTransactionByAccountKeyAndTxid` is `createMemoizedSelector`-based (`transactionsSelectors.ts:130`, `createWeakMapSelector.withTypes<...>()` at line 48 of the same file) — the same stability profile already confirmed for `selectAccountByKey` in the area-08 scan. Both anchors' underlying selectors only return a new reference on a genuine data change, so narrowing the effect's own dependency is what removes the redundant reports, not a workaround for an unstable selector underneath.
- Merge rationale: identical defect shape (an analytics-report effect keyed on the whole domain record instead of the handful of primitive fields it reports) on two different screens — one doc, both anchors, per this sweep's triage.
- Honest sizing: the mechanism is fully traced and verifiable from the code in both files; how often either screen's underlying record actually updates while a user has it open in practice was not measured for this sweep.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
