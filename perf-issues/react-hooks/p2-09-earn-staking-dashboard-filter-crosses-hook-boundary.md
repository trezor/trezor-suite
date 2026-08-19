Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Keep hook
dependencies referentially stable"_. Found by sweep, not named in the doc. This one chain exhibits
both dependency shapes the skill calls provably invisible to `exhaustive-deps`: a value derived
from a call expression (`accounts.filter(...)`), and a dependency that crosses the hook boundary
(the fresh array is passed as a prop into `useStakingAccountsVisibility`, feeding `useMemo`s
inside it).

## Where

- [`packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts:47`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts#L47) — bare `.filter()` in the hook body
- [`packages/suite/src/components/earn/dashboard/staking/hooks/useStakingAccountsVisibility.tsx:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/dashboard/staking/hooks/useStakingAccountsVisibility.tsx#L56) and [`:65`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/dashboard/staking/hooks/useStakingAccountsVisibility.tsx#L65) — two bare `arrayPartition` calls on that prop
- [`useStakingAccountsVisibility.tsx:79`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/dashboard/staking/hooks/useStakingAccountsVisibility.tsx#L79) and [`:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/earn/dashboard/staking/hooks/useStakingAccountsVisibility.tsx#L94) — the two `useMemo`s whose dependencies are those fresh arrays, so they can never hit

## Before

```tsx
// useStakingTableData.ts:45-53
const accounts = useSelector(selectVisibleDeviceAccounts);

const stakingAccounts = accounts.filter(
    account =>
        account.symbol === 'eth' ||
        account.symbol === 'sol' ||
        account.symbol === 'ada' ||
        account.symbol === 'trx',
);
```

```tsx
// useStakingAccountsVisibility.tsx:56-92 (abridged) — stakingAccounts arrives as a prop
const [accountsStakingActive, accountsStakingNotActive] = arrayPartition(
    stakingAccounts,
    (account: Account) => {
        const stakedAmount = getAccountTotalStakingBalance(account);

        return stakedAmount !== null && stakedAmount !== '0';
    },
);

const [accountsSufficientFunds, accountsInsufficientFunds] = arrayPartition(
    accountsStakingNotActive,
    (account: Account) => {
        /* ... */
    },
);

const alwaysVisibleAccounts = useMemo(
    () => [
        ...accountsStakingActive.toSorted(compareEarnByAmountDesc(getAccountStakedAmountInFiat)),
        ...accountsSufficientFunds.toSorted(compareEarnByAmountDesc(getAccountBalanceInFiat)),
    ],
    [
        accountsStakingActive,
        accountsSufficientFunds,
        getAccountStakedAmountInFiat,
        getAccountBalanceInFiat,
    ],
);
```

`accountsStakingActive` and `accountsSufficientFunds` are fresh `arrayPartition` tuples on every
render, so `alwaysVisibleAccounts` recomputes every render — and the second `useMemo`
(`collapsedInsufficientFundsAccounts`, `:94-144`) depends on `alwaysVisibleAccounts` and
`accountsInsufficientFunds`, so it recomputes every render too. Both memos are pure overhead as
written.

## After

```tsx
// useStakingTableData.ts — useMemo is already imported on line 1
const stakingAccounts = useMemo(
    () =>
        accounts.filter(
            account =>
                account.symbol === 'eth' ||
                account.symbol === 'sol' ||
                account.symbol === 'ada' ||
                account.symbol === 'trx',
        ),
    [accounts],
);
```

```tsx
// useStakingAccountsVisibility.tsx — useMemo is already imported on line 1
const [accountsStakingActive, accountsStakingNotActive] = useMemo(
    () =>
        arrayPartition(stakingAccounts, (account: Account) => {
            const stakedAmount = getAccountTotalStakingBalance(account);

            return stakedAmount !== null && stakedAmount !== '0';
        }),
    [stakingAccounts],
);

const [accountsSufficientFunds, accountsInsufficientFunds] = useMemo(
    () =>
        arrayPartition(accountsStakingNotActive, (account: Account) => {
            const minStakingAmount = getStakingLimitsByNetworkSymbol(
                account.symbol,
            )?.MIN_AMOUNT_FOR_STAKING_DASHBOARD;

            return (
                minStakingAmount !== undefined &&
                new BigNumber(account.formattedBalance).gte(minStakingAmount)
            );
        }),
    [accountsStakingNotActive],
);
```

With stable inputs, the two existing `useMemo`s (`alwaysVisibleAccounts`,
`collapsedInsufficientFundsAccounts`) finally hold without any change to their own code.

## Why it matters

The staking table is mounted on the Earn dashboard and re-renders on every fiat-rate tick (four
`useCryptoCurrentRate` subscriptions feed `currentRates`) and on any parent re-render. On each of
those renders the whole chain — the filter, both partitions, two `toSorted` calls and the
`sortByCoin` passes inside the memos — reruns in full, even though its input (`accounts`) is
referentially stable between store changes. This is the bounded, wasteful case the skill
distinguishes from a render loop: it terminates, but the memoization that is already written there
provides no caching at all.

## Notes

- Compiles as written: both files already import `useMemo` on line 1; no new imports, no type
  changes. `packages/suite` is not compiled by React Compiler, so manual memoization is the
  mechanism.
- The upstream selector is not the problem: `selectVisibleDeviceAccounts`
  (`suite-common/wallet-core/src/accounts/accountsSelectors.ts:50`) is built with
  `createMemoizedSelector` and `returnStableArrayIfEmpty`, so `accounts` keeps one reference until
  device accounts actually change — keying the new `useMemo` on `[accounts]` genuinely holds.
  The instability is introduced entirely by this hook chain.
- The two `useCallback` helpers (`getAccountStakedAmountInFiat`, `getAccountBalanceInFiat`) are
  keyed on the memoized `currentRates` object and are already stable between rate changes — they
  are correctly listed and not part of the defect.
- `collapsedAccounts` / `expandedAccounts` / `displayedAccounts` (`:146-153`) stay as plain
  derivations — they are cheap spreads over the memoized arrays, and memoizing them would be the
  redundant-memo antipattern the skill warns about.
- Honest sizing: n is the visible device's account count — dozens, not thousands. The waste is
  real and fiat-tick-driven, but this is P2, not P1.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
