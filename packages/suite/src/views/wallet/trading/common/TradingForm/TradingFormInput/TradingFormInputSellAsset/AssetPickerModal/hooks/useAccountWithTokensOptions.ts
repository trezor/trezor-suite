import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { type CryptoId } from 'invity-api';

import { selectSelectedDevice } from '@suite-common/device';
import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { getCryptoId } from '@suite-common/trading';
import {
    type NetworkSymbol,
    getNetwork,
    networkSymbolCollection,
} from '@suite-common/wallet-config';
import {
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { filterAccountsByNetworkSymbol, isTestnet } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { type AssetRowOption } from 'src/components/suite/asset-picker/types';
import { createAccountOption, createTokenOption } from 'src/components/suite/asset-picker/utils';
import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

export interface UseAccountWithTokensOptionsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    excludedCryptoIds: Set<CryptoId>;
}

export function useAccountWithTokensOptions({
    networkSymbolFilter,
    excludedCryptoIds,
}: UseAccountWithTokensOptionsProps): {
    assetRows: AssetRowOption[];
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

    return useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return { assetRows: [], networks: [] };
        }

        const validAccounts = throttledAccounts.filter(account => {
            if (
                isTestnet(account.symbol) ||
                account.accountType === 'coinjoin' ||
                !getNetwork(account.symbol).tradeCryptoId
            ) {
                return false;
            }

            if (new BigNumber(account.balance).gt(0)) {
                return true;
            }

            const { shownWithBalance, hiddenWithBalance } = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            return shownWithBalance.length > 0 || hiddenWithBalance.length > 0;
        });

        const networks = new Set(validAccounts.map(account => account.symbol));
        const orderedNetworks = networkSymbolCollection.filter(network => networks.has(network));

        const networkAccounts = filterAccountsByNetworkSymbol(validAccounts, networkSymbolFilter);

        const assetRows: AssetRowOption[] = [];

        for (const account of networkAccounts) {
            const { shownWithBalance, hiddenWithBalance } = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            if (
                new BigNumber(account.balance).gt(0) &&
                !excludedCryptoIds.has(getCryptoId(account.symbol))
            ) {
                assetRows.push(createAccountOption(account));
            }

            enhanceTokensWithRates(
                shownWithBalance.concat(hiddenWithBalance),
                baseCurrencyCode,
                account.symbol,
                fiatRates,
            )
                .filter(
                    token => !excludedCryptoIds.has(getCryptoId(account.symbol, token.contract)),
                )
                .sort(sortTokensWithRates)
                .forEach(token => {
                    assetRows.push(createTokenOption(account, token));
                });
        }

        return { assetRows, networks: orderedNetworks };
    }, [
        fiatRatesRef,
        throttledAccounts,
        networkSymbolFilter,
        tokenDefinitions,
        baseCurrencyCode,
        excludedCryptoIds,
    ]);
}
