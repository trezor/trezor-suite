import { createSelector } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { Network, networksCompatibility, NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccounts, selectCoins } from '@suite-common/wallet-core';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';

type Assets = Partial<Record<NetworkSymbol, string[]>>;

interface AssetType {
    symbol: NetworkSymbol;
    network: Network;
    assetBalance: BigNumber;
    fiatBalance: string;
}

export const selectBalancesPerNetwork = createSelector(selectAccounts, (accounts): Assets => {
    const assets: Assets = {};
    accounts.forEach(account => {
        if (!assets[account.symbol]) {
            assets[account.symbol] = [];
        }
        assets[account.symbol]?.push(account.formattedBalance);
    });

    return assets;
});

export const selectNetworksWithAssets = createSelector(
    selectBalancesPerNetwork,
    (assets: Assets): NetworkSymbol[] => Object.keys(assets) as NetworkSymbol[],
);

export const selectAssetsWithBalances = createSelector(
    [
        selectNetworksWithAssets,
        selectBalancesPerNetwork,
        selectCoins,
        (_state, fiatCurrency: FiatCurrencyCode) => fiatCurrency,
    ],
    (networks, assets, coins, fiatCurrency): AssetType[] =>
        networks
            .map((symbol: NetworkSymbol) => {
                const network = networksCompatibility.find(
                    n => n.symbol === symbol && !n.accountType,
                );
                if (!network) {
                    console.error('unknown network');
                    return;
                }

                const currentFiatRates = coins.find(
                    f => f.symbol.toLowerCase() === symbol.toLowerCase(),
                )?.current;

                const assetBalance = assets[symbol]?.reduce(
                    (prev, formattedBalance) => prev.plus(formattedBalance),
                    new BigNumber(0),
                );

                // Note: This shouldn't be happening in a selector but rather in component itself.
                // In future, we will probably have something like `CryptoAmountToFiatFormatter` in component just using value sent from this selector.
                const fiatBalance = toFiatCurrency(
                    assetBalance?.toString() ?? '0',
                    fiatCurrency,
                    currentFiatRates?.rates,
                );

                if (!assetBalance) return;

                const asset: AssetType = {
                    symbol,
                    network,
                    assetBalance,
                    fiatBalance: fiatBalance ?? '0',
                };
                return asset;
            })
            .filter(data => data !== undefined) as AssetType[],
);
