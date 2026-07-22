import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';
import type { WalletDescriptor } from '@trezor/device-utils';
import { parseStaticSessionId } from '@trezor/device-utils';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectAllAddressesForWallet } from '../wallet/suiteSyncWalletSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

export const selectSuiteSyncAccountAddressesByAccount = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, walletDescriptor: WalletDescriptor) =>
            selectAllAddressesForWallet(state, walletDescriptor),
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor,
            accountDescriptor: AccountDescriptor,
        ) => accountDescriptor,
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor,
            _accountDescriptor: AccountDescriptor,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
    ],
    (walletAddresses, accountDescriptor, networkSymbol) =>
        walletAddresses.filter(
            address =>
                address.accountDescriptor === accountDescriptor &&
                address.networkSymbol === networkSymbol,
        ),
);

export const selectSuiteSyncAddressLabel = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, deviceStaticId: StaticSessionId) => {
            const { walletDescriptor } = parseStaticSessionId(deviceStaticId);

            return selectAllAddressesForWallet(state, walletDescriptor);
        },
        (_state: SuiteSyncDataRootState, _deviceStaticId: StaticSessionId, address: string) =>
            address,
    ],
    (walletAddresses, address) =>
        walletAddresses.find(addr => addr.address === address)?.label ?? null,
);

export const selectSuiteSyncAddressLabels = (
    state: SuiteSyncDataRootState,
    deviceStaticId: StaticSessionId,
) => {
    const { walletDescriptor } = parseStaticSessionId(deviceStaticId);

    return selectAllAddressesForWallet(state, walletDescriptor);
};
