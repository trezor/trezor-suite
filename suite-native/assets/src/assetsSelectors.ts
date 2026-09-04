import { shallowEqual } from 'react-redux';

import {
    type AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';
import { selectIsDeviceAuthorized } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';
import {
    getAccountCryptoBalanceWithStaking,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectHasRunningDiscovery,
    selectVisibleDeviceAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getAccountFiatBalance, isStakingSymbol } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type AssetFiatPercentage, type AssetType, type AssetsRootState } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetsRootState>();

export const selectDeviceNetworkSymbolsWithAssets = createMemoizedSelector(
    [selectVisibleDeviceAccounts],
    accounts => {
        const networkSymbols = new Set(accounts.map(account => account.symbol));

        return returnStableArrayIfEmpty(
            networkSymbolCollection.filter(networkSymbol => networkSymbols.has(networkSymbol)),
        );
    },
    {
        memoizeOptions: {
            // accounts churn every discovery tick but the symbol set rarely changes; shallowEqual
            // keeps the previous array reference when symbols match, so `Assets` re-renders only
            // when a network is added or removed, not on every balance update.
            resultEqualityCheck: shallowEqual,
        },
    },
);

const selectDeviceAssetsWithBalances = createMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        selectDeviceNetworkSymbolsWithAssets,
        selectBaseCurrency,
        selectCurrentFiatRates,
    ],
    (accounts, deviceNetworkSymbolsWithAssets, baseCurrencyCode, rates) => {
        const accountsWithFiatBalance = accounts.map(account => {
            const shouldIncludeStaking = isStakingSymbol(account.symbol);

            const fiatValue = getAccountFiatBalance({
                account,
                baseCurrencyCode,
                rates,
                shouldIncludeStaking,
            });

            return {
                symbol: account.symbol,
                fiatValue,
                cryptoValue: getAccountCryptoBalanceWithStaking(account),
            };
        });

        return deviceNetworkSymbolsWithAssets.map((symbol: NetworkSymbol): AssetType => {
            const networkAccounts = accountsWithFiatBalance.filter(
                account => account.symbol === symbol,
            );
            const assetBalance = networkAccounts.reduce(
                (sum, { cryptoValue }) => sum.plus(new BigNumber(cryptoValue)),
                new BigNumber(0),
            );
            const fiatBalance = networkAccounts.reduce<BigNumber | null>((sum, { fiatValue }) => {
                // If any account has null fiat data, set the network fiat to null.
                // This prevents showing partial/incomplete values to users - we show loading state until all data is available.
                if (sum === null) return null;
                if (fiatValue == null) return null;

                return sum.plus(fiatValue);
            }, new BigNumber(0));

            return {
                symbol,
                // For assets we should always only 8 decimals to save space
                assetBalance: assetBalance.toFixed(8),
                fiatBalance: fiatBalance ? asBaseCurrencyAmount(fiatBalance) : null,
            };
        });
    },
);

export const selectAssetCryptoValue = (state: AssetsRootState, symbol: NetworkSymbol) => {
    const assets = selectDeviceAssetsWithBalances(state);
    const asset = assets.find(a => a.symbol === symbol);

    return asset?.assetBalance ?? '0';
};

export const selectHasMultipleDeviceAccountsForNetworkSymbol = (
    state: AssetsRootState,
    symbol: NetworkSymbol,
) => selectVisibleDeviceAccountsByNetworkSymbol(state, symbol).length > 1;

// Returns a primitive (key or null) so a plain `useSelector` (`===`) only re-renders when it
// actually flips - which happens once, when the account count crosses 1<->2.
export const selectSingleDeviceAccountKeyForNetworkSymbol = (
    state: AssetsRootState,
    symbol: NetworkSymbol,
): AccountKey | null => {
    if (selectHasMultipleDeviceAccountsForNetworkSymbol(state, symbol)) {
        return null;
    }

    return selectVisibleDeviceAccountsByNetworkSymbol(state, symbol)[0]?.key ?? null;
};

export const selectAssetFiatValue = createMemoizedSelector(
    [selectDeviceAssetsWithBalances, (_state, symbol: NetworkSymbol) => symbol],
    (assets, symbol) => {
        const asset = assets.find(a => a.symbol === symbol);

        return asset?.fiatBalance?.toString() ?? null;
    },
);

const selectAssetsFiatValuePercentage = createMemoizedSelector(
    [selectDeviceAssetsWithBalances, selectHasRunningDiscovery],
    (assets, hasDiscovery): AssetFiatBalanceWithPercentage[] =>
        hasDiscovery ? returnStableArrayIfEmpty([]) : calculateAssetsPercentage(assets),
);

export const selectAssetFiatValuePercentage = createMemoizedSelector(
    [selectAssetsFiatValuePercentage, (_state, symbol: NetworkSymbol) => symbol],
    (assetsPercentages, symbol): AssetFiatPercentage => {
        const asset = assetsPercentages.find(a => a.symbol === symbol);

        return {
            fiatPercentage: Math.ceil(asset?.fiatPercentage ?? 0),
            fiatPercentageOffset: Math.floor(asset?.fiatPercentageOffset ?? 0),
        };
    },
);

export const selectIsAssetListLoading = createMemoizedSelector(
    [selectHasRunningDiscovery, selectIsDeviceAuthorized],
    (hasDiscovery, isDeviceAuthorized): boolean => hasDiscovery || !isDeviceAuthorized,
);

export const selectIsAssetListEmpty = createMemoizedSelector(
    [selectDeviceNetworkSymbolsWithAssets],
    (deviceNetworkSymbols): boolean => deviceNetworkSymbols.length === 0,
);
