import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    accountsFiatBalanceInDescOrderComparator,
    filterAccountsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { useCurrentRef } from '@trezor/react-utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import {
    createAccountOption,
    createHiddenTokensOption,
    createTokenOption,
} from 'src/components/suite/asset-picker/utils';
import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

export interface UseAccountWithTokensOptionsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    staticSessionId: StaticSessionId | null;

    /**
     * Each account might have expandable hidden token group.
     */
    expandedHiddenTokensGroups: AccountKey[];
}

export function useAccountWithTokensOptions({
    networkSymbolFilter,
    expandedHiddenTokensGroups,
    staticSessionId,
}: UseAccountWithTokensOptionsProps): AccountWithTokensOption[] {
    const baseAccounts = useSelector(selectVisibleDeviceAccounts);

    const accounts = useSelector(state =>
        selectAccountsWithSuiteSyncLabel(state, baseAccounts, staticSessionId),
    );

    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    // Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
    const throttledAccounts = useThrottle(accounts, 1000);
    const fiatRatesRef = useCurrentRef(fiatRates);

    const accountsAndTokensSortedByFiatBalance = useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return [];
        }

        const networkAccounts = filterAccountsByNetworkSymbol(
            throttledAccounts,
            networkSymbolFilter,
        ).filter(acc => acc.networkType !== 'tron');

        return networkAccounts
            .toSorted(function sortByFiatBalanceInDescOrder(accountA, accountB) {
                return accountsFiatBalanceInDescOrderComparator({
                    accountA,
                    accountB,
                    baseCurrencyCode,
                    fiatRates,
                });
            })
            .map(account => {
                const { shownWithBalance, hiddenWithBalance } = getTokens({
                    tokens: account.tokens ?? [],
                    symbol: account.symbol,
                    tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
                });

                const sortedTokensByFiatBalance = enhanceTokensWithRates(
                    shownWithBalance,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                ).sort(sortTokensWithRates);

                const sortedHiddenTokensByFiatBalance = enhanceTokensWithRates(
                    hiddenWithBalance,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                ).sort(sortTokensWithRates);

                return {
                    account,
                    tokens: sortedTokensByFiatBalance,
                    hiddenTokens: sortedHiddenTokensByFiatBalance,
                };
            });
    }, [fiatRatesRef, throttledAccounts, networkSymbolFilter, baseCurrencyCode, tokenDefinitions]);

    return useMemo(() => {
        const accountsWithTokens: AccountWithTokensOption[] = [];

        for (const { account, tokens, hiddenTokens } of accountsAndTokensSortedByFiatBalance) {
            accountsWithTokens.push(createAccountOption(account));

            tokens.forEach(token => {
                accountsWithTokens.push(createTokenOption(account, token));
            });

            if (hiddenTokens.length > 0) {
                accountsWithTokens.push(
                    createHiddenTokensOption({ account, hiddenTokens, expandedHiddenTokensGroups }),
                );
            }
        }

        return accountsWithTokens;
    }, [accountsAndTokensSortedByFiatBalance, expandedHiddenTokensGroups]);
}
