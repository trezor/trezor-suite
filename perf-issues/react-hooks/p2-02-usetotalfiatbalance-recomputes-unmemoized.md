Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Relocate render-body work before memoizing it, and memoize only what pays"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/hooks/wallet/useTotalFiatBalance.ts:8-32`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/hooks/wallet/useTotalFiatBalance.ts#L8-L32)

Call sites:

- [`packages/suite/src/views/dashboard/PortfolioCard/PortfolioCard.tsx:63`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/dashboard/PortfolioCard/PortfolioCard.tsx#L63)
- [`packages/suite/src/views/suite/SwitchDevice/DeviceItem/WalletInstance.tsx:69`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/suite/SwitchDevice/DeviceItem/WalletInstance.tsx#L69)

## Before

```tsx
export const useTotalFiatBalance = (
    accounts: Account[],
    baseCurrencyCode: BaseCurrencyCode,
    rates?: RatesByKey,
) => {
    const tokenDefinitions = useSelector(state => state.tokenDefinitions);
    const deviceAccounts: Account[] = accounts.map(account => {
        const coinDefinitions = tokenDefinitions?.[account.symbol]?.coin;
        const tokens = getTokens({
            tokens: account.tokens ?? [],
            symbol: account.symbol,
            tokenDefinitions: coinDefinitions,
        });

        return { ...account, tokens: tokens.shownWithBalance };
    });

    const totalBaseCurrencyBalance = getTotalFiatBalance({
        deviceAccounts,
        baseCurrencyCode,
        rates,
    }).toString();

    return totalBaseCurrencyBalance;
};
```

No `useMemo`/`useCallback` anywhere in the hook — the `accounts.map` and `getTotalFiatBalance` call
both re-run on every render regardless of whether `accounts` changed.

## After

```tsx
import { useMemo } from 'react';

import { type Account, type RatesByKey } from '@suite-common/wallet-types';
import { getTotalFiatBalance } from '@suite-common/wallet-utils/src/accountUtils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';

export const useTotalFiatBalance = (
    accounts: Account[],
    baseCurrencyCode: BaseCurrencyCode,
    rates?: RatesByKey,
) => {
    const tokenDefinitions = useSelector(state => state.tokenDefinitions);

    return useMemo(() => {
        const deviceAccounts: Account[] = accounts.map(account => {
            const coinDefinitions = tokenDefinitions?.[account.symbol]?.coin;
            const tokens = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: coinDefinitions,
            });

            return { ...account, tokens: tokens.shownWithBalance };
        });

        return getTotalFiatBalance({
            deviceAccounts,
            baseCurrencyCode,
            rates,
        }).toString();
    }, [accounts, baseCurrencyCode, rates, tokenDefinitions]);
};
```

## Why it matters

`getTotalFiatBalance` iterates every account and calls `getAccountFiatBalance` per account
(`suite-common/wallet-utils/src/accountUtils.ts:598-620`), and this hook additionally maps every
account through `getTokens` first. `PortfolioCard` is the dashboard's headline "total balance" card —
`memo()`-wrapped but with no props, so it re-renders on every one of its several `useSelector` reads
changing, `currentFiatRates` being the most frequent. None of that account/token walk is currently
cached against the fiat rate actually changing the total, so it re-runs in full on every rate tick even
when `accounts` itself is unchanged.

## Notes

- Compile requirement: adds `import { useMemo } from 'react';` — the file currently has no `'react'`
  import at all.
- `packages/suite` is not React-Compiler-covered, so this manual `useMemo` is the correct mechanism
  here.
- `getTokens`'s own internal algorithmic cost is out of scope for this doc — it's tracked separately in
  `perf-issues/asymptotic-complexity/p2-25-tokenutils-gettokens.md` (not yet filed). This fix only stops
  that work from re-running on renders where `accounts`/`baseCurrencyCode`/`rates`/`tokenDefinitions`
  are all unchanged; it does not change `getTokens`'s own complexity.
- Two call sites benefit identically: `PortfolioCard.tsx:63` (passes live `accounts`,
  `currentFiatRates`) and `WalletInstance.tsx:69` (passes a per-device-filtered `deviceAccounts` list
  and the same global `currentFiatRates`).

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
