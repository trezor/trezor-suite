import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectTokenDefinitions } from '@suite-common/token-definitions';
import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber, deepEqual } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getAccountsWithPositiveBalanceOrVisibleTokens,
    getTokens,
} from 'src/utils/wallet/tokenUtils';

function getAccountLight({
    utxo,
    addresses,
    ts,
    page,
    history,
    metadata,
    misc,
    deviceState,
    ...lightAccount
}: Account) {
    return lightAccount;
}

function areAccountsEqual(prev: Account[], next: Account[]) {
    const prevAccountsLight = prev.map(getAccountLight);
    const nextAccountsLight = next.map(getAccountLight);

    return deepEqual(prevAccountsLight, nextAccountsLight);
}

type AccountTokenId = `${Account['symbol']}--${TokenInfo['contract']}`;

/**
 * Aggregate all accounts and tokens per network, sum up its balances per network, sort by fiat balance in descending order
 */
export function useAgregatedAccountsWithTokens() {
    const accounts = useSelector(
        selectAllAccountsToList,
        // Prevent re-redering the `useAgregatedAccountsWithTokens` hook and thus its children when the accounts change (accounts are being constantly updated in Redux)
        areAccountsEqual,
    );
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    const throttledAccounts = useThrottle(accounts, 3000);
    const fiatRatesRef = useCurrentRef(fiatRates);

    return useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return [];
        }

        const accountsWithPositiveBalanceOrTokens = getAccountsWithPositiveBalanceOrVisibleTokens(
            throttledAccounts,
            tokenDefinitions,
        );

        const aggregatedAccounts = new Map<Account['symbol'], Account>();
        const aggregatedTokens = new Map<Account['symbol'], Map<AccountTokenId, TokenInfo>>();

        for (const account of accountsWithPositiveBalanceOrTokens) {
            if (aggregatedAccounts.has(account.symbol)) {
                const aggregatedAccount = aggregatedAccounts.get(account.symbol)!;

                const nextAvailableBalance = new BigNumber(aggregatedAccount.availableBalance)
                    .plus(new BigNumber(account.availableBalance))
                    .toString();

                aggregatedAccounts.set(account.symbol, {
                    ...aggregatedAccount,
                    availableBalance: nextAvailableBalance,
                });
            } else {
                aggregatedAccounts.set(account.symbol, account);
            }

            const { shownWithBalance } = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            if (aggregatedTokens.has(account.symbol)) {
                const accountTokens = aggregatedTokens.get(account.symbol)!;

                for (const token of shownWithBalance) {
                    const tokenId = `${account.symbol}--${token.contract}` as const;
                    const aggregatedToken = accountTokens.get(tokenId);

                    if (!aggregatedToken) {
                        continue;
                    }

                    const aggregatedBalance = new BigNumber(aggregatedToken.balance ?? '0')
                        .plus(token.balance ?? '0')
                        .toString();

                    accountTokens.set(tokenId, {
                        ...aggregatedToken,
                        balance: aggregatedBalance,
                    });
                }
            } else {
                const accountTokens = new Map<AccountTokenId, TokenInfo>();

                for (const token of shownWithBalance) {
                    accountTokens.set(`${account.symbol}--${token.contract}`, token);
                }

                aggregatedTokens.set(account.symbol, accountTokens);
            }
        }

        const flatAgregatedTokens = Array.from(aggregatedTokens.entries())
            .flatMap(([accountSymbol, accountTokens]) =>
                enhanceTokensWithRates(
                    Array.from(accountTokens.values()),
                    baseCurrencyCode,
                    accountSymbol,
                    fiatRates,
                ).map(tokenWithRates => ({
                    token: tokenWithRates,
                    account: aggregatedAccounts.get(accountSymbol)!,
                })),
            )
            .map(({ token, account }) => ({
                type: 'token' as const,
                token,
                account,
                fiatAmount: asBaseCurrencyAmount(token.fiatValue),
            }));

        const flatAgregatedAccounts = Array.from(aggregatedAccounts.values()).map(account => ({
            type: 'account' as const,
            account,
            fiatAmount: getAccountFiatBalance({
                account,
                baseCurrencyCode,
                rates: fiatRates,
                shouldIncludeTokens: false,
                shouldIncludeStaking: true,
            }),
        }));

        const sortedAgregatedAccountsAndTokens = [
            ...flatAgregatedAccounts,
            ...flatAgregatedTokens,
        ].toSorted((itemA, itemB) => {
            if (itemA.fiatAmount && itemB.fiatAmount) {
                return itemB.fiatAmount.minus(itemA.fiatAmount).toNumber();
            }

            if (itemA.fiatAmount === null && itemB.fiatAmount) {
                return 1;
            }

            if (itemA.fiatAmount && itemB.fiatAmount === null) {
                return -1;
            }

            return 0;
        });

        return sortedAgregatedAccountsAndTokens;
    }, [throttledAccounts, baseCurrencyCode, fiatRatesRef, tokenDefinitions]);
}

export type AggregatedAccountWithTokens = ReturnType<typeof useAgregatedAccountsWithTokens>[number];
