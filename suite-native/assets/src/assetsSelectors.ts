import {
    type AssetFiatBalanceWithPercentage,
    calculateAssetsPercentage,
} from '@suite-common/assets';
import type { DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectHasRunningDiscovery,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getAccountFiatBalance, isStakingSymbol } from '@suite-common/wallet-utils';
import {
    type NativeStakingRootState,
    getAccountCryptoBalanceWithStaking,
} from '@suite-native/staking';
import { BigNumber } from '@trezor/utils';

export interface AssetType {
    symbol: NetworkSymbol;
    assetBalance: string;
    fiatBalance: BaseCurrencyAmount | null;
}

export type AssetsRootState = AccountsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    TokenDefinitionsRootState &
    NativeStakingRootState &
    DeviceRootState &
    DiscoveryRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetsRootState>();

/*
Selectors here are memoized via `createWeakMapSelector`. Where the inputs churn (e.g. during
discovery) but the output is value-stable, attach a `resultEqualityCheck` so the selector keeps
returning the same reference. Consumers can then use a plain `useSelector` (`===`) instead of the
per-dispatch deep walk of `useSelectorDeepComparison`.
*/

const areNetworkSymbolsEqual = (
    previousNetworkSymbols: NetworkSymbol[],
    nextNetworkSymbols: NetworkSymbol[],
) =>
    previousNetworkSymbols.length === nextNetworkSymbols.length &&
    previousNetworkSymbols.every(
        (networkSymbol, index) => networkSymbol === nextNetworkSymbols[index],
    );

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
            resultEqualityCheck: areNetworkSymbolsEqual,
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

export const selectAssetFiatValue = createMemoizedSelector(
    [selectDeviceAssetsWithBalances, (_state, symbol: NetworkSymbol) => symbol],
    (assets, symbol) => {
        const asset = assets.find(a => a.symbol === symbol);

        return asset?.fiatBalance?.toString() ?? null;
    },
);

type AssetFiatPercentage = {
    fiatPercentage: number;
    fiatPercentageOffset: number;
};

const selectAssetsFiatValuePercentage = createMemoizedSelector(
    [selectDeviceAssetsWithBalances, selectHasRunningDiscovery],
    (assets, hasDiscovery): AssetFiatBalanceWithPercentage[] =>
        // While discovery runs the totals change every tick, so skip the full percentage pass and
        // compute it once discovery finishes. The empty result must stay a STABLE reference
        // (returnStableArrayIfEmpty) - that stability is what keeps selectAssetFiatValuePercentage
        // stable during discovery, so its consumer needs no resultEqualityCheck.
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
