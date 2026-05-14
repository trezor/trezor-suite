import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { type CryptoId } from 'invity-api';

import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type EnhancedTokenInfo, selectTokenDefinitions } from '@suite-common/token-definitions';
import { getCryptoId } from '@suite-common/trading';
import { type NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    accountsFiatBalanceInDescOrderComparator,
    filterAccountsByNetworkSymbol,
    isTestnet,
} from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import {
    createAccountOption,
    createNonTradableTokensOption,
    createTokenOption,
} from 'src/components/suite/asset-picker/utils';
import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

interface GetSupportedTokensProps<T extends TokenInfo | EnhancedTokenInfo> {
    networkSymbol: NetworkSymbol;
    tokens: T[] | undefined;
    supportedCryptoIds: Set<CryptoId>;
}

function getSupportedAndUnsupportedTokens<T extends TokenInfo | EnhancedTokenInfo>({
    networkSymbol,
    tokens = [],
    supportedCryptoIds,
}: GetSupportedTokensProps<T>) {
    const supportedTokens = tokens.filter(token =>
        supportedCryptoIds.has(getCryptoId(networkSymbol, token.contract)),
    );

    const unsupportedTokens = tokens.filter(
        token => !supportedCryptoIds.has(getCryptoId(networkSymbol, token.contract)),
    );

    return { supportedTokens, unsupportedTokens };
}

export interface UseAccountWithTokensOptionsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    includedCryptoIds: Set<CryptoId>;
    excludedCryptoIds: Set<CryptoId>;
    expandedNonTradableTokensGroups: AccountKey[];
}

export function useAccountWithTokensOptions({
    networkSymbolFilter,
    includedCryptoIds,
    excludedCryptoIds,
    expandedNonTradableTokensGroups,
}: UseAccountWithTokensOptionsProps): {
    accountsWithTokens: AccountWithTokensOption[];
    networks: NetworkSymbol[];
} {
    const device = useSelector(selectSelectedDevice);
    const baseAccounts = useSelector(selectVisibleDeviceAccounts);

    const accounts = useSelector(state =>
        selectAccountsWithSuiteSyncLabel(
            state,
            baseAccounts,
            device?.state?.staticSessionId ?? null,
        ),
    );

    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    // Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
    const throttledAccounts = useThrottle(accounts, 1000);
    const fiatRatesRef = useCurrentRef(fiatRates);

    const { networks, accountsWithTokens, supportedCryptoIds } = useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return {
                accountsWithTokens: [],
                networks: [],
                supportedCryptoIds: new Set(),
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
        const supportedNetworkAccounts = networkAccounts.filter(account =>
            includedCryptoIds.has(getCryptoId(account.symbol)),
        );
        const supportedCryptoIds = new Set(
            Array.from(includedCryptoIds).filter(cryptoId => !excludedCryptoIds.has(cryptoId)),
        );

        const accountsAndTokensSortedByFiatBalance = supportedNetworkAccounts
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

                const { supportedTokens, unsupportedTokens } = getSupportedAndUnsupportedTokens({
                    networkSymbol: account.symbol,
                    tokens: shownWithBalance.concat(hiddenWithBalance),
                    supportedCryptoIds,
                });

                const sortedSupportedTokensByFiatBalance = enhanceTokensWithRates(
                    supportedTokens,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                ).sort(sortTokensWithRates);

                const sortedUnsupportedTokensByFiatBalance = enhanceTokensWithRates(
                    unsupportedTokens,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                ).sort(sortTokensWithRates);

                return {
                    account,
                    tokens: sortedSupportedTokensByFiatBalance,
                    nonTradableTokens: sortedUnsupportedTokensByFiatBalance,
                };
            });

        return {
            accountsWithTokens: accountsAndTokensSortedByFiatBalance,
            networks: orderedNetworks,
            supportedCryptoIds,
        };
    }, [
        fiatRatesRef,
        throttledAccounts,
        networkSymbolFilter,
        includedCryptoIds,
        tokenDefinitions,
        baseCurrencyCode,
        excludedCryptoIds,
    ]);

    const accountsWithTokensOptions = useMemo<AccountWithTokensOption[]>(() => {
        const accountsWithTokensOptions: AccountWithTokensOption[] = [];

        for (const { account, tokens, nonTradableTokens } of accountsWithTokens) {
            if (supportedCryptoIds.has(getCryptoId(account.symbol))) {
                accountsWithTokensOptions.push(createAccountOption(account));
            }

            tokens.forEach(token => {
                accountsWithTokensOptions.push(createTokenOption(account, token));
            });

            if (nonTradableTokens.length > 0) {
                accountsWithTokensOptions.push(
                    createNonTradableTokensOption({
                        account,
                        nonTradableTokens,
                        expandedNonTradableTokensGroups,
                    }),
                );
            }
        }

        return accountsWithTokensOptions;
    }, [accountsWithTokens, supportedCryptoIds, expandedNonTradableTokensGroups]);

    return {
        accountsWithTokens: accountsWithTokensOptions,
        networks,
    };
}
