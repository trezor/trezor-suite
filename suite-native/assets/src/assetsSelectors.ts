import { memoize } from 'proxy-memoize';
import { pipe, A } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectVisibleDeviceAccounts,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/settings';

export interface AssetType {
    symbol: NetworkSymbol;
    network: (typeof networks)[NetworkSymbol];
    assetBalance: BigNumber;
    fiatBalance: string;
}

type AssetsRootState = AccountsRootState & FiatRatesRootState & SettingsSliceRootState;

const sumBalance = (balances: string[]): BigNumber =>
    balances.reduce((prev, balance) => prev.plus(balance), new BigNumber(0));

export const selectDeviceAssetsWithBalances = memoize(
    (state: AssetsRootState & DeviceRootState) => {
        const accounts = selectVisibleDeviceAccounts(state);

        const deviceNetworksWithAssets = pipe(
            accounts,
            A.map(account => account.symbol),
            A.uniq,
        );

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

            const cryptoValue = sumBalance(networkAccounts.map(account => account.cryptoValue));

            const network = networks[networkSymbol];

            const asset: AssetType = {
                symbol: networkSymbol,
                network,
                assetBalance: cryptoValue,
                fiatBalance,
            };

            return asset;
        });
    },
);
