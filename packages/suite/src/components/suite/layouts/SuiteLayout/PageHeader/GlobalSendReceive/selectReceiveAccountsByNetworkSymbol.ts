import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import { type DeviceRootState, selectDeviceStaticSessionId } from '@suite-common/device';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { filterReceiveAccounts } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

export type ReceiveAccountsByNetworkSymbolState = AccountsRootState &
    DeviceRootState &
    NetworksRootState &
    DebugRootState;

const createMemoizedSelector =
    createWeakMapSelector.withTypes<ReceiveAccountsByNetworkSymbolState>();

export const selectReceiveAccountsByNetworkSymbol = createMemoizedSelector(
    [
        selectAccounts,
        selectSupportedNetworkSymbols,
        selectDeviceStaticSessionId,
        selectIsDebugModeActive,
        (_state: ReceiveAccountsByNetworkSymbolState, symbol: NetworkSymbol | undefined) => symbol,
    ],
    (accounts, supportedNetworks, staticSessionId, isDebug, symbol): Account[] => {
        if (symbol === undefined) {
            return returnStableArrayIfEmpty<Account>();
        }

        return returnStableArrayIfEmpty(
            filterReceiveAccounts({
                accounts,
                supportedNetworks,
                deviceState: staticSessionId ?? undefined,
                symbol,
                isDebug,
            }),
        );
    },
);
