import { A, F, G, pipe } from '@mobily/ts-belt';

import { calculateAssetsPercentage } from '@suite-common/assets';
import type { DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    getSimpleCoinDefinitionsByNetwork,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, networkSymbolCollection } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectDeviceAccounts,
    selectVisibleDeviceAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getAccountFiatBalance, isStakingSymbol } from '@suite-common/wallet-utils';
import {
    getAccountListSections,
    sortAccountsByNetworksAndAccountTypes,
} from '@suite-native/accounts';
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
    DeviceRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetsRootState>();

/*
We do not memoize most of following selectors because they are using only with `useSelectorDeepComparison` hook which is faster than memoization.
TODO: revalidate if this is still true for reselect
*/

export const selectVisibleDeviceAccountsKeysByNetworkSymbol = (
    state: AssetsRootState,
    symbol: NetworkSymbol | null,
) => {
    if (G.isNull(symbol)) return [];

    const accounts = selectDeviceAccounts(state).filter(
        account => account.symbol === symbol && account.visible,
    );

    return accounts.map(account => account.key);
};

export const selectDeviceNetworksWithAssets = createMemoizedSelector(
    [selectVisibleDeviceAccounts],
    accounts =>
        pipe(
            accounts,
            A.map(account => account.symbol),
            A.uniq,
            A.sort((a, b) => {
                const aOrder = networkSymbolCollection.indexOf(a) ?? Number.MAX_SAFE_INTEGER;
                const bOrder = networkSymbolCollection.indexOf(b) ?? Number.MAX_SAFE_INTEGER;

                return aOrder - bOrder;
            }),
        ),
);

export const selectBottomSheetDeviceNetworkItems = createMemoizedSelector(
    [
        selectVisibleDeviceAccountsByNetworkSymbol,
        selectTokenDefinitions,
        (_state, symbol: NetworkSymbol | null) => symbol,
    ],
    (accounts, tokenDefinitions, symbol) => {
        if (G.isNull(symbol)) return [];

        return pipe(
            accounts,
            sortAccountsByNetworksAndAccountTypes,
            A.map(account =>
                getAccountListSections(
                    account,
                    getSimpleCoinDefinitionsByNetwork(tokenDefinitions, symbol),
                ),
            ),
            A.flat,
            F.toMutable,
        );
    },
);

const selectDeviceAssetsWithBalances = createMemoizedSelector(
    [
        selectVisibleDeviceAccounts,
        selectDeviceNetworksWithAssets,
        selectBaseCurrency,
        selectCurrentFiatRates,
    ],
    (accounts, deviceNetworksWithAssets, baseCurrencyCode, rates) => {
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

        let totalFiatBalance = asBaseCurrencyAmount(new BigNumber(0));

        const assets = deviceNetworksWithAssets.map((symbol: NetworkSymbol) => {
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

            if (fiatBalance) {
                totalFiatBalance = asBaseCurrencyAmount(totalFiatBalance.plus(fiatBalance));
            }

            const asset: AssetType = {
                symbol,
                // For assets we should always only 8 decimals to save space
                assetBalance: assetBalance.toFixed(8),
                fiatBalance: fiatBalance ? asBaseCurrencyAmount(fiatBalance) : null,
            };

            return asset;
        });

        return { assets, totalFiatBalance: asBaseCurrencyAmount(totalFiatBalance) };
    },
);

export const selectAssetCryptoValue = (state: AssetsRootState, symbol: NetworkSymbol) => {
    const assets = selectDeviceAssetsWithBalances(state);
    const asset = assets.assets.find(a => a.symbol === symbol);

    return asset?.assetBalance ?? '0';
};

export const selectAssetFiatValue = createMemoizedSelector(
    [selectDeviceAssetsWithBalances, (_state, symbol: NetworkSymbol) => symbol],
    (assets, symbol) => {
        const asset = assets.assets.find(a => a.symbol === symbol);

        return asset?.fiatBalance?.toString() ?? null;
    },
);

const selectAssetsFiatValuePercentage = createMemoizedSelector(
    [selectDeviceAssetsWithBalances],
    assets => {
        const percentages = calculateAssetsPercentage(assets.assets);

        return percentages;
    },
);

export const selectAssetFiatValuePercentage = createMemoizedSelector(
    [selectAssetsFiatValuePercentage, (_state, symbol: NetworkSymbol) => symbol],
    (assetsPercentages, symbol) => {
        const asset = assetsPercentages.find(a => a.symbol === symbol);

        const assetPercentage = {
            fiatPercentage: Math.ceil(asset?.fiatPercentage ?? 0),
            fiatPercentageOffset: Math.floor(asset?.fiatPercentageOffset ?? 0),
        };

        return assetPercentage;
    },
);
