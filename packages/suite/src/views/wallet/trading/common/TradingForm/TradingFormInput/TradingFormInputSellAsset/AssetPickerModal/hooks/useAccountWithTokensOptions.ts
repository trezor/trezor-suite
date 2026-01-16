import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { CryptoId } from 'invity-api';

import { EnhancedTokenInfo, selectTokenDefinitions } from '@suite-common/token-definitions';
import { getCryptoId } from '@suite-common/trading';
import { NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { Account, AccountKey } from '@suite-common/wallet-types';
import {
    accountsFiatBalanceInDescOrderComparator,
    filterAccountsByNetworkSymbol,
    isTestnet,
} from '@suite-common/wallet-utils';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
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

function getSupportedAccounts(accounts: Account[], supportedCryptoIds: Set<CryptoId>): Account[] {
    return accounts.filter(account => supportedCryptoIds.has(getCryptoId(account.symbol)));
}

interface GetSupportedTokensProps<T extends TokenInfo | EnhancedTokenInfo> {
    accountSymbol: NetworkSymbol;
    tokens: T[] | undefined;
    supportedCryptoIds: Set<CryptoId>;
}

function getSupportedAndUnsupportedTokens<T extends TokenInfo | EnhancedTokenInfo>({
    accountSymbol,
    tokens,
    supportedCryptoIds,
}: GetSupportedTokensProps<T>) {
    const supportedTokens = (tokens ?? []).filter(token =>
        supportedCryptoIds.has(getCryptoId(accountSymbol, token.contract)),
    );

    const unsupportedTokens = (tokens ?? []).filter(
        token => !supportedCryptoIds.has(getCryptoId(accountSymbol, token.contract)),
    );

    return { supportedTokens, unsupportedTokens };
}

export interface UseAccountWithTokensOptionsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    supportedCryptoIds: Set<CryptoId>;
    expandedNonTradableTokensGroups: AccountKey[];
}

export function useAccountWithTokensOptions({
    networkSymbolFilter,
    supportedCryptoIds,
    expandedNonTradableTokensGroups,
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

    const { networks, accountsWithTokens } = useMemo(() => {
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
        const supportedAccounts = getSupportedAccounts(networkAccounts, supportedCryptoIds);

        const accountsAndTokensSortedByFiatBalance = supportedAccounts
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
                    accountSymbol: account.symbol,
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
        };
    }, [
        fiatRatesRef,
        throttledAccounts,
        networkSymbolFilter,
        tokenDefinitions,
        baseCurrencyCode,
        supportedCryptoIds,
    ]);

    const accountsWithTokensOptions = useMemo<AccountWithTokensOption[]>(() => {
        const accountsWithTokensOptions: AccountWithTokensOption[] = [];

        for (const { account, tokens, nonTradableTokens } of accountsWithTokens) {
            accountsWithTokensOptions.push(createAccountOption(account));

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
    }, [accountsWithTokens, expandedNonTradableTokensGroups]);

    return {
        accountsWithTokens: accountsWithTokensOptions,
        networks,
    };
}
