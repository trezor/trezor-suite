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
import {
    accountsFiatBalanceInDescOrderComparator,
    filterAccountsByNetworkSymbol,
    isTestnet,
} from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import { createAccountOption, createTokenOption } from 'src/components/suite/asset-picker/utils';
import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

export interface UseAccountWithTokensOptionsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    supportedCryptoIds: Set<CryptoId>;
}

export function useAccountWithTokensOptions({
    networkSymbolFilter,
    supportedCryptoIds,
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

        const validAccounts = throttledAccounts.filter(account => {
            if (isTestnet(account.symbol) || account.accountType === 'coinjoin') {
                return false;
            }

            if (account.tokens?.length === 0) {
                return new BigNumber(account.balance).gt(0);
            }

            const tokens = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            return tokens.shownWithBalance.length > 0;
        });

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
                    account,
                    tokens: sortedTokensByFiatBalance,
                };
            });

        const accountsWithTokens: AccountWithTokensOption[] =
            accountsAndTokensSortedByFiatBalance.flatMap(({ account, tokens }) => [
                createAccountOption(account),
                ...tokens.map(token => createTokenOption(account, token)),
            ]);

        const supportedAccountsWithTokens = accountsWithTokens.filter(option => {
            switch (option.type) {
                case 'account':
                    return supportedCryptoIds.has(getCryptoId(option.account.symbol));
                case 'token':
                    return supportedCryptoIds.has(
                        getCryptoId(option.account.symbol, option.token?.contract),
                    );
                default:
                    return false;
            }
        });

        return {
            accountsWithTokens: supportedAccountsWithTokens,
            networks: orderedNetworks,
        };
    }, [
        fiatRatesRef,
        throttledAccounts,
        networkSymbolFilter,
        tokenDefinitions,
        baseCurrencyCode,
        supportedCryptoIds,
    ]);
}
