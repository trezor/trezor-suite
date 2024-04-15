import { pipe, A, D } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    DeviceRootState,
    TokenDefinitionsRootState,
    selectValidTokensByNetworkSymbolAndDeviceState,
} from '@suite-common/wallet-core';
import {
    AccountsRootState,
    selectDeviceAccounts,
} from '@suite-common/wallet-core/src/accounts/accountsReducer';
import { TokenSymbol, TokenAddress } from '@suite-common/wallet-types';

export const selectDiscoveryAccountsAnalytics = (
    state: AccountsRootState & DeviceRootState & TokenDefinitionsRootState,
    deviceState: string,
) =>
    pipe(
        selectDeviceAccounts(state),
        A.groupBy(account => account.symbol),
        D.mapWithKey((networkSymbol, accounts) => {
            const numberOfAccounts = accounts?.length ?? 0;

            const validTokens = selectValidTokensByNetworkSymbolAndDeviceState(
                state,
                deviceState,
                networkSymbol as NetworkSymbol,
            );
            if (A.isNotEmpty(validTokens)) {
                return {
                    numberOfAccounts,
                    tokenSymbols: validTokens.map(token => token.symbol as TokenSymbol),
                    tokenAddresses: validTokens.map(token => token.contract as TokenAddress),
                };
            }

            return {
                numberOfAccounts,
            };
        }),
    );
