import { createSelector } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { Network, networksCompatibility, NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccounts, selectCoins } from '@suite-common/wallet-core';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';

type Assets = Partial<Record<NetworkSymbol, string[]>>;
type FormattedAssets = Partial<Record<NetworkSymbol, BigNumber>>;

interface AssetType {
    symbol: NetworkSymbol;
    network: Network;
    assetBalance: BigNumber;
    fiatBalance: string;
}

const formatBalance = (balances: string[]): BigNumber =>
    balances.reduce((prev, balance) => prev.plus(balance), new BigNumber(0));

export const selectBalancesPerNetwork = createSelector(
    selectAccounts,
    (accounts): FormattedAssets => {
        const assets: Assets = {};
        accounts.forEach(account => {
            if (!assets[account.symbol]) {
                assets[account.symbol] = [];
            }
            assets[account.symbol]?.push(account.formattedBalance);
        });

        const formattedNetworkAssets: FormattedAssets = {};
        const assetKeys = Object.keys(assets) as NetworkSymbol[];
        assetKeys.forEach((asset: NetworkSymbol) => {
            const balances = assets[asset] ?? [];
            formattedNetworkAssets[asset] = formatBalance(balances);
        });

        return formattedNetworkAssets;
    },
);

export const selectNetworksWithAssets = createSelector(
    selectBalancesPerNetwork,
    (assets: FormattedAssets): NetworkSymbol[] => Object.keys(assets) as NetworkSymbol[],
);

export const selectAssetsWithBalances = createSelector(
    [
        selectNetworksWithAssets,
        selectBalancesPerNetwork,
        selectCoins,
        (_state, fiatCurrency: FiatCurrencyCode) => fiatCurrency,
    ],
    (networks, formattedAssets, coins, fiatCurrency): AssetType[] =>
        networks
            .map((networkSymbol: NetworkSymbol) => {
                const network = networksCompatibility.find(
                    n => n.symbol === networkSymbol && !n.accountType,
                );
                if (!network) {
                    console.error('unknown network');
                    return;
                }

                const currentFiatRates = coins.find(
                    f => f.symbol.toLowerCase() === networkSymbol.toLowerCase(),
                )?.current;

                // Note: This shouldn't be happening in a selector but rather in component itself.
                // In future, we will probably have something like `CryptoAmountToFiatFormatter` in component just using value sent from this selector.
                const fiatBalance =
                    toFiatCurrency(
                        formattedAssets[networkSymbol]?.toString() ?? '0',
                        fiatCurrency,
                        currentFiatRates?.rates,
                    ) ?? '0';

                const asset: AssetType = {
                    symbol: networkSymbol,
                    network,
                    assetBalance: formattedAssets[networkSymbol] ?? new BigNumber(0),
                    fiatBalance,
                };
                return asset;
            })
            .filter(data => data !== undefined) as AssetType[],
);
