import { useMemo, useRef } from 'react';

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
import { TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import {
    ASSET_ROW_ACCOUNT_HEIGHT,
    ASSET_ROW_TOKEN_HEIGHT,
} from 'src/components/suite/asset-picker/components';
import { useSelector } from 'src/hooks/suite';
import {
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
          token: TokenInfo;
          height: number;
      };

function filterAccountsByNetworkSymbol(
    accounts: Account[],
    networkSymbol: NetworkSymbol | undefined,
): Account[] {
    return networkSymbol ? findAccountsByNetwork(networkSymbol, accounts) : accounts;
}

function selectAccountsWithPositiveBalance(accounts: Account[]): Account[] {
    return accounts.filter(account => new BigNumber(account.availableBalance).gt(0));
}

export function useAccountWithTokensOptions(
    networkSymbol: NetworkSymbol | undefined,
): AccountWithTokensOption[] {
    const accounts = useSelector(selectAllAccountsToList);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const fiatRagesRef = useRef(fiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    return useMemo(() => {
        const fiatRates = fiatRagesRef.current;

        if (!fiatRates) {
            return [];
        }

        const networkAccounts = filterAccountsByNetworkSymbol(accounts, networkSymbol);
        const accountsWithPositiveBalance = selectAccountsWithPositiveBalance(networkAccounts);

        const accountsAndTokensSortedByFiatBalance = accountsWithPositiveBalance
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

        const accountsWithTokensOptions: AccountWithTokensOption[] = [];

        for (const account of accountsAndTokensSortedByFiatBalance) {
            accountsWithTokensOptions.push({
                type: 'account',
                account,
                height: ASSET_ROW_ACCOUNT_HEIGHT,
            });

            for (const token of account.tokens ?? []) {
                accountsWithTokensOptions.push({
                    type: 'token',
                    account,
                    token,
                    height: ASSET_ROW_TOKEN_HEIGHT,
                });
            }
        }

        return accountsWithTokensOptions;
    }, [accounts, baseCurrencyCode, networkSymbol, tokenDefinitions]);
}
