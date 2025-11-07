import { useMemo, useRef } from 'react';

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
import { enhanceTokensWithRates, sortTokensWithRates } from 'src/utils/wallet/tokenUtils';

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
            .map(account => ({
                ...account,
                tokens: enhanceTokensWithRates(
                    account.tokens,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                ).sort(sortTokensWithRates),
            }));

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
    }, [accounts, baseCurrencyCode, networkSymbol]);
}
