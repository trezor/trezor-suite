import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, DeviceRootState, selectAccountByKey } from '@suite-common/wallet-core';

import {
    selectAnyOfTokensIsKnown,
    selectHasDeviceAnyEthereumTokens,
    selectNumberOfEthereumAccountTokensWithFiatRates,
} from './ethereumTokensSelectors';
import { isCoinWithTokens } from './utils';

export type TokensRootState = AccountsRootState & DeviceRootState & TokenDefinitionsRootState;

export const selectHasDeviceAnyTokens = (state: TokensRootState, coin: NetworkSymbol) => {
    if (!isCoinWithTokens(coin)) return false;

    switch (coin) {
        case 'eth':
            const hasAnyTokens = selectHasDeviceAnyEthereumTokens(state);

            return hasAnyTokens;
        default:
            // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
            coin satisfies never;

            return false;
    }
};

export const selectNumberOfAccountTokensWithFiatRates = (
    state: TokensRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isCoinWithTokens(account.symbol)) return 0;

    switch (account.symbol) {
        case 'eth':
            const tokensNumber = selectNumberOfEthereumAccountTokensWithFiatRates(
                state,
                accountKey,
            );

            return tokensNumber;
        default:
            // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
            account.symbol satisfies never;

            return 0;
    }
};

export const selectAccountHasAnyKnownToken = (state: TokensRootState, accountKey: string) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isCoinWithTokens(account.symbol)) return false;

    switch (account.symbol) {
        case 'eth':
            const anyOfTokensIsKnown = selectAnyOfTokensIsKnown(state, accountKey);

            return anyOfTokensIsKnown;
        default:
            // Exhaustive check, all coin types in NETWORKS_WITH_TOKENS should be handled above
            account.symbol satisfies never;

            return false;
    }
};
