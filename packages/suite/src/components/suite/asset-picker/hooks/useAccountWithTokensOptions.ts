import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { CryptoId } from 'invity-api';

import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { getCryptoId } from '@suite-common/trading';
import { NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    accountsFiatBalanceInDescOrderComparator,
    findAccountsByNetwork,
} from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { ASSET_ROW_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { AccountWithTokensOption } from 'src/components/suite/asset-picker/hooks';
import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

function filterAccountsByNetworkSymbol(
    accounts: Account[],
    networkSymbol: NetworkSymbol | undefined,
): Account[] {
    return networkSymbol ? findAccountsByNetwork(networkSymbol, accounts) : accounts;
}
export interface UseAccountWithTokensOptionsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    accountFilter?: (account: Account) => boolean;
    enabledCryptoIds?: Set<CryptoId>;
}

export function useAccountWithTokensOptions({
    networkSymbolFilter,
    accountFilter = () => true,
    enabledCryptoIds = new Set(),
}: UseAccountWithTokensOptionsProps): {
    accountsWithTokens: AccountWithTokensOption[];
    networks: NetworkSymbol[];
} {
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    // Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
    const throttledAccounts = useThrottle(accounts, 1000);
    const fiatRatesRef = useCurrentRef(fiatRates);

    return useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return {
                accountsWithTokens: [],
                networks: [],
            };
        }

        const validAccounts = throttledAccounts.filter(accountFilter);

        const networks = new Set(validAccounts.map(account => account.symbol));
        const orderedNetworks = networkSymbolCollection.filter(network => networks.has(network));

        const networkAccounts = filterAccountsByNetworkSymbol(validAccounts, networkSymbolFilter);

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

        const supportedAccountsWithTokens = accountsWithTokensOptions.filter(option => {
            const cryptoId =
                option.type === 'account'
                    ? getCryptoId(option.account.symbol)
                    : getCryptoId(option.account.symbol, option.token?.contract);

            return enabledCryptoIds.has(cryptoId);
        });

        return {
            accountsWithTokens: supportedAccountsWithTokens,
            networks: orderedNetworks,
        };
    }, [
        fiatRatesRef,
        throttledAccounts,
        networkSymbolFilter,
        accountFilter,
        baseCurrencyCode,
        tokenDefinitions,
        enabledCryptoIds,
    ]);
}
