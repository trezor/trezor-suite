import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type SuiteSyncAccount,
    type SuiteSyncAddress,
    type SuiteSyncOutput,
} from '@suite-common/suite-sync-storage';
import { type WalletDescriptor } from '@suite-common/wallet-types';
import { typedObjectValues } from '@trezor/utils';

import { type SuiteSyncDataRootState, type WalletData } from '../suiteSyncDataReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

export const selectWalletById = (
    state: SuiteSyncDataRootState,
    walletDescriptor: WalletDescriptor | null,
): WalletData | null =>
    walletDescriptor !== null ? (state.suiteSyncData.wallets[walletDescriptor] ?? null) : null;

export const selectAllAccountsForWallet = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        if (wallet === null) {
            return returnStableArrayIfEmpty<SuiteSyncAccount>();
        }

        return typedObjectValues(wallet.accounts);
    },
);

export const selectAllAddressesForWallet = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        if (wallet === null) {
            return returnStableArrayIfEmpty<SuiteSyncAddress>();
        }

        return typedObjectValues(wallet.addresses);
    },
);

export const selectAllOutputsForWallet = createMemoizedSelector(
    [(state, walletDescriptor) => selectWalletById(state, walletDescriptor)],
    wallet => {
        if (wallet === null) {
            return returnStableArrayIfEmpty<SuiteSyncOutput>();
        }

        return typedObjectValues(wallet.outputs);
    },
);

export const selectSuiteSyncWalletLabel = (
    state: SuiteSyncDataRootState,
    walletDescriptor: WalletDescriptor,
) => {
    const walletData = selectWalletById(state, walletDescriptor);

    return walletData?.wallet.label ?? null;
};
