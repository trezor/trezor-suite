import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput,
} from '@suite-common/suite-sync-storage';
import { WalletDescriptor } from '@suite-common/wallet-types';
import { typedObjectValues } from '@trezor/utils';

import { type SuiteSyncDataRootState, WalletData } from '../suiteSyncDataReducer';

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
