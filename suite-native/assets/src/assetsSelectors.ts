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
import {
    calculateCryptoBalanceFormatted,
    getAccountEverstakeStakingPool,
    getAccountFiatBalance,
} from '@suite-common/wallet-utils';
import { discoverySupportedNetworks } from '@suite-native/config';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/settings';
import { BigNumber } from '@trezor/utils/src/bigNumber';

export interface AssetType {
    symbol: NetworkSymbol;
    assetBalance: string;
    fiatBalance: string;
}

type AssetsRootState = AccountsRootState & FiatRatesRootState & SettingsSliceRootState;

const sumCryptoBalance = (balances: string[]): BigNumber =>
    balances.reduce((prev, balance) => prev.plus(balance), new BigNumber(0));

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

        const cryptoBalanceWithStaking = calculateCryptoBalanceFormatted(account);

        return {
            symbol: account.symbol,
            fiatValue,
            cryptoValue: cryptoBalanceWithStaking,
        };
    });

    return deviceNetworksWithAssets.map((networkSymbol: NetworkSymbol) => {
        const networkAccounts = accountsWithFiatBalance.filter(
            account => account.symbol === networkSymbol,
        );
        const fiatBalance = networkAccounts
            .reduce((prev, { symbol, fiatValue }) => {
                if (symbol === networkSymbol && fiatValue) {
                    return prev + Number(fiatValue);
                }

                return prev;
            }, 0)
            .toFixed();

        const cryptoValue = sumCryptoBalance(networkAccounts.map(account => account.cryptoValue));

        const asset: AssetType = {
            symbol: networkSymbol,
            assetBalance: cryptoValue.toFixed(),
            fiatBalance,
        };

        return asset;
    });
};

export const selectVisibleDeviceAccountsWithStakingByNetworkSymbol = (
    state: AccountsRootState & DeviceRootState,
    networkSymbol: NetworkSymbol | null,
) => {
    const accounts = selectDeviceAccounts(state).filter(
        account =>
            account.symbol === networkSymbol &&
            account.visible &&
            !!getAccountEverstakeStakingPool(account),
    );

    return accounts;
};

export const selectHasAnyAccountWithStaking = (
    state: AccountsRootState & DeviceRootState,
    networkSymbol: NetworkSymbol | null,
) => {
    const accountsWithStaking = selectVisibleDeviceAccountsWithStakingByNetworkSymbol(
        state,
        networkSymbol,
    );

    return accountsWithStaking.length > 0;
};
