import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    accountsFiatBalanceInDescOrderComparator,
    findAccountsByNetwork,
} from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { ASSET_ROW_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import {
    TokensWithRates,
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

export type AccountWithTokensOption =
    | {
          type: 'account';
          account: Account;
          height: number;
      }
    | {
          type: 'token';
          account: Account;
          token: TokensWithRates;
          height: number;
      };

function filterAccountsByNetworkSymbol(
    accounts: Account[],
    networkSymbol: NetworkSymbol | undefined,
): Account[] {
    return networkSymbol ? findAccountsByNetwork(networkSymbol, accounts) : accounts;
}

export function useAccountWithTokensOptions(): AccountWithTokensOption[] {
    const networkSymbol = useSelector(globalSendReceiveFilters.selectors.selectNetworkSymbol);
    const accounts = useSelector(selectAllAccountsToList);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    // Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
    const throttledAccounts = useThrottle(accounts, 500);
    const fiatRatesRef = useCurrentRef(fiatRates);

    return useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return [];
        }

        const networkAccounts = filterAccountsByNetworkSymbol(throttledAccounts, networkSymbol);

        const accountsAndTokensSortedByFiatBalance = networkAccounts
            .toSorted(function sortByFiatBalanceInDescOrder(accountA, accountB) {
                return accountsFiatBalanceInDescOrderComparator({
                    accountA,
                    accountB,
                    baseCurrencyCode,
                    fiatRates,
                });
            })
            .map(account => {
                const { shownWithBalance } = getTokens({
                    tokens: account.tokens ?? [],
                    symbol: account.symbol,
                    tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
                });

                const tokensWithRates = enhanceTokensWithRates(
                    shownWithBalance,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                );

                const sortedTokensByFiatBalance = tokensWithRates.sort(sortTokensWithRates);

                return {
                    ...account,
                    tokens: sortedTokensByFiatBalance,
                };
            });

        const accountsWithTokensOptions: AccountWithTokensOption[] =
            accountsAndTokensSortedByFiatBalance.flatMap(account => [
                {
                    type: 'account',
                    account,
                    height: ASSET_ROW_HEIGHT,
                },
                ...(account.tokens ?? []).map(
                    token =>
                        ({
                            type: 'token',
                            account,
                            token,
                            height: ASSET_ROW_HEIGHT,
                        }) satisfies AccountWithTokensOption,
                ),
            ]);

        return accountsWithTokensOptions;
    }, [throttledAccounts, baseCurrencyCode, fiatRatesRef, networkSymbol, tokenDefinitions]);
}
