import { A, G, pipe } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectCurrentFiatRates,
    selectDeviceAccounts,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { discoverySupportedNetworks } from '@suite-native/config';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/settings';
import { BigNumber } from '@trezor/utils/src/bigNumber';

export interface AssetType {
    symbol: NetworkSymbol;
    assetBalance: string;
    fiatBalance: string | null;
}

type AssetsRootState = AccountsRootState & FiatRatesRootState & SettingsSliceRootState;

/*
We do not memoize any of following selectors because they are using only with `useSelectorDeepComparison` hook which is faster than memoization in proxy-memoize.
*/

export const selectVisibleDeviceAccountsKeysByNetworkSymbol = (
    state: AccountsRootState & DeviceRootState,
    networkSymbol: NetworkSymbol | null,
) => {
    if (G.isNull(networkSymbol)) return [];

    const accounts = selectDeviceAccounts(state).filter(
        account => account.symbol === networkSymbol && account.visible,
    );

    return accounts.map(account => account.key);
};

export const selectDeviceAssetsWithBalances = (state: AssetsRootState & DeviceRootState) => {
    const accounts = selectVisibleDeviceAccounts(state);

    const deviceNetworksWithAssets = pipe(
        accounts,
        A.map(account => account.symbol),
        A.uniq,
        A.sort((a, b) => {
            const aOrder = discoverySupportedNetworks.indexOf(a) ?? Number.MAX_SAFE_INTEGER;
            const bOrder = discoverySupportedNetworks.indexOf(b) ?? Number.MAX_SAFE_INTEGER;

            return aOrder - bOrder;
        }),
    );

    const fiatCurrencyCode = selectFiatCurrencyCode(state);
    const rates = selectCurrentFiatRates(state);

    const accountsWithFiatBalance = accounts.map(account => {
        const fiatValue = getAccountFiatBalance({
            account,
            localCurrency: fiatCurrencyCode,
            rates,
            // TODO: this should be removed once Trezor Suite Lite supports staking
            shouldIncludeStaking: true,
        });

        return {
            symbol: account.symbol,
            fiatValue,
            cryptoValue: account.formattedBalance,
        };
    });

    return deviceNetworksWithAssets.map((networkSymbol: NetworkSymbol) => {
        const networkAccounts = accountsWithFiatBalance.filter(
            account => account.symbol === networkSymbol,
        );
        const assetBalance = networkAccounts.reduce(
            (sum, { cryptoValue }) => sum.plus(cryptoValue),
            new BigNumber(0),
        );
        const fiatBalance = networkAccounts.reduce(
            (sum, { fiatValue }) => (fiatValue ? Number(fiatValue) + (sum ?? 0) : sum),
            null as number | null,
        );

        const asset: AssetType = {
            symbol: networkSymbol,
            assetBalance: assetBalance.toFixed(),
            fiatBalance: fiatBalance !== null ? fiatBalance.toFixed(2) : null,
        };

        return asset;
    });
};
