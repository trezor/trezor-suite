import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import type { SuiteSyncAddress } from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';

import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
} from '../../suiteSyncSelectors';
import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectAllAddressesForWallet } from '../wallet/suiteSyncWalletSelectors';

type SuiteSyncAddressRootState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncAddressRootState>();

export const selectSuiteSyncAccountAddressesByAccount = createMemoizedSelector(
    [
        (state: SuiteSyncAddressRootState, walletDescriptor: WalletDescriptor) =>
            selectAllAddressesForWallet(state, walletDescriptor),
        (
            _state: SuiteSyncAddressRootState,
            _walletDescriptor: WalletDescriptor,
            accountDescriptor: AccountDescriptor,
        ) => accountDescriptor,
        (
            _state: SuiteSyncAddressRootState,
            _walletDescriptor: WalletDescriptor,
            _accountDescriptor: AccountDescriptor,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
        selectIsSuiteSyncEnabled,
    ],
    (walletAddresses, accountDescriptor, networkSymbol, isSuiteSyncEnabled) => {
        if (!isSuiteSyncEnabled) {
            return returnStableArrayIfEmpty<SuiteSyncAddress>();
        }

        return returnStableArrayIfEmpty(
            walletAddresses.filter(
                address =>
                    address.accountDescriptor === accountDescriptor &&
                    address.networkSymbol === networkSymbol,
            ),
        );
    },
);

export const selectSuiteSyncAddressLabel = createMemoizedSelector(
    [
        (state: SuiteSyncAddressRootState, deviceStaticId: StaticSessionId) => {
            const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticId);

            return selectAllAddressesForWallet(state, walletDescriptor);
        },
        (_state: SuiteSyncAddressRootState, _deviceStaticId: StaticSessionId, address: string) =>
            address,
        selectIsSuiteSyncEnabled,
    ],
    (walletAddresses, address, isSuiteSyncEnabled) => {
        if (!isSuiteSyncEnabled) return null;

        return walletAddresses.find(addr => addr.address === address)?.label ?? null;
    },
);

export const selectSuiteSyncAddressLabels = (
    state: SuiteSyncAddressRootState,
    deviceStaticId: StaticSessionId,
) => {
    if (!selectIsSuiteSyncEnabled(state)) {
        return returnStableArrayIfEmpty<SuiteSyncAddress>();
    }

    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticId);

    return selectAllAddressesForWallet(state, walletDescriptor);
};
