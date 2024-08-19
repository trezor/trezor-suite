import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { SettingsSliceRootState } from '@suite-native/settings';

import { NetworksWithTokens, isCoinWithTokens } from './utils';
import {
    selectNumberOfEthereumAccountTokensWithFiatRates,
    selectNumberOfUniqueEthereumTokensPerDevice,
} from './ethereumTokensSelectors';

export const selectNumberOfUniqueTokensForCoinPerDevice = (
    state: AccountsRootState & DeviceRootState & FiatRatesRootState & SettingsSliceRootState,
    coin: NetworkSymbol,
) => {
    if (!isCoinWithTokens(coin)) return 0;

    // We can typecast coin to NetworksWithTokens because isCoinWithTokens(coin) act as type guard
    const networkType = getNetworkType(coin) as NetworksWithTokens;

    switch (networkType) {
        case 'ethereum':
            return selectNumberOfUniqueEthereumTokensPerDevice(state);
        default:
            // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
            networkType satisfies never;

            return 0;
    }
};

export const selectNumberOfAccountTokensWithFiatRates = (
    state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isCoinWithTokens(account.symbol)) return 0;

    const networkType = getNetworkType(account.symbol) as NetworksWithTokens;

    switch (networkType) {
        case 'ethereum':
            return selectNumberOfEthereumAccountTokensWithFiatRates(state, accountKey);
        default:
            // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
            networkType satisfies never;

            return 0;
    }
};

export const selectAccountHasAnyTokensWithFiatRates = (
    state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState,
    accountKey: string,
) => {
    return selectNumberOfAccountTokensWithFiatRates(state, accountKey) > 0;
};
