import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { type CryptoId } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type EnhancedTokenInfo, selectTokenDefinitions } from '@suite-common/token-definitions';
import { getCryptoId } from '@suite-common/trading';
import { type NetworkConfigDeps, type NetworkSymbol } from '@suite-common/wallet-config';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { filterAccountsByNetworkSymbol, isTestnet } from '@suite-common/wallet-utils';
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

interface GetSupportedTokensProps<
    T extends TokenInfo | EnhancedTokenInfo,
> extends NetworkConfigDeps {
    networkSymbol: NetworkSymbol;
    tokens: T[] | undefined;
    supportedCryptoIds: Set<CryptoId>;
}

function getSupportedAndUnsupportedTokens<T extends TokenInfo | EnhancedTokenInfo>({
    getNetworkConfig,
    networkModuleRepository,
    networkSymbol,
    tokens = [],
    supportedCryptoIds,
}: GetSupportedTokensProps<T>) {
    const supportedTokens = tokens.filter(token =>
        supportedCryptoIds.has(
            getCryptoId(
                { getNetworkConfig, networkModuleRepository },
                networkSymbol,
                token.contract,
            ),
        ),
    );

    const unsupportedTokens = tokens.filter(
        token =>
            !supportedCryptoIds.has(
                getCryptoId(
                    { getNetworkConfig, networkModuleRepository },
                    networkSymbol,
                    token.contract,
                ),
            ),
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
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
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
            if (
                isTestnet(networkConfigDeps, account.symbol) ||
                account.accountType === 'coinjoin'
            ) {
                return false;
            }

            if (new BigNumber(account.balance).gt(0)) {
                return true;
            }

            const { shownWithBalance, hiddenWithBalance } = getTokens({
                ...networkConfigDeps,
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            return shownWithBalance.length > 0 || hiddenWithBalance.length > 0;
        });

        const networks = new Set(validAccounts.map(account => account.symbol));
        const orderedNetworks = networkConfigDeps.networkModuleRepository
            .getSupportedNetworks()
            .filter(network => networks.has(network));

        const networkAccounts = filterAccountsByNetworkSymbol(validAccounts, networkSymbolFilter);
        const supportedNetworkAccounts = networkAccounts.filter(account =>
            includedCryptoIds.has(getCryptoId(networkConfigDeps, account.symbol)),
        );
        const supportedCryptoIds = new Set(
            Array.from(includedCryptoIds).filter(cryptoId => !excludedCryptoIds.has(cryptoId)),
        );

        const accountsAndTokensSortedByCoin = supportedNetworkAccounts.map(account => {
            const { shownWithBalance, hiddenWithBalance } = getTokens({
                ...networkConfigDeps,
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            const { supportedTokens, unsupportedTokens } = getSupportedAndUnsupportedTokens({
                ...networkConfigDeps,
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
            accountsWithTokens: accountsAndTokensSortedByCoin,
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
            if (
                supportedCryptoIds.has(getCryptoId(networkConfigDeps, account.symbol)) &&
                new BigNumber(account.balance).gt(0)
            ) {
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
