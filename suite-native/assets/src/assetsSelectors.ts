import { A, D, F, G, pipe } from '@mobily/ts-belt';
import { memoize, memoizeWithArgs } from 'proxy-memoize';

import { calculateAssetsPercentage } from '@suite-common/assets';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectCurrentFiatRates,
    selectDeviceAccounts,
    selectVisibleDeviceAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { selectAccountListSections } from '@suite-native/accounts';
import { sortAccountsByNetworksAndAccountTypes } from '@suite-native/accounts/src/utils';
import { discoverySupportedNetworks } from '@suite-native/config';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/settings';
export interface AssetType {
    symbol: NetworkSymbol;
    assetBalance: string;
    fiatBalance: string | null;
}

export type AssetsRootState = AccountsRootState &
    FiatRatesRootState &
    SettingsSliceRootState &
    TokenDefinitionsRootState &
    DeviceRootState;

/*
We do not memoize any of following selectors because they are using only with `useSelectorDeepComparison` hook which is faster than memoization in proxy-memoize.
*/

export const selectVisibleDeviceAccountsKeysByNetworkSymbol = (
    state: AssetsRootState,
    networkSymbol: NetworkSymbol | null,
) => {
    if (G.isNull(networkSymbol)) return [];

    const accounts = selectDeviceAccounts(state).filter(
        account => account.symbol === networkSymbol && account.visible,
    );

    return accounts.map(account => account.key);
};

export const selectDeviceNetworksWithAssets = (state: AssetsRootState) => {
    const accounts = selectVisibleDeviceAccounts(state);

    return pipe(
        accounts,
        A.map(account => account.symbol),
        A.uniq,
        A.sort((a, b) => {
            const aOrder = discoverySupportedNetworks.indexOf(a) ?? Number.MAX_SAFE_INTEGER;
            const bOrder = discoverySupportedNetworks.indexOf(b) ?? Number.MAX_SAFE_INTEGER;

            return aOrder - bOrder;
        }),
    );
};

export const selectBottomSheetDeviceNetworkItems = memoizeWithArgs(
    (state: AssetsRootState, networkSymbol: NetworkSymbol) =>
        pipe(
            selectVisibleDeviceAccountsByNetworkSymbol(state, networkSymbol),
            sortAccountsByNetworksAndAccountTypes,
            A.map(account => selectAccountListSections(state, account.key)),
            A.flat,
            F.toMutable,
        ),
    { size: D.keys(networks).length },
);

const selectDeviceAssetsWithBalances = memoize((state: AssetsRootState) => {
    const accounts = selectVisibleDeviceAccounts(state);

    const deviceNetworksWithAssets = selectDeviceNetworksWithAssets(state);

    const fiatCurrencyCode = selectFiatCurrencyCode(state);
    const rates = selectCurrentFiatRates(state);

    const accountsWithFiatBalance = accounts.map(account => {
        const fiatValue = getAccountFiatBalance({
            account,
            localCurrency: fiatCurrencyCode,
            rates,
            // TODO: this should be removed once Trezor Suite Lite supports staking
            shouldIncludeStaking: false,
        });

        return {
            symbol: account.symbol,
            fiatValue,
            cryptoValue: account.formattedBalance,
        };
    });

    let totalFiatBalance = 0;

    const assets = deviceNetworksWithAssets.map((networkSymbol: NetworkSymbol) => {
        const networkAccounts = accountsWithFiatBalance.filter(
            account => account.symbol === networkSymbol,
        );
        const assetBalance = networkAccounts.reduce(
            (sum, { cryptoValue }) => sum + Number(cryptoValue),
            0,
        );
        const fiatBalance = networkAccounts.reduce(
            (sum, { fiatValue }) => (fiatValue ? Number(fiatValue) + (sum ?? 0) : sum),
            null as number | null,
        );

        totalFiatBalance += fiatBalance ?? 0;

        const asset: AssetType = {
            symbol: networkSymbol,
            // For assets we should always only 8 decimals to save space
            assetBalance: assetBalance.toFixed(8),
            fiatBalance: fiatBalance !== null ? fiatBalance.toFixed(2) : null,
        };

        return asset;
    });

    return { assets, totalFiatBalance: totalFiatBalance.toFixed(2) };
});

export const selectAssetCryptoValue = (state: AssetsRootState, symbol: NetworkSymbol) => {
    const assets = selectDeviceAssetsWithBalances(state);
    const asset = assets.assets.find(a => a.symbol === symbol);

    return asset?.assetBalance ?? '0';
};

export const selectAssetFiatValue = (state: AssetsRootState, symbol: NetworkSymbol) => {
    const assets = selectDeviceAssetsWithBalances(state);
    const asset = assets.assets.find(a => a.symbol === symbol);

    return asset?.fiatBalance ?? null;
};

const selectAssetsFiatValuePercentage = (state: AssetsRootState) => {
    const assets = selectDeviceAssetsWithBalances(state);
    const percentages = calculateAssetsPercentage(assets.assets);

    return percentages;
};

export const selectAssetFiatValuePercentage = (state: AssetsRootState, symbol: NetworkSymbol) => {
    const assetsPercentages = selectAssetsFiatValuePercentage(state);

    const asset = assetsPercentages.find(a => a.symbol === symbol);

    const assetPercentage = {
        fiatPercentage: Math.ceil(asset?.fiatPercentage ?? 0),
        fiatPercentageOffset: Math.floor(asset?.fiatPercentageOffset ?? 0),
    };

    return assetPercentage;
};
