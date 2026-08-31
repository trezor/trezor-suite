import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { useSelector } from '@suite-common/redux-utils';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { filterAccountsByNetworkSymbol } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import {
    createAccountOption,
    createHiddenTokensOption,
    createTokenOption,
} from 'src/components/suite/asset-picker/utils';
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

    const accountsAndTokensSortedByCoin = useMemo(() => {
        const currentFiatRates = fiatRatesRef.current;

        if (!currentFiatRates) {
            return [];
        }

        const networkAccounts = filterAccountsByNetworkSymbol(
            throttledAccounts,
            networkSymbolFilter,
        );

        return networkAccounts
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
                    currentFiatRates,
                ).sort(sortTokensWithRates);

                const sortedHiddenTokensByFiatBalance = enhanceTokensWithRates(
                    hiddenWithBalance,
                    baseCurrencyCode,
                    account.symbol,
                    currentFiatRates,
                ).sort(sortTokensWithRates);

                return {
                    account,
                    tokens: sortedTokensByFiatBalance,
                    hiddenTokens: sortedHiddenTokensByFiatBalance,
                };
            })
            .filter(
                // There is nothing to send from an account with neither native nor token balance,
                // consistent with the Swap and Sell account selection.
                ({ account, tokens, hiddenTokens }) =>
                    new BigNumber(account.balance).gt(0) ||
                    tokens.length > 0 ||
                    hiddenTokens.length > 0,
            );
    }, [fiatRatesRef, throttledAccounts, networkSymbolFilter, baseCurrencyCode, tokenDefinitions]);

    return useMemo(() => {
        const accountsWithTokens: AccountWithTokensOption[] = [];

        for (const { account, tokens, hiddenTokens } of accountsAndTokensSortedByCoin) {
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
    }, [accountsAndTokensSortedByCoin, expandedHiddenTokensGroups]);
}
