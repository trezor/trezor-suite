import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    FiatRatesRootState,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { SettingsSliceRootState } from '@suite-native/settings';

import {
    selectNumberOfEthereumAccountTokensWithFiatRates,
    selectNumberOfUniqueEthereumTokensPerDevice,
} from './ethereumTokensSelectors';
import { isCoinWithTokens } from './utils';

export const selectNumberOfUniqueTokensForCoinPerDevice = (
    state: AccountsRootState & DeviceRootState & FiatRatesRootState & SettingsSliceRootState,
    coin: NetworkSymbol,
) => {
    if (!isCoinWithTokens(coin)) return 0;

    switch (coin) {
        case 'eth':
            return selectNumberOfUniqueEthereumTokensPerDevice(state);
        default:
            // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
            coin satisfies never;

            return 0;
    }
};

export const selectNumberOfAccountTokensWithFiatRates = (
    state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isCoinWithTokens(account.symbol)) return 0;

    switch (account.symbol) {
        case 'eth':
            return selectNumberOfEthereumAccountTokensWithFiatRates(state, accountKey);
        default:
            // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
            account.symbol satisfies never;

            return 0;
    }
};

export const selectAccountHasAnyTokensWithFiatRates = (
    state: AccountsRootState & FiatRatesRootState & SettingsSliceRootState,
    accountKey: string,
) => {
    return selectNumberOfAccountTokensWithFiatRates(state, accountKey) > 0;
};
