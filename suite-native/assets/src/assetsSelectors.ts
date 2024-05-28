import { memoize } from 'proxy-memoize';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectVisibleDeviceAccounts,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/settings';

type Assets = Partial<Record<NetworkSymbol, string[]>>;
type FormattedAssets = Partial<Record<NetworkSymbol, BigNumber>>;

export interface AssetType {
    symbol: NetworkSymbol;
    network: (typeof networks)[NetworkSymbol];
    assetBalance: BigNumber;
    fiatBalance: string;
}

type AssetsRootState = AccountsRootState & FiatRatesRootState & SettingsSliceRootState;

const sumBalance = (balances: string[]): BigNumber =>
    balances.reduce((prev, balance) => prev.plus(balance), new BigNumber(0));

export const selectDeviceBalancesPerNetwork = memoize(
    (state: AssetsRootState & DeviceRootState): FormattedAssets => {
        const accounts = selectVisibleDeviceAccounts(state);

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
            formattedNetworkAssets[asset] = sumBalance(balances);
        });

        return formattedNetworkAssets;
    },
);

export const selectDeviceAssetsWithBalances = memoize(
    (state: AssetsRootState & DeviceRootState) => {
        const deviceBalancesPerNetwork = selectDeviceBalancesPerNetwork(state);
        const deviceNetworksWithAssets = Object.keys(deviceBalancesPerNetwork) as NetworkSymbol[];

        const fiatCurrencyCode = selectFiatCurrencyCode(state);

        return deviceNetworksWithAssets
            .map((networkSymbol: NetworkSymbol) => {
                const fiatRateKey = getFiatRateKey(networkSymbol, fiatCurrencyCode);
                const fiatRate = selectFiatRatesByFiatRateKey(state, fiatRateKey);

                // Note: This shouldn't be happening in a selector but rather in component itself.
                // In future, we will probably have something like `CryptoAmountToFiatFormatter` in component just using value sent from this selector.
                const fiatBalance =
                    toFiatCurrency(
                        deviceBalancesPerNetwork[networkSymbol]?.toString() ?? '0',
                        fiatRate?.rate,
                    ) ?? '0';

                const network = networks[networkSymbol];

                const asset: AssetType = {
                    symbol: networkSymbol,
                    network,
                    assetBalance: deviceBalancesPerNetwork[networkSymbol] ?? new BigNumber(0),
                    fiatBalance,
                };

                return asset;
            })
            .filter(data => data !== undefined) as AssetType[];
    },
);
