import { pipe, A, D } from '@mobily/ts-belt';

import {
    TokenDefinitionsRootState,
    selectValidTokensByDeviceStateAndNetworkSymbol,
} from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { DeviceRootState } from '@suite-common/wallet-core';
import {
    AccountsRootState,
    selectAccountsByDeviceStateAndNetworkSymbol,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
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

            const accountsByDeviceStateAndNetworkSymbol =
                selectAccountsByDeviceStateAndNetworkSymbol(state, deviceState, networkSymbol);

            const validTokens = selectValidTokensByDeviceStateAndNetworkSymbol(
                state,
                accountsByDeviceStateAndNetworkSymbol,
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
